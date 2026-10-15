---
phase: "2"
slug: "dual-model-llm-client-multi-lot-orchestrator"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-15"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest >= 8.2.0 |
| **Config file** | default pytest runner |
| **Quick run command** | `python3 -m pytest backend/tests/test_live_smoke.py -q` |
| **Full suite command** | `python3 -m pytest backend/tests/ -v` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `python3 -m pytest backend/tests/test_live_smoke.py -q`
- **After every plan wave:** Run `python3 -m pytest backend/tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LLM-03 | T-02-01 | Mathematical concession step calculation | unit | `python3 -c "from backend.llm_client import deterministic_fallback_move"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | LLM-01 | T-02-02 | Dual-model selection and concurrency semaphore | unit | `python3 -c "from backend.llm_client import call_agent_llm"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | GUARD-06 | T-02-03 | Memory-isolated prompts prevent budget leakage | unit | `python3 -c "from backend.llm_client import build_lot_prompts"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | ORCH-01 | T-02-04 | Distance filter skips lots beyond max distance | integration | `python3 -c "from backend.orchestrator import run_multi_lot_negotiation"` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | ORCH-03 | T-02-05 | 3-round bilateral state machine execution | integration | `python3 -c "from backend.orchestrator import negotiate_with_single_lot"` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | ORCH-05 | T-02-06 | Atomic slot soft-lock upon agreement | integration | `python3 -c "from backend.db import acquire_soft_lock"` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | TEST-02 | T-02-07 | End-to-end smoke test verifies complete flow | smoke | `python3 -m pytest backend/tests/test_live_smoke.py -v` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | TEST-02 | T-02-08 | Offline replay fixture golden_runs.json valid | file | `python3 -c "import json; json.load(open('frontend/public/golden_runs.json'))"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/llm_client.py`
- [ ] `backend/orchestrator.py`
- [ ] `backend/tests/test_live_smoke.py`
- [ ] `frontend/public/golden_runs.json`

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-15
