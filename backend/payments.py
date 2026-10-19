import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from typing import Any, Dict, Optional, Tuple, Union

import httpx

from backend.config import (
    USD_TO_INR_PAISE,
    HMAC_SECRET_KEY,
    PAYMENT_MODE,
    PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET,
    PAYPAL_ENV,
    BACKEND_URL,
)


def paise_to_usd_cents(total_paise: int) -> int:
    """Converts integer paise to USD cents using USD_TO_INR_PAISE (8400 paise = 100 cents)."""
    return max(1, round((total_paise * 100) / USD_TO_INR_PAISE))


def cents_to_usd_str(usd_cents: int) -> str:
    """Formats integer USD cents as standard 2-decimal USD string (e.g. 136 -> '1.36')."""
    return f"{usd_cents / 100:.2f}"


class PayPalSandboxProvider:
    BASE_URL = "https://api-m.sandbox.paypal.com"

    async def get_access_token(self) -> str:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{self.BASE_URL}/v1/oauth2/token",
                data={"grant_type": "client_credentials"},
                auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
                headers={
                    "Accept": "application/json",
                    "Accept-Language": "en_US",
                },
            )
            resp.raise_for_status()
            return resp.json()["access_token"]

    async def create_order(self, booking_id: str, total_paise: int) -> dict:
        usd_cents = paise_to_usd_cents(total_paise)
        usd_value = cents_to_usd_str(usd_cents)
        token = await self.get_access_token()
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": booking_id,
                    "description": f"Parking Reservation {booking_id}",
                    "amount": {
                        "currency_code": "USD",
                        "value": usd_value,
                    },
                }
            ],
            "application_context": {
                "brand_name": "Agentic Parking Gate",
                "landing_page": "NO_PREFERENCE",
                "user_action": "PAY_NOW",
                "return_url": f"{BACKEND_URL}/api/paypal-return?booking_id={booking_id}",
                "cancel_url": f"{BACKEND_URL}/api/paypal-cancel?booking_id={booking_id}",
            },
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{self.BASE_URL}/v2/checkout/orders",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            approve_url = None
            for link in data.get("links", []):
                if link.get("rel") == "approve":
                    approve_url = link.get("href")
                    break
            return {
                "provider": "PAYPAL_SANDBOX",
                "order_id": data.get("id"),
                "usd_cents": usd_cents,
                "usd_display": f"${usd_value}",
                "approve_url": approve_url,
            }

    async def capture_order(self, order_id: str) -> dict:
        token = await self.get_access_token()
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{self.BASE_URL}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            return resp.json()


# Registry of order ids actually issued by the mock provider in this process.
# capture_order only approves ids from this set, so fabricated order ids
# (e.g. "FAKE_ORDER_999") are rejected exactly like an unapproved PayPal order.
_MOCK_ISSUED_ORDER_IDS: set = set()


class MockPaymentProvider:
    async def create_order(self, booking_id: str, total_paise: int) -> dict:
        usd_cents = paise_to_usd_cents(total_paise)
        usd_value = cents_to_usd_str(usd_cents)
        order_id = f"MOCK-ORD-{uuid.uuid4().hex[:8].upper()}"
        _MOCK_ISSUED_ORDER_IDS.add(order_id)
        approve_url = f"{BACKEND_URL}/api/mock-paypal-approve?order_id={order_id}&booking_id={booking_id}"
        return {
            "provider": "MOCK",
            "order_id": order_id,
            "usd_cents": usd_cents,
            "usd_display": f"${usd_value}",
            "approve_url": approve_url,
        }

    async def capture_order(self, order_id: str) -> dict:
        if order_id not in _MOCK_ISSUED_ORDER_IDS:
            return {
                "status": "FAILED",
                "order_id": order_id,
                "provider": "MOCK",
                "reason": "Unknown order id: no such mock order was issued by this provider",
            }
        return {
            "status": "COMPLETED",
            "order_id": order_id,
            "provider": "MOCK",
        }


def get_payment_provider(
    mode: Optional[str] = None,
) -> Union[PayPalSandboxProvider, MockPaymentProvider]:
    active_mode = mode or os.environ.get("PAYMENT_MODE", PAYMENT_MODE)
    client_id = os.environ.get("PAYPAL_CLIENT_ID", PAYPAL_CLIENT_ID)
    client_secret = os.environ.get("PAYPAL_CLIENT_SECRET", PAYPAL_CLIENT_SECRET)
    if (
        active_mode == "mock"
        or not client_id
        or client_id == "dummy_sandbox_client_id"
        or not client_secret
    ):
        return MockPaymentProvider()
    return PayPalSandboxProvider()


def generate_signed_qr_token(
    booking_id: str, lot_id: str, slot_id: str, plate: str, valid_hours: int
) -> str:
    """Generates an HMAC-SHA256 signed URL-safe base64 QR token containing reservation details."""
    payload = {
        "bid": booking_id,
        "lot": lot_id,
        "slot": slot_id,
        "ph": hashlib.sha256(plate.strip().upper().encode("utf-8")).hexdigest()[:10],
        "exp": int(time.time()) + (valid_hours * 3600),
    }
    raw_bytes = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    b64_body = base64.urlsafe_b64encode(raw_bytes).decode("ascii").rstrip("=")
    sig = hmac.new(
        HMAC_SECRET_KEY.encode("utf-8"), b64_body.encode("ascii"), hashlib.sha256
    ).hexdigest()[:16]
    return f"{b64_body}.{sig}"


def verify_signed_qr_token(token: str) -> Tuple[bool, Union[Dict[str, Any], str]]:
    """Verifies HMAC signature, expiry, and decodes payload from a signed QR token."""
    if not token or not isinstance(token, str) or "." not in token:
        return False, "Malformed token format"
    parts = token.split(".")
    if len(parts) != 2:
        return False, "Malformed token structure"
    b64_body, sig = parts
    expected_sig = hmac.new(
        HMAC_SECRET_KEY.encode("utf-8"), b64_body.encode("ascii"), hashlib.sha256
    ).hexdigest()[:16]
    if not hmac.compare_digest(sig, expected_sig):
        return False, "Invalid HMAC signature (tampered QR)"
    try:
        padding = len(b64_body) % 4
        padded_b64 = b64_body + ("=" * (4 - padding) if padding else "")
        raw_bytes = base64.urlsafe_b64decode(padded_b64.encode("ascii"))
        data = json.loads(raw_bytes.decode("utf-8"))
    except Exception as e:
        return False, f"Malformed token payload: {e}"

    if not isinstance(data, dict) or "exp" not in data:
        return False, "Invalid token payload schema"

    if int(time.time()) > data["exp"]:
        return False, "QR pass expired"

    return True, data
