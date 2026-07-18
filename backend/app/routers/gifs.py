from fastapi import APIRouter, Path
from fastapi.responses import FileResponse

from app.services.gif_service import resolve_gif_path

router = APIRouter(prefix="/gifs", tags=["GIFs"])


@router.get("/{score}")
async def get_gif_by_score(
    score: str = Path(description="Productivity score key, e.g. -0.4, 0.0, 1.0"),
) -> FileResponse:
    """Return the GIF file that matches the score filename in the gifs folder."""
    path = resolve_gif_path(score)
    filename = path.name if path.suffix else f"{path.name}.gif"
    return FileResponse(
        path,
        media_type="image/gif",
        filename=filename,
    )
