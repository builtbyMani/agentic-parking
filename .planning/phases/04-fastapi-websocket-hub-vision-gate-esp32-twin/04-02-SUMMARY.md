# Phase 4 Plan 02: Summary

**Plan:** 04-02 (Wave 2)
**Status:** Completed
**Date:** 2026-10-15

## Summary

Implemented the bidirectional USB serial bridge with virtual hardware twin fallback in `backend/serial_bridge.py` and the OpenCV webcam QR scanner in `backend/vision_gate.py`.

### Key Deliverables

1. **Serial Bridge & Virtual Twin (`backend/serial_bridge.py`):**
   - Connects to physical ESP32 on `ESP32_SERIAL_PORT` at 115200 baud.
   - If port is unset or disconnected, gracefully runs in software virtual twin mode.
   - Actuates servo gate open (`trigger_gate_open`) with 5-second automatic close timer.
   - Parses active-LOW IR sensor telemetry (`SLOT:A-01:OCCUPIED` / `SLOT:A-01:VACANT`) and updates SQLite state.
   - Provides software slot toggle simulation (`simulate_slot_toggle`).

2. **OpenCV QR Detector & Gate Verifier (`backend/vision_gate.py`):**
   - Uses `cv2.QRCodeDetector()` for fast deterministic frame decoding.
   - Validates cryptographic HMAC-SHA256 signature and expiry timestamp.
   - Enforces a 5-second gate actuation cooldown to prevent continuous re-triggering.
   - Supports raw QR token strings, image files, and base64 video stream frames.
