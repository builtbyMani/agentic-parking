# Requirements: Agentic Parking Negotiation & IoT Gate System

**Defined:** 2026-10-15
**Core Value:** Zero-hallucination, deterministic bilateral price negotiation and automated physical access control: LLMs generate conversational bidding strategy while pure mathematical guards and deterministic barriers strictly clamp prices, enforce monotonic convergence, sanitize contradictory prose, and control all financial and physical access primitives.

## v1 Requirements

### Guardrails & Policy Invariants (7 Anti-Hallucination Barriers)

- [ ] **GUARD-01**: AgentMove schema enforces integer paise token generation via `response_schema` without float drift.
- [ ] **GUARD-02**: PolicyGuard clamps lot offers to [effective_floor_paise, base_list_paise] and emits AMBER_CLAMP event on breach.
- [ ] **GUARD-03**: PolicyGuard clamps driver counters to [last_driver_bid_paise, min(budget, last_lot_offer - 100)] preventing upward bidding or bid drops.
- [ ] **GUARD-04**: Regex prose sanitizer rewrites rupee figures in `move.message` when clamped and appends `[Adjusted to policy limit ₹XX/hr]`.
- [ ] **GUARD-05**: State machine locks and overrides action types (OFFER, COUNTER, ACCEPT, WALK_AWAY) based on round and agent turn.
- [ ] **GUARD-06**: Memory-isolated prompt builders prevent driver reservation budget leakage to lot prompts.
- [ ] **GUARD-07**: Zero-LLM payment calculation executes pure Python arithmetic for paise and USD cents conversion.

### Core Data, Schemas & Persistence

- [ ] **CORE-01**: Strict Pydantic models for `AgentMoveLLM`, `ValidatedMove`, `DriverConstraints`, `LotPolicy`, and system events.
- [ ] **CORE-02**: Async SQLite database storing lots, slots (with `soft_lock_until` timestamp), and bookings in integer paise.
- [ ] **CORE-03**: Dynamic pricing engine calculating base list price and effective floor with multi-hour prepay discounts.

### LLM Integration & Fallback Engine

- [ ] **LLM-01**: Dual-model client routing: Driver agent uses `gemini-2.5-flash`, Lot agents use `gemini-2.5-flash-lite`.
- [ ] **LLM-02**: `asyncio.Semaphore(2)` concurrency limiter preventing 429 quota exhaustion on free Gemini API tier.
- [ ] **LLM-03**: Deterministic mathematical fallback engine computing rule-based concession steps if LLM call fails or times out.

### Multi-Lot Negotiation Orchestration

- [ ] **ORCH-01**: Deterministic distance pre-filter skipping lots beyond `max_walk_distance_m` with `LOT_SKIPPED` WebSocket event.
- [ ] **ORCH-02**: Deterministic opening request anchor calculated as `min(list_price * 0.72, budget * 0.80)`.
- [ ] **ORCH-03**: 3-round bilateral parallel negotiation loop across active lots using `asyncio.gather`.
- [ ] **ORCH-04**: Deterministic winner evaluation scoring qualifying lots by total cost + distance walk penalty.
- [ ] **ORCH-05**: Atomic SQLite soft-lock (180s) on winning slot and broadcasting final `ACCEPT` to winner and `WALK_AWAY` to losers.

### Testing & Adversarial Verification

- [ ] **TEST-01**: 50-run adversarial chaos fuzz test verifying 0% invariant violations across all 7 hallucination types.
- [ ] **TEST-02**: Live Gemini smoke test recording turn latencies and exporting `golden_runs.json` fallback fixture.

### Payment Integration & Cryptographic Pass

- [ ] **PAY-01**: Deterministic paise-to-USD conversion using `USD_TO_INR_PAISE` (8400 paise = $1.00 USD).
- [ ] **PAY-02**: PayPal Sandbox v2 checkout order creation with approval URL and payment capture lifecycle.
- [ ] **PAY-03**: HMAC-SHA256 signed URL-safe QR token generator incorporating booking ID, lot, slot, plate hash, and expiration.
- [ ] **PAY-04**: Cryptographic token verification rejecting expired or tampered QR passes.

### Hardware Digital Twin & Computer Vision Gate

- [ ] **HW-01**: OpenCV `cv2.QRCodeDetector` scanning video frames and extracting signed HMAC tokens without LLM interpretation.
- [ ] **HW-02**: USB Serial / WebSocket communication bridge between FastAPI backend and ESP32 microcontroller.
- [ ] **HW-03**: ESP32 C++ firmware controlling SG90 servo gate with auto-close timer and reporting IR obstacle slot occupancy.

### React Frontend Dashboard & Theater

- [ ] **FE-01**: Vite React TypeScript application with zero AG Grid Enterprise watermark warnings (AG Grid Community only).
- [ ] **FE-02**: `usePacedStream` pacing queue smoothing rapid WebSocket events into readable 1200ms steps.
- [ ] **FE-03**: Interactive Negotiation Theater component showing live chat bubbles, clamped badges, and round transitions.
- [ ] **FE-04**: OfferLadderChart rendering price convergence lines across rounds.
- [ ] **FE-05**: Live AG Grid dashboard with `enableCellChangeFlash` flashing green on sensor changes and amber on guard clamps.

## v2 Requirements

- **EXT-01**: Multi-vehicle fleet dispatch and simultaneous multi-driver reservation.
- **EXT-02**: Stripe and UPI payment rails integration alongside PayPal.
- **EXT-03**: Automated license plate recognition (ALPR) camera integration.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Floating-point currency storage | Causes precision errors and calculation drifts; integer paise used exclusively |
| LLM-based payment arithmetic | Unacceptable financial hallucination risk; pure Python arithmetic boundary |
| LLM-based QR code decoding | High rate of character hallucination; deterministic OpenCV detector used |
| AG Grid Enterprise features | Triggers trial watermarks and adds licensing cost |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GUARD-01 | Phase 1 | Pending |
| GUARD-02 | Phase 1 | Pending |
| GUARD-03 | Phase 1 | Pending |
| GUARD-04 | Phase 1 | Pending |
| GUARD-05 | Phase 1 | Pending |
| GUARD-06 | Phase 1 | Pending |
| GUARD-07 | Phase 1 | Pending |
| CORE-01 | Phase 1 | Pending |
| CORE-02 | Phase 1 | Pending |
| CORE-03 | Phase 1 | Pending |
| TEST-01 | Phase 1 | Pending |
| LLM-01 | Phase 2 | Pending |
| LLM-02 | Phase 2 | Pending |
| LLM-03 | Phase 2 | Pending |
| ORCH-01 | Phase 2 | Pending |
| ORCH-02 | Phase 2 | Pending |
| ORCH-03 | Phase 2 | Pending |
| ORCH-04 | Phase 2 | Pending |
| ORCH-05 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |
| PAY-01 | Phase 3 | Pending |
| PAY-02 | Phase 3 | Pending |
| PAY-03 | Phase 3 | Pending |
| PAY-04 | Phase 3 | Pending |
| HW-01 | Phase 4 | Pending |
| HW-02 | Phase 4 | Pending |
| HW-03 | Phase 4 | Pending |
| FE-01 | Phase 5 | Pending |
| FE-02 | Phase 5 | Pending |
| FE-03 | Phase 5 | Pending |
| FE-04 | Phase 5 | Pending |
| FE-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-15*
*Last updated: 2026-10-15 after initial definition*
