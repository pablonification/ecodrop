# PLAN: Backend AI/CV And IoT Integration

## Objective

Integrate the backend with the AI/CV validation service and ESP32 SmartBin command/sensor workflow.

## File Ownership

Allowed:

- `services/backend/**`
- `services/ai-cv/**`
- `docs/api/**`

Coordinate before editing:

- `iot/smartbin-esp32/**`
- `packages/shared/**`

## Scope

- AI/CV service client.
- Roboflow/OpenCV response normalization.
- SmartBin command queue.
- REST hybrid command polling.
- Future WebSocket-compatible command abstraction.
- Sensor event handling and idempotency.
- Heartbeat and offline detection.

## Reference Links

- Setorin reference repo: `https://github.com/pablonification/Setorin-AICCompfest2025`
- Setorin backend references:
  - `backend/src/backend/services/opencv_service.py`
  - `backend/src/backend/services/roboflow_service.py`
  - `backend/src/backend/routers/scan.py`
  - `backend/src/backend/routers/esp32.py`
- Roboflow pretrained brand model browse page: `https://universe.roboflow.com/mantaps-workspace/merk-label/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true`
- Setorin IoT firmware reference, token-free URL: `https://raw.githubusercontent.com/pablonification/Setorin-AICCompfest2025/refs/heads/main/setorin.ino`
- Private IoT firmware access via `gh`:
  ```bash
  gh api repos/pablonification/Setorin-AICCompfest2025/contents/setorin.ino --jq .content | base64 -d
  ```

Do not commit temporary raw GitHub `?token=...` URLs. Use `gh` authentication or environment variables.

## Implementation Steps

1. Finalize `BottleValidation` response shape.
2. In `services/ai-cv`, implement:
   - Roboflow brand prediction adapter;
   - OpenCV reference box measurement;
   - fallback/mock mode;
   - debug image optional output.
3. In backend, call AI/CV service with `multipart/form-data`.
4. Validate business rules:
   - confidence threshold;
   - acceptable volume range;
   - valid PET bottle categories;
   - reference box detected.
5. Queue `open_lid` command only after valid result.
6. Implement command ACK and failure logs.
7. Implement sensor event endpoint:
   - accept only matching `session_id`;
   - reject if timer expired;
   - reject if already completed;
   - close session and award points once.
8. Mark device offline if heartbeat is stale.

## Acceptance Criteria

- Backend can run with mock AI and real AI service modes.
- AI service can be replaced without changing mobile/web contracts.
- ESP32 can poll commands and send sensor events.
- Duplicate sensor events do not double-award.
- Device heartbeat appears in admin dashboard.
- Command and sensor errors are visible in logs/admin data.

## Verification

```bash
cd services/ai-cv
uvicorn app.main:app --reload --port 8010
cd ../backend
uvicorn app.main:app --reload --port 8000
```

Manual API sequence:

1. `POST /api/deposit-sessions`
2. `POST /api/deposit-sessions/{id}/validate`
3. `GET /api/iot/devices/ECO-SMARTBIN-001/commands/next`
4. `POST /api/iot/devices/ECO-SMARTBIN-001/sensor-events`
5. Verify user points changed once.
