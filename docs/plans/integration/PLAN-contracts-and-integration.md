# PLAN: Contracts And Integration

## Objective

Integrate mobile, web admin, backend, AI/CV, and IoT work into one coherent EcoDrop prototype while resolving contract drift and merge conflicts.

## Ownership

Allowed:

- `docs/api/**`
- `docs/architecture/**`
- `packages/shared/**`
- Small integration patches across apps/services after reviewing each owner plan

Do not rewrite feature modules without coordinating with their owner.

## Integration Principles

- Backend is the source of truth.
- Shared contracts are updated before frontend/backend field changes.
- Points are awarded only after sensor confirmation.
- AI/CV mock and real mode must use the same response shape.
- IoT command transport can evolve, but command payload must remain stable.

## Reference Links

- Setorin reference repo: `https://github.com/pablonification/Setorin-AICCompfest2025`
- Setorin IoT raw reference, token-free URL: `https://raw.githubusercontent.com/pablonification/Setorin-AICCompfest2025/refs/heads/main/setorin.ino`
- Roboflow pretrained brand model browse page: `https://universe.roboflow.com/mantaps-workspace/merk-label/browse?queryText=&pageSize=50&startingIndex=0&browseQuery=true`
- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
- Local final UI references:
  - `/Users/macbook/Documents/coding/RekSTI/UI/Final Mobile UI Designs`
  - `/Users/macbook/Documents/coding/RekSTI/UI/Final Web UI Designs`

## Steps

1. Review current `packages/shared/src/index.ts`.
2. Review `docs/api/API_CONTRACT.md`.
3. Compare backend response fields against shared TypeScript types.
4. Align mobile API normalization with backend field names.
5. Align web admin API normalization with backend field names.
6. Run an end-to-end smoke test:
   - create session;
   - validate image;
   - consume IoT command;
   - send sensor event;
   - verify transaction and user points;
   - verify admin dashboard summary.
7. Fix conflicts with the smallest scoped edits possible.
8. Document any intentional deviations from Deliverable 3.

## Acceptance Criteria

- One command sequence can demonstrate the full deposit path.
- Mobile can complete the happy path against the backend.
- Admin dashboard shows the resulting transaction/device state.
- IoT firmware can consume the queued command payload.
- No module relies on different status names for the same lifecycle.

## Verification

Root checks:

```bash
npm run typecheck
npm run build:mobile
npm run build:web
```

Backend checks:

```bash
cd services/backend
python -m compileall app
uvicorn app.main:app --reload --port 8000
```

Smoke test sequence:

```bash
curl -s http://localhost:8000/health
curl -s -X POST http://localhost:8000/api/deposit-sessions \
  -H 'Content-Type: application/json' \
  -d '{"qr_token":"ECO-SMARTBIN-001","user_id":"user-demo-001"}'
```

Continue with `/validate`, `/commands/next`, and `/sensor-events` using the returned session ID.
