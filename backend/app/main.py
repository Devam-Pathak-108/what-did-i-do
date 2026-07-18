from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import close_mongo_connection, connect_to_mongo
from app.routers import auth, chat, gifs, profile, summary


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        description="AI-powered personal memory assistant API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api")
    app.include_router(profile.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")
    app.include_router(summary.router, prefix="/api")
    app.include_router(gifs.router, prefix="/api")

    @app.get("/health")
    async def health():
        return {"status": "ok", "app": settings.app_name}

    return app


app = create_app()
