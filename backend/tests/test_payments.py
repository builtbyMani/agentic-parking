import hashlib
import pytest
from backend.payments import (
    paise_to_usd_cents,
    cents_to_usd_str,
    MockPaymentProvider,
    get_payment_provider,
    generate_signed_qr_token,
    verify_signed_qr_token,
)


def test_currency_conversion():
    # 8400 paise = 84 INR = 1 USD = 100 cents
    assert paise_to_usd_cents(8400) == 100
    assert cents_to_usd_str(100) == "1.00"

    # 11400 paise = 114 INR -> 114 / 84 = 1.3571... -> 136 cents ($1.36)
    assert paise_to_usd_cents(11400) == 136
    assert cents_to_usd_str(136) == "1.36"

    # 3500 paise = 35 INR -> 35 / 84 = 0.4166... -> 42 cents ($0.42)
    assert paise_to_usd_cents(3500) == 42
    assert cents_to_usd_str(42) == "0.42"

    # Zero or negative floor guard -> minimum 1 cent
    assert paise_to_usd_cents(0) == 1
    assert cents_to_usd_str(1) == "0.01"


@pytest.mark.asyncio
async def test_mock_payment_provider():
    provider = get_payment_provider(mode="mock")
    assert isinstance(provider, MockPaymentProvider)

    # Order creation
    order = await provider.create_order("bk_test_999", 11400)
    assert order["provider"] == "MOCK"
    assert order["order_id"].startswith("MOCK-ORD-")
    assert order["usd_cents"] == 136
    assert order["usd_display"] == "$1.36"
    assert "mock-paypal-approve" in order["approve_url"]
    assert "bk_test_999" in order["approve_url"]

    # Order capture
    capture = await provider.capture_order(order["order_id"])
    assert capture["status"] == "COMPLETED"
    assert capture["order_id"] == order["order_id"]


@pytest.mark.asyncio
async def test_live_paypal_sandbox_provider_if_configured():
    provider = get_payment_provider()
    # If the user has configured live sandbox credentials in .env, test live order creation
    if isinstance(provider, MockPaymentProvider):
        return
    order = await provider.create_order("bk_live_test", 11400)
    assert order["provider"] == "PAYPAL_SANDBOX"
    assert order["usd_cents"] == 136
    assert order["approve_url"] is not None
    assert "sandbox.paypal.com" in order["approve_url"]


def test_hmac_qr_lifecycle():
    plate = "KA-01-MJ-2026"
    tok = generate_signed_qr_token(
        booking_id="bk_123",
        lot_id="LOT_A",
        slot_id="A-01",
        plate=plate,
        valid_hours=3,
    )
    assert "." in tok
    b64_body, sig = tok.split(".")
    assert len(sig) == 16

    # 1. Genuine token verification
    ok, data = verify_signed_qr_token(tok)
    assert ok is True
    assert isinstance(data, dict)
    assert data["bid"] == "bk_123"
    assert data["lot"] == "LOT_A"
    assert data["slot"] == "A-01"
    expected_ph = hashlib.sha256(plate.encode("utf-8")).hexdigest()[:10]
    assert data["ph"] == expected_ph
    assert data["exp"] > 0

    # 2. Tampered signature
    tampered_sig = tok[:-1] + ("0" if tok[-1] != "0" else "1")
    ok_sig, err_sig = verify_signed_qr_token(tampered_sig)
    assert ok_sig is False
    assert "Invalid HMAC signature" in err_sig

    # Appending garbage
    ok_ext, err_ext = verify_signed_qr_token(tok + "x")
    assert ok_ext is False
    assert "Invalid HMAC signature" in err_ext

    # 3. Tampered payload body
    tampered_body = ("a" if b64_body[0] != "a" else "b") + b64_body[1:] + "." + sig
    ok_body, err_body = verify_signed_qr_token(tampered_body)
    assert ok_body is False

    # 4. Expired token
    expired_tok = generate_signed_qr_token(
        booking_id="bk_exp",
        lot_id="LOT_B",
        slot_id="B-02",
        plate=plate,
        valid_hours=-1,  # Expired in past
    )
    ok_exp, err_exp = verify_signed_qr_token(expired_tok)
    assert ok_exp is False
    assert "QR pass expired" in err_exp

    # 5. Malformed tokens
    assert verify_signed_qr_token("")[0] is False
    assert verify_signed_qr_token("nodotsinthisstring")[0] is False
    assert verify_signed_qr_token("a.b.c")[0] is False
