import re
from typing import Optional
from backend.schemas import AgentMoveLLM, LotPolicy, DriverConstraints
from backend.pricing_engine import compute_effective_lot_floor_paise

def sanitize_message_prices(message: str, clamped_paise: int) -> str:
    """
    Substitutes any ₹XX or Rs. XX price occurrence in the agent's prose with the actual
    clamped rupee integer to prevent text-vs-number contradictions.
    """
    rupees = clamped_paise // 100
    cleaned = re.sub(r'(?:₹|Rs\.?\s*)\d+(?:\.\d+)?', f'₹{rupees}', message)
    return f"{cleaned} [Adjusted to policy limit ₹{rupees}/hr]"

def enforce_lot_guard(
    raw_move: AgentMoveLLM,
    policy: LotPolicy,
    hours: int,
    prepay: bool,
    round_num: int,
    last_lot_offer_paise: Optional[int],
    last_driver_bid_paise: int
) -> tuple[int, str, str, bool, Optional[str]]:
    """
    Enforces deterministic lot price constraints:
    1. Floor Clamp: Never below effective floor.
    2. Monotonic Ceiling Clamp: Never above previous ask (cannot raise price).
    3. Bid Respect: Never ask less than what driver already offered.
    4. Action Type Locking: OFFER in R1, COUNTER in R2/R3.
    5. Regex Prose Sanitizer: Fixes message text if price is clamped.

    Returns: (clamped_paise, enforced_action, final_msg, guard_triggered, guard_reason)
    """
    floor_paise = compute_effective_lot_floor_paise(policy, hours, prepay)
    ceiling_paise = last_lot_offer_paise if last_lot_offer_paise is not None else policy.base_list_paise

    proposed = raw_move.price_per_hour_paise
    clamped = proposed
    reasons = []

    # 1. Floor Clamp
    if clamped < floor_paise:
        clamped = floor_paise
        reasons.append(f"Agent proposed ₹{proposed//100}, effective floor is ₹{floor_paise//100}, clamped.")

    # 2. Monotonic Ceiling Clamp (Lot cannot raise price mid-negotiation)
    if clamped > ceiling_paise:
        clamped = ceiling_paise
        reasons.append(f"Agent raised ask to ₹{proposed//100} above prior ₹{ceiling_paise//100}, clamped.")

    # 3. Never ask less than what the driver already offered to pay
    if clamped < last_driver_bid_paise and last_driver_bid_paise >= floor_paise:
        clamped = last_driver_bid_paise
        reasons.append(f"Agent asked ₹{proposed//100} below driver's accepted bid ₹{last_driver_bid_paise//100}, clamped.")

    # 4. Lock action type by round (Lots only OFFER in R1 or COUNTER in R2/R3)
    enforced_action = "OFFER" if round_num == 1 else "COUNTER"

    guard_triggered = len(reasons) > 0
    guard_reason = " | ".join(reasons) if guard_triggered else None
    final_msg = sanitize_message_prices(raw_move.message, clamped) if guard_triggered else raw_move.message

    return clamped, enforced_action, final_msg, guard_triggered, guard_reason

def enforce_driver_guard(
    raw_move: AgentMoveLLM,
    driver: DriverConstraints,
    round_num: int,
    last_driver_bid_paise: int,
    last_lot_offer_paise: int
) -> tuple[int, str, str, bool, Optional[str]]:
    """
    Enforces deterministic driver price constraints:
    1. Budget Ceiling Clamp: Never bid above private budget.
    2. Monotonic Floor Clamp: Never lower previous bid.
    3. Upward-Bidding Guard: Never counter higher than what the lot asked.
    4. Action Type Locking: Always COUNTER.
    5. Regex Prose Sanitizer: Fixes message text if bid is clamped.

    Returns: (clamped_paise, enforced_action, final_msg, guard_triggered, guard_reason)
    """
    budget = driver.max_budget_per_hour_paise
    proposed = raw_move.price_per_hour_paise
    clamped = proposed
    reasons = []

    # 1. Budget Ceiling Clamp
    if clamped > budget:
        clamped = budget
        reasons.append(f"Driver proposed ₹{proposed//100}, above hidden budget ₹{budget//100}, clamped.")

    # 2. Monotonic Floor Clamp (Driver cannot lower their own previous bid)
    if clamped < last_driver_bid_paise:
        clamped = last_driver_bid_paise
        reasons.append(f"Driver lowered bid below prior ₹{last_driver_bid_paise//100}, clamped.")

    # 3. Upward-Bidding Guard (Never counter higher than what the lot just asked!)
    if clamped > last_lot_offer_paise:
        clamped = min(budget, last_lot_offer_paise)
        reasons.append(f"Driver bid above Lot's ask of ₹{last_lot_offer_paise//100}, clamped.")

    enforced_action = "COUNTER"
    guard_triggered = len(reasons) > 0
    guard_reason = " | ".join(reasons) if guard_triggered else None
    final_msg = sanitize_message_prices(raw_move.message, clamped) if guard_triggered else raw_move.message

    return clamped, enforced_action, final_msg, guard_triggered, guard_reason
