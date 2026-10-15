import time
import uuid
import asyncio
from typing import Optional, Callable
from backend.config import USD_TO_INR_PAISE, DB_PATH
from backend.schemas import (
    DriverConstraints,
    LotPolicy,
    ValidatedMove,
    BookingRecord,
    NegotiationEvent,
)
from backend.pricing_engine import (
    compute_effective_lot_floor_paise,
    compute_opening_request_anchor,
)
from backend.policy_guard import enforce_lot_guard, enforce_driver_guard
from backend.llm_client import (
    build_lot_prompts,
    build_driver_prompts,
    call_agent_llm,
)
from backend.db import acquire_soft_lock, create_booking

async def emit_event(
    event_callback: Optional[Callable],
    event_type: str,
    negotiation_id: str,
    data: dict,
    event_log: Optional[list] = None
) -> None:
    now_ts = int(time.time())
    event_obj = {
        "event_type": event_type,
        "negotiation_id": negotiation_id,
        "data": data,
        "timestamp": now_ts,
    }
    if event_log is not None:
        event_log.append(event_obj)
    if event_callback:
        if asyncio.iscoroutinefunction(event_callback):
            await event_callback(event_obj)
        else:
            event_callback(event_obj)

async def negotiate_with_single_lot(
    negotiation_id: str,
    driver: DriverConstraints,
    lot: LotPolicy,
    event_callback: Optional[Callable] = None,
    event_log: Optional[list] = None
) -> dict:
    """
    Executes a 3-round bilateral negotiation between Driver and a single Parking Lot.
    """
    eff_floor = compute_effective_lot_floor_paise(lot, driver.hours, driver.prepay)
    anchor_paise = compute_opening_request_anchor(lot.base_list_paise, driver.max_budget_per_hour_paise)

    # Step 1: Opening Request Anchor
    opening_msg = f"Requesting {driver.hours}h parking at ₹{anchor_paise//100}/hr (prepay={driver.prepay})."
    opening_move = ValidatedMove(
        negotiation_id=negotiation_id,
        lot_id=lot.lot_id,
        round_num=0,
        from_agent="driver",
        to_agent=lot.lot_id,
        action="REQUEST",
        raw_llm_paise=anchor_paise,
        price_per_hour_paise=anchor_paise,
        hours=driver.hours,
        prepay=driver.prepay,
        message=opening_msg,
        reasoning="Deterministic opening anchor based on list price and reservation budget.",
        guard_triggered=False,
        model_used="deterministic-anchor",
        latency_ms=0,
    )
    await emit_event(event_callback, "REQUEST", negotiation_id, opening_move.model_dump(), event_log)

    history_lines = [f"Driver: {opening_msg}"]
    last_lot_ask: Optional[int] = lot.base_list_paise
    last_driver_bid = anchor_paise
    lot_moves: list[ValidatedMove] = [opening_move]

    # Rounds 1, 2, 3
    for r in range(1, lot.max_rounds + 1):
        # 1. Lot's Turn
        lot_sys, lot_usr = build_lot_prompts(lot, driver.hours, driver.prepay, r, history_lines)
        lot_fallback_args = ("lot", r, eff_floor, last_lot_ask, last_driver_bid)
        raw_lot_move, lot_model, lot_latency = await call_agent_llm("lot", lot_sys, lot_usr, lot_fallback_args)

        clamped_lot_paise, lot_action, lot_msg, lot_clamped, lot_reason = enforce_lot_guard(
            raw_lot_move, lot, driver.hours, driver.prepay, r, last_lot_ask, last_driver_bid
        )
        last_lot_ask = clamped_lot_paise

        val_lot_move = ValidatedMove(
            negotiation_id=negotiation_id,
            lot_id=lot.lot_id,
            round_num=r,
            from_agent=lot.lot_id,
            to_agent="driver",
            action=lot_action,
            raw_llm_paise=raw_lot_move.price_per_hour_paise,
            price_per_hour_paise=clamped_lot_paise,
            hours=driver.hours,
            prepay=driver.prepay,
            message=lot_msg,
            reasoning=raw_lot_move.reasoning,
            guard_triggered=lot_clamped,
            guard_reason=lot_reason,
            model_used=lot_model,
            latency_ms=lot_latency,
        )
        lot_moves.append(val_lot_move)

        if lot_clamped:
            await emit_event(event_callback, "AMBER_CLAMP", negotiation_id, {
                "agent": lot.lot_id,
                "round_num": r,
                "raw_paise": raw_lot_move.price_per_hour_paise,
                "clamped_paise": clamped_lot_paise,
                "reason": lot_reason,
            }, event_log)

        await emit_event(event_callback, lot_action, negotiation_id, val_lot_move.model_dump(), event_log)
        history_lines.append(f"{lot.name}: {lot_msg}")

        # In Round 3 (final round), Lot gives its Best & Final Offer; driver evaluates at Step 3
        if r == lot.max_rounds:
            break

        # 2. Driver's Turn
        drv_sys, drv_usr = build_driver_prompts(driver, lot.name, lot.distance_m, r, history_lines)
        drv_fallback_args = ("driver", r, driver.max_budget_per_hour_paise, last_driver_bid, last_lot_ask)
        raw_drv_move, drv_model, drv_latency = await call_agent_llm("driver", drv_sys, drv_usr, drv_fallback_args)

        clamped_drv_paise, drv_action, drv_msg, drv_clamped, drv_reason = enforce_driver_guard(
            raw_drv_move, driver, r, last_driver_bid, last_lot_ask
        )
        last_driver_bid = clamped_drv_paise

        val_drv_move = ValidatedMove(
            negotiation_id=negotiation_id,
            lot_id=lot.lot_id,
            round_num=r,
            from_agent="driver",
            to_agent=lot.lot_id,
            action=drv_action,
            raw_llm_paise=raw_drv_move.price_per_hour_paise,
            price_per_hour_paise=clamped_drv_paise,
            hours=driver.hours,
            prepay=driver.prepay,
            message=drv_msg,
            reasoning=raw_drv_move.reasoning,
            guard_triggered=drv_clamped,
            guard_reason=drv_reason,
            model_used=drv_model,
            latency_ms=drv_latency,
        )
        lot_moves.append(val_drv_move)

        if drv_clamped:
            await emit_event(event_callback, "AMBER_CLAMP", negotiation_id, {
                "agent": "driver",
                "round_num": r,
                "raw_paise": raw_drv_move.price_per_hour_paise,
                "clamped_paise": clamped_drv_paise,
                "reason": drv_reason,
            }, event_log)

        await emit_event(event_callback, drv_action, negotiation_id, val_drv_move.model_dump(), event_log)
        history_lines.append(f"Driver: {drv_msg}")

    return {
        "lot": lot,
        "final_lot_offer_paise": last_lot_ask,
        "final_driver_bid_paise": last_driver_bid,
        "qualifies": (last_lot_ask <= driver.max_budget_per_hour_paise),
        "moves": lot_moves,
    }

async def run_multi_lot_negotiation(
    driver: DriverConstraints,
    lots: list[LotPolicy],
    plate_number: str = "KA-01-MJ-2026",
    event_callback: Optional[Callable] = None,
    db_path: str = DB_PATH
) -> dict:
    """
    Multi-lot negotiation coordinator:
    - Step 0: Deterministic Distance Filter
    - Step 1: Opening Request Anchor
    - Step 2: Parallel 3-round bilateral negotiations
    - Step 3: Deterministic Winner Evaluation
    - Step 4: Atomic Slot Soft-Lock and ACCEPT/WALK_AWAY signals
    """
    negotiation_id = f"neg_{uuid.uuid4().hex[:8]}"
    event_log: list = []

    await emit_event(event_callback, "NEGOTIATION_STARTED", negotiation_id, {
        "driver_constraints": driver.model_dump(),
        "total_lots_considered": len(lots),
        "plate_number": plate_number,
    }, event_log)

    # Step 0: Distance Filter
    active_lots: list[LotPolicy] = []
    for lot in lots:
        if lot.distance_m > driver.max_walk_distance_m:
            await emit_event(event_callback, "LOT_SKIPPED", negotiation_id, {
                "lot_id": lot.lot_id,
                "lot_name": lot.name,
                "distance_m": lot.distance_m,
                "max_distance_m": driver.max_walk_distance_m,
                "reason": f"{lot.name}: {lot.distance_m}m exceeds {driver.max_walk_distance_m}m limit — skipped."
            }, event_log)
        else:
            active_lots.append(lot)

    if not active_lots:
        await emit_event(event_callback, "NO_DEAL", negotiation_id, {
            "reason": "All available parking lots exceed the driver's maximum walking distance limit."
        }, event_log)
        return {
            "negotiation_id": negotiation_id,
            "winner_lot_id": None,
            "status": "NO_DEAL",
            "reason": "All lots exceeded max walk distance",
            "event_log": event_log,
        }

    # Step 2: Parallel Bilateral Rounds across Active Lots
    tasks = [
        negotiate_with_single_lot(negotiation_id, driver, lot, event_callback, event_log)
        for lot in active_lots
    ]
    lot_results = await asyncio.gather(*tasks)

    # Step 3: Deterministic Winner Evaluation
    qualifying_lots = [r for r in lot_results if r["qualifies"]]

    if not qualifying_lots:
        await emit_event(event_callback, "NO_DEAL", negotiation_id, {
            "reason": "None of the competing parking lots met the driver's reservation budget limit."
        }, event_log)
        return {
            "negotiation_id": negotiation_id,
            "winner_lot_id": None,
            "status": "NO_DEAL",
            "reason": "All offers exceeded driver budget",
            "event_log": event_log,
            "lot_results": lot_results,
        }

    # Score each qualifying lot: Score = (Rate * hours) + (Distance * penalty * hours)
    for res in qualifying_lots:
        lot = res["lot"]
        rate = res["final_lot_offer_paise"]
        parking_cost = rate * driver.hours
        walk_penalty = lot.distance_m * driver.walk_penalty_paise_per_m * driver.hours
        res["score_paise"] = parking_cost + walk_penalty
        res["parking_cost_paise"] = parking_cost
        res["walk_penalty_paise"] = walk_penalty

    # Winner has minimum effective score
    winner_res = min(qualifying_lots, key=lambda x: x["score_paise"])
    winner_lot = winner_res["lot"]
    agreed_rate_paise = winner_res["final_lot_offer_paise"]
    total_paise = agreed_rate_paise * driver.hours
    usd_cents = max(1, round((total_paise * 100) / USD_TO_INR_PAISE))

    # Step 4: Atomic Slot Soft-Lock & Booking Creation
    winning_slot_id = await acquire_soft_lock(winner_lot.lot_id, 180, db_path)
    if not winning_slot_id:
        # Fallback to another lot if all slots full in first choice
        for alt in sorted(qualifying_lots, key=lambda x: x["score_paise"]):
            if alt["lot"].lot_id != winner_lot.lot_id:
                alt_slot = await acquire_soft_lock(alt["lot"].lot_id, 180, db_path)
                if alt_slot:
                    winner_res = alt
                    winner_lot = alt["lot"]
                    winning_slot_id = alt_slot
                    agreed_rate_paise = alt["final_lot_offer_paise"]
                    total_paise = agreed_rate_paise * driver.hours
                    usd_cents = max(1, round((total_paise * 100) / USD_TO_INR_PAISE))
                    break

    if not winning_slot_id:
        await emit_event(event_callback, "NO_DEAL", negotiation_id, {
            "reason": "Agreed terms reached but all parking slots are currently occupied or locked."
        }, event_log)
        return {
            "negotiation_id": negotiation_id,
            "winner_lot_id": None,
            "status": "NO_DEAL",
            "reason": "No slots available for soft-lock",
            "event_log": event_log,
        }

    booking_id = f"bk_{uuid.uuid4().hex[:8]}"
    booking = BookingRecord(
        booking_id=booking_id,
        negotiation_id=negotiation_id,
        lot_id=winner_lot.lot_id,
        slot_id=winning_slot_id,
        plate_number=plate_number,
        hours=driver.hours,
        agreed_rate_paise=agreed_rate_paise,
        total_paise=total_paise,
        usd_cents=usd_cents,
        status="PENDING_PAYMENT",
        paypal_order_id=None,
        qr_token=None,
        created_at=int(time.time()),
    )
    await create_booking(booking, db_path=db_path)

    # Emit ACCEPT to winner
    await emit_event(event_callback, "ACCEPT", negotiation_id, {
        "winner_lot_id": winner_lot.lot_id,
        "winner_name": winner_lot.name,
        "slot_id": winning_slot_id,
        "agreed_rate_paise": agreed_rate_paise,
        "agreed_rate_rupees": agreed_rate_paise // 100,
        "total_paise": total_paise,
        "total_rupees": total_paise // 100,
        "usd_cents": usd_cents,
        "booking_id": booking_id,
        "soft_lock_seconds": 180,
        "message": f"Deal accepted at ₹{agreed_rate_paise//100}/hr × {driver.hours}h = ₹{total_paise//100}. Slot {winning_slot_id} reserved for 180s.",
    }, event_log)

    # Emit WALK_AWAY to losing lots
    for lot_res in lot_results:
        if lot_res["lot"].lot_id != winner_lot.lot_id:
            await emit_event(event_callback, "WALK_AWAY", negotiation_id, {
                "lot_id": lot_res["lot"].lot_id,
                "lot_name": lot_res["lot"].name,
                "reason": f"Driver selected {winner_lot.name} at ₹{agreed_rate_paise//100}/hr.",
            }, event_log)

    return {
        "negotiation_id": negotiation_id,
        "winner_lot_id": winner_lot.lot_id,
        "winner_name": winner_lot.name,
        "winning_slot_id": winning_slot_id,
        "agreed_rate_paise": agreed_rate_paise,
        "total_paise": total_paise,
        "usd_cents": usd_cents,
        "booking_id": booking_id,
        "status": "ACCEPTED",
        "lot_results": [
            {
                "lot_id": r["lot"].lot_id,
                "name": r["lot"].name,
                "final_lot_offer_paise": r["final_lot_offer_paise"],
                "qualifies": r["qualifies"],
                "score_paise": r.get("score_paise"),
            }
            for r in lot_results
        ],
        "event_log": event_log,
    }
