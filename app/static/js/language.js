// -------- Language Helpers --------
function getSelectedLanguage() {
    return localStorage.getItem("selectedLanguage") || "english";
}

// Load translations if needed
async function loadTranslations() {
    const lang = getSelectedLanguage();
    try {
        const res = await fetch("/static/lang/lang.json");
        const allTranslations = await res.json();
        const translations = allTranslations[lang] || allTranslations["english"];
        window.t = translations;
        window.currentLang = lang;
        return { lang, translations };
    } catch (e) {
        console.error("Error loading translations:", e);
        window.t = {};
        return { lang, translations: {} };
    }
}

// Keep title fixed
function updateLanguageUI() {
    const langTitle = document.getElementById("langTitle");
    if (langTitle) langTitle.textContent = "Language / भाषा"; // Fixed
}

// Handle language selection
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const selectedLang = btn.getAttribute('data-lang');
        localStorage.setItem('selectedLanguage', selectedLang);
        window.location.href = "/chat"; // Direct to chat interface
    });
});

// Init
document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations();
    updateLanguageUI();
});
