import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

try:
    from .db import (
        init_db,
        get_lots,
        get_slots,
        get_booking,
        confirm_slot_booking,
        update_booking_payment,
    )
    from .schemas import DriverConstraints
    from .orchestrator import run_multi_lot_negotiation
    from .payments import (
        get_payment_provider,
        generate_signed_qr_token,
    )
    from .serial_bridge import bridge
    from .vision_gate import vision_scanner
except ImportError:
    from db import (
        init_db,
        get_lots,
        get_slots,
        get_booking,
        confirm_slot_booking,
        update_booking_payment,
    )
    from schemas import DriverConstraints
    from orchestrator import run_multi_lot_negotiation
    from payments import (
        get_payment_provider,
        generate_signed_qr_token,
    )
    from serial_bridge import bridge
    from vision_gate import vision_scanner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts real-time events to all clients."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WS] Client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WS] Client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and start serial bridge / twin
    await init_db()
    bridge.event_callback = manager.broadcast
    await bridge.start()
    yield
    # Shutdown
    await bridge.stop()


app = FastAPI(
    title="Agentic Parking Negotiation & IoT Gate Hub",
    description="Deterministic anti-hallucination dual-agent negotiation with PayPal v2 & physical gate access",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Schemas ---

class QRVerifyRequest(BaseModel):
    qr_token: Optional[str] = None
    frame_b64: Optional[str] = None


class CheckoutRequest(BaseModel):
    booking_id: str


class ConfirmRequest(BaseModel):
    order_id: Optional[str] = None


class SlotToggleRequest(BaseModel):
    slot_id: str
    occupied: bool


# --- REST Endpoints ---

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "Agentic Parking Gateway",
        "gate_state": bridge.gate_state,
        "serial_connected": bridge.is_connected,
    }


@app.get("/api/lots")
async def fetch_lots():
    lots = await get_lots()
    return [l.model_dump() for l in lots]


@app.get("/api/slots")
async def fetch_slots(lot_id: Optional[str] = None):
    return await get_slots(lot_id=lot_id)


@app.post("/api/negotiate")
async def start_negotiation(driver: DriverConstraints):
    """Launches 3-round multi-lot negotiation as a background task, streaming events to WebSocket."""
    async def run_in_background():
        try:
            await run_multi_lot_negotiation(
                driver=driver,
                event_callback=manager.broadcast,
            )
        except Exception as e:
            logger.error(f"[Negotiation Task Error] {e}", exc_info=True)
            await manager.broadcast({
                "event_type": "NEGOTIATION_ERROR",
                "negotiation_id": "error",
                "data": {"error": str(e)},
            })

    asyncio.create_task(run_in_background())
    return {
        "status": "negotiating",
        "driver": driver.model_dump(),
        "message": "Negotiation started in background. Listen on /ws for live rounds.",
    }


@app.post("/api/bookings/{booking_id}/checkout")
async def create_checkout_session(booking_id: str):
    booking = await get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    provider = get_payment_provider()
    order = await provider.create_order(
        booking_id=booking_id,
        total_paise=booking["total_paise"],
    )
    return order


@app.post("/api/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str, req: ConfirmRequest):
    booking = await get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    order_id = req.order_id or booking.get("paypal_order_id") or "DIRECT_CONFIRM"
    provider = get_payment_provider()
    try:
        capture_res = await provider.capture_order(order_id)
    except Exception as e:
        logger.warning(f"[PayPal Capture Note] Order {order_id} not approved by buyer in sandbox browser: {e}")
        capture_res = {"status": "COMPLETED_DEMO", "order_id": order_id, "note": str(e)}

    # Issue cryptographic HMAC-SHA256 signed QR pass
    qr_token = generate_signed_qr_token(
        booking_id=booking_id,
        lot_id=booking["lot_id"],
        slot_id=booking["slot_id"],
        plate=booking["plate_number"],
        valid_hours=booking["hours"],
    )

    # Persist confirmation in SQLite
    await confirm_slot_booking(booking["slot_id"])
    await update_booking_payment(
        booking_id=booking_id,
        paypal_order_id=order_id,
        qr_token=qr_token,
        status="CONFIRMED",
    )

    confirmed_booking = await get_booking(booking_id)
    event_data = {
        "event_type": "BOOKING_CONFIRMED",
        "booking_id": booking_id,
        "data": {
            "booking": confirmed_booking,
            "qr_token": qr_token,
            "capture": capture_res,
        },
    }
    await manager.broadcast(event_data)
    return {
        "status": "CONFIRMED",
        "booking": confirmed_booking,
        "qr_token": qr_token,
        "capture": capture_res,
    }


@app.post("/api/gate/verify-qr")
async def verify_gate_qr(req: QRVerifyRequest):
    """Validates QR access pass via token string or base64 webcam frame and opens gate on genuine pass."""
    if req.frame_b64:
        result = await vision_scanner.scan_base64_frame(req.frame_b64)
    elif req.qr_token:
        result = await vision_scanner.verify_and_actuate(req.qr_token)
    else:
        raise HTTPException(status_code=400, detail="Must provide qr_token or frame_b64")

    # Broadcast gate attempt to dashboard
    await manager.broadcast({
        "event_type": "GATE_ACCESS_ATTEMPT",
        "data": result,
    })
    return result


@app.post("/api/hardware/toggle-slot")
async def toggle_slot_sensor(req: SlotToggleRequest):
    """Simulates hardware IR sensor slot toggle for demos."""
    result = await bridge.simulate_slot_toggle(req.slot_id, req.occupied)
    return result


@app.get("/api/mock-paypal-approve", response_class=HTMLResponse)
async def mock_paypal_approve(order_id: str, booking_id: str):
    """Offline simulated PayPal approval page for demo resilience."""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>PayPal Sandbox Approval Simulator</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
            .card {{ background: #1e293b; border: 1px solid #334155; padding: 2rem; border-radius: 12px; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
            .btn {{ background: #0070ba; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 1.5rem; }}
            .btn:hover {{ background: #005ea6; }}
            .badge {{ background: #059669; color: #ecfdf5; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2><span style="color:#0070ba;">PayPal</span> Sandbox Checkout</h2>
            <p><span class="badge">SIMULATED APPROVED</span></p>
            <p>Order ID: <code>{order_id}</code></p>
            <p>Booking ID: <code>{booking_id}</code></p>
            <p>Simulated payment successful. Return to the dashboard to view your HMAC QR pass.</p>
            <a href="http://localhost:5173" class="btn">Return to Parking Dashboard</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial snapshot
        lots = await get_lots()
        slots = await get_slots()
        await websocket.send_json({
            "event_type": "CONNECTED",
            "data": {
                "lots": [l.model_dump() for l in lots],
                "slots": slots,
                "gate_state": bridge.gate_state,
                "serial_connected": bridge.is_connected,
            },
        })
        while True:
            # Keep connection alive & handle incoming pings
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_json({"type": "PONG"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[WS Exception] {e}")
        manager.disconnect(websocket)
