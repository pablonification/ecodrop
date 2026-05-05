# AGENTS.md - Mobile App

These instructions apply to `apps/mobile/**`.

## Product Direction

Build a native-feeling mobile app with React, Vite, and Capacitor. The UI should follow the EcoDrop final mobile designs and feel clean, green, rounded, and simple like a Gojek-style mobile experience.

References:

- `/Users/macbook/Documents/coding/RekSTI/UI/Final Mobile UI Designs`
- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
- Setorin scan reference: `https://github.com/pablonification/Setorin-AICCompfest2025`, especially `app/scan` and `app/components/BottomNav.js`.

## Ownership

Allowed:

- `apps/mobile/**`

Read-only unless coordinated:

- `packages/shared/**`
- `docs/api/**`

Do not edit:

- backend internals;
- web admin internals;
- IoT firmware.

## Mobile Rules

- Do not compute or mutate final user points client-side.
- Show estimated points only as a validation preview.
- Treat success as final only after backend session/transaction confirms SmartBin sensor insertion.
- Keep the 10 second insert timer visible and aligned with backend/IoT contract.
- Keep direct sensor confirmation buttons behind dev/demo-only flows.
- Prefer a simple state machine for deposit flow:
  `qr -> capture -> detecting -> detected|invalid -> insert -> success|failed`.
- Preserve bottom navigation with centered `Setor` primary action.
- Keep text readable on 390 px and 430 px wide screens.
- Avoid desktop-first layouts, landing pages, or marketing sections.

## Verification

```bash
npm run dev:mobile
npm run build:mobile
```

Manual checks:

- successful deposit path;
- invalid bottle retry;
- insert timer failure;
- activity, education, profile navigation.
