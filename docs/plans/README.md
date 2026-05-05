# EcoDrop Implementation Plans

These plans are designed to be attached to separate implementation agents or assigned to team members. Each plan contains scope, ownership, steps, acceptance criteria, and verification commands.

For a compressed 3-person team split, use `TEAM_ASSIGNMENT_3_PERSON.md`.

Recommended execution order:

1. `backend/PLAN-backend-core.md`
2. `mobile/PLAN-mobile-core.md`
3. `web-admin/PLAN-web-core.md`
4. `backend/PLAN-backend-ai-iot.md`
5. `iot/PLAN-iot-smartbin.md`
6. `mobile/PLAN-mobile-integration-polish.md`
7. `web-admin/PLAN-web-integration-polish.md`
8. `integration/PLAN-contracts-and-integration.md`

Parallelization guidance:

- Mobile core and web core can proceed against mock data after shared contracts are stable.
- Backend core must own API shape and reward integrity.
- IoT work should not edit backend business logic directly; request contract changes through the integration plan.
