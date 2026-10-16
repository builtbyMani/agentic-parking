export interface ValidatedMove {
  negotiation_id: string;
  lot_id: string;
  round_num: number;
  from_agent: string;
  to_agent: string;
  action: 'REQUEST' | 'OFFER' | 'COUNTER' | 'ACCEPT' | 'WALK_AWAY';
  raw_llm_paise: number;
  price_per_hour_paise: number;
  hours: number;
  prepay: boolean;
  message: string;
  reasoning: string;
  guard_triggered: boolean;
  guard_reason?: string | null;
  model_used: string;
  latency_ms: number;
}

export interface DriverConstraints {
  max_budget_per_hour_paise: number;
  max_walk_distance_m: number;
  hours: number;
  prepay: boolean;
  walk_penalty_paise_per_m?: number;
}

export interface LotPolicy {
  lot_id: string;
  name: string;
  distance_m: number;
  total_slots: number;
  occupied_slots: number;
  event_active: boolean;
  base_list_paise: number;
  base_floor_paise: number;
  max_prepay_discount_pct: number;
  min_prepay_hours?: number;
  max_rounds?: number;
}

export interface Slot {
  slot_id: string;
  lot_id: string;
  sensor_occupied: number | boolean;
  booking_status: 'IDLE' | 'SOFT_LOCK' | 'CONFIRMED';
  soft_lock_until: number;
}

export interface NegotiationEvent {
  event_type: string;
  negotiation_id?: string;
  data: any;
  timestamp?: number;
}

export interface WinnerData {
  lot_id: string;
  name: string;
  slot_id: string;
  agreed_rate_paise: number;
  agreed_rate_rupees: number;
  total_paise: number;
  total_rupees: number;
  usd_cents: number;
  usd_display: string;
  booking_id: string;
}
