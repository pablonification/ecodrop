# AGENTS.md - Backend

These instructions apply to `services/backend/**`.

## Product Direction

The backend is the EcoDrop source of truth and orchestrator. It owns user points, deposit session lifecycle, transaction records, SmartBin device state, admin data, AI/CV calls, and IoT commands.

References:

- `docs/api/API_CONTRACT.md`
- `packages/shared/src/index.ts`
- Setorin backend reference: `https://github.com/pablonification/Setorin-AICCompfest2025`, especially `backend/src/backend`.

## Ownership

Allowed:

- `services/backend/**`

Coordinate before editing:

- `docs/api/**`
- `packages/shared/**`
- `services/ai-cv/**`
- `iot/smartbin-esp32/**`

Do not edit:

- mobile or web UI code unless explicitly assigned.

## Backend Rules

- Preserve reward integrity:
  - validation success queues SmartBin action;
  - validation success does not award points;
  - sensor confirmation awards points exactly once.
- Make transaction and point updates idempotent.
- Tie every sensor event to one active `session_id` and `device_id`.
- Reject or fail stale sessions when the insert timer expires.
- Unknown/offline devices must not start new deposit sessions.
- Keep command queue payloads compatible with ESP32 firmware.
- Use Pydantic schemas for all request/response objects.
- Keep MongoDB/Redis integration behind service or repository boundaries.
- Add tests for state transitions before broad refactors.

## Verification

```bash
cd services/backend
python3 -m compileall app
uvicorn app.main:app --reload --port 8000
```

Manual smoke sequence:

1. create deposit session;
2. validate image;
3. poll IoT command;
4. send sensor event;
5. verify transaction and points.
