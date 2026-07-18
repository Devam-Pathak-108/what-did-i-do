from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path
from dotenv import load_dotenv

_BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "What Did I Do?"
    debug: bool = True

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "what_did_i_do"

    # Folder of productivity GIFs named by score (e.g. -0.4.gif)
    gifs_dir: str = str(_BACKEND_ROOT / "gifs")

    jwt_secret_key: str = "change-me-to-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440

    otp_expire_minutes: int = 10
    otp_length: int = 6

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "What Did I Do?"
    smtp_use_tls: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

# --- ElevenLabs (speech-to-text) ---
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text"
ELEVENLABS_STT_MODEL = "scribe_v1"

# --- ElevenLabs (text-to-speech) ---
# Voice: Jessica - Playful, Bright, Warm
ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech"
ELEVENLABS_TTS_MODEL = "eleven_multilingual_v2"
ELEVENLABS_VOICE_ID = "cgSgspJ2msm6clMCkdW9"  # Jessica

# --- Gemini (text generation / summarization) ---
# Auth: CURSOR_API_KEY is preferred; GEMINI_API_KEY is a fallback.
# Free-tier models: gemini-2.5-flash or gemini-3-flash-preview
GEMINI_API_KEY = os.getenv("CURSOR_API_KEY") or os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# --- Storage ---
DATA_DIR = PROJECT_ROOT / "backend" / "data"
ENTRIES_FILE = DATA_DIR / "entries.json"

