import { db } from "./firebase.js";
import {
    collection,
    onSnapshot,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const WHATSAPP_NUMBER = "5519989466089";
const catalogContainer = document.getElementById("rentalCatalog");
const catalogSource = document.getElementById("catalogSource");

const fallbackOvens = [
    {
        id: "600-sem-chamine",
        ordem: 1,
        ativo: true,
        medidaMm: 600,
        aluguel24h: 280,
        nomePt: "Forno 600 mm sem chaminé",
        nomeEn: "600 mm oven without chimney",
        nomeEs: "Horno de 600 mm sin chimenea",
        descricaoPt: "Modelo compacto para eventos e operações que não exigem chaminé.",
        descricaoEn: "Compact model for events and operations that do not require a chimney.",
        descricaoEs: "Modelo compacto para eventos y operaciones que no requieren chimenea.",
        configuracaoPt: "Sem chaminé",
        configuracaoEn: "Without chimney",
        configuracaoEs: "Sin chimenea"
    },
    {
        id: "600-com-chamine",
        ordem: 2,
        ativo: true,
        medidaMm: 600,
        aluguel24h: 304,
        nomePt: "Forno 600 mm com chaminé",
        nomeEn: "600 mm oven with chimney",
        nomeEs: "Horno de 600 mm con chimenea",
        descricaoPt: "Modelo compacto com chaminé para melhor direcionamento da exaustão.",
        descricaoEn: "Compact model with chimney for better exhaust direction.",
        descricaoEs: "Modelo compacto con chimenea para una mejor dirección de la extracción.",
        configuracaoPt: "Com chaminé",
        configuracaoEn: "With chimney",
        configuracaoEs: "Con chimenea"
    },
    {
        id: "740-sem-carretinha",
        ordem: 3,
        ativo: true,
        medidaMm: 740,
        aluguel24h: 519,
        nomePt: "Forno 740 mm sem carretinha",
        nomeEn: "740 mm oven without trailer",
        nomeEs: "Horno de 740 mm sin remolque",
        descricaoPt: "Maior área de cocção em uma configuração sem carretinha.",
        descricaoEn: "Larger baking area in a configuration without a trailer.",
        descricaoEs: "Mayor área de cocción en una configuración sin remolque.",
        configuracaoPt: "Sem carretinha",
        configuracaoEn: "Without trailer",
        configuracaoEs: "Sin remolque"
    },
    {
        id: "740-com-carretinha",
        ordem: 4,
        ativo: true,
        medidaMm: 740,
        aluguel24h: 796,
        nomePt: "Forno 740 mm com carretinha",
        nomeEn: "740 mm oven with trailer",
        nomeEs: "Horno de 740 mm con remolque",
        descricaoPt: "Solução móvel para eventos e operações temporárias.",
        descricaoEn: "Mobile solution for events and temporary operations.",
        descricaoEs: "Solución móvil para eventos y operaciones temporales.",
        configuracaoPt: "Com carretinha",
        configuracaoEn: "With trailer",
        configuracaoEs: "Con remolque"
    },
    {
        id: "800-com-carretinha",
        ordem: 5,
        ativo: true,
        medidaMm: 800,
        aluguel24h: 854,
        nomePt: "Forno 800 mm com carretinha",
        nomeEn: "800 mm oven with trailer",
        nomeEs: "Horno de 800 mm con remolque",
        descricaoPt: "Capacidade ampliada com mobilidade para eventos de maior produção.",
        descricaoEn: "Expanded capacity with mobility for higher-output events.",
        descricaoEs: "Capacidad ampliada con movilidad para eventos de mayor producción.",
        configuracaoPt: "Com carretinha",
        configuracaoEn: "With trailer",
        configuracaoEs: "Con remolque"
    },
    {
        id: "1040-com-carretinha",
        ordem: 6,
        ativo: true,
        medidaMm: 1040,
        aluguel24h: 1380,
        nomePt: "Forno 1.040 mm com carretinha",
        nomeEn: "1,040 mm oven with trailer",
        nomeEs: "Horno de 1.040 mm con remolque",
        descricaoPt: "Modelo de grande porte para operações com alta demanda de produção.",
        descricaoEn: "Large model for operations with high production demand.",
        descricaoEs: "Modelo de gran porte para operaciones con alta demanda de producción.",
        configuracaoPt: "Com carretinha",
        configuracaoEn: "With trailer",
        configuracaoEs: "Con remolque"
    }
];

let currentOvens = fallbackOvens;

function getCurrentLanguage() {
    const language = document.documentElement.lang || "pt-BR";
    if (language.startsWith("en")) return "en";
    if (language.startsWith("es")) return "es";
    return "pt";
}

function formatCurrency(value, language) {
    const locales = {
        pt: "pt-BR",
        en: "en-US",
        es: "es-ES"
    };

    return new Intl.NumberFormat(locales[language] || "pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2
    }).format(Number(value) || 0);
}

function textFor(oven, field, language) {
    const suffix = language.charAt(0).toUpperCase() + language.slice(1);
    return oven[`${field}${suffix}`] || oven[`${field}Pt`] || "";
}

function buildWhatsappUrl(oven, type, language) {
    const name = textFor(oven, "nome", language);
    const messages = {
        pt: type === "rent"
            ? `Olá! Tenho interesse em alugar o ${name} por 24 horas. Gostaria de verificar a disponibilidade.`
            : `Olá! Tenho interesse em comprar o ${name}. Gostaria de solicitar um orçamento.`,
        en: type === "rent"
            ? `Hello! I am interested in renting the ${name} for 24 hours. I would like to check availability.`
            : `Hello! I am interested in purchasing the ${name}. I would like to request a quote.`,
        es: type === "rent"
            ? `¡Hola! Estoy interesado en alquilar el ${name} por 24 horas. Quisiera consultar la disponibilidad.`
            : `¡Hola! Estoy interesado en comprar el ${name}. Quisiera solicitar un presupuesto.`
    };

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messages[language] || messages.pt)}`;
}

function getLabels(language) {
    const labels = {
        pt: {
            rental: "Aluguel por 24 horas",
            sale: "Venda",
            consultation: "A consultar",
            availability: "Disponibilidade sob consulta",
            rentButton: "Consultar aluguel",
            buyButton: "Comprar / orçamento"
        },
        en: {
            rental: "24-hour rental",
            sale: "Purchase",
            consultation: "On request",
            availability: "Availability on request",
            rentButton: "Check rental",
            buyButton: "Purchase / quote"
        },
        es: {
            rental: "Alquiler por 24 horas",
            sale: "Venta",
            consultation: "A consultar",
            availability: "Disponibilidad a consultar",
            rentButton: "Consultar alquiler",
            buyButton: "Compra / presupuesto"
        }
    };

    return labels[language] || labels.pt;
}

function renderCatalog() {
    if (!catalogContainer) return;

    const language = getCurrentLanguage();
    const labels = getLabels(language);
    const activeOvens = currentOvens
        .filter((oven) => oven.ativo !== false)
        .sort((a, b) => (Number(a.ordem) || 999) - (Number(b.ordem) || 999));

    if (activeOvens.length === 0) {
        catalogContainer.innerHTML = `
            <div class="catalog-empty">
                <i class="fa-solid fa-fire-flame-curved"></i>
                <p>${language === "en" ? "Models are being updated." : language === "es" ? "Los modelos se están actualizando." : "Os modelos estão sendo atualizados."}</p>
            </div>
        `;
        return;
    }

    catalogContainer.innerHTML = activeOvens.map((oven) => {
        const name = textFor(oven, "nome", language);
        const description = textFor(oven, "descricao", language);
        const configuration = textFor(oven, "configuracao", language);
        const rentalUrl = buildWhatsappUrl(oven, "rent", language);
        const saleUrl = buildWhatsappUrl(oven, "buy", language);

        return `
            <article class="rental-card reveal is-visible">
                <div class="rental-card-top">
                    <div class="rental-size">
                        <i class="fa-solid fa-fire-burner"></i>
                        <strong>${Number(oven.medidaMm || 0).toLocaleString(language === "pt" ? "pt-BR" : language === "es" ? "es-ES" : "en-US")} mm</strong>
                    </div>
                    <span class="rental-status"><i class="fa-solid fa-circle-check"></i>${labels.availability}</span>
                </div>

                <h3>${name}</h3>
                <p>${description}</p>

                <div class="rental-chips">
                    <span><i class="fa-solid fa-screwdriver-wrench"></i>${configuration}</span>
                    <span><i class="fa-solid fa-cart-shopping"></i>${labels.sale}: ${labels.consultation}</span>
                </div>

                <div class="rental-price-box">
                    <span>${labels.rental}</span>
                    <strong>${formatCurrency(oven.aluguel24h, language)}</strong>
                </div>

                <div class="rental-actions">
                    <a class="button button-primary" href="${rentalUrl}" target="_blank" rel="noopener noreferrer">
                        <i class="fa-brands fa-whatsapp"></i>
                        <span>${labels.rentButton}</span>
                    </a>
                    <a class="button button-secondary" href="${saleUrl}" target="_blank" rel="noopener noreferrer">
                        <i class="fa-solid fa-tag"></i>
                        <span>${labels.buyButton}</span>
                    </a>
                </div>
            </article>
        `;
    }).join("");
}

function useFallbackCatalog() {
    currentOvens = fallbackOvens;
    if (catalogSource) {
        catalogSource.textContent = "";
        catalogSource.hidden = true;
    }
    renderCatalog();
}

if (catalogContainer) {
    renderCatalog();

    const ovensQuery = query(collection(db, "fornos"), orderBy("ordem", "asc"));

    onSnapshot(ovensQuery, (snapshot) => {
        if (snapshot.empty) {
            useFallbackCatalog();
            return;
        }

        currentOvens = snapshot.docs.map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...documentSnapshot.data()
        }));

        if (catalogSource) {
            catalogSource.hidden = true;
        }

        renderCatalog();
    }, (error) => {
        console.error("Não foi possível carregar o catálogo do Firestore:", error);
        useFallbackCatalog();
    });

    document.addEventListener("campLanguageChanged", renderCatalog);
}
