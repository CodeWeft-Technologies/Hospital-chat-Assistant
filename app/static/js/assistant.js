// -------- Language Helpers --------
function getSelectedLanguage() {
    return localStorage.getItem("selectedLanguage") || "english";
}

// Load translations
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

// Update assistant page UI with translated text
function updateAssistantUI() {
    // Hospital Name
    document.getElementById("hospitalName").textContent = window.t.hospital_name || "XYZ Hospital";

    // Sub-title "Our Assistant – Please choose an option"
    const subTitle = `${window.t.assistant_sub_title || "Our Assistant"} – ${window.t.chat_welcome || "Please choose an option"}`;
    document.querySelector(".assistant-header h2").textContent = subTitle;

    // Language pill
    document.getElementById("currentLangPill").textContent = window.t.lang_label || window.currentLang;

    // Chat & Voice buttons
    document.getElementById("chatBtnTitle").textContent = window.t.chat_assistant_title || "Chat Assistant";
    document.getElementById("chatBtnSub").textContent = window.t.chat_assistant_sub || "Ask or manage via chat";
    document.getElementById("voiceBtnTitle").textContent = window.t.voice_assistant_title || "Voice Assistant";
    document.getElementById("voiceBtnSub").textContent = window.t.voice_assistant_sub || "Talk to the assistant";

    // Back button text from translation
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.textContent = window.t.back_title || "← Back";
        backBtn.addEventListener("click", () => window.history.back());
    }
}

// Wire buttons to go to respective flows
function wireAssistantHome() {
    document.getElementById("chatAssistantBtn")?.addEventListener("click", () => {
        window.location.href = "/chat";
    });
    document.getElementById("voiceAssistantBtn")?.addEventListener("click", () => {
        window.location.href = "/voice";
    });
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations();
    updateAssistantUI();
    wireAssistantHome();
});
