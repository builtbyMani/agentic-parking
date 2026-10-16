import os
import json
import pytest
from backend.schemas import DriverConstraints, LotPolicy
from backend.db import init_db, get_lots, get_booking
from backend.orchestrator import run_multi_lot_negotiation

@pytest.mark.asyncio
async def test_end_to_end_negotiation(tmp_path):
    test_db = str(tmp_path / "smoke_test.db")
    await init_db(test_db)
    lots = await get_lots(test_db)
    assert len(lots) == 3

    # Driver max distance 400m excludes Lot B (500m)
    driver = DriverConstraints(
        max_budget_per_hour_paise=3800,
        max_walk_distance_m=400,
        hours=3,
        prepay=True,
    )

    events_captured = []
    async def capture_event(evt):
        events_captured.append(evt)

    result = await run_multi_lot_negotiation(
        driver=driver,
        lots=lots,
        plate_number="KA-01-MJ-2026",
        event_callback=capture_event,
        db_path=test_db,
    )

    # 1. Verification of results
    assert result["status"] == "ACCEPTED"
    assert result["winner_lot_id"] in ["LOT_A", "LOT_C"]
    assert result["agreed_rate_paise"] <= 3800
    assert result["winning_slot_id"] is not None
    assert result["total_paise"] == result["agreed_rate_paise"] * 3
    assert result["usd_cents"] > 0

    # 2. Database verification
    booking = await get_booking(result["booking_id"], db_path=test_db)
    assert booking is not None
    assert booking["status"] == "PENDING_PAYMENT"
    assert booking["plate_number"] == "KA-01-MJ-2026"

    # 3. Events trace verification
    event_types = [e["event_type"] for e in events_captured]
    assert "NEGOTIATION_STARTED" in event_types
    assert "LOT_SKIPPED" in event_types
    assert "REQUEST" in event_types
    assert "OFFER" in event_types
    assert "COUNTER" in event_types
    assert "ACCEPT" in event_types
    assert "WALK_AWAY" in event_types

    # Ensure Lot B was skipped due to 500m distance > 400m
    skipped_events = [e for e in events_captured if e["event_type"] == "LOT_SKIPPED"]
    assert any(s["data"]["lot_id"] == "LOT_B" for s in skipped_events)

@pytest.mark.asyncio
async def test_generate_golden_runs_fixture(tmp_path):
    """
    Generates a high-fidelity golden run trace and writes to frontend/public/golden_runs.json
    so that frontend live demos never freeze or fail if internet or quotas are unavailable.
    """
    test_db = str(tmp_path / "fixture_test.db")
    await init_db(test_db)
    lots = await get_lots(test_db)

    driver = DriverConstraints(
        max_budget_per_hour_paise=3800,
        max_walk_distance_m=400,
        hours=3,
        prepay=True,
    )

    events_captured = []
    async def capture_event(evt):
        events_captured.append(evt)

    result = await run_multi_lot_negotiation(
        driver=driver,
        lots=lots,
        plate_number="KA-01-MJ-2026",
        event_callback=capture_event,
        db_path=test_db,
    )

    golden_data = {
        "negotiation_id": result["negotiation_id"],
        "plate_number": "KA-01-MJ-2026",
        "driver_constraints": driver.model_dump(),
        "winner": {
            "lot_id": result["winner_lot_id"],
            "name": result["winner_name"],
            "slot_id": result["winning_slot_id"],
            "agreed_rate_paise": result["agreed_rate_paise"],
            "agreed_rate_rupees": result["agreed_rate_paise"] // 100,
            "total_paise": result["total_paise"],
            "total_rupees": result["total_paise"] // 100,
            "usd_cents": result["usd_cents"],
            "usd_display": f"${result['usd_cents'] / 100:.2f}",
            "booking_id": result["booking_id"],
        },
        "events": events_captured,
        "recorded_at": "2026-10-15T19:00:00Z",
    }

    from pathlib import Path
    repo_root = Path(__file__).resolve().parent.parent.parent
    golden_path = repo_root / "frontend" / "public" / "golden_runs.json"
    os.makedirs(os.path.dirname(golden_path), exist_ok=True)
    with open(golden_path, "w", encoding="utf-8") as f:
        json.dump(golden_data, f, indent=2)

    assert os.path.exists(golden_path)
    assert len(golden_data["events"]) >= 10
