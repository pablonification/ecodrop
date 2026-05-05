# PLAN: Backend Core

## Objective

Implement the FastAPI backend as EcoDrop's source of truth for users, points, SmartBins, deposit sessions, transactions, withdrawals, education, and admin dashboard data.

## Context

The backend orchestrates mobile, web admin, AI/CV, and IoT. It must preserve reward integrity: image validation can estimate points, but points are awarded only after SmartBin sensor confirmation.

References:

- `docs/api/API_CONTRACT.md`
- `packages/shared/src/index.ts`
- Deliverable 3 architecture and database design
- Setorin backend folder as technical reference: `https://github.com/pablonification/Setorin-AICCompfest2025`, especially `backend/src/backend/routers`, `backend/src/backend/services`, and `backend/src/backend/models`.

## File Ownership

Allowed:

- `services/backend/**`
- `docs/api/**`

Coordinate before editing:

- `packages/shared/**`

Do not edit:

- `apps/mobile/**`
- `apps/web-admin/**`
- `iot/**`

## Scope

- FastAPI app structure.
- Pydantic schemas.
- MongoDB repository layer.
- Redis temporary state layer for session/command queue if needed.
- Auth placeholder and future JWT hooks.
- Deposit session endpoints.
- Transaction creation and point updates.
- Admin read endpoints.
- Education and withdrawal initial endpoints.
- Tests for reward integrity.

## Implementation Steps

1. Replace in-memory store with repository interfaces:
   - `UserRepository`
   - `DeviceRepository`
   - `DepositSessionRepository`
   - `TransactionRepository`
   - `EducationRepository`
   - `WithdrawalRepository`
2. Add MongoDB collections and indexes:
   - users: email, role;
   - devices: status, last_heartbeat_at;
   - deposit_sessions: user_id, device_id, status, created_at;
   - transactions: user_id, device_id, status, created_at;
   - withdrawals: user_id, status, requested_at.
3. Implement dev auth and future JWT dependency boundaries.
4. Implement deposit lifecycle:
   - create session from QR;
   - validate bottle;
   - queue SmartBin command;
   - confirm sensor;
   - create successful transaction;
   - increment points atomically.
5. Add idempotency protection so repeated sensor events cannot double-award points.
6. Add admin dashboard aggregate endpoints.
7. Add unit tests for point calculation and transaction state transitions.

## Acceptance Criteria

- A valid photo does not increment points by itself.
- A sensor event for an awaiting session increments points exactly once.
- Expired insert windows create failed transactions with zero points.
- Unknown or offline device cannot start a deposit session.
- Admin dashboard aggregates match transaction records.
- Tests cover success, invalid bottle, timeout, and duplicate sensor event.

## Verification

```bash
cd services/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then open:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`
