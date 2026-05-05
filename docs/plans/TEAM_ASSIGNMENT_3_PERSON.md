# EcoDrop 3-Person Team Assignment

This assignment is designed for a 3-person implementation team. It keeps ownership boundaries clear while still covering the three required products: mobile app, web admin app, and IoT SmartBin. Backend and AI/CV are treated as shared infrastructure, but owned primarily by one person so reward integrity does not drift.

## Recommended Split

| Person | Primary Ownership | Secondary Support | Main Plans |
| --- | --- | --- | --- |
| Person A | Mobile App | UX polish, demo script for user flow | `mobile/PLAN-mobile-core.md`, `mobile/PLAN-mobile-integration-polish.md` |
| Person B | Backend + AI/CV | API contract, database, reward integrity, admin APIs | `backend/PLAN-backend-core.md`, `backend/PLAN-backend-ai-iot.md` |
| Person C | Web Admin + IoT | Dashboard, SmartBin firmware, integration QA | `web-admin/PLAN-web-core.md`, `web-admin/PLAN-web-integration-polish.md`, `iot/PLAN-iot-smartbin.md`, `integration/PLAN-contracts-and-integration.md` |

## Why This Split Works

- Person A can focus on the most important user-facing flow: QR scan, bottle capture, validation result, 10-second insert timer, success/failure, activity, education, and profile.
- Person B owns the backend source of truth, which is the riskiest part because points must only be awarded after SmartBin sensor confirmation.
- Person C owns operator-facing dashboard work and the physical IoT demo, then leads integration QA because those two areas reveal whether backend state is visible and operational.

## Person A: Mobile App Owner

### Scope

- Build and polish the mobile app in `apps/mobile/**`.
- Follow `apps/mobile/AGENTS.md`.
- Use final mobile UI references and Figma.
- Implement the full deposit UX:
  - home;
  - scan QR;
  - capture bottle;
  - detecting/loading;
  - detected bottle;
  - invalid bottle;
  - insert timer;
  - success;
  - failure;
  - activity;
  - education;
  - profile.

### Key Rules

- Do not mutate final points on the client.
- Estimated points may be displayed before insertion, but final points must come from backend success state.
- Do not communicate directly with ESP32.
- Keep Capacitor readiness intact.

### Deliverables

- Mobile UI matching final reference style.
- Deposit state machine integrated with backend.
- Mobile fallback/demo mode if backend is offline.
- Build passes with `npm run build:mobile`.

## Person B: Backend + AI/CV Owner

### Scope

- Build backend in `services/backend/**`.
- Build AI/CV service in `services/ai-cv/**`.
- Follow `services/backend/AGENTS.md` and `services/ai-cv/AGENTS.md`.
- Maintain `docs/api/API_CONTRACT.md`.
- Own MongoDB/Redis transition from in-memory scaffold.
- Own reward and transaction lifecycle.

### Key Rules

- Backend is the source of truth.
- Image validation does not award points.
- Sensor confirmation awards points exactly once.
- Duplicate sensor events must be idempotent.
- AI/CV mock and real mode must return the same response shape.

### Deliverables

- Deposit session API.
- Bottle validation API integration.
- Transaction creation and point update logic.
- Admin read APIs.
- AI/CV mock-first service, prepared for Roboflow/OpenCV.
- Tests or smoke scripts for:
  - success path;
  - invalid bottle;
  - timeout;
  - duplicate sensor event.

## Person C: Web Admin + IoT + Integration Owner

### Scope

- Build web admin in `apps/web-admin/**`.
- Build firmware in `iot/smartbin-esp32/**`.
- Follow:
  - `apps/web-admin/AGENTS.md`
  - `iot/smartbin-esp32/AGENTS.md`
  - `docs/plans/integration/PLAN-contracts-and-integration.md`
- Lead end-to-end integration checks.

### Key Rules

- Web admin should show backend state, not invented state.
- SmartBin must fail safe with lid closed.
- No real Wi-Fi passwords or device secrets in committed firmware.
- Sensor events must include matching `session_id`.

### Deliverables

- Admin dashboard modules:
  - overview;
  - monitoring;
  - transactions;
  - users;
  - education;
  - QR code;
  - withdrawals;
  - export.
- ESP32 firmware:
  - register;
  - heartbeat;
  - command polling;
  - servo open/close;
  - IR sensor event.
- E2E smoke test report showing:
  - mobile creates session;
  - backend validates image;
  - IoT receives open command;
  - sensor event confirms deposit;
  - admin dashboard shows transaction/device state.

## Shared Milestones

### Milestone 1: Contract Freeze

Owner: Person B, reviewed by Person A and C.

- Finalize lifecycle statuses.
- Finalize API field names.
- Finalize shared TypeScript types.
- Update `docs/api/API_CONTRACT.md`.

### Milestone 2: Parallel Feature Build

Owner: Everyone.

- Person A builds mobile against mock/real API.
- Person B builds backend and AI/CV service.
- Person C builds admin dashboard and IoT firmware scaffold.

### Milestone 3: First End-To-End Demo

Owner: Person C, supported by Person B.

Required flow:

1. User starts deposit in mobile.
2. Backend creates session.
3. Mobile uploads/validates bottle.
4. Backend queues `open_lid`.
5. SmartBin receives command.
6. IR sensor sends `object_detected`.
7. Backend creates successful transaction and adds points.
8. Admin dashboard shows updated transaction/device status.

### Milestone 4: Polish And Presentation Readiness

Owner: Everyone.

- Person A polishes mobile screens.
- Person B stabilizes API, logs, and tests.
- Person C polishes dashboard, firmware demo, and E2E script.

## Suggested Timeline

| Day | Person A | Person B | Person C |
| --- | --- | --- | --- |
| 1 | Mobile screen structure | Backend schema + session API | Admin layout + IoT wiring review |
| 2 | Deposit flow UI | Validation + transaction lifecycle | Dashboard tables + firmware polling |
| 3 | Backend integration | AI/CV mock/Roboflow adapter | ESP32 heartbeat + command handling |
| 4 | Mobile polish | Idempotency + admin APIs | Admin integration + sensor event |
| 5 | Bug fixing | E2E fixes | E2E test lead + demo script |

## Handoff Checklist

Each person should report:

- changed files;
- implemented features;
- commands run;
- unresolved blockers;
- contract changes requested;
- screenshots or demo notes if UI/IoT-related.

