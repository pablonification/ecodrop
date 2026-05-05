# EcoDrop Monorepo

EcoDrop is a smart recycling bank prototype for II3240 Rekayasa Sistem dan Teknologi Informasi. This repository scaffolds the three products that must be built together:

- Mobile app for users: React, Vite, Capacitor.
- Web admin dashboard: React/Next.js-style dashboard.
- Backend and AI/CV services: FastAPI, MongoDB, Redis, Roboflow/OpenCV-ready mock pipeline.
- IoT SmartBin firmware: ESP32, MG996R servo, IR barrier sensor.

The implementation follows the Deliverable 3 architecture and uses Setorin as a technical reference, with EcoDrop-specific reward integrity: points are awarded only after image validation succeeds and the SmartBin sensor confirms the bottle physically entered the bin.

## Repository Layout

```txt
apps/
  mobile/              React + Vite + Capacitor user app
  web-admin/           React/Next.js admin dashboard
services/
  backend/             FastAPI source of truth and IoT orchestrator
  ai-cv/               AI/CV validation service, mock-first
packages/
  shared/              TypeScript API contracts, enums, mock data
iot/
  smartbin-esp32/      ESP32 firmware scaffold
docs/
  api/                 API contract summary and OpenAPI seed
  plans/               Agent-ready implementation plans
```

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev:mobile
npm run dev:web
```

Backend services can be run separately:

```bash
cd services/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

AI/CV service:

```bash
cd services/ai-cv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010
```

## References

- Local task documents: `../../Tugas01`, `../../Tugas02`, `../../Tugas03`.
- Final UI references: `../../UI/Final Mobile UI Designs`, `../../UI/Final Web UI Designs`.
- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`.
- Setorin reference repo: `https://github.com/pablonification/Setorin-AICCompfest2025`.
- Setorin IoT firmware reference: `https://raw.githubusercontent.com/pablonification/Setorin-AICCompfest2025/refs/heads/main/setorin.ino`.
- Roboflow pretrained brand model reference: `https://universe.roboflow.com/mantaps-workspace/merk-label/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true`.

For private Setorin files, prefer `gh` instead of embedding temporary raw tokens in docs:

```bash
gh api repos/pablonification/Setorin-AICCompfest2025/contents/setorin.ino --jq .content | base64 -d
```

## Development Order

1. Stabilize contracts in `packages/shared` and `docs/api`.
2. Implement the backend happy path with mock AI/CV and mock IoT.
3. Implement the mobile deposit flow end-to-end against the backend.
4. Implement admin monitoring, transactions, users, QR, education, exports, and withdrawals.
5. Integrate ESP32 firmware with backend commands and sensor events.
6. Replace mock AI/CV with Roboflow/OpenCV.
