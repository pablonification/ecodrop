# EcoDrop API Contract

This contract is the first coordination point for mobile, web admin, backend, AI/CV, and IoT work. Update this document before changing request/response fields.

## Core Rule

Points are awarded only after:

1. A deposit session is created from a valid SmartBin QR token.
2. Bottle image validation succeeds.
3. The backend queues an `open_lid` command.
4. The SmartBin IR sensor sends `object_detected` for the same session before the 10 second insert timer expires.

Image validation alone must never create a successful transaction or increment user points.

## Mobile REST

### `POST /api/deposit-sessions`

Request:

```json
{
  "qr_token": "ECO-SMARTBIN-001",
  "user_id": "user-demo-001"
}
```

Response: `DepositSession`.

### `POST /api/deposit-sessions/{session_id}/validate`

Request: `multipart/form-data` with `image`.

Response: `DepositSession` with `validation`.

Valid image result moves the session to `awaiting_insert` and queues `open_lid`. Invalid result moves the session to `rejected` and creates a failed transaction with zero points.

### `POST /api/deposit-sessions/{session_id}/confirm`

Temporary development endpoint to simulate IR sensor confirmation from the mobile app.

Response: `DepositTransaction`.

Production mobile flow should wait for backend/device status instead of calling this endpoint directly.

## IoT REST Hybrid

### `POST /api/iot/devices/register`

Registers or refreshes an ESP32 SmartBin.

### `POST /api/iot/devices/{device_id}/heartbeat`

Updates online/offline/error status, firmware version, and capacity.

### `GET /api/iot/devices/{device_id}/commands/next`

Returns the next command:

```json
{
  "id": "cmd-abc123",
  "device_id": "ECO-SMARTBIN-001",
  "action": "open_lid",
  "session_id": "sess-abc123",
  "duration_seconds": 10,
  "status": "sent"
}
```

When no command exists, returns `action: "noop"`.

### `POST /api/iot/devices/{device_id}/sensor-events`

Request:

```json
{
  "session_id": "sess-abc123",
  "sensor_state": "object_detected",
  "raw_value": 0
}
```

Response: successful transaction if the session is awaiting insertion and not expired.

## Admin REST

- `GET /api/admin/dashboard`
- `GET /api/admin/transactions`
- `GET /api/admin/users`
- `GET /api/admin/withdrawals`

These are initially read-only scaffold endpoints. Admin mutation endpoints should be added by the web/backend agents after the core dashboard is stable.
