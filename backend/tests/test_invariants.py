import random
import pytest
from backend.schemas import AgentMoveLLM, LotPolicy, DriverConstraints
from backend.pricing_engine import compute_effective_lot_floor_paise
from backend.policy_guard import (
    enforce_lot_guard,
    enforce_driver_guard,
    sanitize_message_prices,
)

def test_50_adversarial_negotiations_never_violate_invariants():
    """
    Simulates 50 multi-round bilateral negotiations where the simulated LLM acts
    as an adversarial chaos agent outputting negative numbers, prices far below floor,
    prices above budget, upward bids, and misleading text prose.
    Verifies that PolicyGuard guarantees 100% invariant adherence.
    """
    random.seed(42)
    for run in range(50):
        policy = LotPolicy(
            lot_id="LOT_A",
            name="Lot A",
            distance_m=150,
            total_slots=10,
            occupied_slots=8,
            event_active=True,
            base_list_paise=4500,
            base_floor_paise=3500,
            max_prepay_discount_pct=15,
            min_prepay_hours=3,
            max_rounds=3,
        )
        driver = DriverConstraints(
            max_budget_per_hour_paise=random.choice([3200, 3600, 4000, 4400]),
            max_walk_distance_m=400,
            hours=random.choice([2, 3, 4]),
            prepay=random.choice([True, False]),
        )
        eff_floor = compute_effective_lot_floor_paise(policy, driver.hours, driver.prepay)
        last_lot = None
        last_driver = 2800

        for r in range(1, 4):
            # Adversarial LLM tries random wild prices including negative, below floor, and above list
            chaos_lot_move = AgentMoveLLM(
                action=random.choice(["OFFER", "COUNTER", "ACCEPT", "WALK_AWAY"]),
                price_per_hour_paise=random.choice([-1000, 1500, 2200, 3100, 3800, 5000, 9900]),
                message="Special deal at ₹15/hr!",
                reasoning="Chaos test",
            )
            lot_paise, lot_act, lot_msg, lot_clamped, _ = enforce_lot_guard(
                chaos_lot_move, policy, driver.hours, driver.prepay, r, last_lot, last_driver
            )
            assert lot_paise >= eff_floor, f"Run {run} R{r} INVARIANT BROKEN: Lot offered below effective floor! {lot_paise} < {eff_floor}"
            assert lot_paise <= (last_lot or policy.base_list_paise), f"Run {run} R{r} INVARIANT BROKEN: Lot raised price! {lot_paise} > {last_lot}"
            if lot_clamped:
                assert f"₹{lot_paise//100}" in lot_msg, f"Run {run} R{r} INVARIANT BROKEN: Prose price mismatch! {lot_msg}"
            last_lot = lot_paise

            # Driver LLM tries bids exceeding budget, below prior bid, or above lot ask
            chaos_drv_move = AgentMoveLLM(
                action="ACCEPT",
                price_per_hour_paise=random.choice([1000, 2500, 3500, 4500, 8000]),
                message="I will pay ₹80/hr!",
                reasoning="Chaos test",
            )
            drv_paise, drv_act, drv_msg, drv_clamped, _ = enforce_driver_guard(
                chaos_drv_move, driver, r, last_driver, last_lot
            )
            assert drv_paise <= driver.max_budget_per_hour_paise, f"Run {run} R{r} INVARIANT BROKEN: Driver exceeded budget! {drv_paise} > {driver.max_budget_per_hour_paise}"
            assert drv_paise >= last_driver, f"Run {run} R{r} INVARIANT BROKEN: Driver lowered bid! {drv_paise} < {last_driver}"
            assert drv_paise <= last_lot, f"Run {run} R{r} INVARIANT BROKEN: Driver bid above Lot's ask! {drv_paise} > {last_lot}"
            if drv_clamped:
                assert f"₹{drv_paise//100}" in drv_msg, f"Run {run} R{r} INVARIANT BROKEN: Driver prose price mismatch! {drv_msg}"
            last_driver = drv_paise

def test_prose_sanitizer_edge_cases():
    # Various formats of currency in text
    res1 = sanitize_message_prices("Let's close at ₹25 right now.", 3200)
    assert "₹32" in res1
    assert "₹25" not in res1
    assert "[Adjusted to policy limit ₹32/hr]" in res1

    res2 = sanitize_message_prices("I can accept Rs 40/hr or Rs.45.", 3800)
    assert "₹38" in res2
    assert "40" not in res2

def test_effective_floor_rounding():
    policy = LotPolicy(
        lot_id="LOT_TEST",
        name="Test Lot",
        distance_m=100,
        total_slots=10,
        occupied_slots=2,
        event_active=False,
        base_list_paise=4500,
        base_floor_paise=3500,
        max_prepay_discount_pct=15,
        min_prepay_hours=3,
    )
    # prepay=True, hours=3: 3500 * 0.85 = 2975 -> rounds to 3000 paise
    eff = compute_effective_lot_floor_paise(policy, 3, True)
    assert eff == 3000

    # prepay=False: no discount
    assert compute_effective_lot_floor_paise(policy, 3, False) == 3500

    # hours < min_prepay_hours: no discount
    assert compute_effective_lot_floor_paise(policy, 2, True) == 3500
