function setLanguage(language) {
    const elements = document.querySelectorAll("[data-pt]");

    elements.forEach(function(element) {
        const text = element.getAttribute("data-" + language);

        if (text) {
            element.innerText = text;
        }
    });

    const languageScreen = document.getElementById("languageScreen");

    languageScreen.style.opacity = "0";
    languageScreen.style.transition = "0.6s";

    setTimeout(function() {
        languageScreen.style.display = "none";
    }, 600);
}