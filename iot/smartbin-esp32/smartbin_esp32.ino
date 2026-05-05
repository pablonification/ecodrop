#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <HTTPClient.h>
#include <WiFi.h>

// Update these values before flashing.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_BASE_URL = "http://192.168.1.10:8000";
const char* DEVICE_ID = "ECO-SMARTBIN-001";
const char* DEVICE_TOKEN = "dev-device-token";
const char* FIRMWARE_VERSION = "0.1.0";

const int SERVO_PIN = 18;
const int IR_SENSOR_PIN = 19;
const int STATUS_LED_PIN = 2;

const int SERVO_CLOSED_DEG = 38;
const int SERVO_OPEN_DEG = 180;

const unsigned long HEARTBEAT_INTERVAL_MS = 30000;
const unsigned long COMMAND_POLL_INTERVAL_MS = 2000;
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 5000;

Servo lidServo;

unsigned long lastHeartbeatAt = 0;
unsigned long lastCommandPollAt = 0;
unsigned long lastReconnectAttemptAt = 0;

bool lidOpen = false;
bool sessionActive = false;
bool sensorAlreadyReported = false;
String activeSessionId = "";

void setup() {
  Serial.begin(115200);
  delay(400);

  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(IR_SENSOR_PIN, INPUT_PULLUP);

  lidServo.attach(SERVO_PIN);
  closeLid();

  connectWiFi();
  registerDevice();
}

void loop() {
  ensureWiFi();
  if (WiFi.status() != WL_CONNECTED) {
    delay(100);
    return;
  }

  unsigned long now = millis();

  if (now - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    lastHeartbeatAt = now;
  }

  if (now - lastCommandPollAt >= COMMAND_POLL_INTERVAL_MS) {
    pollNextCommand();
    lastCommandPollAt = now;
  }

  readIrSensor();
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
  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["firmware_version"] = FIRMWARE_VERSION;
  doc["location_name"] = "Prototype Location";
  doc["ip_address"] = WiFi.localIP().toString();

  String body;
  serializeJson(doc, body);
  postJson("/api/iot/devices/register", body);
}

void sendHeartbeat() {
  StaticJsonDocument<256> doc;
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

  StaticJsonDocument<512> doc;
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
    openLid();
    acknowledgeCommand(commandId, "acknowledged", "Lid opened.");
    Serial.printf("Lid opened for session %s, window %d seconds.\n", activeSessionId.c_str(), durationSeconds);
  } else if (String(action) == "close_lid") {
    closeLid();
    sessionActive = false;
    activeSessionId = "";
    acknowledgeCommand(commandId, "acknowledged", "Lid closed.");
  } else if (String(action) != "noop") {
    acknowledgeCommand(commandId, "failed", "Unknown action.");
  }
}

void readIrSensor() {
  if (!sessionActive || sensorAlreadyReported) return;

  int raw = digitalRead(IR_SENSOR_PIN);
  bool objectDetected = raw == LOW;
  if (!objectDetected) return;

  sensorAlreadyReported = true;
  StaticJsonDocument<256> doc;
  doc["session_id"] = activeSessionId;
  doc["sensor_state"] = "object_detected";
  doc["raw_value"] = raw;

  String body;
  serializeJson(doc, body);
  String path = String("/api/iot/devices/") + DEVICE_ID + "/sensor-events";
  postJson(path, body);
  closeLid();
}

void acknowledgeCommand(const char* commandId, const char* status, const char* message) {
  if (String(commandId).length() == 0 || String(commandId).startsWith("noop")) return;

  StaticJsonDocument<256> doc;
  doc["status"] = status;
  doc["message"] = message;

  String body;
  serializeJson(doc, body);
  String path = String("/api/iot/devices/") + DEVICE_ID + "/commands/" + commandId + "/ack";
  postJson(path, body);
}

void openLid() {
  lidServo.write(SERVO_OPEN_DEG);
  lidOpen = true;
}

void closeLid() {
  lidServo.write(SERVO_CLOSED_DEG);
  lidOpen = false;
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
