import pytest
from fastapi import UploadFile

from app.core.config import get_settings
from app.services.ai_client import validate_bottle_image


@pytest.fixture()
def anyio_backend():
    return "asyncio"


class DummyResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "is_valid": True,
            "brand": "Le Minerale",
            "confidence": 0.88,
            "volume_ml": 1500,
            "height_mm": 315,
            "diameter_mm": 88,
            "estimated_points": 150,
            "reason": "Accepted by test AI service.",
            "debug_image_url": None,
        }


class DummyAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def post(self, *args, **kwargs):
        return DummyResponse()


@pytest.mark.anyio
async def test_backend_ai_client_real_service_mode(monkeypatch):
    monkeypatch.setenv("USE_MOCK_AI", "false")
    get_settings.cache_clear()
    monkeypatch.setattr("app.services.ai_client.httpx.AsyncClient", DummyAsyncClient)
    image = UploadFile(filename="le-minerale.jpg", file=BytesFile(b"image"))

    validation = await validate_bottle_image(image)

    assert validation.is_valid is True
    assert validation.brand == "Le Minerale"
    assert validation.volume_ml == 1500
    assert validation.estimated_points == 150


class BytesFile:
    def __init__(self, content: bytes) -> None:
        self.content = content

    def read(self, *args, **kwargs) -> bytes:
        return self.content
