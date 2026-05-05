from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import (
    CommandAckRequest,
    CreateSessionRequest,
    DeviceRegistrationRequest,
    HeartbeatRequest,
    SensorEventRequest,
)
from app.services.ai_client import validate_bottle_image
from app.services.state import now_utc, state


app = FastAPI(
    title="EcoDrop Backend API",
    description="FastAPI scaffold for EcoDrop mobile, admin dashboard, AI/CV, and SmartBin integration.",
    version="0.1.0",
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
async def get_me(user_id: str = "user-demo-001"):
    user = state.users.get(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/devices")
async def list_devices():
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
    session = state.sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Deposit session not found")
    return session


@app.post("/api/deposit-sessions/{session_id}/validate")
async def validate_deposit_image(session_id: str, image: UploadFile = File(...)):
    if session_id not in state.sessions:
        raise HTTPException(status_code=404, detail="Deposit session not found")
    validation = await validate_bottle_image(image)
    return state.set_validation(session_id, validation)


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
    return [t for t in state.transactions.values() if t.user_id == user_id]


@app.get("/api/education")
async def list_education():
    return state.articles


@app.get("/api/admin/dashboard")
async def admin_dashboard():
    return state.dashboard()


@app.get("/api/admin/transactions")
async def admin_transactions():
    return list(state.transactions.values())


@app.get("/api/admin/users")
async def admin_users():
    return list(state.users.values())


@app.get("/api/admin/withdrawals")
async def admin_withdrawals():
    return state.withdrawals


@app.post("/api/iot/devices/register")
async def register_device(payload: DeviceRegistrationRequest):
    existing = state.devices.get(payload.device_id)
    if existing:
        existing.status = "online"
        existing.last_heartbeat_at = now_utc()
        existing.firmware_version = payload.firmware_version
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
    return device


@app.get("/api/iot/devices/{device_id}/commands/next")
async def get_next_device_command(device_id: str):
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
        return state.acknowledge_command(device_id, command_id, payload.status)
    except KeyError:
        raise HTTPException(status_code=404, detail="Command not found")


@app.post("/api/iot/devices/{device_id}/sensor-events")
async def receive_sensor_event(device_id: str, payload: SensorEventRequest):
    if payload.sensor_state != "object_detected":
        return {"status": "ignored", "reason": "Sensor is clear"}
    try:
        transaction = state.confirm_sensor(payload.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Deposit session not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return {"status": "accepted", "transaction": transaction}
