"""ElevenLabs speech-to-text.

Takes the raw audio the user spoke and returns the transcribed text (raw_data).
"""

import requests

from app.config import ELEVENLABS_API_KEY, ELEVENLABS_STT_MODEL, ELEVENLABS_STT_URL


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    """Send audio to ElevenLabs and return the transcript text.

    Args:
        audio_bytes: The raw audio content of what the user spoke.
        filename: Original filename (used to hint the content type).

    Returns:
        The transcribed text.
    """
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY is not set in the .env file.")

    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    files = {"file": (filename, audio_bytes)}
    data = {"model_id": ELEVENLABS_STT_MODEL}

    response = requests.post(
        ELEVENLABS_STT_URL,
        headers=headers,
        files=files,
        data=data,
        timeout=120,
    )
    response.raise_for_status()

    payload = response.json()
    return payload.get("text", "").strip()
