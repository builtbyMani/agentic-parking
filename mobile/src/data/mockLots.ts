import { LotPolicy, Slot } from '../types';

export const INITIAL_LOTS: LotPolicy[] = [
  {
    lot_id: 'LOT_A',
    name: 'Lot A (City Center)',
    distance_m: 150,
    total_slots: 10,
    occupied_slots: 8,
    event_active: true,
    base_list_paise: 4500,
    base_floor_paise: 3500,
    max_prepay_discount_pct: 15,
    min_prepay_hours: 3,
    max_rounds: 3,
  },
  {
    lot_id: 'LOT_B',
    name: 'Lot B (North Garage)',
    distance_m: 500,
    total_slots: 15,
    occupied_slots: 5,
    event_active: true,
    base_list_paise: 4000,
    base_floor_paise: 3000,
    max_prepay_discount_pct: 10,
    min_prepay_hours: 3,
    max_rounds: 3,
  },
  {
    lot_id: 'LOT_C',
    name: 'Lot C (Metro Plaza)',
    distance_m: 250,
    total_slots: 8,
    occupied_slots: 4,
    event_active: true,
    base_list_paise: 4200,
    base_floor_paise: 3200,
    max_prepay_discount_pct: 12,
    min_prepay_hours: 3,
    max_rounds: 3,
  },
];

export const INITIAL_SLOTS: Slot[] = [
  { slot_id: 'A-01', lot_id: 'LOT_A', sensor_occupied: 0, booking_status: 'IDLE', soft_lock_until: 0 },
  { slot_id: 'A-02', lot_id: 'LOT_A', sensor_occupied: 0, booking_status: 'IDLE', soft_lock_until: 0 },
  { slot_id: 'B-01', lot_id: 'LOT_B', sensor_occupied: 0, booking_status: 'IDLE', soft_lock_until: 0 },
  { slot_id: 'B-02', lot_id: 'LOT_B', sensor_occupied: 0, booking_status: 'IDLE', soft_lock_until: 0 },
  { slot_id: 'C-01', lot_id: 'LOT_C', sensor_occupied: 0, booking_status: 'IDLE', soft_lock_until: 0 },
  { slot_id: 'C-02', lot_id: 'LOT_C', sensor_occupied: 0, booking_status: 'IDLE', soft_lock_until: 0 },
];
