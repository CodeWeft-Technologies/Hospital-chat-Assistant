# app/services/google_stt.py
import requests
import base64
from ..config import settings
from google.cloud import speech

def google_stt(audio_content, language_code="en-IN"):
    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(content=audio_content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code=language_code,
    )

    response = client.recognize(config=config, audio=audio)
    return [result.alternatives[0].transcript for result in response.results]


def google_stt(audio_path, language="en-IN"):
    url = f"https://speech.googleapis.com/v1/speech:recognize?key={settings.GOOGLE_STT_API_KEY}"
    
    with open(audio_path, "rb") as f:
        audio_content = base64.b64encode(f.read()).decode("utf-8")

    body = {
        "config": {
            "encoding": "LINEAR16",
            "sampleRateHertz": 16000,
            "languageCode": language
        },
        "audio": {"content": audio_content}
    }
    r = requests.post(url, json=body)
    result = r.json()
    if "results" in result:
        return result["results"][0]["alternatives"][0]["transcript"]
    return ""
