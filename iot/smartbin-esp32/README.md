# EcoDrop SmartBin ESP32 Firmware

This scaffold controls the EcoDrop SmartBin prototype:

- ESP32 Wi-Fi connectivity and auto-reconnect.
- MG996R servo open/close action.
- IR barrier sensor confirmation.
- REST registration and heartbeat.
- Command polling fallback for demo stability.

The task document describes WebSocket Secure for low-latency commands. This scaffold intentionally starts with hybrid REST + polling because it is easier to demonstrate when the ESP32 is behind Wi-Fi/NAT. A future implementation can add a persistent WebSocket client while preserving the same command payload.

## Pins

| Component | Default Pin |
| --- | --- |
| Servo signal | GPIO 18 |
| IR sensor digital output | GPIO 19 |
| Status LED | GPIO 2 |

Use a separate 5V 3A supply for the servo and connect grounds between the ESP32 and servo supply.

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
