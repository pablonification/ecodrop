# AGENTS.md - ESP32 SmartBin

These instructions apply to `iot/smartbin-esp32/**`.

## Product Direction

The SmartBin firmware controls the physical prototype: Wi-Fi, heartbeat, command handling, servo door movement, IR sensor confirmation, and fail-safe behavior.

References:

- Setorin repo: `https://github.com/pablonification/Setorin-AICCompfest2025`
- Setorin firmware token-free raw URL: `https://raw.githubusercontent.com/pablonification/Setorin-AICCompfest2025/refs/heads/main/setorin.ino`
- Private access command:
  ```bash
  gh api repos/pablonification/Setorin-AICCompfest2025/contents/setorin.ino --jq .content | base64 -d
  ```

Do not commit temporary raw GitHub `?token=...` URLs.

## Ownership

Allowed:

- `iot/smartbin-esp32/**`

Read-only unless coordinated:

- `docs/api/**`
- backend endpoint definitions

Do not edit:

- mobile or web UI code;
- backend reward logic.

## Hardware Rules

- Servo MG996R must use external 5V power, not ESP32 3.3V.
- ESP32 and servo power supply must share ground.
- Keep fail-safe default: lid closed.
- Unknown command, lost connection, or error should not leave lid open.
- IR sensor confirmation should be sent once per active session.
- Serial logs should be clear enough for demo troubleshooting.
- Do not hardcode real Wi-Fi passwords or device secrets in committed firmware.

## Protocol Rules

- Current scaffold supports REST hybrid:
  - register;
  - heartbeat;
  - poll command;
  - acknowledge command;
  - send sensor event.
- WebSocket support may be added later, but command payloads must remain compatible.
- Sensor events must include the matching `session_id`.

## Verification

```bash
cd iot/smartbin-esp32
pio run
pio run --target upload
pio device monitor
```

Manual checks:

- servo opens and closes at configured angles;
- heartbeat appears in backend;
- command polling receives `open_lid`;
- IR event completes deposit;
- no sensor event means no points.
