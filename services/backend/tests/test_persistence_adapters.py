import pytest

from app.repositories.mongo import COLLECTION_INDEXES, ensure_mongo_indexes


class FakeCollection:
    def __init__(self) -> None:
        self.created_indexes = []

    async def create_index(self, keys):
        self.created_indexes.append(keys)


class FakeDatabase:
    def __init__(self) -> None:
        self.collections = {}

    def __getitem__(self, name: str) -> FakeCollection:
        self.collections.setdefault(name, FakeCollection())
        return self.collections[name]


@pytest.fixture()
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_mongo_index_initializer_covers_required_collections():
    database = FakeDatabase()

    await ensure_mongo_indexes(database)

    assert set(database.collections) == set(COLLECTION_INDEXES)
    assert database.collections["users"].created_indexes == [[("email", 1)], [("role", 1)]]
    assert [("session_id", 1)] in database.collections["transactions"].created_indexes
    assert [("user_id", 1), ("device_id", 1), ("status", 1)] in database.collections[
        "deposit_sessions"
    ].created_indexes
