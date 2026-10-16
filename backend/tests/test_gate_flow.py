import time
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.db import create_booking, get_slots, init_db
from backend.schemas import BookingRecord
from backend.payments import generate_signed_qr_token
from backend.serial_bridge import bridge


import asyncio
from unittest.mock import patch


@pytest.fixture(autouse=True)
def isolated_test_db(tmp_path):
    """Ensures test_gate_flow runs on an isolated temporary SQLite database."""
    test_db = str(tmp_path / "test_parking.db")
    with patch("backend.config.DB_PATH", test_db), \
         patch("backend.db.DB_PATH", test_db), \
         patch("backend.orchestrator.DB_PATH", test_db), \
         patch("backend.serial_bridge.DB_PATH", test_db):
        asyncio.run(init_db(test_db))
        yield test_db


def test_rest_root_and_metadata():
    with TestClient(app) as client:
        res = client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        assert "gate_state" in data

        res_lots = client.get("/api/lots")
        assert res_lots.status_code == 200
        lots = res_lots.json()
        assert len(lots) == 3

        res_slots = client.get("/api/slots")
        assert res_slots.status_code == 200
        slots = res_slots.json()
        assert len(slots) >= 6

        res_lot_a_slots = client.get("/api/slots?lot_id=LOT_A")
        assert res_lot_a_slots.status_code == 200
        for s in res_lot_a_slots.json():
            assert s["lot_id"] == "LOT_A"


def test_qr_gate_verification_flow():
    with TestClient(app) as client:
        # 1. Valid authentic token
        valid_token = generate_signed_qr_token(
            booking_id="bk_gate_flow_1",
            lot_id="LOT_A",
            slot_id="A-01",
            plate="KA-01-MJ-2026",
            valid_hours=2,
        )
        res = client.post("/api/gate/verify-qr", json={"qr_token": valid_token})
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is True
        assert data["status"] == "ACCESS_GRANTED"
        assert data["pass_data"]["slot"] == "A-01"

        # 2. Tampered token
        tampered_token = valid_token + "tampered"
        res_bad = client.post("/api/gate/verify-qr", json={"qr_token": tampered_token})
        assert res_bad.status_code == 200
        data_bad = res_bad.json()
        assert data_bad["valid"] is False
        assert data_bad["status"] == "ACCESS_DENIED"


def test_slot_toggle_sensor_telemetry():
    with TestClient(app) as client:
        # Simulate physical IR sensor detecting vehicle
        res_occ = client.post(
            "/api/hardware/toggle-slot",
            json={"slot_id": "A-01", "occupied": True},
        )
        assert res_occ.status_code == 200
        slots_after_occ = client.get("/api/slots?lot_id=LOT_A").json()
        slot_a01 = next(s for s in slots_after_occ if s["slot_id"] == "A-01")
        assert slot_a01["sensor_occupied"] == 1

        # Simulate vehicle leaving
        res_vac = client.post(
            "/api/hardware/toggle-slot",
            json={"slot_id": "A-01", "occupied": False},
        )
        assert res_vac.status_code == 200
        slots_after_vac = client.get("/api/slots?lot_id=LOT_A").json()
        slot_a01_vac = next(s for s in slots_after_vac if s["slot_id"] == "A-01")
        assert slot_a01_vac["sensor_occupied"] == 0


import uuid

def test_full_checkout_and_confirmation_lifecycle():
    # 1. Pre-seed a winning booking in SQLite
    bk_id = f"bk_lifecycle_{uuid.uuid4().hex[:8]}"
    booking = BookingRecord(
        booking_id=bk_id,
        negotiation_id="neg_123",
        lot_id="LOT_A",
        slot_id="A-02",
        plate_number="KA-05-AB-1234",
        hours=3,
        agreed_rate_paise=3800,
        total_paise=11400,
        usd_cents=136,
        status="PENDING_PAYMENT",
        created_at=int(time.time()),
    )
    asyncio.run(create_booking(booking))

    from backend.payments import MockPaymentProvider
    with TestClient(app) as client:
        with patch("backend.main.get_payment_provider", return_value=MockPaymentProvider()):
            # 2. Create Checkout Order
            res_chk = client.post(f"/api/bookings/{bk_id}/checkout")
            assert res_chk.status_code == 200
            chk_data = res_chk.json()
            assert chk_data["usd_cents"] == 136
            order_id = chk_data["order_id"]

            # 3. Confirm payment
            res_conf = client.post(
                f"/api/bookings/{bk_id}/confirm",
                json={"order_id": order_id},
            )
            assert res_conf.status_code == 200
            conf_data = res_conf.json()
            assert conf_data["status"] == "CONFIRMED"
            qr_token = conf_data["qr_token"]
            assert qr_token is not None

            # 4. Verify gate opens with the confirmed booking QR token
            res_gate = client.post("/api/gate/verify-qr", json={"qr_token": qr_token})
            assert res_gate.status_code == 200
            gate_data = res_gate.json()
            assert gate_data["valid"] is True
            assert gate_data["status"] in ["ACCESS_GRANTED", "COOLDOWN_ACTIVE"]


def test_api_negotiate_endpoint():
    with TestClient(app) as client:
        payload = {
            "max_budget_per_hour_paise": 3800,
            "max_walk_distance_m": 400,
            "hours": 3,
            "prepay": True,
            "walk_penalty_paise_per_m": 2,
        }
        res = client.post("/api/negotiate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "negotiating"
        assert data["driver"]["max_budget_per_hour_paise"] == 3800


def test_empty_confirm_body_rejected_without_order_id():
    """Proves that /confirm cannot be bypassed with an empty body — payment is a mandatory precondition."""
    bk_id = f"bk_empty_{uuid.uuid4().hex[:8]}"
    booking = BookingRecord(
        booking_id=bk_id,
        negotiation_id="neg_empty",
        lot_id="LOT_B",
        slot_id="B-01",
        plate_number="KA-05-XY-9999",
        hours=2,
        agreed_rate_paise=3500,
        total_paise=7000,
        usd_cents=83,
        status="PENDING_PAYMENT",
        created_at=int(time.time()),
    )
    asyncio.run(create_booking(booking))

    with TestClient(app) as client:
        # 1. Attempt to confirm with an empty body
        res = client.post(f"/api/bookings/{bk_id}/confirm", json={})
        assert res.status_code == 400
        assert "Missing required order_id" in res.json()["detail"]

        # 2. Verify that slot remains unconfirmed
        slots = client.get("/api/slots?lot_id=LOT_B").json()
        slot_b01 = next(s for s in slots if s["slot_id"] == "B-01")
        assert slot_b01["booking_status"] != "CONFIRMED"


def test_failed_or_unapproved_capture_rejected():
    """Proves that a failed capture returns 402 and denies the gate pass."""
    bk_id = f"bk_failed_{uuid.uuid4().hex[:8]}"
    booking = BookingRecord(
        booking_id=bk_id,
        negotiation_id="neg_fail",
        lot_id="LOT_C",
        slot_id="C-01",
        plate_number="KA-05-ZZ-1111",
        hours=1,
        agreed_rate_paise=3200,
        total_paise=3200,
        usd_cents=38,
        status="PENDING_PAYMENT",
        created_at=int(time.time()),
    )
    asyncio.run(create_booking(booking))

    from unittest.mock import patch, AsyncMock
    with TestClient(app) as client:
        # Mock capture_order to simulate unapproved buyer or PayPal network failure
        with patch("backend.main.get_payment_provider") as mock_prov:
            instance = mock_prov.return_value
            instance.capture_order = AsyncMock(return_value={"status": "FAILED"})
            res = client.post(
                f"/api/bookings/{bk_id}/confirm",
                json={"order_id": "ORD-FAILED-123"},
            )
            assert res.status_code == 402
            assert "Gate pass denied" in res.json()["detail"]


def test_paypal_return_and_cancel_endpoints():
    """Verifies that PayPal redirect return landing captures payment and issues pass, and cancel landing functions."""
    bk_id = f"bk_return_{uuid.uuid4().hex[:8]}"
    booking = BookingRecord(
        booking_id=bk_id,
        negotiation_id="neg_ret",
        lot_id="LOT_A",
        slot_id="A-01",
        plate_number="KA-05-RT-8888",
        hours=2,
        agreed_rate_paise=3800,
        total_paise=7600,
        usd_cents=90,
        status="PENDING_PAYMENT",
        created_at=int(time.time()),
    )
    asyncio.run(create_booking(booking))

    from backend.payments import MockPaymentProvider
    with TestClient(app) as client:
        with patch("backend.main.get_payment_provider", return_value=MockPaymentProvider()):
            # 1. PayPal Return callback with valid mock token
            res_ret = client.get(f"/api/paypal-return?booking_id={bk_id}&token=ORD-RETURN-TEST")
            assert res_ret.status_code == 200
            assert "PAYMENT CAPTURED &amp; VERIFIED" in res_ret.text
            assert "Reservation Confirmed!" in res_ret.text

            # Verify DB is now CONFIRMED
            slots = client.get("/api/slots?lot_id=LOT_A").json()
            slot_a01 = next(s for s in slots if s["slot_id"] == "A-01")
            assert slot_a01["booking_status"] == "CONFIRMED"

        # 2. PayPal Cancel callback
        res_can = client.get(f"/api/paypal-cancel?booking_id={bk_id}")
        assert res_can.status_code == 200
        assert "CHECKOUT CANCELLED" in res_can.text

