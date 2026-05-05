# EcoDrop Backend

FastAPI backend scaffold for the EcoDrop prototype.

The backend is the source of truth for:

- users and point balances;
- SmartBin devices and heartbeat state;
- deposit sessions and transactions;
- withdrawal requests;
- education content;
- AI/CV validation orchestration;
- IoT commands and sensor confirmation.

By default this scaffold uses an in-memory store so frontend and IoT teams can integrate immediately. MongoDB and Redis fields are present in configuration and Docker Compose for the next implementation step.

Reward integrity is enforced in the backend:

- image validation only estimates points and queues `open_lid`;
- points are awarded only after a matching SmartBin `object_detected` sensor event;
- duplicate sensor events return the existing transaction and do not double-award;
- expired insert windows create failed zero-point transactions.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`.

## Test

```bash
PYTHONPATH=app python -m pytest tests
```

From the monorepo root:

```bash
PYTHONPATH=services/backend services/backend/.venv/bin/python -m pytest services/backend/tests
```
