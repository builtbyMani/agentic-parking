# Phase 3: PayPal Sandbox & Cryptographic HMAC QR Passes - Context

**Gathered:** 2026-10-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the zero-LLM payment boundary and the cryptographic access pass infrastructure in `backend/payments.py`. This includes deterministic conversion of integer paise to USD cents using `USD_TO_INR_PAISE = 8400`, PayPal Sandbox v2 checkout order creation with approval URL retrieval, capture handling, mock fallback provider, and tamper-proof HMAC-SHA256 signed URL-safe QR access pass generation and verification.

</domain>

<decisions>
## Implementation Decisions

### Zero-LLM Payment Boundary (Anti-Hallucination Barrier 7)
- **D-01:** Currency conversion: All internal storage is strictly integer paise. Python computes:
  `usd_cents = max(1, round((total_paise * 100) / USD_TO_INR_PAISE))`
  `usd_value = f"{usd_cents / 100:.2f}"`
- **D-02:** Zero LLM involvement: LLMs are never asked to calculate monetary totals, taxes, or exchange rates.

### PayPal Sandbox v2 & Mock Provider
- **D-03:** `PayPalSandboxProvider`: Connects to `https://api-m.sandbox.paypal.com`. Requests OAuth2 bearer token via client credentials, creates checkout orders with `intent="CAPTURE"` in USD, and extracts the `approve` URL.
- **D-04:** `MockPaymentProvider`: Activates when `PAYMENT_MODE == "mock"` or when sandbox credentials are dummy/missing. Returns instantaneous simulated order approval for offline hackathon resiliency.

### Cryptographic Signed HMAC QR Passes
- **D-05:** Pass structure: `{b64_body}.{sig}` where `b64_body` is URL-safe base64 encoded compact JSON payload:
  `{"bid": booking_id, "lot": lot_id, "slot": slot_id, "ph": sha256(plate)[:10], "exp": unix_timestamp}`
- **D-06:** Signature: `hmac.new(HMAC_SECRET_KEY, b64_body, hashlib.sha256).hexdigest()[:16]`
- **D-07:** Deterministic verification: Compares signature with `hmac.compare_digest()`, rejects tampered bodies, and rejects expired passes (`time.time() > exp`).

### Test Coverage
- **D-08:** `backend/tests/test_payments.py` comprehensively verifies FX math, order generation, valid QR passes, tampered payloads, tampered signatures, and expired timestamps.

</decisions>

<canonical_refs>
## Canonical References

### Specification
- User Specification §1: Barrier 7 (Payment Total Hallucination)
- User Specification §3: Step 7 (Payment Provider & HMAC QR Pass)

</canonical_refs>

<specifics>
## Specific Ideas

- PayPal Sandbox label on UI: "Approve ₹114.00 ($1.36 USD Sandbox Demo Rate)".
- Plate number is hashed with SHA-256 (first 10 chars) so the driver's full license plate is not openly visible in raw QR text.

</specifics>

<deferred>
## Deferred Ideas

- Webcam QR scanning with OpenCV and ESP32 physical servo trigger — Phase 4
- Frontend checkout approval button and QR display modal — Phase 5

</deferred>

---
*Phase: 03-paypal-sandbox-cryptographic-hmac-qr-passes*
*Context gathered: 2026-10-15*
