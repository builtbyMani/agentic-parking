---
phase: "3"
slug: "paypal-sandbox-cryptographic-hmac-qr-passes"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-15"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest >= 8.2.0 |
| **Config file** | default pytest runner |
| **Quick run command** | `python3 -m pytest backend/tests/test_payments.py -q` |
| **Full suite command** | `python3 -m pytest backend/tests/ -v` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `python3 -m pytest backend/tests/test_payments.py -q`
- **After every plan wave:** Run `python3 -m pytest backend/tests/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PAY-01 | T-03-01 | Integer paise converts to USD cents | unit | `python3 -c "from backend.payments import paise_to_usd_cents; assert paise_to_usd_cents(11400) == 136"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PAY-02 | T-03-02 | Payment provider handles checkout orders | unit | `python3 -c "from backend.payments import get_payment_provider"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | PAY-03 | T-03-03 | Generates URL-safe HMAC-SHA256 signed QR pass | unit | `python3 -c "from backend.payments import generate_signed_qr_token"` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | PAY-04 | T-03-04 | Cryptographic verification rejects invalid passes | unit | `python3 -c "from backend.payments import verify_signed_qr_token"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | PAY-01..04 | T-03-05 | Full automated test suite for payments & QR | integration | `python3 -m pytest backend/tests/test_payments.py -v` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/payments.py`
- [ ] `backend/tests/test_payments.py`

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
