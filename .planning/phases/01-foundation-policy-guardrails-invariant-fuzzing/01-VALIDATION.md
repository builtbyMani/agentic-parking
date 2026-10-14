---
phase: "1"
slug: "foundation-policy-guardrails-invariant-fuzzing"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-15"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest >= 8.2.0 |
| **Config file** | pyproject.toml / pytest.ini (or default pytest runner) |
| **Quick run command** | `pytest backend/tests/test_invariants.py -q` |
| **Full suite command** | `pytest backend/tests/test_invariants.py -v` |
| **Estimated runtime** | ~0.05 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pytest backend/tests/test_invariants.py -q`
- **After every plan wave:** Run `pytest backend/tests/test_invariants.py -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CORE-01 | T-01-01 | Integer paise currency constants loaded | unit | `python3 -c "from backend.config import USD_TO_INR_PAISE; assert USD_TO_INR_PAISE == 8400"` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | GUARD-01 | T-01-02 | Schema rejects float drift and invalid types | unit | `python3 -c "from backend.schemas import AgentMoveLLM; move = AgentMoveLLM(action='OFFER', price_per_hour_paise=3500, message='Test', reasoning='Test')"` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | CORE-02 | T-01-03 | SQLite database creates tables & soft-locks | integration | `python3 -c "import asyncio; from backend.db import init_db; asyncio.run(init_db(':memory:'))"` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | CORE-03 | T-01-04 | Pricing engine rounds prepay discount to ₹1 | unit | `python3 -c "from backend.pricing_engine import compute_effective_lot_floor_paise"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | GUARD-02 | T-01-05 | PolicyGuard clamps lot offers to floor | unit | `python3 -c "from backend.policy_guard import enforce_lot_guard"` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | GUARD-03 | T-01-06 | PolicyGuard clamps driver bids to budget | unit | `python3 -c "from backend.policy_guard import enforce_driver_guard"` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 2 | GUARD-04 | T-01-07 | Regex prose sanitizer updates message text | unit | `python3 -c "from backend.policy_guard import sanitize_message_prices"` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 3 | TEST-01 | T-01-08 | 50-run adversarial chaos fuzzing suite | fuzz | `pytest backend/tests/test_invariants.py -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `requirements.txt` — install pytest, pydantic, aiosqlite
- [ ] `backend/tests/__init__.py` — test package marker
- [ ] `backend/tests/test_invariants.py` — test assertions

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-15
