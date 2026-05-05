from typing import List, Optional, Protocol

from redis.asyncio import Redis

from app.models.schemas import SmartBinCommand


class CommandQueue(Protocol):
    async def push(self, command: SmartBinCommand) -> None:
        ...

    async def pop_next(self, device_id: str) -> Optional[SmartBinCommand]:
        ...


class RedisCommandQueue:
    def __init__(self, redis: Redis, prefix: str = "ecodrop:commands") -> None:
        self.redis = redis
        self.prefix = prefix

    async def push(self, command: SmartBinCommand) -> None:
        await self.redis.rpush(self._key(command.device_id), command.model_dump_json())

    async def pop_next(self, device_id: str) -> Optional[SmartBinCommand]:
        payload = await self.redis.lpop(self._key(device_id))
        if payload is None:
            return None
        if isinstance(payload, bytes):
            payload = payload.decode()
        return SmartBinCommand.model_validate_json(payload)

    def _key(self, device_id: str) -> str:
        return f"{self.prefix}:{device_id}"


class InMemoryCommandQueue:
    def __init__(self) -> None:
        self.commands: dict[str, List[SmartBinCommand]] = {}

    async def push(self, command: SmartBinCommand) -> None:
        self.commands.setdefault(command.device_id, []).append(command)

    async def pop_next(self, device_id: str) -> Optional[SmartBinCommand]:
        queue = self.commands.get(device_id, [])
        if not queue:
            return None
        return queue.pop(0)
