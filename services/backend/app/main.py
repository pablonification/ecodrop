from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.core.auth import get_current_user, require_admin
from app.models.schemas import (
    CommandAckRequest,
    CreateEducationArticleRequest,
    CreateSessionRequest,
    CreateWithdrawalRequest,
    DeviceRegistrationRequest,
    HeartbeatRequest,
    SensorEventRequest,
    UpdateEducationArticleRequest,
    UpdateWithdrawalStatusRequest,
)
from app.services.ai_client import validate_bottle_image
from app.services.persistence import close_persistence, connect_persistence
from app.services.state import now_utc, state


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_persistence()
    yield
    await close_persistence()


app = FastAPI(
    title="EcoDrop Backend API",
    description="FastAPI scaffold for EcoDrop mobile, admin dashboard, AI/CV, and SmartBin integration.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ecodrop-backend"}


@app.post("/api/auth/dev-login")
async def dev_login(email: str = "arqila@example.com"):
    user = next((u for u in state.users.values() if u["email"] == email), None)
    if user is None:
        raise HTTPException(status_code=404, detail="Demo user not found")
    return {"access_token": f"dev-token-{user['id']}", "token_type": "bearer", "user": user}


@app.get("/api/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    state.expire_stale_sessions()
    return current_user


@app.get("/api/devices")
async def list_devices():
    for device_id in list(state.devices.keys()):
        state.refresh_device_availability(device_id)
    return list(state.devices.values())


@app.post("/api/deposit-sessions")
async def create_deposit_session(payload: CreateSessionRequest):
    try:
        return state.create_session(user_id=payload.user_id, qr_token=payload.qr_token)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@app.get("/api/deposit-sessions/{session_id}")
async def get_deposit_session(session_id: str):
    state.expire_stale_sessions()
    session = state.sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Deposit session not found")
    return session


@app.post("/api/deposit-sessions/{session_id}/validate")
async def validate_deposit_image(session_id: str, image: UploadFile = File(...)):
    if session_id not in state.sessions:
        raise HTTPException(status_code=404, detail="Deposit session not found")
    validation = await validate_bottle_image(image)
    try:
        return state.set_validation(session_id, validation)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@app.post("/api/deposit-sessions/{session_id}/confirm")
async def confirm_deposit_manually(session_id: str):
    try:
        return state.confirm_sensor(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Deposit session not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@app.get("/api/transactions")
async def list_user_transactions(user_id: str = "user-demo-001"):
    return state.list_transactions(user_id=user_id)


@app.get("/api/education")
async def list_education():
    return state.articles


@app.get("/api/education/{article_id}")
async def get_education_article(article_id: str):
    article = next((item for item in state.articles if item.id == article_id), None)
    if article is None:
        raise HTTPException(status_code=404, detail="Education article not found")
    return article


@app.post("/api/withdrawals")
async def create_withdrawal(payload: CreateWithdrawalRequest):
    try:
        return state.create_withdrawal(payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="User not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@app.get("/api/admin/dashboard")
async def admin_dashboard(_admin: dict = Depends(require_admin)):
    return state.dashboard()


@app.get("/api/admin/transactions")
async def admin_transactions(_admin: dict = Depends(require_admin)):
    return state.list_transactions()


@app.get("/api/admin/users")
async def admin_users(_admin: dict = Depends(require_admin)):
    return list(state.users.values())


@app.get("/api/admin/withdrawals")
async def admin_withdrawals(_admin: dict = Depends(require_admin)):
    return state.withdrawals


@app.get("/api/admin/iot-logs")
async def admin_iot_logs(_admin: dict = Depends(require_admin)):
    return state.iot_logs[-100:]


@app.patch("/api/admin/withdrawals/{withdrawal_id}")
async def update_withdrawal_status(
    withdrawal_id: str,
    payload: UpdateWithdrawalStatusRequest,
    _admin: dict = Depends(require_admin),
):
    try:
        return state.update_withdrawal_status(withdrawal_id, payload.status)
    except KeyError:
        raise HTTPException(status_code=404, detail="Withdrawal not found")


@app.post("/api/admin/education")
async def create_admin_education_article(
    payload: CreateEducationArticleRequest,
    _admin: dict = Depends(require_admin),
):
    return state.create_education_article(payload)


@app.patch("/api/admin/education/{article_id}")
async def update_admin_education_article(
    article_id: str,
    payload: UpdateEducationArticleRequest,
    _admin: dict = Depends(require_admin),
):
    try:
        return state.update_education_article(article_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Education article not found")


@app.post("/api/iot/devices/register")
async def register_device(payload: DeviceRegistrationRequest):
    existing = state.devices.get(payload.device_id)
    if existing:
        existing.status = "online"
        existing.last_heartbeat_at = now_utc()
        existing.firmware_version = payload.firmware_version
        if payload.location_name:
            existing.location_name = payload.location_name
        state.log_iot(
            device_id=payload.device_id,
            event_type="device_registered",
            message="SmartBin registration refreshed.",
        )
        return existing
    device = {
        "id": payload.device_id,
        "name": f"EcoDrop {payload.device_id}",
        "location_name": payload.location_name or "Unassigned Location",
        "latitude": 0,
        "longitude": 0,
        "status": "online",
        "capacity_percent": 0,
        "last_heartbeat_at": now_utc(),
        "firmware_version": payload.firmware_version,
    }
    from app.models.schemas import SmartBin

    smart_bin = SmartBin(**device)
    state.devices[payload.device_id] = smart_bin
    state.log_iot(
        device_id=payload.device_id,
        event_type="device_registered",
        message="SmartBin registered.",
    )
    return smart_bin


@app.post("/api/iot/devices/{device_id}/heartbeat")
async def device_heartbeat(device_id: str, payload: HeartbeatRequest):
    device = state.devices.get(device_id)
    if device is None:
        raise HTTPException(status_code=404, detail="SmartBin device not found")
    device.status = payload.status
    device.capacity_percent = payload.capacity_percent
    device.firmware_version = payload.firmware_version or device.firmware_version
    device.last_heartbeat_at = now_utc()
    state.log_iot(
        device_id=device_id,
        event_type="heartbeat",
        message=f"Heartbeat received with status {payload.status}.",
    )
    return device


@app.get("/api/iot/devices/{device_id}/commands/next")
async def get_next_device_command(device_id: str):
    if device_id not in state.devices:
        raise HTTPException(status_code=404, detail="SmartBin device not found")
    command = state.next_command(device_id)
    if command is None:
        return {
            "id": f"noop-{device_id}",
            "device_id": device_id,
            "action": "noop",
            "duration_seconds": 0,
            "status": "sent",
            "created_at": now_utc(),
            "metadata": {},
        }
    return command


@app.post("/api/iot/devices/{device_id}/commands/{command_id}/ack")
async def acknowledge_device_command(device_id: str, command_id: str, payload: CommandAckRequest):
    try:
        return state.acknowledge_command(device_id, command_id, payload.status, payload.message)
    except KeyError:
        raise HTTPException(status_code=404, detail="Command not found")


@app.post("/api/iot/devices/{device_id}/sensor-events")
async def receive_sensor_event(device_id: str, payload: SensorEventRequest):
    if device_id not in state.devices:
        raise HTTPException(status_code=404, detail="SmartBin device not found")
    if payload.sensor_state != "object_detected":
        state.log_iot(
            device_id=device_id,
            event_type="sensor_ignored",
            message="Sensor event ignored because beam is clear.",
            session_id=payload.session_id,
        )
        return {"status": "ignored", "reason": "Sensor is clear"}
    try:
        transaction = state.confirm_sensor(payload.session_id, device_id=device_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Deposit session not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return {"status": "accepted", "transaction": transaction}
