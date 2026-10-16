import asyncio
import logging
from typing import Callable, Optional
import aiosqlite

from backend.config import ESP32_SERIAL_PORT, DB_PATH
from backend.db import update_slot_sensor

logger = logging.getLogger("serial_bridge")


class SerialBridge:
    def __init__(self, port: Optional[str] = None, baudrate: int = 115200):
        self.port = port if port is not None else ESP32_SERIAL_PORT
        self.baudrate = baudrate
        self.is_connected = False
        self.gate_state = "CLOSED"  # "CLOSED" | "OPEN"
        self.serial_conn = None
        self.event_callback: Optional[Callable] = None
        self._reader_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        """Starts serial background listener or initializes virtual hardware twin."""
        if not self.port:
            logger.info("[Virtual Twin] ESP32_SERIAL_PORT not set. Operating in virtual twin mode.")
            self.is_connected = False
            return

        try:
            import serial
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=0.1)
            self.is_connected = True
            logger.info(f"[Serial Bridge] Connected to ESP32 on {self.port} at {self.baudrate} baud.")
            self._reader_task = asyncio.create_task(self._read_serial_loop())
        except Exception as e:
            logger.warning(
                f"[Virtual Twin] Failed to open {self.port}: {e}. "
                "Operating in software virtual twin mode."
            )
            self.is_connected = False

    async def stop(self) -> None:
        if self._reader_task:
            self._reader_task.cancel()
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
        self.is_connected = False

    async def _read_serial_loop(self) -> None:
        while self.is_connected and self.serial_conn:
            try:
                line = await asyncio.to_thread(self.serial_conn.readline)
                if line:
                    decoded = line.decode("utf-8", errors="ignore").strip()
                    if decoded:
                        await self.handle_serial_line(decoded)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[Serial Bridge] Read error: {e}")
                await asyncio.sleep(1.0)
            await asyncio.sleep(0.01)

    async def handle_serial_line(self, line: str) -> None:
        """Parses telemetry strings emitted by ESP32 firmware."""
        logger.info(f"[Serial Inbound] {line}")
        # Telemetry: SLOT:A-01:OCCUPIED or SLOT:A-01:VACANT
        if line.startswith("SLOT:"):
            parts = line.split(":")
            if len(parts) >= 3:
                slot_id = parts[1].strip()
                status = parts[2].strip()
                is_occupied = (status == "OCCUPIED")
                # Default lot_id is LOT_A for slot A-01/A-02
                lot_id = "LOT_A" if slot_id.startswith("A-") else ("LOT_B" if slot_id.startswith("B-") else "LOT_C")
                await update_slot_sensor(lot_id, slot_id, is_occupied)
                if self.event_callback:
                    event = {
                        "event_type": "SLOT_SENSOR_CHANGED",
                        "data": {
                            "lot_id": lot_id,
                            "slot_id": slot_id,
                            "occupied": is_occupied,
                            "source": "HARDWARE_IR" if self.is_connected else "VIRTUAL_TWIN",
                        },
                    }
                    if asyncio.iscoroutinefunction(self.event_callback):
                        await self.event_callback(event)
                    else:
                        self.event_callback(event)

        elif line in ("GATE:OPENED", "GATE:OPEN"):
            self.gate_state = "OPEN"
            if self.event_callback:
                event = {"event_type": "GATE_OPENED", "data": {"gate_state": "OPEN", "source": "HARDWARE_ESP32"}}
                if asyncio.iscoroutinefunction(self.event_callback):
                    await self.event_callback(event)
                else:
                    self.event_callback(event)

        elif line == "GATE:CLOSED":
            self.gate_state = "CLOSED"
            if self.event_callback:
                event = {"event_type": "GATE_CLOSED", "data": {"gate_state": "CLOSED", "source": "HARDWARE_ESP32"}}
                if asyncio.iscoroutinefunction(self.event_callback):
                    await self.event_callback(event)
                else:
                    self.event_callback(event)

    async def trigger_gate_open(self, duration_sec: float = 5.0) -> dict:
        """Actuates servo gate open and automatically returns to closed after duration."""
        self.gate_state = "OPEN"
        # 1. Send physical command to ESP32 if connected
        if self.is_connected and self.serial_conn:
            try:
                await asyncio.to_thread(self.serial_conn.write, b"GATE:OPEN\n")
            except Exception as e:
                logger.error(f"[Serial Bridge] Failed to send GATE:OPEN: {e}")

        # 2. Emit GATE_OPENED event
        if self.event_callback:
            event = {
                "event_type": "GATE_OPENED",
                "data": {
                    "gate_state": "OPEN",
                    "duration_sec": duration_sec,
                    "mode": "PHYSICAL_SERVO" if self.is_connected else "VIRTUAL_TWIN",
                },
            }
            if asyncio.iscoroutinefunction(self.event_callback):
                await self.event_callback(event)
            else:
                self.event_callback(event)

        # 3. Schedule auto-close window
        asyncio.create_task(self._auto_close_gate(duration_sec))
        return {
            "status": "GATE_OPENED",
            "duration_sec": duration_sec,
            "mode": "PHYSICAL_SERVO" if self.is_connected else "VIRTUAL_TWIN",
        }

    async def _auto_close_gate(self, duration_sec: float) -> None:
        await asyncio.sleep(duration_sec)
        self.gate_state = "CLOSED"
        if self.event_callback:
            event = {
                "event_type": "GATE_CLOSED",
                "data": {
                    "gate_state": "CLOSED",
                    "mode": "PHYSICAL_SERVO" if self.is_connected else "VIRTUAL_TWIN",
                },
            }
            if asyncio.iscoroutinefunction(self.event_callback):
                await self.event_callback(event)
            else:
                self.event_callback(event)

    async def simulate_slot_toggle(self, slot_id: str, occupied: bool) -> dict:
        """Software simulator trigger for testing and demos when hardware is unplugged."""
        line = f"SLOT:{slot_id}:{'OCCUPIED' if occupied else 'VACANT'}"
        await self.handle_serial_line(line)
        return {"slot_id": slot_id, "occupied": occupied, "mode": "VIRTUAL_TWIN"}


# Global singleton instance
bridge = SerialBridge()
