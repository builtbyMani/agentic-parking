from pydantic import BaseModel, Field
from typing import Literal, Optional

# 1. What Gemini is constrained to output via response_schema
class AgentMoveLLM(BaseModel):
    action: Literal["OFFER", "COUNTER", "ACCEPT", "WALK_AWAY"]
    price_per_hour_paise: int = Field(
        description="Net all-in hourly rate in integer paise. Example: ₹38/hr is 3800."
    )
    message: str = Field(
        description="Short negotiation statement under 120 chars. Do not invent facts."
    )
    reasoning: str = Field(
        description="1-sentence internal rationale explaining the price choice."
    )

# 2. What passes through the backend and WebSocket after PolicyGuard validation
class ValidatedMove(BaseModel):
    negotiation_id: str
    lot_id: str
    round_num: int
    from_agent: str
    to_agent: str
    action: Literal["REQUEST", "OFFER", "COUNTER", "ACCEPT", "WALK_AWAY"]
    raw_llm_paise: int
    price_per_hour_paise: int
    hours: int
    prepay: bool
    message: str
    reasoning: str
    guard_triggered: bool = False
    guard_reason: Optional[str] = None
    model_used: str
    latency_ms: int

class DriverConstraints(BaseModel):
    max_budget_per_hour_paise: int   # e.g., 4000 (₹40/hr) - HIDDEN FROM LOTS
    max_walk_distance_m: int         # e.g., 400
    hours: int                       # e.g., 3
    prepay: bool                     # e.g., True
    walk_penalty_paise_per_m: int = 2 # 2 paise per meter per hour for utility ranking

class LotPolicy(BaseModel):
    lot_id: str
    name: str
    distance_m: int
    total_slots: int
    occupied_slots: int
    event_active: bool
    base_list_paise: int             # e.g., 4500 (₹45/hr)
    base_floor_paise: int            # e.g., 3500 (₹35/hr)
    max_prepay_discount_pct: int     # e.g., 15 (allows floor down to ~2975 -> 3000 paise)
    min_prepay_hours: int = 3
    max_rounds: int = 3

class SlotState(BaseModel):
    slot_id: str
    lot_id: str
    sensor_occupied: bool = False
    booking_status: Literal["IDLE", "SOFT_LOCK", "CONFIRMED"] = "IDLE"
    soft_lock_until: int = 0

class BookingRecord(BaseModel):
    booking_id: str
    negotiation_id: str
    lot_id: str
    slot_id: str
    plate_number: str
    hours: int
    agreed_rate_paise: int
    total_paise: int
    usd_cents: int
    status: Literal["PENDING_PAYMENT", "CONFIRMED", "EXPIRED"]
    paypal_order_id: Optional[str] = None
    qr_token: Optional[str] = None
    created_at: int

class NegotiationEvent(BaseModel):
    event_type: str
    negotiation_id: str
    data: dict
    timestamp: int
