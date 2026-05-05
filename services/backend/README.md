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

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`.
