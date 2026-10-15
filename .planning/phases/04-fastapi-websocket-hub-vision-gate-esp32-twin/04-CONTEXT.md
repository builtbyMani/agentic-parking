# Phase 4: FastAPI WebSocket Hub, Vision Gate & ESP32 Twin - Context

**Gathered:** 2026-10-15
**Status:** In Planning

<domain>
## Phase Boundary

Construct the real-time application layer and physical computing interfaces:
1. `backend/main.py`: FastAPI server with CORS, async SQLite connection lifecycle, REST endpoints for lots/slots/bookings, and WebSocket connection hub broadcasting real-time negotiation and hardware events.
2. `backend/serial_bridge.py`: Bidirectional 115200 baud USB serial listener and hardware twin fallback for ESP32 gate and IR slot sensor communication.
3. `backend/vision_gate.py`: OpenCV `QRCodeDetector` frame processor validating cryptographic HMAC signatures and triggering physical gate entry.
4. `hardware/esp32_lot_a/esp32_lot_a.ino`: Arduino C++ firmware for ESP32 with SG90 servo gate actuation (5-second auto-close window) and active-LOW IR slot occupancy sensing.

</domain>

<decisions>
## Implementation Decisions

### Real-Time Hub & REST APIs (HW-01)
- **D-01:** WebSocket hub: Broadcasts structured JSON events (`ROUND_COMPLETED`, `AMBER_CLAMP`, `WINNER_DECLARED`, `GATE_TRIGGERED`, `SLOT_CHANGED`) to all connected frontend clients.
- **D-02:** Background task negotiation: `POST /api/negotiate` accepts driver constraints, spawns the multi-lot orchestrator in an async task, and streams live events to WebSockets.
- **D-03:** Checkout & confirmation endpoints:
  - `POST /api/bookings/{booking_id}/checkout`: Creates order via `PayPalSandboxProvider` (or mock).
  - `POST /api/bookings/{booking_id}/confirm`: Captures payment, confirms slot in SQLite, issues HMAC-SHA256 signed QR pass.

### OpenCV Vision Gate (HW-02)
- **D-04:** Deterministic frame decoding: `cv2.QRCodeDetector()` detects QR text from image/webcam frames.
- **D-05:** Cryptographic verification: Passes decoded QR token to `verify_signed_qr_token()`. If signature matches and token is unexpired, invokes gate opening and emits `GATE_TRIGGERED`. If invalid, emits `GATE_REJECTED`.
- **D-06:** Cooldown prevention: 5-second cooldown timer prevents continuous re-triggering while a vehicle pass remains in front of the lens.

### USB Serial Bridge & Virtual Twin (HW-03)
- **D-07:** Serial protocol:
  - Command to ESP32: `GATE:OPEN\n`
  - Event from ESP32: `SLOT:A-01:OCCUPIED\n` or `SLOT:A-01:VACANT\n`
- **D-08:** Virtual Hardware Twin: If `ESP32_SERIAL_PORT` is empty or device is unplugged, operates in virtual twin mode without crashing, simulating servo timing and accepting software sensor triggers.

### ESP32 Firmware (HW-03)
- **D-09:** SG90 Servo on GPIO 18 (PWM), TCRT5000 IR sensor on GPIO 19 (`INPUT_PULLUP`, active-LOW), LED on GPIO 2.
- **D-10:** 5-second auto-close: On `GATE:OPEN`, servo moves to 90 degrees; after 5000ms, automatically returns to 0 degrees.

</decisions>

<canonical_refs>
## Canonical References

### Specification
- User Specification §2: Project Directory Layout (`backend/main.py`, `backend/vision_gate.py`, `backend/serial_bridge.py`, `hardware/esp32_lot_a/esp32_lot_a.ino`)
- User Specification §1: Barrier 7 (Zero-LLM Payment Boundary)
- Roadmap Phase 4: Requirements HW-01, HW-02, HW-03

</canonical_refs>

---
*Phase: 04-fastapi-websocket-hub-vision-gate-esp32-twin*
*Context gathered: 2026-10-15*
