import { auth, db } from "../firebase/firebase.js";
import {
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const initialOvens = [
    {
        id: "600-sem-chamine", ordem: 1, ativo: true, medidaMm: 600, aluguel24h: 280,
        nomePt: "Forno 600 mm sem chaminé", nomeEn: "600 mm oven without chimney", nomeEs: "Horno de 600 mm sin chimenea",
        descricaoPt: "Modelo compacto para eventos e operações que não exigem chaminé.",
        descricaoEn: "Compact model for events and operations that do not require a chimney.",
        descricaoEs: "Modelo compacto para eventos y operaciones que no requieren chimenea.",
        configuracaoPt: "Sem chaminé", configuracaoEn: "Without chimney", configuracaoEs: "Sin chimenea"
    },
    {
        id: "600-com-chamine", ordem: 2, ativo: true, medidaMm: 600, aluguel24h: 304,
        nomePt: "Forno 600 mm com chaminé", nomeEn: "600 mm oven with chimney", nomeEs: "Horno de 600 mm con chimenea",
        descricaoPt: "Modelo compacto com chaminé para melhor direcionamento da exaustão.",
        descricaoEn: "Compact model with chimney for better exhaust direction.",
        descricaoEs: "Modelo compacto con chimenea para una mejor dirección de la extracción.",
        configuracaoPt: "Com chaminé", configuracaoEn: "With chimney", configuracaoEs: "Con chimenea"
    },
    {
        id: "740-sem-carretinha", ordem: 3, ativo: true, medidaMm: 740, aluguel24h: 519,
        nomePt: "Forno 740 mm sem carretinha", nomeEn: "740 mm oven without trailer", nomeEs: "Horno de 740 mm sin remolque",
        descricaoPt: "Maior área de cocção em uma configuração sem carretinha.",
        descricaoEn: "Larger baking area in a configuration without a trailer.",
        descricaoEs: "Mayor área de cocción en una configuración sin remolque.",
        configuracaoPt: "Sem carretinha", configuracaoEn: "Without trailer", configuracaoEs: "Sin remolque"
    },
    {
        id: "740-com-carretinha", ordem: 4, ativo: true, medidaMm: 740, aluguel24h: 796,
        nomePt: "Forno 740 mm com carretinha", nomeEn: "740 mm oven with trailer", nomeEs: "Horno de 740 mm con remolque",
        descricaoPt: "Solução móvel para eventos e operações temporárias.",
        descricaoEn: "Mobile solution for events and temporary operations.",
        descricaoEs: "Solución móvil para eventos y operaciones temporales.",
        configuracaoPt: "Com carretinha", configuracaoEn: "With trailer", configuracaoEs: "Con remolque"
    },
    {
        id: "800-com-carretinha", ordem: 5, ativo: true, medidaMm: 800, aluguel24h: 854,
        nomePt: "Forno 800 mm com carretinha", nomeEn: "800 mm oven with trailer", nomeEs: "Horno de 800 mm con remolque",
        descricaoPt: "Capacidade ampliada com mobilidade para eventos de maior produção.",
        descricaoEn: "Expanded capacity with mobility for higher-output events.",
        descricaoEs: "Capacidad ampliada con movilidad para eventos de mayor producción.",
        configuracaoPt: "Com carretinha", configuracaoEn: "With trailer", configuracaoEs: "Con remolque"
    },
    {
        id: "1040-com-carretinha", ordem: 6, ativo: true, medidaMm: 1040, aluguel24h: 1380,
        nomePt: "Forno 1.040 mm com carretinha", nomeEn: "1,040 mm oven with trailer", nomeEs: "Horno de 1.040 mm con remolque",
        descricaoPt: "Modelo de grande porte para operações com alta demanda de produção.",
        descricaoEn: "Large model for operations with high production demand.",
        descricaoEs: "Modelo de gran porte para operaciones con alta demanda de producción.",
        configuracaoPt: "Com carretinha", configuracaoEn: "With trailer", configuracaoEs: "Con remolque"
    }
];

const elements = {
    loginPanel: document.getElementById("loginPanel"),
    dashboard: document.getElementById("dashboard"),
    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginButton: document.getElementById("loginButton"),
    loginStatus: document.getElementById("loginStatus"),
    resetPasswordButton: document.getElementById("resetPasswordButton"),
    passwordToggle: document.getElementById("passwordToggle"),
    logoutButton: document.getElementById("logoutButton"),
    seedButton: document.getElementById("seedButton"),
    dashboardStatus: document.getElementById("dashboardStatus"),
    ovenEditorList: document.getElementById("ovenEditorList"),
    adminEmail: document.getElementById("adminEmail"),
    totalOvens: document.getElementById("totalOvens"),
    activeOvens: document.getElementById("activeOvens")
};

let catalogUnsubscribe = null;

function showStatus(element, message, type = "") {
    if (!element) return;
    element.textContent = message;
    element.className = `status-message${type ? ` ${type}` : ""}`;
    element.hidden = false;
}

function hideStatus(element) {
    if (element) element.hidden = true;
}

function translateAuthError(error) {
    const messages = {
        "auth/invalid-credential": "E-mail ou senha incorretos.",
        "auth/user-disabled": "Este usuário está desativado.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        "auth/invalid-email": "Informe um e-mail válido.",
        "auth/unauthorized-domain": "Este domínio ainda não foi autorizado no Firebase Authentication.",
        "auth/network-request-failed": "Falha de conexão. Verifique a internet e tente novamente."
    };

    return messages[error?.code] || "Não foi possível concluir a operação. Tente novamente.";
}

async function userIsAdmin(user) {
    if (!user) return false;
    const adminSnapshot = await getDoc(doc(db, "admins", user.uid));
    return adminSnapshot.exists();
}

function setDashboardVisible(user) {
    elements.loginPanel.hidden = true;
    elements.dashboard.hidden = false;
    elements.adminEmail.textContent = user.email || "Administrador";
    subscribeToCatalog();
}

function setLoginVisible() {
    if (catalogUnsubscribe) {
        catalogUnsubscribe();
        catalogUnsubscribe = null;
    }
    elements.dashboard.hidden = true;
    elements.loginPanel.hidden = false;
    elements.ovenEditorList.innerHTML = "";
}

function fieldValue(form, name) {
    const field = form.elements.namedItem(name);
    return field ? field.value.trim() : "";
}

function createEditor(oven) {
    const article = document.createElement("article");
    article.className = "oven-editor";
    article.dataset.id = oven.id;

    article.innerHTML = `
        <div class="oven-editor-header">
            <div class="oven-editor-title">
                <i class="fa-solid fa-fire-burner"></i>
                <div>
                    <strong>${oven.nomePt || oven.id}</strong>
                    <span>ID: ${oven.id}</span>
                </div>
            </div>
            <label class="active-toggle">
                <input type="checkbox" name="ativo" ${oven.ativo !== false ? "checked" : ""}>
                Visível no site
            </label>
        </div>

        <form class="oven-editor-body editor-form">
            <div class="editor-grid">
                <label class="editor-field">
                    <span>Ordem</span>
                    <input name="ordem" type="number" min="1" step="1" value="${oven.ordem ?? 1}" required>
                </label>
                <label class="editor-field">
                    <span>Medida (mm)</span>
                    <input name="medidaMm" type="number" min="1" step="1" value="${oven.medidaMm ?? ""}" required>
                </label>
                <label class="editor-field">
                    <span>Aluguel por 24h (R$)</span>
                    <input name="aluguel24h" type="number" min="0" step="0.01" value="${oven.aluguel24h ?? ""}" required>
                </label>

                <label class="editor-field">
                    <span>Nome em português</span>
                    <input name="nomePt" value="${escapeAttribute(oven.nomePt || "")}" required>
                </label>
                <label class="editor-field">
                    <span>Nome em inglês</span>
                    <input name="nomeEn" value="${escapeAttribute(oven.nomeEn || "")}" required>
                </label>
                <label class="editor-field">
                    <span>Nome em espanhol</span>
                    <input name="nomeEs" value="${escapeAttribute(oven.nomeEs || "")}" required>
                </label>

                <label class="editor-field">
                    <span>Configuração em português</span>
                    <input name="configuracaoPt" value="${escapeAttribute(oven.configuracaoPt || "")}" required>
                </label>
                <label class="editor-field">
                    <span>Configuração em inglês</span>
                    <input name="configuracaoEn" value="${escapeAttribute(oven.configuracaoEn || "")}" required>
                </label>
                <label class="editor-field">
                    <span>Configuração em espanhol</span>
                    <input name="configuracaoEs" value="${escapeAttribute(oven.configuracaoEs || "")}" required>
                </label>

                <label class="editor-field span-3">
                    <span>Descrição em português</span>
                    <textarea name="descricaoPt" required>${escapeHtml(oven.descricaoPt || "")}</textarea>
                </label>
                <label class="editor-field span-3">
                    <span>Descrição em inglês</span>
                    <textarea name="descricaoEn" required>${escapeHtml(oven.descricaoEn || "")}</textarea>
                </label>
                <label class="editor-field span-3">
                    <span>Descrição em espanhol</span>
                    <textarea name="descricaoEs" required>${escapeHtml(oven.descricaoEs || "")}</textarea>
                </label>
            </div>

            <div class="editor-footer">
                <span class="editor-save-state" aria-live="polite"></span>
                <button class="admin-button admin-button-primary" type="submit">
                    <i class="fa-solid fa-floppy-disk"></i>
                    Salvar alterações
                </button>
            </div>
        </form>
    `;

    const form = article.querySelector("form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await saveOven(article, form);
    });

    return article;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

async function saveOven(article, form) {
    const ovenId = article.dataset.id;
    const saveButton = form.querySelector('button[type="submit"]');
    const saveState = form.querySelector(".editor-save-state");
    const activeInput = article.querySelector('input[name="ativo"]');

    saveButton.disabled = true;
    saveState.textContent = "Salvando...";

    const data = {
        ativo: Boolean(activeInput?.checked),
        ordem: Number(fieldValue(form, "ordem")),
        medidaMm: Number(fieldValue(form, "medidaMm")),
        aluguel24h: Number(fieldValue(form, "aluguel24h")),
        nomePt: fieldValue(form, "nomePt"),
        nomeEn: fieldValue(form, "nomeEn"),
        nomeEs: fieldValue(form, "nomeEs"),
        configuracaoPt: fieldValue(form, "configuracaoPt"),
        configuracaoEn: fieldValue(form, "configuracaoEn"),
        configuracaoEs: fieldValue(form, "configuracaoEs"),
        descricaoPt: fieldValue(form, "descricaoPt"),
        descricaoEn: fieldValue(form, "descricaoEn"),
        descricaoEs: fieldValue(form, "descricaoEs"),
        vendaPt: "A consultar",
        vendaEn: "On request",
        vendaEs: "A consultar",
        atualizadoEm: new Date().toISOString()
    };

    try {
        await updateDoc(doc(db, "fornos", ovenId), data);
        saveState.textContent = "Alterações salvas.";
        saveState.style.color = "var(--success)";
        window.setTimeout(() => { saveState.textContent = ""; }, 3500);
    } catch (error) {
        console.error(error);
        saveState.textContent = "Erro ao salvar.";
        saveState.style.color = "var(--danger)";
    } finally {
        saveButton.disabled = false;
    }
}

function renderEditors(ovens) {
    elements.ovenEditorList.innerHTML = "";

    if (ovens.length === 0) {
        elements.ovenEditorList.innerHTML = `
            <div class="admin-loading">
                <i class="fa-solid fa-circle-info"></i>
                Nenhum forno cadastrado. Clique em “Cadastrar modelos iniciais”.
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();
    ovens.forEach((oven) => fragment.appendChild(createEditor(oven)));
    elements.ovenEditorList.appendChild(fragment);
}

function subscribeToCatalog() {
    if (catalogUnsubscribe) catalogUnsubscribe();

    const ovensQuery = query(collection(db, "fornos"), orderBy("ordem", "asc"));
    catalogUnsubscribe = onSnapshot(ovensQuery, (snapshot) => {
        const ovens = snapshot.docs.map((snapshotDocument) => ({
            id: snapshotDocument.id,
            ...snapshotDocument.data()
        }));

        elements.totalOvens.textContent = String(ovens.length);
        elements.activeOvens.textContent = String(ovens.filter((oven) => oven.ativo !== false).length);
        elements.seedButton.disabled = ovens.length > 0;
        renderEditors(ovens);
    }, (error) => {
        console.error(error);
        showStatus(elements.dashboardStatus, "Não foi possível carregar o catálogo. Confira as regras do Firestore.", "error");
    });
}

async function seedInitialOvens() {
    elements.seedButton.disabled = true;
    showStatus(elements.dashboardStatus, "Cadastrando os seis modelos oficiais...", "");

    try {
        const existing = await getDocs(collection(db, "fornos"));
        if (!existing.empty) {
            showStatus(elements.dashboardStatus, "O catálogo já possui modelos. Nenhum dado foi substituído.", "error");
            return;
        }

        const batch = writeBatch(db);
        initialOvens.forEach((oven) => {
            const { id, ...data } = oven;
            batch.set(doc(db, "fornos", id), {
                ...data,
                vendaPt: "A consultar",
                vendaEn: "On request",
                vendaEs: "A consultar",
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString()
            });
        });
        await batch.commit();
        showStatus(elements.dashboardStatus, "Os seis modelos foram cadastrados com sucesso.", "success");
    } catch (error) {
        console.error(error);
        showStatus(elements.dashboardStatus, "Não foi possível cadastrar os modelos. Confira se este usuário está na coleção admins.", "error");
        elements.seedButton.disabled = false;
    }
}

elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideStatus(elements.loginStatus);
    elements.loginButton.disabled = true;
    elements.loginButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Entrando...';

    try {
        await signInWithEmailAndPassword(auth, elements.loginEmail.value.trim(), elements.loginPassword.value);
        elements.loginPassword.value = "";
    } catch (error) {
        showStatus(elements.loginStatus, translateAuthError(error), "error");
    } finally {
        elements.loginButton.disabled = false;
        elements.loginButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar no painel';
    }
});

elements.resetPasswordButton.addEventListener("click", async () => {
    const email = elements.loginEmail.value.trim();
    if (!email) {
        showStatus(elements.loginStatus, "Digite seu e-mail no campo acima para receber a recuperação de senha.", "error");
        elements.loginEmail.focus();
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showStatus(elements.loginStatus, "E-mail de recuperação enviado. Verifique também a pasta de spam.", "success");
    } catch (error) {
        showStatus(elements.loginStatus, translateAuthError(error), "error");
    }
});

elements.passwordToggle.addEventListener("click", () => {
    const showing = elements.loginPassword.type === "text";
    elements.loginPassword.type = showing ? "password" : "text";
    elements.passwordToggle.innerHTML = showing ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
});

elements.logoutButton.addEventListener("click", () => signOut(auth));
elements.seedButton.addEventListener("click", seedInitialOvens);

onAuthStateChanged(auth, async (user) => {
    hideStatus(elements.loginStatus);

    if (!user) {
        setLoginVisible();
        return;
    }

    try {
        const admin = await userIsAdmin(user);
        if (!admin) {
            await signOut(auth);
            showStatus(elements.loginStatus, "Este usuário existe, mas não possui permissão de administrador.", "error");
            return;
        }

        setDashboardVisible(user);
    } catch (error) {
        console.error(error);
        await signOut(auth);
        showStatus(elements.loginStatus, "Não foi possível verificar a permissão do administrador.", "error");
    }
});
