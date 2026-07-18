"""Entry endpoints: transcribe spoken audio and store/list daily entries.

Ported from the standalone speech-to-text + storage app and wired into the
main FastAPI application.
"""

from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from storage import get_entries, save_entry
from transcription import transcribe_audio

router = APIRouter(prefix="/entries", tags=["Entries"])


@router.post("/audio")
async def create_entry_from_audio(
    file: UploadFile = File(...),
    date: Optional[str] = Form(None),
):
    """Transcribe spoken audio -> raw_data and store it with the date."""
    audio_bytes = await file.read()
    try:
        raw_data = transcribe_audio(audio_bytes, file.filename or "audio.wav")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Transcription failed: {exc}")

    return save_entry(raw_data=raw_data, date=date)


@router.get("")
def list_entries(date: Optional[str] = None):
    """List stored entries, optionally filtered by date."""
    return get_entries(date)
