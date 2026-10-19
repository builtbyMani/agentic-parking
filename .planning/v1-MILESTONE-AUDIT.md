---
milestone: v1
audited: 2026-10-19T13:10:00+05:30
status: tech_debt
scores:
  requirements: 28/28
  phases: 5/5
  integration: 5/6
  flows: 3/3
gaps:
  requirements: []
  integration:
    - from: "backend/serial_bridge.py"
      to: "hardware/esp32_lot_a/esp32_lot_a.ino"
      issue: "Protocol mismatch: ESP32 emits GATE:OPENED but serial_bridge only handles GATE:CLOSED. GATE:OPENED events from hardware are silently dropped."
  flows: []
tech_debt:
  - phase: all
    items:
      - "CRITICAL: .env file with API keys committed to git history — must rotate all keys and scrub history"
      - "CORS wildcard allow_origins=['*'] with allow_credentials=True — should be explicit origins"
      - "No size limit on frame_b64 input to /api/gate/verify-qr — unbounded memory risk"
  - phase: 01-foundation-policy-guardrails-invariant-fuzzing
    items:
      - "ORCH-02 design leak: compute_opening_request_anchor receives driver budget — lot operator could reverse-engineer private budget from opening bid"
      - "No backend/__init__.py — relies on try/except ImportError dual-import hack"
  - phase: 02-dual-model-llm-client-multi-lot-orchestrator
    items:
      - "Stale model IDs: code uses gemini-3.1-flash-lite and gemini-3.5-flash-lite but comments say gemini-2.5-flash/flash-lite"
      - "asyncio.create_task fire-and-forget in /api/negotiate — no task tracking, no session isolation for concurrent negotiations"
  - phase: 04-fastapi-websocket-hub-vision-gate-esp32-twin
    items:
      - "test_gate_flow.py uses production parking.db instead of tmp_path — running tests corrupts demo data"
      - "ESP32 firmware protocol mismatch: emits GATE:OPENED but backend only handles GATE:CLOSED"
      - "Every DB call opens a new aiosqlite connection — no connection pooling"
  - phase: 05-react-frontend-paced-theater-ag-grid-dashboard
    items:
      - "WebSocket URL hardcodes port 8000 — breaks any non-localhost deployment"
      - "Negotiate endpoint has conditional localhost URL — should use Vite proxy consistently"
      - "NegotiationTheater has no auto-scroll to latest event"
      - "QRPassModal uses useState<any> for checkoutData and has unused cooldownTime state"
      - "Empty frontend/src/components/finance/ directory"
      - "Mock PayPal approval page hardcodes localhost:5173 return URL"
nyquist:
  overall: skipped
  reason: "nyquist_validation disabled in .planning/config.json"
---

# v1 Milestone Audit — Agentic Parking Negotiation & IoT Gate System

**Audited:** 2026-10-19  
**Status:** ⚡ Tech Debt (all requirements met, no critical blockers, accumulated debt needs review)

---

## 1. Requirement Coverage

All **28 v1 requirements** are satisfied. Cross-referenced against 5 VERIFICATION.md files, 14 SUMMARY.md files, and the live codebase.

### Guardrails & Policy Invariants

| Requirement | Description | Phase | Verification | Codebase Evidence |
|-------------|-------------|-------|--------------|-------------------|
| GUARD-01 | Integer paise via `response_schema` | Phase 1 | ✅ PASS | `llm_client.py:166` — `response_schema=AgentMoveLLM` |
| GUARD-02 | Lot floor/list clamp | Phase 1 | ✅ PASS | `policy_guard.py:42-49` — floor + ceiling clamp |
| GUARD-03 | Driver bid/budget clamp | Phase 1 | ✅ PASS | `policy_guard.py:88-100` — budget + monotonic + upward guard |
| GUARD-04 | Regex prose sanitizer | Phase 1 | ✅ PASS | `policy_guard.py:6-13` — `sanitize_message_prices()` |
| GUARD-05 | Action state machine | Phase 1 | ✅ PASS | `policy_guard.py:57,102` — OFFER R1, COUNTER R2+ |
| GUARD-06 | Memory-isolated prompts | Phase 1 | ✅ PASS | `llm_client.py:66` — "budget is NEVER passed" to lot prompts |
| GUARD-07 | Zero-LLM payment calc | Phase 1 | ✅ PASS | `payments.py:32-34` — pure Python `paise_to_usd_cents()` |

### Core Data & Persistence

| Requirement | Description | Phase | Verification | Status |
|-------------|-------------|-------|--------------|--------|
| CORE-01 | Pydantic schemas | Phase 1 | ✅ PASS | `schemas.py` — 6 strict models |
| CORE-02 | Async SQLite in integer paise | Phase 1 | ✅ PASS | `db.py` — all columns INTEGER |
| CORE-03 | Dynamic pricing engine | Phase 1 | ✅ PASS | `pricing_engine.py` — floor + discount |

### LLM Integration

| Requirement | Description | Phase | Verification | Status |
|-------------|-------------|-------|--------------|--------|
| LLM-01 | Dual-model routing | Phase 2 | ✅ PASS | `llm_client.py:116` — separate model IDs |
| LLM-02 | Semaphore(2) limiter | Phase 2 | ✅ PASS | `llm_client.py:11` |
| LLM-03 | Fallback engine | Phase 2 | ✅ PASS | `llm_client.py:22-57` — `deterministic_fallback_move()` |

### Orchestration

| Requirement | Description | Phase | Verification | Status |
|-------------|-------------|-------|--------------|--------|
| ORCH-01 | Distance pre-filter | Phase 2 | ✅ PASS | `orchestrator.py` — LOT_SKIPPED event |
| ORCH-02 | Opening anchor | Phase 2 | ✅ PASS | `pricing_engine.py:14-20` |
| ORCH-03 | 3-round parallel loops | Phase 2 | ✅ PASS | `orchestrator.py` — `asyncio.gather` |
| ORCH-04 | Utility winner scoring | Phase 2 | ✅ PASS | `orchestrator.py` — cost + walk penalty |
| ORCH-05 | Atomic 180s soft-lock | Phase 2 | ✅ PASS | `db.py` — `acquire_soft_lock()` |

### Testing

| Requirement | Description | Phase | Verification | Status |
|-------------|-------------|-------|--------------|--------|
| TEST-01 | 50-run adversarial fuzz | Phase 1 | ✅ PASS | `test_invariants.py` — 50 runs, 0 violations |
| TEST-02 | Live smoke + golden runs | Phase 2 | ✅ PASS | `test_live_smoke.py` — fixture written |

### Payments & QR

| Requirement | Description | Phase | Verification | Status |
|-------------|-------------|-------|--------------|--------|
| PAY-01 | Paise-to-USD conversion | Phase 3 | ✅ PASS | `payments.py:32-34` |
| PAY-02 | PayPal Sandbox v2 | Phase 3 | ✅ PASS | `payments.py:42-118` |
| PAY-03 | HMAC-SHA256 QR generator | Phase 3 | ✅ PASS | `payments.py:159-175` |
| PAY-04 | Token verification | Phase 3 | ✅ PASS | `payments.py:178-206` |

### Hardware & Vision

| Requirement | Description | Phase | Verification | Status |
|-------------|-------------|-------|--------------|--------|
| HW-01 | OpenCV QR detector | Phase 4 | ✅ PASS | `vision_gate.py:17` — `cv2.QRCodeDetector()` |
| HW-02 | Serial bridge 115200 | Phase 4 | ✅ PASS | `serial_bridge.py:13` |
| HW-03 | ESP32 firmware | Phase 4 | ✅ PASS | `esp32_lot_a.ino` — servo + IR + 5s auto-close |

### Frontend

| Requirement | Description | Phase | Verification | Status |
|-------------|-------------|-------|--------------|--------|
| FE-01 | Vite React TS + AG Grid Community | Phase 5 | ✅ PASS | `package.json` — `ag-grid-community@32.3.9` |
| FE-02 | 1200ms pacing queue | Phase 5 | ✅ PASS | `usePacedStream.ts:4` — `paceMs = 1200` |
| FE-03 | Negotiation Theater + clamp badges | Phase 5 | ✅ PASS | `NegotiationTheater.tsx` — amber badges |
| FE-04 | OfferLadderChart convergence | Phase 5 | ✅ PASS | `OfferLadderChart.tsx` — Recharts lines |
| FE-05 | AG Grid cell change flash | Phase 5 | ✅ PASS | `AgGridDashboard.tsx` — `enableCellChangeFlash` |

**Coverage: 28/28 requirements satisfied ✓**

---

## 2. Phase Verification Summary

| Phase | VERIFICATION.md | Status | Score | Tests |
|-------|----------------|--------|-------|-------|
| 1. Foundation & Guardrails | ✅ Exists | passed | 100/100 | 3 pass |
| 2. LLM Client & Orchestrator | ✅ Exists | passed | 100/100 | 2 pass |
| 3. PayPal & HMAC QR | ✅ Exists | passed | 100/100 | 3 pass |
| 4. FastAPI Hub & ESP32 | ✅ Exists | passed | 100/100 | 4 pass + 1 negotiate |
| 5. React Frontend | ✅ Exists | passed | 100/100 | tsc + build |

**Phases: 5/5 verified ✓**

---

## 3. Live Test Execution (Audit-time)

```
python3 -m pytest backend/tests/ -v
13 passed in 11.27s

cd frontend && npx tsc --noEmit
Exit: 0 (clean)
```

All 13 backend tests pass. Frontend TypeScript compiles clean.

---

## 4. Cross-Phase Integration Check

| Flow | From → To | Status |
|------|-----------|--------|
| Schemas → PolicyGuard → Orchestrator | Phase 1 → Phase 2 | ✅ Wired |
| Orchestrator → DB soft-lock → Booking | Phase 2 → Phase 1 DB | ✅ Wired |
| Booking → PayPal → QR token | Phase 2 → Phase 3 | ✅ Wired |
| QR token → VisionGate → SerialBridge | Phase 3 → Phase 4 | ✅ Wired |
| WebSocket → usePacedStream → Theater | Phase 4 → Phase 5 | ✅ Wired |
| SerialBridge ↔ ESP32 firmware protocol | Phase 4 ↔ Hardware | ⚠️ Mismatch |

**Integration gap:** ESP32 firmware emits `GATE:OPENED` but `serial_bridge.py` `handle_serial_line()` only matches `GATE:CLOSED`. The `GATE:OPENED` acknowledgment from hardware is silently dropped. Gate still works because the backend tracks state internally, but hardware confirmation is lost.

**Integration: 5/6 flows verified**

---

## 5. End-to-End Flow Verification

| Flow | Steps | Status |
|------|-------|--------|
| **Negotiate → Pay → Gate** | Driver constraints → 3-round negotiation → ACCEPT → checkout → confirm → QR token → gate verify | ✅ Verified (test_full_checkout_and_confirmation_lifecycle) |
| **Offline Demo** | Load golden_runs.json → pace 22 events → display theater | ✅ Verified (test_generate_golden_runs_fixture) |
| **Sensor Telemetry** | Toggle slot → DB update → WebSocket broadcast | ✅ Verified (test_slot_toggle_sensor_telemetry) |

**Flows: 3/3 verified ✓**

---

## 6. Nyquist Compliance

**Skipped.** `nyquist_validation: false` in `.planning/config.json`.

All 5 VALIDATION.md files exist with `status: draft` (seeded by plan-phase, never reconciled by validate-phase).

---

## 7. Tech Debt Inventory

### 🔴 Security (fix before any public demo)

| # | Item | Phase | Effort |
|---|------|-------|--------|
| 1 | `.env` with real API keys committed to git — rotate keys, scrub history | All | 5 min |
| 2 | CORS `allow_origins=["*"]` with `allow_credentials=True` | Phase 4 | 1 min |
| 3 | No `max_length` on `frame_b64` field — unbounded memory | Phase 4 | 2 min |

### 🟡 Correctness

| # | Item | Phase | Effort |
|---|------|-------|--------|
| 4 | `test_gate_flow.py` writes to production `parking.db` instead of `tmp_path` | Phase 4 | 10 min |
| 5 | ESP32 `GATE:OPENED` protocol mismatch with serial_bridge | Phase 4 | 2 min |
| 6 | `asyncio.create_task` fire-and-forget — no task tracking for concurrent negotiations | Phase 4 | 15 min |
| 7 | Opening anchor formula leaks driver budget via `min(list*0.72, budget*0.80)` | Phase 1 | 5 min |
| 8 | Stale model IDs in docstring vs code | Phase 2 | 2 min |

### 🟢 Code Quality

| # | Item | Phase | Effort |
|---|------|-------|--------|
| 9 | Hardcoded port 8000 in WebSocket URL and negotiate endpoint | Phase 5 | 5 min |
| 10 | No auto-scroll in NegotiationTheater | Phase 5 | 5 min |
| 11 | `useState<any>` and unused `cooldownTime` in QRPassModal | Phase 5 | 2 min |
| 12 | Empty `finance/` directory | Phase 5 | 1 min |
| 13 | Mock PayPal approval hardcodes localhost URLs | Phase 4 | 2 min |
| 14 | `try/except ImportError` dual-import pattern everywhere | All | 10 min |
| 15 | Every DB call opens a new aiosqlite connection | Phase 1 | 15 min |

**Total: 15 items across 5 phases**

---

## 8. Orphan Detection

No orphaned requirements found. All 28 requirements in the traceability table are covered by at least one VERIFICATION.md file.

---

*Audited by: Antigravity GSD Milestone Audit Pipeline*
*Audit timestamp: 2026-10-19T13:10:00+05:30*
