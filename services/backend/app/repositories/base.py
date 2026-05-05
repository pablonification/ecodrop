from typing import Dict, Generic, List, Optional, Protocol, TypeVar


T = TypeVar("T")


class KeyValueRepository(Protocol[T]):
    def all(self) -> List[T]:
        ...

    def get(self, item_id: str) -> Optional[T]:
        ...

    def upsert(self, item_id: str, item: T) -> T:
        ...

    def delete(self, item_id: str) -> None:
        ...


class DictRepository(Generic[T]):
    def __init__(self, initial: Optional[Dict[str, T]] = None) -> None:
        self.items: Dict[str, T] = initial or {}

    def all(self) -> List[T]:
        return list(self.items.values())

    def get(self, item_id: str) -> Optional[T]:
        return self.items.get(item_id)

    def upsert(self, item_id: str, item: T) -> T:
        self.items[item_id] = item
        return item

    def delete(self, item_id: str) -> None:
        self.items.pop(item_id, None)
