# AGENTS.md - Web Admin Dashboard

These instructions apply to `apps/web-admin/**`.

## Product Direction

Build a work-focused admin dashboard for monitoring transactions, users, SmartBins, education content, QR codes, exports, and withdrawals. The dashboard should be dense, readable, and operational, not a landing page.

References:

- `/Users/macbook/Documents/coding/RekSTI/UI/Final Web UI Designs`
- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
- Setorin admin reference: `https://github.com/pablonification/Setorin-AICCompfest2025`, especially `app/admin`.

## Ownership

Allowed:

- `apps/web-admin/**`

Read-only unless coordinated:

- `packages/shared/**`
- `docs/api/**`

Do not edit:

- mobile internals;
- backend business rules;
- IoT firmware.

## Web Admin Rules

- Do not invent backend state. Show backend values or clearly labeled mock/fallback values.
- Prioritize tables, filters, search, status badges, and compact summaries.
- SmartBin monitoring must show status, capacity, last heartbeat, and error/maintenance state.
- Transactions must distinguish success, failed, rejected, and pending.
- Withdrawal actions must be auditable and should not silently mutate data.
- Education and QR management should use forms with validation before backend mutation.
- Avoid oversized hero sections, decorative card-heavy marketing composition, or vague feature descriptions.
- Keep tables usable on desktop and tablet widths.

## Verification

```bash
npm run dev:web
npm run build:web
```

Manual checks:

- each admin module opens;
- dashboard renders backend or fallback data;
- table text does not overlap;
- status badges remain scannable.
