# Roadmap: Agentic Parking Negotiation & IoT Gate System

## Overview

Build an end-to-end autonomous parking negotiation and physical gate control system backed by Google Gemini and deterministic Python guardrails. Development proceeds across 5 phases: Phase 1 establishes the mathematical guardrails, schemas, database, and 50-run adversarial fuzz verification; Phase 2 builds the dual-model LLM engine and 3-round multi-lot orchestrator; Phase 3 integrates PayPal Sandbox and HMAC QR passes; Phase 4 completes the FastAPI server, OpenCV vision gate, and ESP32 hardware twin; and Phase 5 delivers the paced React frontend and live AG Grid dashboard.

## Phases

- [x] **Phase 1: Foundation, Policy Guardrails & Invariant Fuzzing** - Strict schemas, SQLite integer paise store, PolicyGuard clamps, prose sanitizer, and 50-run adversarial fuzz test.
- [x] **Phase 2: Dual-Model LLM Client & Multi-Lot Orchestrator** - Dual-bucket Gemini routing, concurrency semaphore, concession fallback, 3-round state machine, and soft-locking.
- [x] **Phase 3: PayPal Sandbox & Cryptographic HMAC QR Passes** - Zero-LLM currency boundary, PayPal v2 orders, and tamper-proof HMAC-SHA256 signed QR pass lifecycle.
- [x] **Phase 4: FastAPI WebSocket Hub, Vision Gate & ESP32 Twin** - Real-time WebSocket broadcasting, OpenCV QR detector, USB serial bridge, and ESP32 gate/IR firmware.
- [x] **Phase 5: React Frontend Paced Theater & AG Grid Dashboard** - Vite React-TS frontend, 1200ms pacing queue, live negotiation theater, offer ladder chart, and cell-flashing dashboard.

## Phase Details

### Phase 1: Foundation, Policy Guardrails & Invariant Fuzzing
**Goal**: Establish deterministic foundation with strict Pydantic schemas, integer paise SQLite persistence, pricing engine, the core PolicyGuard anti-hallucination barriers, and a 50-run adversarial fuzz test suite proving 100% safety invariant compliance.
**Depends on**: Nothing (first phase)
**Requirements**: [GUARD-01, GUARD-02, GUARD-03, GUARD-04, GUARD-05, GUARD-06, GUARD-07, CORE-01, CORE-02, CORE-03, TEST-01]
**Success Criteria** (what must be TRUE):
  1. All monetary quantities across schemas and SQLite tables are stored strictly in integer paise (₹1 = 100 paise).
  2. PolicyGuard clamps lot offers to [floor, list] and driver bids to [last_bid, min(budget, last_offer - 100)], preventing upward bids or floor breaches.
  3. Prose sanitizer rewrites ₹XX numbers in message text when clamped and appends `[Adjusted to policy limit ₹XX/hr]`.
  4. 50-run adversarial chaos test (`pytest backend/tests/test_invariants.py`) completes with 100% invariant pass rate and zero assertions broken.
**Plans**: 3 plans

Plans:
- [x] 01-01: Environment configuration, dependencies, Pydantic schemas, and SQLite database in integer paise.
- [x] 01-02: Pricing engine and anti-hallucination PolicyGuard (floor/budget clamp, monotonicity clamp, regex prose sanitizer).
- [x] 01-03: 50-run adversarial chaos fuzz testing suite verifying all 7 invariants.

### Phase 2: Dual-Model LLM Client & Multi-Lot Orchestrator
**Goal**: Build rate-limit-safe dual-model Gemini client with concurrency semaphore, deterministic concession fallback engine, memory-isolated prompts, and 3-round multi-lot negotiation state machine with atomic slot soft-locking and utility-based winner selection.
**Depends on**: Phase 1
**Requirements**: [LLM-01, LLM-02, LLM-03, ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05, TEST-02]
**Success Criteria** (what must be TRUE):
  1. Driver queries `gemini-2.5-flash` while Lot queries `gemini-2.5-flash-lite` under an `asyncio.Semaphore(2)` concurrency limit.
  2. If Gemini API times out or hits 429 quota, fallback engine produces mathematical concession steps without crashing.
  3. Driver prompt builders never leak private reservation budget to lot prompt contexts.
  4. Orchestrator executes distance filtering, 3 bilateral rounds across active lots, atomic 180s SQLite soft-lock, and emits ACCEPT to winner and WALK_AWAY to losers.
  5. 3 live Gemini smoke tests run and export latency stats and `golden_runs.json` fixture.
**Plans**: 3 plans

Plans:
- [x] 02-01: Dual-model Gemini client with semaphore and deterministic concession fallback engine.
- [x] 02-02: Multi-lot 3-round bilateral state machine with distance pre-filter, slot soft-lock, and winner scoring.
- [x] 02-03: Live Gemini smoke test runs and golden_runs.json offline replay capture.

### Phase 3: PayPal Sandbox & Cryptographic HMAC QR Passes
**Goal**: Implement zero-LLM payment boundary converting integer paise to USD cents, PayPal Sandbox v2 checkout order creation, and tamper-proof HMAC-SHA256 signed QR access pass generator and cryptographic verifier.
**Depends on**: Phase 2
**Requirements**: [PAY-01, PAY-02, PAY-03, PAY-04]
**Success Criteria** (what must be TRUE):
  1. Payment calculations execute in pure Python (`usd_cents = round(total_paise * 100 / 8400)`) with zero LLM parameter passing.
  2. Backend authenticates with PayPal Sandbox v2 API, creates checkout orders, and returns valid approval URLs.
  3. QR passes are signed with HMAC-SHA256 and URL-safe base64 encoding with plate hash and expiry.
  4. Verification correctly validates authentic passes and rejects tampered signatures or expired timestamps.
**Plans**: 2 plans

Plans:
- [x] 03-01: Deterministic paise-to-USD conversion and PayPal Sandbox v2 checkout order provider.
- [x] 03-02: Cryptographic HMAC-SHA256 signed QR pass generator and token verifier.

### Phase 4: FastAPI WebSocket Hub, Vision Gate & ESP32 Twin
**Goal**: Construct FastAPI web application with real-time WebSocket hub, OpenCV webcam QR scanner with HMAC verification, USB serial bridge, and ESP32 Arduino firmware for physical SG90 servo gate and IR obstacle slot sensors.
**Depends on**: Phase 3
**Requirements**: [HW-01, HW-02, HW-03]
**Success Criteria** (what must be TRUE):
  1. FastAPI exposes REST endpoints for lots, slots, bookings, and a WebSocket hub broadcasting negotiation and hardware events.
  2. OpenCV `cv2.QRCodeDetector` deterministically extracts QR text from video frames and triggers gate on HMAC validity.
  3. USB Serial bridge at 115200 baud communicates bidirectionally between FastAPI and ESP32.
  4. ESP32 firmware opens servo gate for 5 seconds on `OPEN_GATE` command and emits active-LOW IR sensor updates.
**Plans**: 3 plans

Plans:
- [x] 04-01: FastAPI application, WebSocket connection hub, and REST route endpoints.
- [x] 04-02: OpenCV webcam QR scanner with HMAC pass validation and USB serial bridge.
- [x] 04-03: ESP32 Arduino firmware for SG90 servo gate control and IR obstacle slot monitoring.

### Phase 5: React Frontend Paced Theater & AG Grid Dashboard
**Goal**: Deliver responsive Vite React-TS user interface featuring `usePacedStream` pacing queue, live Negotiation Theater, OfferLadderChart price convergence visualization, and cell-flashing AG Grid Community dashboard.
**Depends on**: Phase 4
**Requirements**: [FE-01, FE-02, FE-03, FE-04, FE-05]
**Success Criteria** (what must be TRUE):
  1. Vite React TypeScript application builds cleanly with zero AG Grid Enterprise watermark warnings.
  2. `usePacedStream` hook buffers rapid WebSocket bursts and paces events at readable 1200ms intervals.
  3. Negotiation Theater displays animated dialog bubbles with amber badges on clamped offers and round progression markers.
  4. OfferLadderChart renders price convergence trajectories across rounds for all competing lots.
  5. AG Grid Community flashes green on sensor changes and amber on policy clamps via `enableCellChangeFlash`.
**Plans**: 3 plans

Plans:
- [x] 05-01: Vite React TypeScript project setup, styling, and usePacedStream pacing hook.
- [x] 05-02: Negotiation Theater component and OfferLadderChart Recharts visualization.
- [x] 05-03: AG Grid Community live flashing dashboard and offline golden_runs replay controller.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Policy Guardrails & Invariant Fuzzing | 3/3 | Complete | 2026-10-15 |
| 2. Dual-Model LLM Client & Multi-Lot Orchestrator | 3/3 | Complete | 2026-10-15 |
| 3. PayPal Sandbox & Cryptographic HMAC QR Passes | 0/2 | Not started | - |
| 4. FastAPI WebSocket Hub, Vision Gate & ESP32 Twin | 0/3 | Not started | - |
| 5. React Frontend Paced Theater & AG Grid Dashboard | 0/3 | Not started | - |
