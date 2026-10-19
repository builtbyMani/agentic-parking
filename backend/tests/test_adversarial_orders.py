"""Adversarial regression tests: fabricated or foreign order ids must never
produce a gate pass — on /confirm, on /paypal-return, or via the mock
provider directly. Locks in the README's Step 4 security claim."""
import asyncio
import time
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.db import create_booking, get_booking, init_db
from backend.main import app
from backend.payments import MockPaymentProvider
from backend.schemas import BookingRecord


@pytest.fixture(autouse=True)
def isolated_test_db(tmp_path):
    """Ensures adversarial tests run on an isolated temporary SQLite database."""
    test_db = str(tmp_path / "test_parking_adv.db")
    with patch("backend.config.DB_PATH", test_db), \
         patch("backend.db.DB_PATH", test_db), \
         patch("backend.orchestrator.DB_PATH", test_db), \
         patch("backend.serial_bridge.DB_PATH", test_db):
        asyncio.run(init_db(test_db))
        yield test_db


def _make_booking(client, tag):
    bk_id = f"bk_adv_{tag}_{uuid.uuid4().hex[:8]}"
    booking = BookingRecord(
        booking_id=bk_id,
        negotiation_id="neg_adv",
        lot_id="LOT_A",
        slot_id="A-01",
        plate_number="KA-05-AD-0001",
        hours=1,
        agreed_rate_paise=3200,
        total_paise=3200,
        usd_cents=38,
        status="PENDING_PAYMENT",
        created_at=int(time.time()),
    )
    asyncio.run(create_booking(booking))
    return bk_id


def test_mock_provider_rejects_unissued_order_id():
    """The mock provider itself must not approve order ids it never issued."""
    provider = MockPaymentProvider()
    bad = asyncio.run(provider.capture_order("FAKE_ORDER_999"))
    assert bad["status"] == "FAILED"
    assert bad["provider"] == "MOCK"


def test_confirm_rejects_fake_order_id_readme_step4():
    """Mirrors README Step 4 verbatim: a fabricated order id gets HTTP 402."""
    with TestClient(app) as client:
        bk_id = _make_booking(client, "confirm")
        with patch("backend.main.get_payment_provider", return_value=MockPaymentProvider()):
            res = client.post(
                f"/api/bookings/{bk_id}/confirm",
                json={"order_id": "FAKE_ORDER_999"},
            )
            assert res.status_code == 402
            assert "Gate pass denied" in res.json()["detail"]

            # The booking itself must remain unconfirmed with no QR pass issued.
            booking_row = asyncio.run(get_booking(bk_id))
            assert booking_row["status"] != "CONFIRMED"
            assert not booking_row.get("qr_token")


def test_confirm_rejects_foreign_booking_order_id():
    """An order id issued for booking X must not confirm booking Y."""
    with TestClient(app) as client:
        bk_x = _make_booking(client, "x")
        bk_y = _make_booking(client, "y")
        with patch("backend.main.get_payment_provider", return_value=MockPaymentProvider()):
            order_x = client.post(f"/api/bookings/{bk_x}/checkout").json()["order_id"]
            client.post(f"/api/bookings/{bk_y}/checkout")
            res = client.post(
                f"/api/bookings/{bk_y}/confirm",
                json={"order_id": order_x},
            )
            assert res.status_code == 402
            assert "does not match" in res.json()["detail"]


def test_paypal_return_rejects_forged_token():
    """A forged token on the return landing must not issue a gate pass."""
    with TestClient(app) as client:
        bk_id = _make_booking(client, "return")
        with patch("backend.main.get_payment_provider", return_value=MockPaymentProvider()):
            client.post(f"/api/bookings/{bk_id}/checkout")
            res = client.get(f"/api/paypal-return?booking_id={bk_id}&token=FAKE_ORDER_999")
            assert res.status_code == 402
