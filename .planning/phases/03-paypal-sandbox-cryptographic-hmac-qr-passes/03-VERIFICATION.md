---
phase: 03-paypal-sandbox-cryptographic-hmac-qr-passes
verified_at: 2026-10-15
status: passed
score: 100/100
---

# Phase 3 Verification Report: PayPal Sandbox & Cryptographic HMAC QR Passes

## Executive Summary

Phase 3 implements the zero-LLM payment boundary, currency conversion, PayPal Sandbox checkout orders with mock fallback provider, and the tamper-proof HMAC-SHA256 signed QR pass lifecycle. All automated tests in `backend/tests/test_payments.py` passed with 100% coverage across currency conversions, mock orders, and token tamper/expiry detection.

---

## 1. Requirement Verification Table

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| **PAY-01** | Integer paise to USD cents conversion via deterministic Python arithmetic | PASS | `paise_to_usd_cents(11400) == 136` ($1.36); `paise_to_usd_cents(8400) == 100` ($1.00); 0 paise clamped to 1 cent |
| **PAY-02** | PayPal Sandbox v2 integration with OAuth2 client credentials and fallback | PASS | `PayPalSandboxProvider` targets `api-m.sandbox.paypal.com`; `MockPaymentProvider` returns simulated order with approval URL |
| **PAY-03** | HMAC-SHA256 signed URL-safe QR access pass generation | PASS | `generate_signed_qr_token` encodes compact JSON with booking ID, lot, slot, SHA-256 plate hash, and expiry into URL-safe base64 + 16-hex-char HMAC |
| **PAY-04** | Cryptographic verification & tamper detection | PASS | `verify_signed_qr_token` validates genuine tokens; rejects modified signatures, tampered payloads, expired timestamps, and malformed inputs |

---

## 2. Test Execution Details

- Command: `python3 -m pytest backend/tests/test_payments.py -v`
- Output:
  ```
  backend/tests/test_payments.py::test_currency_conversion PASSED [ 33%]
  backend/tests/test_payments.py::test_mock_payment_provider PASSED [ 66%]
  backend/tests/test_payments.py::test_hmac_qr_lifecycle PASSED [100%]
  3 passed in 1.25s
  ```
- Full Suite Command: `python3 -m pytest backend/tests/ -v`
- Suite Output: `8 passed in 1.79s` (100% pass across Phases 1, 2, and 3)

---

## 3. Anti-Hallucination Barrier 7 Compliance

- Zero LLM involvement in pricing: Python computes `total_paise = agreed_rate_paise * hours` and converts directly to USD cents.
- No float conversions or LLM-derived amounts are ever transmitted to PayPal or encoded into access passes.
