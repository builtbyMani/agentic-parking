import { NegotiationEvent } from "../types";

export const GOLDEN_EVENTS: NegotiationEvent[] = [
  {
    "event_type": "NEGOTIATION_STARTED",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "driver_constraints": {
        "max_budget_per_hour_paise": 3800,
        "max_walk_distance_m": 400,
        "hours": 3,
        "prepay": true,
        "walk_penalty_paise_per_m": 2
      },
      "total_lots_considered": 3,
      "plate_number": "KA-01-MJ-2026"
    },
    "timestamp": 1792074370
  },
  {
    "event_type": "LOT_SKIPPED",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "lot_id": "LOT_B",
      "lot_name": "Lot B (North Garage)",
      "distance_m": 500,
      "max_distance_m": 400,
      "reason": "Lot B (North Garage): 500m exceeds 400m limit \u2014 skipped."
    },
    "timestamp": 1792074370
  },
  {
    "event_type": "REQUEST",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_A",
      "round_num": 0,
      "from_agent": "driver",
      "to_agent": "LOT_A",
      "action": "REQUEST",
      "raw_llm_paise": 3000,
      "price_per_hour_paise": 3000,
      "hours": 3,
      "prepay": true,
      "message": "Requesting 3h parking at \u20b930/hr (prepay=True).",
      "reasoning": "Deterministic opening anchor based on list price and reservation budget.",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "deterministic-anchor",
      "latency_ms": 0
    },
    "timestamp": 1792074370
  },
  {
    "event_type": "REQUEST",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_C",
      "round_num": 0,
      "from_agent": "driver",
      "to_agent": "LOT_C",
      "action": "REQUEST",
      "raw_llm_paise": 3000,
      "price_per_hour_paise": 3000,
      "hours": 3,
      "prepay": true,
      "message": "Requesting 3h parking at \u20b930/hr (prepay=True).",
      "reasoning": "Deterministic opening anchor based on list price and reservation budget.",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "deterministic-anchor",
      "latency_ms": 0
    },
    "timestamp": 1792074370
  },
  {
    "event_type": "OFFER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_A",
      "round_num": 1,
      "from_agent": "LOT_A",
      "to_agent": "driver",
      "action": "OFFER",
      "raw_llm_paise": 4200,
      "price_per_hour_paise": 4200,
      "hours": 3,
      "prepay": true,
      "message": "City center is 80% full with an active event. We can offer \u20b942/hr.",
      "reasoning": "High public occupancy and an active event justify a price above the floor while remaining competitive.",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "gemini-3.5-flash-lite",
      "latency_ms": 6082
    },
    "timestamp": 1792074376
  },
  {
    "event_type": "OFFER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_C",
      "round_num": 1,
      "from_agent": "LOT_C",
      "to_agent": "driver",
      "action": "OFFER",
      "raw_llm_paise": 3500,
      "price_per_hour_paise": 3500,
      "hours": 3,
      "prepay": true,
      "message": "Can offer \u20b935/hr for prepaid multi-hour slot.",
      "reasoning": "Rule-based concession step toward policy floor (API fallback).",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "fallback-rule-engine",
      "latency_ms": 6828
    },
    "timestamp": 1792074377
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_A",
      "round_num": 1,
      "from_agent": "driver",
      "to_agent": "LOT_A",
      "action": "COUNTER",
      "raw_llm_paise": 3400,
      "price_per_hour_paise": 3400,
      "hours": 3,
      "prepay": true,
      "message": "I can come up to \u20b934/hr if we lock it now.",
      "reasoning": "Rule-based concession step toward reservation budget (API fallback).",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "fallback-rule-engine",
      "latency_ms": 1638
    },
    "timestamp": 1792074377
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_C",
      "round_num": 1,
      "from_agent": "driver",
      "to_agent": "LOT_C",
      "action": "COUNTER",
      "raw_llm_paise": 3400,
      "price_per_hour_paise": 3400,
      "hours": 3,
      "prepay": true,
      "message": "I can come up to \u20b934/hr if we lock it now.",
      "reasoning": "Rule-based concession step toward reservation budget (API fallback).",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "fallback-rule-engine",
      "latency_ms": 1712
    },
    "timestamp": 1792074378
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_C",
      "round_num": 2,
      "from_agent": "LOT_C",
      "to_agent": "driver",
      "action": "COUNTER",
      "raw_llm_paise": 3500,
      "price_per_hour_paise": 3500,
      "hours": 3,
      "prepay": true,
      "message": "With a nearby event active and decent demand, \u20b935/hr with the max 12% prepay discount is our best rate.",
      "reasoning": "Holding firm at 3500 paise protects the floor well above the owner base while factoring in the active nearby event.",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "gemini-3.5-flash-lite",
      "latency_ms": 1406
    },
    "timestamp": 1792074380
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_A",
      "round_num": 2,
      "from_agent": "LOT_A",
      "to_agent": "driver",
      "action": "COUNTER",
      "raw_llm_paise": 4000,
      "price_per_hour_paise": 4000,
      "hours": 3,
      "prepay": true,
      "message": "With high demand due to the active event, our best price for 3 hours is \u20b940/hr.",
      "reasoning": "Given high 80% occupancy and an active event, we reduce the standard price slightly for a 3-hour prepay but stay well above the base floor.",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "gemini-3.5-flash-lite",
      "latency_ms": 3526
    },
    "timestamp": 1792074381
  },
  {
    "event_type": "AMBER_CLAMP",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "agent": "driver",
      "round_num": 2,
      "raw_paise": 3600,
      "clamped_paise": 3500,
      "reason": "Driver bid above Lot's ask of \u20b935, clamped."
    },
    "timestamp": 1792074381
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_C",
      "round_num": 2,
      "from_agent": "driver",
      "to_agent": "LOT_C",
      "action": "COUNTER",
      "raw_llm_paise": 3600,
      "price_per_hour_paise": 3500,
      "hours": 3,
      "prepay": true,
      "message": "I can come up to \u20b935/hr if we lock it now. [Adjusted to policy limit \u20b935/hr]",
      "reasoning": "Rule-based concession step toward reservation budget (API fallback).",
      "guard_triggered": true,
      "guard_reason": "Driver bid above Lot's ask of \u20b935, clamped.",
      "model_used": "fallback-rule-engine",
      "latency_ms": 1580
    },
    "timestamp": 1792074381
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_A",
      "round_num": 2,
      "from_agent": "driver",
      "to_agent": "LOT_A",
      "action": "COUNTER",
      "raw_llm_paise": 3600,
      "price_per_hour_paise": 3600,
      "hours": 3,
      "prepay": true,
      "message": "I can come up to \u20b936/hr if we lock it now.",
      "reasoning": "Rule-based concession step toward reservation budget (API fallback).",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "fallback-rule-engine",
      "latency_ms": 1559
    },
    "timestamp": 1792074383
  },
  {
    "event_type": "AMBER_CLAMP",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "agent": "LOT_C",
      "round_num": 3,
      "raw_paise": 3100,
      "clamped_paise": 3500,
      "reason": "Agent asked \u20b931 below driver's accepted bid \u20b935, clamped."
    },
    "timestamp": 1792074383
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_C",
      "round_num": 3,
      "from_agent": "LOT_C",
      "to_agent": "driver",
      "action": "COUNTER",
      "raw_llm_paise": 3100,
      "price_per_hour_paise": 3500,
      "hours": 3,
      "prepay": true,
      "message": "Can offer \u20b935/hr for prepaid multi-hour slot. [Adjusted to policy limit \u20b935/hr]",
      "reasoning": "Rule-based concession step toward policy floor (API fallback).",
      "guard_triggered": true,
      "guard_reason": "Agent asked \u20b931 below driver's accepted bid \u20b935, clamped.",
      "model_used": "fallback-rule-engine",
      "latency_ms": 1647
    },
    "timestamp": 1792074383
  },
  {
    "event_type": "COUNTER",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "negotiation_id": "neg_c6ff08cb",
      "lot_id": "LOT_A",
      "round_num": 3,
      "from_agent": "LOT_A",
      "to_agent": "driver",
      "action": "COUNTER",
      "raw_llm_paise": 3800,
      "price_per_hour_paise": 3800,
      "hours": 3,
      "prepay": true,
      "message": "Final round: Given the active event and 80% occupancy, our absolute best is \u20b938/hr with the 15% prepay discount.",
      "reasoning": "Since this is the final round and demand is high at 80% occupancy with an active event, we offer our lowest sustainable price above the floor while respecting the prepay discount.",
      "guard_triggered": false,
      "guard_reason": null,
      "model_used": "gemini-3.5-flash-lite",
      "latency_ms": 1176
    },
    "timestamp": 1792074384
  },
  {
    "event_type": "ACCEPT",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "winner_lot_id": "LOT_C",
      "winner_name": "Lot C (Metro Plaza)",
      "slot_id": "C-01",
      "agreed_rate_paise": 3500,
      "agreed_rate_rupees": 35,
      "total_paise": 10500,
      "total_rupees": 105,
      "usd_cents": 125,
      "booking_id": "bk_2cebae87",
      "soft_lock_seconds": 180,
      "message": "Deal accepted at \u20b935/hr \u00d7 3h = \u20b9105. Slot C-01 reserved for 180s."
    },
    "timestamp": 1792074384
  },
  {
    "event_type": "WALK_AWAY",
    "negotiation_id": "neg_c6ff08cb",
    "data": {
      "lot_id": "LOT_A",
      "lot_name": "Lot A (City Center)",
      "reason": "Driver selected Lot C (Metro Plaza) at \u20b935/hr."
    },
    "timestamp": 1792074384
  }
];
