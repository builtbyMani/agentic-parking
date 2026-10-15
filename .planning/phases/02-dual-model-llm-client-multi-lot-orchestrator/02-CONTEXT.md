# Phase 2: Dual-Model LLM Client & Multi-Lot Orchestrator - Context

**Gathered:** 2026-10-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the LLM client layer and the multi-lot negotiation orchestrator. Driver agent uses `gemini-2.5-flash` while Lot agents use `gemini-2.5-flash-lite`, bound by an `asyncio.Semaphore(2)` and backed by a deterministic concession fallback engine. The orchestrator coordinates a 5-step bilateral negotiation across competing lots with distance pre-filtering, 3 structured rounds, utility-based scoring, atomic SQLite slot soft-locking (180s), and event emission. Live smoke runs capture latency metrics and export `frontend/public/golden_runs.json` for offline replay.

</domain>

<decisions>
## Implementation Decisions

### Dual-Bucket Model Allocation & Concurrency
- **D-01:** Driver agent calls `gemini-2.5-flash` (own RPM quota).
- **D-02:** Lot agents call `gemini-2.5-flash-lite` (independent RPM quota).
- **D-03:** Concurrency limit: `asyncio.Semaphore(2)` prevents quota starvation on free-tier API keys.
- **D-04:** Deterministic concession fallback: If Gemini times out (6.0s) or hits 429 quota exhaustion, `deterministic_fallback_move()` steps mathematical concession towards policy floor / budget without failing the negotiation.
- **D-05:** `LLM_MODE` toggle supports `gemini`, `mock_adversarial`, and `fallback_only` for zero-API-key testing and demonstrations.

### Memory Isolation (Anti-Hallucination Barrier 6)
- **D-06:** `build_lot_prompts()` accepts only `LotPolicy`, `hours`, `prepay`, `round_num`, and `history_lines`. Never receives `DriverConstraints.max_budget_per_hour_paise`.
- **D-07:** `build_driver_prompts()` marks `max_budget_per_hour_paise` as private and instructs driver never to reveal it.

### Multi-Lot Orchestrator State Machine
- **D-08:** Step 0 — Distance Filter: Skip lots beyond `driver.max_walk_distance_m`, emit `LOT_SKIPPED` event.
- **D-09:** Step 1 — Opening REQUEST: Deterministic anchor calculated as `min(list_paise * 0.72, budget_paise * 0.80)` rounded to nearest 100 paise.
- **D-10:** Step 2 — 3 Rounds: Executed via `asyncio.gather` across all eligible lots concurrently.
  - Round 1: Lot OFFER → Driver COUNTER.
  - Round 2: Lot COUNTER → Driver COUNTER.
  - Round 3: Lot Best & Final COUNTER.
- **D-11:** Step 3 — Deterministic Winner Evaluation:
  - Filter out lots exceeding driver budget.
  - Compute `Score_paise = (rate_paise * hours) + (distance_m * walk_penalty_paise_per_m * hours)`.
  - Lowest score wins.
- **D-12:** Step 4 — Soft-Lock & Settlement Signal:
  - Atomically acquire 180s soft-lock on winning lot slot (`acquire_soft_lock`).
  - Emit `ACCEPT` to winner, `WALK_AWAY` to losing lots.
  - Create `BookingRecord` in SQLite with status `PENDING_PAYMENT`.

### Offline Golden Runs Fixture
- **D-13:** Export successful negotiation trace to `frontend/public/golden_runs.json` with realistic latencies, messages, and clamp events to guarantee offline hackathon resiliency.

</decisions>

<canonical_refs>
## Canonical References

### Specification
- User Specification §1: Barriers 5 (Action Type), 6 (Context Leakage), and 7 (Payment Arithmetic)
- User Specification §3: Step 4 (Dual-Bucket Gemini Client & Deterministic Fallback)
- User Specification §3: Step 5 (Multi-Lot Negotiation Orchestrator)

</canonical_refs>

<specifics>
## Specific Ideas

- Live turns should emit events to an event callback or queue so WebSocket can stream in Phase 4.
- `golden_runs.json` contains complete turn-by-turn timeline including guard clamp triggers and reasoning.

</specifics>

<deferred>
## Deferred Ideas

- PayPal Sandbox checkout order capture — Phase 3
- OpenCV camera vision gate & ESP32 serial bridge — Phase 4
- Vite React frontend dashboard and theater — Phase 5

</deferred>

---
*Phase: 02-dual-model-llm-client-multi-lot-orchestrator*
*Context gathered: 2026-10-15*
