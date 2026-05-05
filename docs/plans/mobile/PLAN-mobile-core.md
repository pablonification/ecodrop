# PLAN: Mobile Core

## Objective

Build the EcoDrop mobile app core user experience using React, Vite, and Capacitor. The app must cover the main user flow from home to SmartBin QR scan, bottle photo validation, insert timer, success/failure feedback, activity history, education, and profile.

## Context

EcoDrop is a smart recycling bank. Users scan a SmartBin QR code, take a bottle photo on a fixed black reference box, receive AI/CV validation, insert the bottle within 10 seconds, and receive points only after the SmartBin IR sensor confirms physical insertion.

Follow:

- `/Users/macbook/Documents/coding/RekSTI/UI/Final Mobile UI Designs`
- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
- Figma section: `Final Mobile Design`
- `docs/api/API_CONTRACT.md`
- `packages/shared/src/index.ts`
- Setorin app reference: `https://github.com/pablonification/Setorin-AICCompfest2025`, especially `app/scan`, `app/components/BottomNav.js`, and auth/context patterns.

## File Ownership

Allowed:

- `apps/mobile/**`
- Read-only reference: `packages/shared/**`, `docs/api/**`

Do not edit:

- `services/backend/**`
- `apps/web-admin/**`
- `iot/**`

## Scope

- App shell sized for mobile-first usage.
- Bottom navigation with primary centered `Setor` action.
- Screens:
  - login placeholder or dev session entry;
  - home;
  - QR scan;
  - capture bottle with reference box overlay;
  - detecting/loading;
  - detected bottle result;
  - bottle not validated;
  - insert bottle timer;
  - deposit success;
  - deposit failure;
  - activity and detail placeholder;
  - education list and detail placeholder;
  - profile, help, privacy, edit profile placeholders.
- Local fallback mock data if backend is offline.
- API client functions matching contract names and response shapes.

## Out of Scope

- Real camera permission and native QR scanning.
- Production auth.
- Real Roboflow/OpenCV processing.
- Direct ESP32 communication from the app.

## Implementation Steps

1. Replace current single-file screen logic with routed or state-based components under `apps/mobile/src/screens`.
2. Create reusable UI components:
   - `AppHeader`
   - `BottomNav`
   - `StatusCard`
   - `PrimaryButton`
   - `DepositCameraOverlay`
   - `TransactionItem`
3. Build API module with:
   - `createDepositSession`
   - `validateBottle`
   - `getDepositSession`
   - `getTransactions`
   - `getEducationArticles`
4. Implement the deposit state machine:
   - `qr_validated`
   - `validating`
   - `awaiting_insert`
   - `completed`
   - `failed`
   - `rejected`
5. Keep final point display derived from backend transaction/session state.
6. Match the final UI references: green palette, rounded cards, clean spacing, native mobile feel.
7. Add empty/loading/error states for each async step.

## Acceptance Criteria

- User can complete a simulated successful deposit from home.
- User can simulate invalid bottle and retake photo.
- User can simulate timer expiration and see no points awarded.
- UI remains readable at 390 px width and 430 px width.
- No screen depends on backend availability for basic navigation.
- The code imports shared types from `@ecodrop/shared`.

## Verification

```bash
npm install
npm run dev:mobile
npm run build:mobile
```

Manual checks:

- Complete successful deposit.
- Let timer expire.
- Navigate activity, education, and profile.
- Confirm no text overflows on narrow mobile viewport.
