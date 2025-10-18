# app/services/google_tts.py
import requests
from ..config import settings

def google_tts(text, out_file, lang="en-IN", voice="en-IN-Wavenet-D"):
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={settings.GOOGLE_TTS_API_KEY}"
    body = {
        "input": {"text": text},
        "voice": {"languageCode": lang, "name": voice},
        "audioConfig": {"audioEncoding": "MP3"}
    }
    r = requests.post(url, json=body)
    result = r.json()
    if "audioContent" in result:
        with open(out_file, "wb") as f:
            f.write(bytes(result["audioContent"], "utf-8"))
    else:
        raise Exception(f"TTS error: {result}")
