from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import certifi

from app.config import get_settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global _client, _db
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())
    _db = _client[settings.mongodb_db_name]

    await _db.users.create_index("email", unique=True)
    await _db.users.create_index("username", unique=True)
    await _db.otps.create_index("expires_at", expireAfterSeconds=0)

    # Chat: sessions + messages (UI history) + day_summaries (type-0 recall/history)
    await _db.chat_sessions.create_index([("user_id", 1), ("is_active", 1), ("updated_at", -1)])
    await _db.chat_messages.create_index(
        [("user_id", 1), ("session_id", 1), ("visible_in_chat", 1), ("datetime", -1)]
    )
    await _db.chat_messages.create_index([("session_id", 1), ("datetime", -1)])
    await _db.day_summaries.create_index([("user_id", 1), ("entry_date", 1), ("created_at", 1)])
    await _db.day_summaries.create_index([("user_id", 1), ("date", -1)])
    await _db.recalls.create_index([("user_id", 1), ("entry_date", 1), ("created_at", -1)])
    await _db.period_summaries.create_index([("user_id", 1), ("created_at", -1)])
    await _db.period_summaries.create_index([("user_id", 1), ("start_date", 1), ("end_date", 1)])


async def close_mongo_connection() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None


def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database has not been initialized")
    return _db
