#pragma once

// Copy this file to secrets.h before flashing from Arduino IDE or PlatformIO.
// Keep secrets.h local; it is ignored by git.
#define ECODROP_WIFI_SSID "YOUR_WIFI_SSID"
#define ECODROP_WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// These defaults match the current VPS deployment and ESP32 device registration.
#define ECODROP_BACKEND_BASE_URL "http://139.59.245.101:8000"
#define ECODROP_DEVICE_ID "ECO-SMARTBIN-001"
#define ECODROP_DEVICE_TOKEN "dev-device-token"
