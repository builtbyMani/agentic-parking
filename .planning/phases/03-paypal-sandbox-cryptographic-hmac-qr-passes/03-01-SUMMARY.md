# Phase 3 Plan 01: Summary

**Plan:** 03-01 (Wave 1)
**Status:** Completed
**Date:** 2026-10-15

## Summary

Implemented the zero-LLM payment boundary, currency conversion, payment providers, and HMAC-SHA256 signed QR access pass generator and verifier in `backend/payments.py`.

### Key Deliverables

1. **Deterministic Currency Conversion:**
   - `paise_to_usd_cents(total_paise: int) -> int`: Converts paise to USD cents based on `USD_TO_INR_PAISE = 8400` with `max(1, round((total_paise * 100) / 8400))`.
   - `cents_to_usd_str(usd_cents: int) -> str`: Formats integer cents into standard USD string (e.g. 136 -> "1.36").

2. **Payment Providers:**
   - `PayPalSandboxProvider`: Connects to `https://api-m.sandbox.paypal.com/v2/checkout/orders` with OAuth2 client credentials, sets `intent="CAPTURE"` and application context return/cancel URLs, and extracts the PayPal approval URL.
   - `MockPaymentProvider`: Resilient offline/demo fallback generating mock order IDs and simulated local approval URLs.
   - `get_payment_provider()`: Auto-selects mock provider when `PAYMENT_MODE="mock"` or sandbox credentials are unset.

3. **Cryptographic Access Passes:**
   - `generate_signed_qr_token(booking_id, lot_id, slot_id, plate, valid_hours) -> str`: Generates URL-safe base64 compact JSON payload (`bid`, `lot`, `slot`, `ph` sha256 hash, and `exp` unix timestamp) signed with a 16-hex-char HMAC-SHA256 token using `HMAC_SECRET_KEY`.
   - `verify_signed_qr_token(token) -> Tuple[bool, Union[dict, str]]`: Validates signature using timing-safe `hmac.compare_digest()`, checks timestamp expiration against `time.time()`, and decodes access permissions.

## Verification

- `paise_to_usd_cents(11400) == 136` and `cents_to_usd_str(136) == "1.36"`.
- `generate_signed_qr_token` and `verify_signed_qr_token` pass roundtrip verification with authentic tokens.
- Tampered signature (`tok + 'x'`) rejected with `Invalid HMAC signature`.
- Mock payment provider generates valid order structure with `$1.36` display.
