import pytest

from app.models.schemas import BottleValidation, SmartBinCommand
from app.services.command_queue import InMemoryCommandQueue
from app.services.rewards import compute_tier, estimate_points
from app.services.state import now_utc, state


@pytest.fixture()
def anyio_backend():
    return "asyncio"


def setup_function():
    state.reset()


def test_point_estimation_and_tiers():
    assert estimate_points(600) == 60
    assert estimate_points(0) == 0
    assert compute_tier(0) == "Perintis"
    assert compute_tier(20000) == "Penjelajah"
    assert compute_tier(50000) == "Panutan"
    assert compute_tier(75000) == "Pewaris"


def test_admin_dashboard_aggregates_match_transactions():
    session = state.create_session("user-demo-001", "ECO-SMARTBIN-001")
    state.set_validation(
        session.id,
        BottleValidation(
            is_valid=True,
            brand="Aqua",
            confidence=0.95,
            volume_ml=600,
            height_mm=215,
            diameter_mm=65,
            estimated_points=60,
        ),
    )
    state.confirm_sensor(session.id, device_id="ECO-SMARTBIN-001")

    dashboard = state.dashboard()

    assert dashboard.overview.total_transactions == 1
    assert dashboard.overview.total_volume_ml == 600
    assert dashboard.overview.total_points_issued == 60
    assert dashboard.transactions[0].session_id == session.id


@pytest.mark.anyio
async def test_in_memory_command_queue_roundtrip():
    queue = InMemoryCommandQueue()
    command = SmartBinCommand(
        id="cmd-test",
        device_id="ECO-SMARTBIN-001",
        action="open_lid",
        session_id="sess-test",
        duration_seconds=10,
        status="queued",
        created_at=now_utc(),
    )

    await queue.push(command)
    popped = await queue.pop_next("ECO-SMARTBIN-001")

    assert popped is not None
    assert popped.id == "cmd-test"
    assert await queue.pop_next("ECO-SMARTBIN-001") is None
