from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


def test_health_exposes_mock_mode():
    get_settings.cache_clear()
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["mode"] == "mock"


def test_mock_validation_returns_stable_success_shape():
    get_settings.cache_clear()
    client = TestClient(app)

    response = client.post(
        "/validate-bottle",
        files={"image": ("aqua-600.jpg", b"valid aqua bottle", "image/jpeg")},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["is_valid"] is True
    assert payload["brand"] == "Aqua"
    assert payload["volume_ml"] == 600
    assert payload["estimated_points"] == 60
    assert "reason" in payload


def test_mock_validation_can_reject_non_bottle_upload():
    get_settings.cache_clear()
    client = TestClient(app)

    response = client.post(
        "/validate-bottle",
        files={"image": ("invalid-object.jpg", b"not-bottle", "image/jpeg")},
    )
    payload = response.json()

    assert response.status_code == 200
    assert payload["is_valid"] is False
    assert payload["brand"] == "Unknown"
    assert payload["estimated_points"] == 0
