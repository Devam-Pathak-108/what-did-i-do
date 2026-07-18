from pathlib import Path

from fastapi import HTTPException, status

from app.config import get_settings


def format_score_key(score: float) -> str:
    """Normalize score to one decimal place for GIF filenames (e.g. -0.4)."""
    value = round(float(score), 1)
    if value < -1 or value > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="score must be between -1 and 1",
        )
    return f"{value:.1f}"


def build_gif_url(score: float) -> str:
    return f"/api/gifs/{format_score_key(score)}"


def _gifs_root() -> Path:
    return Path(get_settings().gifs_dir).resolve()


def resolve_gif_path(score: float | str) -> Path:
    """
    Find a GIF under the gifs folder whose name matches the score key.

    Accepts files like `-0.4.gif`, `-0.4`, including nested folders.
    """
    if isinstance(score, str):
        try:
            score_value = float(score)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid score param",
            ) from exc
    else:
        score_value = score

    key = format_score_key(score_value)
    root = _gifs_root()
    if not root.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"GIF folder not found for score {key}",
        )

    for candidate in (root / f"{key}.gif", root / f"{key}.GIF", root / key):
        resolved = candidate.resolve()
        if resolved.is_file() and str(resolved).startswith(str(root)):
            return resolved

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        resolved = path.resolve()
        if not str(resolved).startswith(str(root)):
            continue
        if path.stem == key:
            return resolved

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"GIF not found for score {key}",
    )
