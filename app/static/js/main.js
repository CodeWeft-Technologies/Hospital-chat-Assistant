// -------- Language helpers --------
function getSelectedLanguage() {
  return localStorage.getItem("selectedLanguage") || "english";
}

// Expose global fallback helper
window.tOr = function (key, fallback) {
  return (window.t && window.t[key]) || fallback;
};

// -------- Load translations --------
async function loadTranslations() {
  const lang = getSelectedLanguage();
  try {
    const res = await fetch(`/lang/${lang}`);
    if (!res.ok) throw new Error(`Failed to load language: ${lang}`);
    const translations = await res.json();
    window.t = translations;
    window.currentLang = lang;
    console.log("Translations loaded successfully:", window.t);
    return { lang, translations };
  } catch (e) {
    console.error("Error loading translations:", e);
    window.t = {};
    return { lang, translations: {} };
  }
}

// -------- Update UI with translations --------
function updateUIText() {
  if (!window.t) return;

  const hospitalName = document.getElementById("hospitalName");
  if (hospitalName) hospitalName.textContent = window.t.hospital_name || "XYZ Hospital";

  const langTitle = document.getElementById("langTitle");
  if (langTitle) langTitle.textContent = window.t.lang_pill ? `${window.t.lang_pill} / भाषा` : "Language / भाषा";
}

// -------- Page routing --------
document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.getAttribute("data-page");
  const { translations } = await loadTranslations();

  switch (page) {
    case "language":
      updateUIText();
      break;
    case "assistant":
      applyAssistantLabels(translations);
      wireAssistantHome();
      break;
    case "chat":
      console.log("Chat page loaded, handled separately.");
      break;
    case "voice":
      console.log("Voice page loaded, handled separately.");
      break;
    default:
      console.warn(`No translation bindings for page: ${page}`);
  }
});

// -------- Language selection --------
window.selectLanguage = function(lang) {
  localStorage.setItem("selectedLanguage", lang);
  window.location.href = "/assistant";
};
