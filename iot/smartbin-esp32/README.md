# EcoDrop SmartBin ESP32 Firmware

This scaffold controls the EcoDrop SmartBin prototype:

- ESP32 Wi-Fi connectivity and auto-reconnect.
- MG996R servo open/close action.
- Ultrasonic distance sensor confirmation.
- REST registration and heartbeat.
- Command polling fallback for demo stability.

The task document describes WebSocket Secure for low-latency commands. This scaffold intentionally starts with hybrid REST + polling because it is easier to demonstrate when the ESP32 is behind Wi-Fi/NAT. A future implementation can add a persistent WebSocket client while preserving the same command payload.

## Pins

| Component | Default Pin |
| --- | --- |
| Servo signal | GPIO 18 |
| Ultrasonic trigger | GPIO 19 |
| Ultrasonic echo | GPIO 21 |
| Status LED | GPIO 2 |

Use a separate 5V 3A supply for the servo and connect grounds between the ESP32 and servo supply.
If the ultrasonic module uses 5V echo output, use a voltage divider or level shifter
before connecting echo to the ESP32.

## Ultrasonic Detection

When the backend sends `open_lid`, the firmware opens the servo, waits for the
lid to settle, samples the empty-bin wall distance as the baseline, then watches
for the distance to drop by at least 5 cm during the insert window. When that
happens, it sends `object_detected` to the backend and closes the lid.

Serial monitor commands at 115200 baud:

```text
open       : open lid locally for hardware testing
close      : close lid locally
ultrasonic : print current averaged distance
baseline   : resample empty-bin distance
help       : print command list
```

## Arduino IDE Setup

Before flashing, copy `src/secrets.example.h` to `src/secrets.h` and fill in
the Wi-Fi SSID and password:

```cpp
#define ECODROP_WIFI_SSID "your-wifi-name"
#define ECODROP_WIFI_PASSWORD "your-wifi-password"
```

The example file already points to the VPS demo backend at
`http://139.59.245.101:8000` with device ID `ECO-SMARTBIN-001` and token
`dev-device-token`.

## Backend Contract

- `POST /api/iot/devices/register`
- `POST /api/iot/devices/{device_id}/heartbeat`
- `GET /api/iot/devices/{device_id}/commands/next`
- `POST /api/iot/devices/{device_id}/commands/{command_id}/ack`
- `POST /api/iot/devices/{device_id}/sensor-events`

For the VPS demo backend, keep the firmware `BACKEND_BASE_URL` pointed to
`http://139.59.245.101:8000` and send the configured device token through the
`X-Device-Token` header.
