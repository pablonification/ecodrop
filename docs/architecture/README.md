# Architecture Notes

EcoDrop follows the Deliverable 3 service-oriented architecture:

```mermaid
flowchart LR
  User["Mobile User"] --> Mobile["Mobile App<br/>React + Vite + Capacitor"]
  Admin["Administrator"] --> Web["Web Admin Dashboard<br/>React/Next.js"]
  Mobile -->|REST JSON + multipart image| Backend["FastAPI Backend"]
  Web -->|REST + future SSE/WebSocket| Backend
  Backend --> AI["AI/CV Service<br/>Roboflow + OpenCV"]
  Backend --> DB["MongoDB"]
  Backend --> Redis["Redis temporary state"]
  Backend -->|REST hybrid now<br/>WebSocket future| ESP32["ESP32 SmartBin"]
  ESP32 --> Servo["MG996R Servo"]
  ESP32 --> IRSensor["IR Sensor"]
  IRSensor --> ESP32
```

Important decisions:

- The backend is the source of truth for points and transaction status.
- Mobile and web should never compute final reward state independently.
- AI/CV can be mocked during integration, but response shape must stay stable.
- ESP32 communication starts as REST + polling for demo robustness, with a future WebSocket path allowed by the contract.
