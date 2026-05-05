from motor.motor_asyncio import AsyncIOMotorDatabase


COLLECTION_INDEXES = {
    "users": [
        ("email",),
        ("role",),
    ],
    "devices": [
        ("status",),
        ("last_heartbeat_at",),
    ],
    "deposit_sessions": [
        ("user_id",),
        ("device_id",),
        ("status",),
        ("created_at",),
        ("user_id", "device_id", "status"),
    ],
    "transactions": [
        ("session_id",),
        ("user_id",),
        ("device_id",),
        ("status",),
        ("created_at",),
    ],
    "withdrawals": [
        ("user_id",),
        ("status",),
        ("requested_at",),
    ],
    "education": [
        ("category",),
        ("published_at",),
    ],
    "iot_logs": [
        ("device_id",),
        ("session_id",),
        ("created_at",),
    ],
}


async def ensure_mongo_indexes(database: AsyncIOMotorDatabase) -> None:
    for collection_name, indexes in COLLECTION_INDEXES.items():
        collection = database[collection_name]
        for fields in indexes:
            keys = [(field, 1) for field in fields]
            await collection.create_index(keys)


class MongoRepositories:
    """MongoDB adapter boundary for the next persistence step.

    The current demo runtime remains in-memory by default. This adapter owns collection
    names and index initialization so the state service can move to async persistence
    without changing endpoint contracts.
    """

    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.database = database
        self.users = database["users"]
        self.devices = database["devices"]
        self.sessions = database["deposit_sessions"]
        self.transactions = database["transactions"]
        self.withdrawals = database["withdrawals"]
        self.education = database["education"]
        self.iot_logs = database["iot_logs"]
