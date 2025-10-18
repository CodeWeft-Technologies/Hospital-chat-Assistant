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

// Handle language selection with visual feedback
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const selectedLang = btn.getAttribute('data-lang');
        
        // Add visual feedback
        btn.classList.add('selected');
        
        // Add loading state
        btn.style.transform = 'scale(0.95)';
        btn.innerHTML = '<span style="display: inline-block; animation: pulse 0.6s ease-in-out;">Loading...</span>';
        
        // Save selection
        localStorage.setItem('selectedLanguage', selectedLang);
        
        // Small delay for visual feedback, then redirect
        setTimeout(() => {
            window.location.href = "/chat";
        }, 500);
    });
    
    // Add hover sound effect (optional)
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-4px) scale(1.02)';
    });
    
    btn.addEventListener('mouseleave', () => {
        if (!btn.classList.contains('selected')) {
            btn.style.transform = 'translateY(0) scale(1)';
        }
    });
});

// Init
document.addEventListener("DOMContentLoaded", async () => {
    await loadTranslations();
    updateLanguageUI();
});
