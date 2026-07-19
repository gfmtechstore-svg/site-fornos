const WHATSAPP_NUMBER = "5519989466089";
let currentLanguage = "pt";

const languageNames = {
    pt: "PT",
    en: "EN",
    es: "ES"
};

const interestLabels = {
    pt: {
        venda: "Comprar um forno",
        aluguel: "Alugar um forno",
        duvida: "Tirar uma dúvida"
    },
    en: {
        venda: "Buy an oven",
        aluguel: "Rent an oven",
        duvida: "Ask a question"
    },
    es: {
        venda: "Comprar un horno",
        aluguel: "Alquilar un horno",
        duvida: "Hacer una consulta"
    }
};

function translatePage(language) {
    currentLanguage = language;
    document.documentElement.lang = language === "pt" ? "pt-BR" : language;

    document.querySelectorAll("[data-pt]").forEach((element) => {
        const translation = element.dataset[language];
        if (translation) {
            element.textContent = translation;
        }
    });

    document.querySelectorAll("[data-placeholder-pt]").forEach((element) => {
        const placeholder = element.getAttribute(`data-placeholder-${language}`);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });

    const currentLanguageLabel = document.getElementById("currentLanguageLabel");
    if (currentLanguageLabel) {
        currentLanguageLabel.textContent = languageNames[language] || "PT";
    }
}

function closeLanguageScreen() {
    const languageScreen = document.getElementById("languageScreen");
    if (!languageScreen) return;

    languageScreen.classList.add("is-hidden");
    document.body.classList.remove("modal-open");

    window.setTimeout(() => {
        languageScreen.setAttribute("aria-hidden", "true");
    }, 700);
}

function openLanguageScreen() {
    const languageScreen = document.getElementById("languageScreen");
    if (!languageScreen) return;

    languageScreen.removeAttribute("aria-hidden");
    languageScreen.classList.remove("is-hidden");
    document.body.classList.add("modal-open");
}

function setLanguage(language) {
    translatePage(language);
    sessionStorage.setItem("campLanguage", language);
    closeLanguageScreen();
}

window.setLanguage = setLanguage;

function createEmbers(containerId, amount) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const fragment = document.createDocumentFragment();

    for (let index = 0; index < amount; index += 1) {
        const ember = document.createElement("span");
        ember.className = "ember";
        ember.style.setProperty("--left", `${Math.random() * 100}%`);
        ember.style.setProperty("--size", `${2 + Math.random() * 4}px`);
        ember.style.setProperty("--duration", `${5 + Math.random() * 8}s`);
        ember.style.setProperty("--delay", `${Math.random() * -10}s`);
        ember.style.setProperty("--drift", `${-70 + Math.random() * 140}px`);
        fragment.appendChild(ember);
    }

    container.appendChild(fragment);
}

function initializeMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const navigation = document.getElementById("mainNavigation");

    if (!menuToggle || !navigation) return;

    const closeMenu = () => {
        menuToggle.classList.remove("is-open");
        navigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
    };

    menuToggle.addEventListener("click", () => {
        const willOpen = !navigation.classList.contains("is-open");
        menuToggle.classList.toggle("is-open", willOpen);
        navigation.classList.toggle("is-open", willOpen);
        menuToggle.setAttribute("aria-expanded", String(willOpen));
        document.body.classList.toggle("menu-open", willOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeMenu();
    });
}

function initializeHeader() {
    const header = document.getElementById("siteHeader");
    if (!header) return;

    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 30);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
}

function initializeRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal:not(.is-visible)");

    if (!("IntersectionObserver" in window)) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12
    });

    revealElements.forEach((element) => observer.observe(element));
}

function initializeActiveNavigation() {
    const sections = document.querySelectorAll("main section[id]");
    const links = document.querySelectorAll('.main-navigation a[href^="#"]');

    if (!("IntersectionObserver" in window) || sections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            links.forEach((link) => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
            });
        });
    }, {
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
}

function initializeLightbox() {
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxClose = document.getElementById("lightboxClose");
    const imageButtons = document.querySelectorAll("[data-lightbox-src]");

    if (!lightbox || !lightboxImage || !lightboxClose) return;

    const closeLightbox = () => {
        lightbox.hidden = true;
        lightboxImage.src = "";
        document.body.classList.remove("modal-open");
    };

    imageButtons.forEach((button) => {
        button.addEventListener("click", () => {
            lightboxImage.src = button.dataset.lightboxSrc || "";
            lightboxImage.alt = button.dataset.lightboxAlt || "Forno Camp Fornos";
            lightbox.hidden = false;
            document.body.classList.add("modal-open");
            lightboxClose.focus();
        });
    });

    lightboxClose.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
}

function initializeQuoteForm() {
    const form = document.getElementById("quoteForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("quoteName")?.value.trim() || "";
        const city = document.getElementById("quoteCity")?.value.trim() || "";
        const interest = document.getElementById("quoteInterest")?.value || "";
        const message = document.getElementById("quoteMessage")?.value.trim() || "";
        const interestText = interestLabels[currentLanguage]?.[interest] || interest;

        const templates = {
            pt: `Olá, equipe Camp Fornos!\n\nMeu nome é ${name}.\nCidade: ${city}.\nInteresse: ${interestText}.\n\n${message || "Gostaria de receber mais informações."}`,
            en: `Hello, Camp Fornos team!\n\nMy name is ${name}.\nCity: ${city}.\nInterest: ${interestText}.\n\n${message || "I would like to receive more information."}`,
            es: `¡Hola, equipo de Camp Fornos!\n\nMi nombre es ${name}.\nCiudad: ${city}.\nInterés: ${interestText}.\n\n${message || "Me gustaría recibir más información."}`
        };

        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(templates[currentLanguage] || templates.pt)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    });
}

function initializeLanguagePreference() {
    const savedLanguage = sessionStorage.getItem("campLanguage");

    if (savedLanguage && ["pt", "en", "es"].includes(savedLanguage)) {
        translatePage(savedLanguage);
        closeLanguageScreen();
    } else {
        translatePage("pt");
        document.body.classList.add("modal-open");
    }

    document.getElementById("languageSwitch")?.addEventListener("click", openLanguageScreen);
}

function initializeYear() {
    const currentYear = document.getElementById("currentYear");
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", () => {
    createEmbers("heroEmbers", 34);
    createEmbers("languageEmbers", 24);
    initializeLanguagePreference();
    initializeMenu();
    initializeHeader();
    initializeRevealAnimations();
    initializeActiveNavigation();
    initializeLightbox();
    initializeQuoteForm();
    initializeYear();
});
