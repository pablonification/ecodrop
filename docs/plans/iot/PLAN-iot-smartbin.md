# PLAN: IoT SmartBin

## Objective

Build and test ESP32 SmartBin firmware for EcoDrop's physical prototype: Wi-Fi connectivity, heartbeat, command handling, servo door control, IR sensor confirmation, and fail-safe behavior.

## Context

Hardware:

- ESP32 development board.
- Servo MG996R for lid/trapdoor actuation.
- IR Infrared Barrier Obstacle Avoidance Sensor for bottle insertion confirmation.
- 5V 3A external power supply for servo.
- Shared ground between ESP32 and servo supply.
- 1000 uF capacitor recommended across servo power.

## Reference Links

- Setorin reference repo: `https://github.com/pablonification/Setorin-AICCompfest2025`
- Setorin IoT firmware reference, token-free URL: `https://raw.githubusercontent.com/pablonification/Setorin-AICCompfest2025/refs/heads/main/setorin.ino`
- Private firmware access via `gh`:
  ```bash
  gh api repos/pablonification/Setorin-AICCompfest2025/contents/setorin.ino --jq .content | base64 -d
  ```

Do not commit temporary raw GitHub `?token=...` URLs. The reference firmware uses REST registration/status and command polling; EcoDrop may keep that hybrid approach for demo stability while preserving the architecture path toward WebSocket command delivery.

## File Ownership

Allowed:

- `iot/smartbin-esp32/**`

Read-only:

- `docs/api/**`
- `services/backend/app/main.py` endpoint names

Do not edit:

- Mobile/web frontend.
- Backend business logic.

## Scope

- Wi-Fi connect and reconnect.
- Register device to backend.
- Send heartbeat.
- Poll command endpoint.
- Execute `open_lid`, `close_lid`, and `noop`.
- Read IR sensor and send `object_detected`.
- Fail-safe close on unknown command or connection disruption.
- Serial logs for demo debugging.

## Implementation Steps

1. Confirm wiring:
   - servo signal to GPIO 18;
   - IR sensor output to GPIO 19;
   - status LED GPIO 2;
   - servo VCC to external 5V;
   - shared ground.
2. Flash scaffold firmware.
3. Configure:
   - Wi-Fi SSID/password;
   - backend local IP;
   - device ID;
   - servo open/closed angles.
4. Test servo movement manually from commands.
5. Test heartbeat endpoint.
6. Test command polling after backend validates a bottle.
7. Test IR sensor event with active session.
8. Tune sensor sensitivity and servo angle.

## Acceptance Criteria

- ESP32 reconnects after Wi-Fi disruption.
- Backend dashboard shows recent heartbeat.
- Valid backend command opens the lid.
- Lid closes after success or close command.
- IR sensor event triggers successful transaction in backend.
- If no sensor event is sent within the insert window, no points are awarded.
- Unknown commands do not leave lid open.

## Verification

Using PlatformIO:

```bash
cd iot/smartbin-esp32
pio run
pio run --target upload
pio device monitor
```

Manual API checks:

- `POST /api/iot/devices/register`
- `GET /api/iot/devices/{device_id}/commands/next`
- Serial monitor logs command execution.
