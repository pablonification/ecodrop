# AGENTS.md - EcoDrop Monorepo

These instructions apply to the entire EcoDrop repository. More specific `AGENTS.md` files in subdirectories add scoped rules for that area.

## Project Context

EcoDrop is a smart recycling bank prototype for II3240 Rekayasa Sistem dan Teknologi Informasi. It includes:

- a mobile app for users;
- a web admin dashboard;
- a FastAPI backend;
- an AI/computer vision service;
- ESP32 SmartBin firmware.

The current product decision is Capacitor-based mobile app, not PWA-only.

## Source Of Truth

Use these references in priority order:

1. Latest user instructions in the current task.
2. `docs/api/API_CONTRACT.md`.
3. `packages/shared/src/index.ts`.
4. Deliverable 3 document: `/Users/macbook/Documents/coding/RekSTI/Tugas03/II3240 Template Tugas Deliverable 3.md`.
5. Final UI references:
   - `/Users/macbook/Documents/coding/RekSTI/UI/Final Mobile UI Designs`
   - `/Users/macbook/Documents/coding/RekSTI/UI/Final Web UI Designs`
6. Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
7. Setorin reference repo: `https://github.com/pablonification/Setorin-AICCompfest2025`
8. Roboflow brand model: `https://universe.roboflow.com/mantaps-workspace/merk-label/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true`

Older Deliverable 2 placeholders lose to Deliverable 3 and the latest user prompt when they conflict.

## Non-Negotiable Reward Integrity

- The backend is the source of truth for user points and transaction status.
- Bottle image validation may estimate points, but must not award points.
- Points may be added only after SmartBin IR sensor confirmation for the matching active deposit session.
- Duplicate sensor events must not double-award points.
- Expired or failed insert windows must create zero-point failed transactions.

## Contract Rules

- Update `docs/api/API_CONTRACT.md` before changing endpoint names, request fields, response fields, or lifecycle status names.
- Update `packages/shared/src/index.ts` when frontend-facing types or enums change.
- Keep mock and real implementations compatible with the same response shape.
- Prefer additive contract changes. Avoid breaking mobile, web admin, backend, AI/CV, or IoT teams without updating integration docs.

## Security Rules

- Do not commit secrets, API keys, Wi-Fi passwords, JWT secrets, or temporary GitHub raw URLs with `?token=...`.
- For private Setorin files, use authenticated `gh`, for example:
  ```bash
  gh api repos/pablonification/Setorin-AICCompfest2025/contents/setorin.ino --jq .content | base64 -d
  ```
- Keep `.env.example` safe and non-secret.

## Implementation Style

- Keep the repo scaffold runnable while improving it.
- Prefer small, focused edits within the assigned ownership area.
- Do not refactor unrelated products while implementing a scoped plan.
- Preserve file ownership boundaries in `docs/plans/**`.
- Use TypeScript types from `@ecodrop/shared` in frontend code.
- Use Pydantic schemas in backend and AI/CV services.
- Keep UI clean, green, mobile-first for mobile, and dense/readable for admin.

## Verification

Run relevant checks before handing off:

```bash
npm run typecheck
npm run build:mobile
npm run build:web
python3 -m compileall services/backend/app services/ai-cv/app
```

If you cannot run a check, document why in your handoff.

## Documentation Handoff

When finishing substantial work, update the relevant plan notes or final response with:

- files changed;
- contract changes;
- verification run;
- known risks or follow-up tasks.
