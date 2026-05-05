from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.repositories.mongo import ensure_mongo_indexes


mongo_client: Optional[AsyncIOMotorClient] = None


async def connect_persistence() -> None:
    global mongo_client
    settings = get_settings()
    if settings.use_mock_db:
        return
    mongo_client = AsyncIOMotorClient(settings.mongodb_uri)
    await ensure_mongo_indexes(mongo_client[settings.mongodb_db_name])


async def close_persistence() -> None:
    global mongo_client
    if mongo_client is not None:
        mongo_client.close()
        mongo_client = None
