# PLAN: Mobile Integration And Polish

## Objective

Connect the mobile app to the backend deposit APIs, polish the final UX against the local/Figma designs, and prepare the app for Capacitor device testing.

## File Ownership

Allowed:

- `apps/mobile/**`
- `docs/plans/mobile/**` for progress notes only

Coordinate before editing:

- `packages/shared/**`
- `docs/api/**`

Do not edit:

- Backend business rules.
- IoT firmware.

## Scope

- Replace mock-only flow with real backend calls.
- Poll or subscribe to session status after `awaiting_insert`.
- Keep the manual confirm button only behind a dev flag.
- Use Capacitor-friendly camera abstraction placeholders.
- Improve loading, failure, retry, and offline states.
- Match final mobile UI visual references.

## Reference Links

- Figma file: `https://www.figma.com/design/eYtHfH7wcB6eB5yZJVQWVq/RekSTI?node-id=0-1`
- Local final mobile UI: `/Users/macbook/Documents/coding/RekSTI/UI/Final Mobile UI Designs`
- Setorin scan flow reference: `https://github.com/pablonification/Setorin-AICCompfest2025`

## Implementation Steps

1. Add environment handling for `VITE_API_BASE_URL`.
2. Add `getDepositSession(sessionId)` polling while waiting for sensor confirmation.
3. Remove any client-side final point increment logic.
4. Add upload image support using browser file input first, then a Capacitor camera adapter.
5. Improve deposit result screens:
   - success: show brand, volume, points, SmartBin, timestamp;
   - failure: show reason and retry path;
   - invalid: show retake/home actions.
6. Add route or state persistence so refresh does not lose an active session.
7. Run visual QA against:
   - `Final Mobile UI Designs/Homepage.png`
   - `Final Mobile UI Designs/Setor/*.png`
   - `Final Mobile UI Designs/Aktivitas.png`
   - `Final Mobile UI Designs/Edukasi.png`
   - `Final Mobile UI Designs/Profil.png`

## Acceptance Criteria

- Mobile app can use the real backend happy path.
- Points are shown only after backend confirms success.
- The 10 second timer is reflected in UI and matches backend/IoT window.
- Offline backend displays useful fallback without corrupting local state.
- Capacitor build config remains valid.

## Verification

```bash
npm run build:mobile
cd apps/mobile
npx cap sync
```

Manual checks:

- Backend offline fallback.
- Backend online success.
- Backend online validation failure.
- Insert timeout failure.
