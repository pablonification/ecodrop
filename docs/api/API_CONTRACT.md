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

### `POST /api/auth/dev-login`

Development auth endpoint. Returns a bearer token in the form
`dev-token-{user_id}`. Admin endpoints require an admin dev token.

### `GET /api/users/me`

Returns the current user. During development the endpoint accepts either a
`Bearer dev-token-{user_id}` header or defaults to `user-demo-001`.

### `POST /api/deposit-sessions`

Request:

```json
{
  "qr_token": "ECO-SMARTBIN-001",
  "user_id": "user-demo-001"
}
```

Response: `DepositSession`.

Backend rejects unknown users, unknown devices, offline devices, and duplicate active
sessions for the same user/device pair.

### `POST /api/deposit-sessions/{session_id}/validate`

Request: `multipart/form-data` with `image`.

Response: `DepositSession` with `validation`.

Valid image result moves the session to `awaiting_insert` and queues `open_lid`. Invalid result moves the session to `rejected` and creates a failed transaction with zero points.

Validation response is normalized by backend rules:

- confidence must be at least `BOTTLE_CONFIDENCE_THRESHOLD`;
- volume must be between `BOTTLE_MIN_VOLUME_ML` and `BOTTLE_MAX_VOLUME_ML`;
- points are estimated but not awarded.

`DepositSession` includes `failure_reason`, `updated_at`, and `insert_deadline_at`
when relevant.

### `POST /api/deposit-sessions/{session_id}/confirm`

Temporary development endpoint to simulate IR sensor confirmation from the mobile app.

Response: `DepositTransaction`.

Production mobile flow should wait for backend/device status instead of calling this endpoint directly.

## IoT REST Hybrid

### `POST /api/iot/devices/register`

Registers or refreshes an ESP32 SmartBin.

### `POST /api/iot/devices/{device_id}/heartbeat`

Updates online/offline/error status, firmware version, and capacity.

Backend marks an online device as offline when its heartbeat becomes stale.

### `GET /api/iot/devices/{device_id}/commands/next`

Returns the next command:

```json
{
  "id": "cmd-abc123",
  "device_id": "ECO-SMARTBIN-001",
  "action": "open_lid",
  "session_id": "sess-abc123",
  "duration_seconds": 10,
  "status": "sent",
  "acknowledged_at": null,
  "message": null,
  "metadata": {}
}
```

When no command exists, returns `action: "noop"`.

### `POST /api/iot/devices/{device_id}/commands/{command_id}/ack`

Request:

```json
{
  "status": "acknowledged",
  "message": "Servo opened"
}
```

Response: updated `SmartBinCommand`.

### `POST /api/iot/devices/{device_id}/sensor-events`

Request:

```json
{
  "session_id": "sess-abc123",
  "sensor_state": "object_detected",
  "raw_value": 0,
  "event_id": "optional-device-event-id"
}
```

Response: successful transaction if the session is awaiting insertion and not expired.
Duplicate sensor confirmation for an already completed session returns the existing
transaction and must not add points again. Expired insert windows create a failed
zero-point transaction.

## AI/CV REST

The backend can run with `USE_MOCK_AI=true` for direct mock responses or call the
separate AI/CV service when `USE_MOCK_AI=false`.

### `GET /health` on AI/CV service

Returns service status, active mode, and configured Roboflow model id.

### `POST /validate-bottle` on AI/CV service

Request: `multipart/form-data` with `image`.

Response:

```json
{
  "is_valid": true,
  "brand": "Aqua",
  "confidence": 0.93,
  "volume_ml": 600,
  "height_mm": 215,
  "diameter_mm": 65,
  "estimated_points": 60,
  "reason": "Mock validation accepted the bottle for integration testing.",
  "debug_image_url": null
}
```

Supported service modes:

- `mock`: deterministic demo response and invalid-object hints for tests.
- `opencv`: local reference-box measurement with generic brand fallback.
- `roboflow`: Roboflow brand adapter plus OpenCV measurement.

## Admin REST

- `GET /api/admin/dashboard`
- `GET /api/admin/transactions`
- `GET /api/admin/users`
- `GET /api/admin/withdrawals`
- `GET /api/admin/iot-logs`
- `PATCH /api/admin/withdrawals/{withdrawal_id}`
- `POST /api/admin/education`
- `PATCH /api/admin/education/{article_id}`

Admin endpoints require `Authorization: Bearer dev-token-admin-demo-001` in the
current development auth mode.

## Education And Withdrawals

### `GET /api/education`

Returns published education articles.

### `GET /api/education/{article_id}`

Returns one education article.

### `POST /api/withdrawals`

Request:

```json
{
  "user_id": "user-demo-001",
  "points": 1000,
  "method": "ewallet",
  "account_target": "081234567890"
}
```

Response: pending `WithdrawalRequest`. The backend rejects requests when the
user does not have enough points.
