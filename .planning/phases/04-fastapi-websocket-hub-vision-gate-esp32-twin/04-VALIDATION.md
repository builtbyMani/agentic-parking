---
phase: "4"
slug: "fastapi-websocket-hub-vision-gate-esp32-twin"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-15"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest >= 8.2.0 + FastAPI TestClient |
| **Config file** | default pytest runner |
| **Quick run command** | `python3 -m pytest backend/tests/test_gate_flow.py -q` |
| **Full suite command** | `python3 -m pytest backend/tests/ -v` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python3 -m pytest backend/tests/test_gate_flow.py -q`
- **After every plan wave:** Run `python3 -m pytest backend/tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|---|---|
| 04-01-01 | 01 | 1 | HW-01 | T-04-01 | FastAPI app & WebSocket hub initialize | integration | `python3 -c "from backend.main import app; from fastapi.testclient import TestClient; c = TestClient(app); assert c.get('/').status_code == 200"` | ✅ yes | ✅ green |
| 04-02-01 | 02 | 2 | HW-03 | T-04-02 | Serial bridge / virtual twin manages gate state | unit | `python3 -c "import asyncio; from backend.serial_bridge import bridge; asyncio.run(bridge.trigger_gate_open(0.05))"` | ✅ yes | ✅ green |
| 04-02-02 | 02 | 2 | HW-02 | T-04-03 | OpenCV QR scanner verifies authentic passes | unit | `python3 -c "from backend.vision_gate import vision_scanner"` | ✅ yes | ✅ green |
| 04-03-01 | 03 | 3 | HW-03 | T-04-04 | ESP32 Arduino firmware syntax & tokens | syntax | `grep -q 'GATE:OPEN' hardware/esp32_lot_a/esp32_lot_a.ino` | ✅ yes | ✅ green |
| 04-03-02 | 03 | 3 | HW-01..03 | T-04-05 | Full gate flow and slot telemetry test suite | integration | `python3 -m pytest backend/tests/test_gate_flow.py -v` | ✅ yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/main.py`
- [ ] `backend/serial_bridge.py`
- [ ] `backend/vision_gate.py`
- [ ] `hardware/esp32_lot_a/esp32_lot_a.ino`
- [ ] `backend/tests/test_gate_flow.py`

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 3s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-15
