from fastapi.testclient import TestClient

from app.main import app
from app.services.state import state


def setup_function():
    state.reset()


def admin_headers() -> dict:
    return {"Authorization": "Bearer dev-token-admin-demo-001"}


def test_admin_endpoints_require_admin_token():
    client = TestClient(app)

    response = client.get("/api/admin/dashboard")

    assert response.status_code == 403


def test_admin_can_create_and_update_education_article():
    client = TestClient(app)
    create_response = client.post(
        "/api/admin/education",
        headers=admin_headers(),
        json={
            "title": "Sort PET Before Deposit",
            "excerpt": "Clean bottles improve recycling value.",
            "content": "Empty and rinse PET bottles before using EcoDrop.",
            "category": "plastic",
        },
    )

    assert create_response.status_code == 200
    article = create_response.json()

    update_response = client.patch(
        f"/api/admin/education/{article['id']}",
        headers=admin_headers(),
        json={"title": "Sort PET Bottles Before Deposit"},
    )

    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Sort PET Bottles Before Deposit"


def test_user_can_request_withdrawal_and_admin_can_update_status():
    client = TestClient(app)
    create_response = client.post(
        "/api/withdrawals",
        json={
            "user_id": "user-demo-001",
            "points": 1000,
            "method": "ewallet",
            "account_target": "081234567890",
        },
    )

    assert create_response.status_code == 200
    withdrawal = create_response.json()

    update_response = client.patch(
        f"/api/admin/withdrawals/{withdrawal['id']}",
        headers=admin_headers(),
        json={"status": "approved"},
    )

    assert update_response.status_code == 200
    assert update_response.json()["status"] == "approved"
