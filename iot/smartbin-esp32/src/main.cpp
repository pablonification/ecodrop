#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <HTTPClient.h>
#include <WiFi.h>

#if __has_include("secrets.h")
#include "secrets.h"
#endif

/*
 * HARDWARE WIRING RULES:
 * - Servo MG996R MUST use external 5V power, not ESP32 3.3V.
 * - ESP32 and servo power supply MUST share ground.
 * - Keep fail-safe default: lid closed.
 */

#ifndef ECODROP_WIFI_SSID
#define ECODROP_WIFI_SSID "YOUR_WIFI_SSID"
#endif

#ifndef ECODROP_WIFI_PASSWORD
#define ECODROP_WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#endif

#ifndef ECODROP_BACKEND_BASE_URL
#define ECODROP_BACKEND_BASE_URL "http://139.59.245.101:8000"
#endif

#ifndef ECODROP_DEVICE_ID
#define ECODROP_DEVICE_ID "ECO-SMARTBIN-001"
#endif

#ifndef ECODROP_DEVICE_TOKEN
#define ECODROP_DEVICE_TOKEN "dev-device-token"
#endif

const char* WIFI_SSID = ECODROP_WIFI_SSID;
const char* WIFI_PASSWORD = ECODROP_WIFI_PASSWORD;
const char* BACKEND_BASE_URL = ECODROP_BACKEND_BASE_URL;
const char* DEVICE_ID = ECODROP_DEVICE_ID;
const char* DEVICE_TOKEN = ECODROP_DEVICE_TOKEN;
const char* FIRMWARE_VERSION = "0.2.0";

const int SERVO_PIN = 18;
const int STATUS_LED_PIN = 2;
const int ULTRASONIC_TRIG_PIN = 19;
const int ULTRASONIC_ECHO_PIN = 21;

const int SERVO_CLOSED_DEG = 38;
const int SERVO_OPEN_DEG = 170;
const float DEPOSIT_DETECTION_THRESHOLD_CM = 5.0;
const unsigned long SERVO_SENSOR_SETTLE_MS = 600;
const unsigned long SERVO_EMI_GUARD_MS = 200;

const unsigned long HEARTBEAT_INTERVAL_MS = 30000;
const unsigned long COMMAND_POLL_INTERVAL_MS = 2000;
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 5000;

Servo lidServo;

unsigned long lastHeartbeatAt = 0;
unsigned long lastCommandPollAt = 0;
unsigned long lastReconnectAttemptAt = 0;
unsigned long lidOpenedAt = 0;
unsigned long lidOpenDurationMs = 10000;
unsigned long lastServoActionAt = 0;

bool lidOpen = false;
bool sessionActive = false;
bool sensorAlreadyReported = false;
String activeSessionId = "";
float baselineDistanceCm = -1.0;

void acknowledgeCommand(const char* commandId, const char* status, const char* message);
void checkUltrasonicDeposit();
void closeLid();
void connectWiFi();
void ensureWiFi();
String getJson(String path);
void handleSerialInput();
void openLid();
bool postJson(String path, String body);
void pollNextCommand();
float readDistanceCm();
float readStableDistanceCm(int samples);
void registerDevice();
void resetActiveSession();
void sendHeartbeat();

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==========================================");
  Serial.println("       ECODROP SMARTBIN ONLINE TEST");
  Serial.println("==========================================");
  Serial.println("Commands: open, close, ultrasonic, baseline, help");

  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  lidServo.attach(SERVO_PIN);
  closeLid();

  connectWiFi();
  registerDevice();
}

void loop() {
  handleSerialInput();
  ensureWiFi();
  if (WiFi.status() != WL_CONNECTED) {
    if (lidOpen) {
      Serial.println("Fail-safe: Wi-Fi lost, closing lid.");
      closeLid();
      resetActiveSession();
    }
    delay(100);
    return;
  }

  unsigned long now = millis();

  if (lidOpen && (now - lidOpenedAt >= lidOpenDurationMs)) {
    Serial.println("Fail-safe: Insert window expired, closing lid.");
    closeLid();
    resetActiveSession();
  }

  if (now - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    lastHeartbeatAt = now;
  }

  if (now - lastCommandPollAt >= COMMAND_POLL_INTERVAL_MS) {
    pollNextCommand();
    lastCommandPollAt = now;
  }

  checkUltrasonicDeposit();
  delay(50);
}

void connectWiFi() {
  Serial.println("Connecting Wi-Fi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    delay(300);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    Serial.print("Wi-Fi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(STATUS_LED_PIN, LOW);
    Serial.println("Wi-Fi connection failed.");
  }
}

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  unsigned long now = millis();
  if (now - lastReconnectAttemptAt < WIFI_RECONNECT_INTERVAL_MS) return;

  lastReconnectAttemptAt = now;
  Serial.println("Wi-Fi disconnected. Reconnecting...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void registerDevice() {
  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["location_name"] = "Prototype Location";
  doc["ip_address"] = WiFi.localIP().toString();

  String body;
  serializeJson(doc, body);
  postJson("/api/iot/devices/register", body);
}

void sendHeartbeat() {
  JsonDocument doc;
  doc["status"] = "online";
  doc["capacity_percent"] = 42;
  doc["firmware_version"] = FIRMWARE_VERSION;

  String body;
  serializeJson(doc, body);
  String path = String("/api/iot/devices/") + DEVICE_ID + "/heartbeat";
  postJson(path, body);
}

void pollNextCommand() {
  String path = String("/api/iot/devices/") + DEVICE_ID + "/commands/next";
  String response = getJson(path);
  if (response.length() == 0) return;

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, response);
  if (error) {
    Serial.println("Failed to parse command JSON.");
    return;
  }

  const char* action = doc["action"] | "noop";
  const char* commandId = doc["id"] | "";
  const char* sessionId = doc["session_id"] | "";
  int durationSeconds = doc["duration_seconds"] | 10;

  if (String(action) == "open_lid") {
    activeSessionId = String(sessionId);
    sessionActive = activeSessionId.length() > 0;
    sensorAlreadyReported = false;
    lidOpenDurationMs = (unsigned long)durationSeconds * 1000;
    lidOpenedAt = millis();
    openLid();
    acknowledgeCommand(commandId, "acknowledged", "Lid opened.");
    Serial.printf(
      "Lid opened for session %s, window %d seconds, baseline %.1f cm.\n",
      activeSessionId.c_str(),
      durationSeconds,
      baselineDistanceCm
    );
  } else if (String(action) == "close_lid") {
    closeLid();
    resetActiveSession();
    acknowledgeCommand(commandId, "acknowledged", "Lid closed.");
  } else if (String(action) != "noop") {
    Serial.println("Fail-safe: Unknown command received, closing lid.");
    closeLid();
    resetActiveSession();
    acknowledgeCommand(commandId, "failed", "Unknown action.");
  }
}

void checkUltrasonicDeposit() {
  if (!sessionActive || sensorAlreadyReported) return;
  if (baselineDistanceCm <= 0) {
    baselineDistanceCm = readStableDistanceCm(5);
    if (baselineDistanceCm > 0) {
      Serial.printf("Ultrasonic baseline recovered: %.1f cm\n", baselineDistanceCm);
    }
    return;
  }

  float currentDistanceCm = readDistanceCm();
  if (currentDistanceCm <= 0) return;

  float deltaCm = baselineDistanceCm - currentDistanceCm;
  if (deltaCm < DEPOSIT_DETECTION_THRESHOLD_CM) return;

  Serial.printf(
    "Bottle detected by ultrasonic sensor. Baseline %.1f cm, current %.1f cm, delta %.1f cm.\n",
    baselineDistanceCm,
    currentDistanceCm,
    deltaCm
  );

  sensorAlreadyReported = true;
  JsonDocument doc;
  doc["session_id"] = activeSessionId;
  doc["sensor_state"] = "object_detected";
  doc["raw_value"] = (int)round(currentDistanceCm);
  doc["event_id"] = String("ultra-") + String(millis());

  String body;
  serializeJson(doc, body);
  String path = String("/api/iot/devices/") + DEVICE_ID + "/sensor-events";
  postJson(path, body);
  closeLid();
  resetActiveSession();
}

void acknowledgeCommand(const char* commandId, const char* status, const char* message) {
  if (String(commandId).length() == 0 || String(commandId).startsWith("noop")) return;

  JsonDocument doc;
  doc["status"] = status;
  doc["message"] = message;

  String body;
  serializeJson(doc, body);
  String path = String("/api/iot/devices/") + DEVICE_ID + "/commands/" + commandId + "/ack";
  postJson(path, body);
}

void openLid() {
  lidServo.write(SERVO_OPEN_DEG);
  lastServoActionAt = millis();
  lidOpen = true;
  delay(SERVO_SENSOR_SETTLE_MS);
  baselineDistanceCm = readStableDistanceCm(5);
  if (baselineDistanceCm > 0) {
    Serial.printf("Ultrasonic baseline: %.1f cm\n", baselineDistanceCm);
  } else {
    Serial.println("Ultrasonic baseline unavailable; will retry while awaiting deposit.");
  }
}

void closeLid() {
  lidServo.write(SERVO_CLOSED_DEG);
  lastServoActionAt = millis();
  lidOpen = false;
  baselineDistanceCm = -1.0;
}

void resetActiveSession() {
  sessionActive = false;
  sensorAlreadyReported = false;
  activeSessionId = "";
}

float readDistanceCm() {
  if (millis() - lastServoActionAt < SERVO_EMI_GUARD_MS) return -1;

  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  return (duration * 0.0343) / 2.0;
}

float readStableDistanceCm(int samples) {
  float total = 0;
  int valid = 0;
  for (int index = 0; index < samples; index++) {
    float distance = readDistanceCm();
    if (distance > 0) {
      total += distance;
      valid++;
    }
    delay(40);
  }
  if (valid == 0) return -1;
  return total / valid;
}

void handleSerialInput() {
  if (!Serial.available()) return;

  String command = Serial.readStringUntil('\n');
  command.trim();
  command.toLowerCase();

  if (command == "open") {
    openLid();
    lidOpenedAt = millis();
    lidOpenDurationMs = 10000;
    Serial.println("Manual open; no backend sensor event will be sent without an active session.");
  } else if (command == "close") {
    closeLid();
    resetActiveSession();
    Serial.println("Manual close complete.");
  } else if (command == "ultrasonic") {
    Serial.printf("Ultrasonic distance: %.1f cm\n", readStableDistanceCm(3));
  } else if (command == "baseline") {
    baselineDistanceCm = readStableDistanceCm(5);
    Serial.printf("Ultrasonic baseline set to %.1f cm\n", baselineDistanceCm);
  } else if (command == "help") {
    Serial.println();
    Serial.println("--- Commands ---");
    Serial.println("open       : open lid locally for hardware testing");
    Serial.println("close      : close lid locally");
    Serial.println("ultrasonic : print current averaged distance");
    Serial.println("baseline   : resample empty-bin distance");
    Serial.println("help       : print this menu");
    Serial.println("----------------");
    Serial.println();
  }
}

String getJson(String path) {
  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + path;
  http.begin(url);
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  int status = http.GET();
  String response = "";
  if (status > 0) {
    response = http.getString();
  } else {
    Serial.printf("GET failed: %s\n", url.c_str());
  }
  http.end();
  return response;
}

bool postJson(String path, String body) {
  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + path;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  int status = http.POST(body);
  if (status <= 0) {
    Serial.printf("POST failed: %s\n", url.c_str());
    http.end();
    return false;
  }
  Serial.printf("POST %s -> %d\n", path.c_str(), status);
  http.end();
  return status >= 200 && status < 300;
}
