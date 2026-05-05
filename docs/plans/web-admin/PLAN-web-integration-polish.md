# PLAN: Web Admin Integration And Polish

## Objective

Connect the admin dashboard to backend APIs, complete CRUD workflows where needed, and polish the UI against final web references.

## File Ownership

Allowed:

- `apps/web-admin/**`
- `docs/plans/web-admin/**` for progress notes only

Coordinate before editing:

- `docs/api/**`
- `packages/shared/**`

Do not edit:

- Backend internals unless explicitly assigned.

## Scope

- Replace fallback data with real API data.
- Add filters, search, pagination placeholders or actual implementation.
- Implement admin actions:
  - education create/edit;
  - QR generate/deactivate;
  - withdrawal approve/reject;
  - export CSV trigger.
- Add real-time or refresh-based monitoring for SmartBin heartbeat.
- Add empty, loading, and error states.

## Reference Links

- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
- Local final web UI: `/Users/macbook/Documents/coding/RekSTI/UI/Final Web UI Designs`
- Setorin admin implementation reference: `https://github.com/pablonification/Setorin-AICCompfest2025`

## Implementation Steps

1. Create one API client per domain:
   - `adminDashboardApi`
   - `transactionsApi`
   - `devicesApi`
   - `educationApi`
   - `qrApi`
   - `withdrawalsApi`
2. Add status badges and filter controls matching final UI.
3. Implement mutation forms as modals or dedicated panels.
4. Add optimistic UI only where rollback is straightforward.
5. Validate all forms before calling the backend.
6. Use local final web screenshots as visual QA references.

## Acceptance Criteria

- All read pages load real backend data when backend is running.
- Mutations show success/failure feedback.
- Admin can inspect device health and transaction failures.
- Export workflow produces or requests a downloadable file.
- UI remains stable with empty data.

## Verification

```bash
npm run build:web
```

Manual checks:

- Backend offline fallback.
- Backend online dashboard.
- Education create/edit mock or real path.
- QR generation path.
- Withdrawal reject path.
