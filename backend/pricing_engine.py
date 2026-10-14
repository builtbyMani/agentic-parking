from backend.schemas import LotPolicy

def compute_effective_lot_floor_paise(policy: LotPolicy, hours: int, prepay: bool) -> int:
    """
    Computes effective floor rate in integer paise.
    Applies multi-hour prepay discount if eligible, rounded to nearest 100 paise (₹1).
    """
    if prepay and hours >= policy.min_prepay_hours:
        discounted = round(policy.base_floor_paise * (100 - policy.max_prepay_discount_pct) / 100)
        # Round to nearest 100 paise (₹1) for clean demo numbers
        return int(round(discounted / 100.0) * 100)
    return policy.base_floor_paise

def compute_opening_request_anchor(list_paise: int, budget_paise: int) -> int:
    """
    Calculates deterministic opening REQUEST anchor for driver:
    min(list * 0.72, budget * 0.80) rounded to nearest 100 paise.
    """
    anchor = min(int(list_paise * 0.72), int(budget_paise * 0.80))
    return int(round(anchor / 100.0) * 100)

def calculate_total_paise(agreed_rate_paise: int, hours: int) -> int:
    """Pure Python deterministic total calculation."""
    return agreed_rate_paise * hours
