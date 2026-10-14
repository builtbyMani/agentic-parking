import time
import aiosqlite
from typing import Optional
from backend.config import DB_PATH
from backend.schemas import LotPolicy, BookingRecord

INIT_DDL = """
CREATE TABLE IF NOT EXISTS lots (
    lot_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    distance_m INTEGER NOT NULL,
    total_slots INTEGER NOT NULL,
    occupied_slots INTEGER NOT NULL,
    event_active INTEGER NOT NULL DEFAULT 1,
    base_list_paise INTEGER NOT NULL,
    base_floor_paise INTEGER NOT NULL,
    max_prepay_discount_pct INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS slots (
    slot_id TEXT PRIMARY KEY,
    lot_id TEXT NOT NULL,
    sensor_occupied INTEGER NOT NULL DEFAULT 0,
    booking_status TEXT NOT NULL DEFAULT 'IDLE', -- IDLE | SOFT_LOCK | CONFIRMED
    soft_lock_until INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id TEXT PRIMARY KEY,
    negotiation_id TEXT NOT NULL,
    lot_id TEXT NOT NULL,
    slot_id TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    hours INTEGER NOT NULL,
    agreed_rate_paise INTEGER NOT NULL,
    total_paise INTEGER NOT NULL,
    usd_cents INTEGER NOT NULL,
    status TEXT NOT NULL, -- PENDING_PAYMENT | CONFIRMED | EXPIRED
    paypal_order_id TEXT,
    qr_token TEXT,
    created_at INTEGER NOT NULL
);
"""

INITIAL_LOTS = [
    ("LOT_A", "Lot A (City Center)", 150, 10, 8, 1, 4500, 3500, 15),
    ("LOT_B", "Lot B (North Garage)", 500, 15, 5, 1, 4000, 3000, 10),
    ("LOT_C", "Lot C (Metro Plaza)", 250, 8, 4, 1, 4200, 3200, 12),
]

INITIAL_SLOTS = [
    ("A-01", "LOT_A", 0, "IDLE", 0),
    ("A-02", "LOT_A", 0, "IDLE", 0),
    ("B-01", "LOT_B", 0, "IDLE", 0),
    ("B-02", "LOT_B", 0, "IDLE", 0),
    ("C-01", "LOT_C", 0, "IDLE", 0),
    ("C-02", "LOT_C", 0, "IDLE", 0),
]

async def init_db(db_path: str = DB_PATH) -> None:
    async with aiosqlite.connect(db_path) as db:
        await db.executescript(INIT_DDL)
        # Seed lots if empty
        cursor = await db.execute("SELECT COUNT(*) FROM lots")
        count = (await cursor.fetchone())[0]
        if count == 0:
            await db.executemany(
                "INSERT INTO lots VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                INITIAL_LOTS
            )
            await db.executemany(
                "INSERT INTO slots VALUES (?, ?, ?, ?, ?)",
                INITIAL_SLOTS
            )
        await db.commit()

async def get_lots(db_path: str = DB_PATH) -> list[LotPolicy]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM lots")
        rows = await cursor.fetchall()
        return [
            LotPolicy(
                lot_id=row["lot_id"],
                name=row["name"],
                distance_m=row["distance_m"],
                total_slots=row["total_slots"],
                occupied_slots=row["occupied_slots"],
                event_active=bool(row["event_active"]),
                base_list_paise=row["base_list_paise"],
                base_floor_paise=row["base_floor_paise"],
                max_prepay_discount_pct=row["max_prepay_discount_pct"],
            )
            for row in rows
        ]

async def get_lot(lot_id: str, db_path: str = DB_PATH) -> Optional[LotPolicy]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM lots WHERE lot_id = ?", (lot_id,))
        row = await cursor.fetchone()
        if not row:
            return None
        return LotPolicy(
            lot_id=row["lot_id"],
            name=row["name"],
            distance_m=row["distance_m"],
            total_slots=row["total_slots"],
            occupied_slots=row["occupied_slots"],
            event_active=bool(row["event_active"]),
            base_list_paise=row["base_list_paise"],
            base_floor_paise=row["base_floor_paise"],
            max_prepay_discount_pct=row["max_prepay_discount_pct"],
        )

async def get_slots(lot_id: Optional[str] = None, db_path: str = DB_PATH) -> list[dict]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        if lot_id:
            cursor = await db.execute("SELECT * FROM slots WHERE lot_id = ?", (lot_id,))
        else:
            cursor = await db.execute("SELECT * FROM slots")
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

async def acquire_soft_lock(
    lot_id: str,
    lock_duration_sec: int = 180,
    db_path: str = DB_PATH
) -> Optional[str]:
    """Atomically reserves one free or expired soft-locked slot in the specified lot."""
    now = int(time.time())
    lock_until = now + lock_duration_sec
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("BEGIN IMMEDIATE")
        cursor = await db.execute(
            """
            SELECT slot_id FROM slots
            WHERE lot_id = ?
              AND (
                  (booking_status = 'IDLE' AND sensor_occupied = 0)
                  OR (booking_status = 'SOFT_LOCK' AND soft_lock_until < ?)
              )
            LIMIT 1
            """,
            (lot_id, now)
        )
        row = await cursor.fetchone()
        if not row:
            await db.rollback()
            return None

        slot_id = row["slot_id"]
        await db.execute(
            """
            UPDATE slots
            SET booking_status = 'SOFT_LOCK', soft_lock_until = ?
            WHERE slot_id = ?
            """,
            (lock_until, slot_id)
        )
        await db.commit()
        return slot_id

async def release_soft_lock(slot_id: str, db_path: str = DB_PATH) -> bool:
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute(
            """
            UPDATE slots
            SET booking_status = 'IDLE', soft_lock_until = 0
            WHERE slot_id = ? AND booking_status = 'SOFT_LOCK'
            """,
            (slot_id,)
        )
        await db.commit()
        return cursor.rowcount > 0

async def confirm_slot_booking(slot_id: str, db_path: str = DB_PATH) -> bool:
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute(
            """
            UPDATE slots
            SET booking_status = 'CONFIRMED', soft_lock_until = 0
            WHERE slot_id = ?
            """,
            (slot_id,)
        )
        await db.commit()
        return cursor.rowcount > 0

async def create_booking(booking: BookingRecord, db_path: str = DB_PATH) -> None:
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            """
            INSERT INTO bookings (
                booking_id, negotiation_id, lot_id, slot_id, plate_number,
                hours, agreed_rate_paise, total_paise, usd_cents,
                status, paypal_order_id, qr_token, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                booking.booking_id, booking.negotiation_id, booking.lot_id, booking.slot_id,
                booking.plate_number, booking.hours, booking.agreed_rate_paise,
                booking.total_paise, booking.usd_cents, booking.status,
                booking.paypal_order_id, booking.qr_token, booking.created_at
            )
        )
        await db.commit()

async def get_booking(booking_id: str, db_path: str = DB_PATH) -> Optional[dict]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None

async def update_booking_payment(
    booking_id: str,
    paypal_order_id: str,
    qr_token: str,
    status: str = "CONFIRMED",
    db_path: str = DB_PATH
) -> bool:
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute(
            """
            UPDATE bookings
            SET paypal_order_id = ?, qr_token = ?, status = ?
            WHERE booking_id = ?
            """,
            (paypal_order_id, qr_token, status, booking_id)
        )
        await db.commit()
        return cursor.rowcount > 0

async def update_slot_sensor(
    lot_id: str,
    slot_id: str,
    occupied: bool,
    db_path: str = DB_PATH
) -> bool:
    async with aiosqlite.connect(db_path) as db:
        cursor = await db.execute(
            """
            UPDATE slots
            SET sensor_occupied = ?
            WHERE lot_id = ? AND slot_id = ?
            """,
            (1 if occupied else 0, lot_id, slot_id)
        )
        await db.commit()
        return cursor.rowcount > 0
