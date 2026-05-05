# PLAN: Web Admin Core

## Objective

Build the EcoDrop web admin dashboard core modules for monitoring, transactions, users, SmartBins, education, QR codes, export, and withdrawals.

## Context

The admin dashboard is for operators and maintainers. It should be dense, readable, work-focused, and suitable for repeated monitoring. Use final web references and Setorin as a technical reference, but keep EcoDrop naming and reward integrity.

References:

- `/Users/macbook/Documents/coding/RekSTI/UI/Final Web UI Designs`
- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
- Figma section: `Final Web Design`
- `docs/api/API_CONTRACT.md`
- Setorin admin reference: `https://github.com/pablonification/Setorin-AICCompfest2025`, especially `app/admin`, `app/admin/monitoring`, `app/admin/qr-codes`, `app/admin/withdrawals`, and backend admin endpoints.

## File Ownership

Allowed:

- `apps/web-admin/**`

Read-only:

- `packages/shared/**`
- `docs/api/**`

Do not edit:

- `apps/mobile/**`
- `services/backend/**`
- `iot/**`

## Scope

- Admin layout with sidebar navigation.
- Dashboard overview cards.
- Monitoring page for SmartBin online/offline, heartbeat, capacity, error state.
- Transactions table with filters and status badges.
- Users table and detail placeholder.
- Education list/create/edit placeholders.
- QR code list/generate placeholder.
- Withdrawals list/detail/reject placeholder.
- Export module placeholder.
- Backend fallback data.

## Out of Scope

- Production admin auth.
- Real CSV file generation.
- Mutating backend records.
- Charts beyond simple first-pass visualization.

## Implementation Steps

1. Split `AdminShell` into route-level or module components.
2. Build reusable admin components:
   - `Sidebar`
   - `Topbar`
   - `MetricCard`
   - `DataTable`
   - `StatusBadge`
   - `FilterBar`
3. Implement modules:
   - dashboard;
   - monitoring;
   - transactions;
   - users;
   - education;
   - QR code;
   - withdrawals;
   - export.
4. Use backend API client with fallback data.
5. Keep UI aligned with final web design: green brand, white surfaces, compact tables, predictable scanning.

## Acceptance Criteria

- Admin can switch through all modules.
- Dashboard renders metrics and a basic trend chart.
- Monitoring table shows device status and heartbeat.
- Transactions table shows successful and failed statuses.
- Layout works at desktop widths and remains usable on tablet.
- Build succeeds.

## Verification

```bash
npm install
npm run dev:web
npm run build:web
```

Manual checks:

- Open each admin module.
- Resize to tablet width.
- Confirm table text does not overlap.
