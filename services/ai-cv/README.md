# EcoDrop AI/CV Service

Mock-first FastAPI service for bottle validation. It is intentionally separate from the backend so the AI/CV owner can replace the mock with Roboflow and OpenCV without disturbing mobile, web admin, or IoT teams.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```
