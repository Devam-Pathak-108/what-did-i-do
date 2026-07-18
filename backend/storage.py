"""Simple JSON storage for daily entries (date + raw_data)."""

import json
from datetime import date as date_cls
from typing import Optional

from app.config import DATA_DIR, ENTRIES_FILE


def _load_all() -> list[dict]:
    if not ENTRIES_FILE.exists():
        return []
    with open(ENTRIES_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _write_all(entries: list[dict]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(ENTRIES_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def save_entry(raw_data: str, date: Optional[str] = None) -> dict:
    """Store a new entry. Defaults the date to today when not provided."""
    entry = {
        "date": date or date_cls.today().isoformat(),
        "raw_data": raw_data,
    }
    entries = _load_all()
    entries.append(entry)
    _write_all(entries)
    return entry


def get_entries(date: Optional[str] = None) -> list[dict]:
    """Return all entries, optionally filtered by a specific date."""
    entries = _load_all()
    if date:
        return [e for e in entries if e.get("date") == date]
    return entries
