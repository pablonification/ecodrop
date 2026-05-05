# AGENTS.md - AI/CV Service

These instructions apply to `services/ai-cv/**`.

## Product Direction

The AI/CV service validates bottle images and estimates dimensions/volume. It should start mock-first but be replaceable with Roboflow and OpenCV without changing backend/mobile contracts.

References:

- Roboflow pretrained brand model: `https://universe.roboflow.com/mantaps-workspace/merk-label/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true`
- Setorin AI/CV reference: `https://github.com/pablonification/Setorin-AICCompfest2025`, especially:
  - `backend/src/backend/services/opencv_service.py`
  - `backend/src/backend/services/roboflow_service.py`

## Ownership

Allowed:

- `services/ai-cv/**`

Coordinate before editing:

- `services/backend/**`
- `docs/api/**`
- `packages/shared/**`

## AI/CV Rules

- Keep the response shape stable:
  - `is_valid`
  - `brand`
  - `confidence`
  - `volume_ml`
  - `height_mm`
  - `diameter_mm`
  - `estimated_points`
  - `reason`
  - optional `debug_image_url`
- Mock and real modes must return the same fields.
- Do not award points in this service.
- Use OpenCV for reference box measurement when implementing real mode.
- Use Roboflow only behind an adapter/client so it can be mocked in tests.
- Handle poor lighting, missing reference box, non-bottle object, and low confidence with clear rejection reasons.
- Do not commit Roboflow API keys.

## Verification

```bash
cd services/ai-cv
python3 -m compileall app
uvicorn app.main:app --reload --port 8010
```

Manual checks:

- empty upload is rejected;
- mock valid upload returns stable response shape;
- backend can call this service without response mapping changes.
