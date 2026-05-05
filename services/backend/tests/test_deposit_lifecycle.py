from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.state import now_utc, state


@pytest.fixture(autouse=True)
def reset_state():
    state.reset()
    yield


@pytest.fixture()
def client():
    return TestClient(app)


def create_session(client: TestClient) -> dict:
    response = client.post(
        "/api/deposit-sessions",
        json={"qr_token": "ECO-SMARTBIN-001", "user_id": "user-demo-001"},
    )
    assert response.status_code == 200
    return response.json()


def validate_session(client: TestClient, session_id: str, content: bytes = b"valid-image") -> dict:
    response = client.post(
        f"/api/deposit-sessions/{session_id}/validate",
        files={"image": ("bottle.jpg", content, "image/jpeg")},
    )
    assert response.status_code == 200
    return response.json()


def get_user_points(client: TestClient) -> int:
    return client.get("/api/users/me").json()["points"]


def test_validation_queues_lid_but_does_not_award_points(client: TestClient):
    start_points = get_user_points(client)
    session = create_session(client)

    validated = validate_session(client, session["id"])

    assert validated["status"] == "awaiting_insert"
    assert validated["validation"]["is_valid"] is True
    assert get_user_points(client) == start_points

    command = client.get("/api/iot/devices/ECO-SMARTBIN-001/commands/next").json()
    assert command["action"] == "open_lid"
    assert command["session_id"] == session["id"]


def test_active_session_can_be_recovered_after_duplicate_start(client: TestClient):
    session = create_session(client)
    duplicate_response = client.post(
        "/api/deposit-sessions",
        json={"qr_token": "ECO-SMARTBIN-001", "user_id": "user-demo-001"},
    )

    active_response = client.get(
        "/api/deposit-sessions/active",
        params={"user_id": "user-demo-001", "device_id": "ECO-SMARTBIN-001"},
    )

    assert duplicate_response.status_code == 409
    assert active_response.status_code == 200
    assert active_response.json()["id"] == session["id"]


def test_sensor_confirmation_awards_points_once(client: TestClient):
    start_points = get_user_points(client)
    session = create_session(client)
    validate_session(client, session["id"])

    first_response = client.post(
        "/api/iot/devices/ECO-SMARTBIN-001/sensor-events",
        json={"session_id": session["id"], "sensor_state": "object_detected", "raw_value": 0},
    )
    duplicate_response = client.post(
        "/api/iot/devices/ECO-SMARTBIN-001/sensor-events",
        json={"session_id": session["id"], "sensor_state": "object_detected", "raw_value": 0},
    )

    assert first_response.status_code == 200
    assert duplicate_response.status_code == 200
    first_transaction = first_response.json()["transaction"]
    duplicate_transaction = duplicate_response.json()["transaction"]
    assert first_transaction["status"] == "success"
    assert duplicate_transaction["id"] == first_transaction["id"]
    assert get_user_points(client) - start_points == first_transaction["points"]


def test_invalid_bottle_creates_zero_point_failed_transaction(client: TestClient):
    start_points = get_user_points(client)
    session = create_session(client)

    validated = validate_session(client, session["id"], content=b"invalid object")
    transactions = client.get("/api/transactions").json()

    assert validated["status"] == "rejected"
    assert validated["validation"]["is_valid"] is False
    assert transactions[0]["session_id"] == session["id"]
    assert transactions[0]["status"] == "failed"
    assert transactions[0]["points"] == 0
    assert get_user_points(client) == start_points


def test_insert_timeout_creates_failed_transaction_without_points(client: TestClient):
    start_points = get_user_points(client)
    session = create_session(client)
    validate_session(client, session["id"])
    state.sessions[session["id"]].insert_deadline_at = now_utc() - timedelta(seconds=1)

    response = client.post(
        "/api/iot/devices/ECO-SMARTBIN-001/sensor-events",
        json={"session_id": session["id"], "sensor_state": "object_detected", "raw_value": 0},
    )
    transaction = response.json()["transaction"]

    assert response.status_code == 200
    assert transaction["status"] == "failed"
    assert transaction["points"] == 0
    assert "expired" in transaction["failure_reason"].lower()
    assert get_user_points(client) == start_points


def test_offline_device_cannot_start_session(client: TestClient):
    state.devices["ECO-SMARTBIN-001"].status = "offline"

    response = client.post(
        "/api/deposit-sessions",
        json={"qr_token": "ECO-SMARTBIN-001", "user_id": "user-demo-001"},
    )

    assert response.status_code == 409
