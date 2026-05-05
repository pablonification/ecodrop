# EcoDrop AI/CV Service

Mock-first FastAPI service for bottle validation. It is intentionally separate from the backend so the AI/CV owner can replace the mock with Roboflow and OpenCV without disturbing mobile, web admin, or IoT teams.

The response shape is stable across modes:

- `mock`: deterministic demo mode for mobile/backend integration;
- `opencv`: local black reference box measurement;
- `roboflow`: Roboflow brand prediction plus OpenCV measurement.

Reference model:

- Roboflow pretrained brand model: `https://universe.roboflow.com/mantaps-workspace/merk-label/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true`

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

## Test

```bash
PYTHONPATH=app python -m pytest tests
```

From the monorepo root:

```bash
PYTHONPATH=services/ai-cv services/backend/.venv/bin/python -m pytest services/ai-cv/tests
```
