from deep_translator import GoogleTranslator

class GoogleTranslateService:
    def __init__(self, default_target="en"):
        self.default_target = default_target

    def translate(self, text, target_lang=None, source_lang="auto"):
        """
        Translate text dynamically using Google Translate (via deep-translator).
        Falls back safely if translation fails.
        """
        if not text or text.strip() == "":
            return ""

        target = target_lang or self.default_target
        translated = None

        try:
            translated = GoogleTranslator(
                source=source_lang, target=target
            ).translate(text)
        except Exception as e:
            print(f"[Translation Error] {e}")
            translated = None

        # 🔥 Fallback: if translator failed OR returned empty OR returned same text
        if not translated or translated.strip() == "" or translated.strip().lower() == text.strip().lower():
            try:
                # try once more with source_lang="auto"
                translated = GoogleTranslator(source="auto", target=target).translate(text)
            except Exception as e2:
                print(f"[Fallback Translation Error] {e2}")
                return text  # final fallback → original

        return translated or text


# ✅ Create a global instance for re-use
google_translate = GoogleTranslateService()
