import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from backend.db import (
    init_db,
    get_lots,
    get_slots,
    get_booking,
    set_booking_order_id,
    confirm_slot_booking,
    update_booking_payment,
)
from backend.schemas import DriverConstraints
from backend.orchestrator import run_multi_lot_negotiation
from backend.payments import (
    get_payment_provider,
    generate_signed_qr_token,
)
from backend.serial_bridge import bridge
from backend.vision_gate import vision_scanner
from backend.config import FRONTEND_URL

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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Schemas ---

class QRVerifyRequest(BaseModel):
    qr_token: Optional[str] = None
    frame_b64: Optional[str] = Field(None, max_length=15_000_000)


class CheckoutRequest(BaseModel):
    booking_id: str


class ConfirmRequest(BaseModel):
    order_id: Optional[str] = None


class SlotToggleRequest(BaseModel):
    slot_id: str
    occupied: bool


# Active background task references to avoid GC / untracked failures
active_negotiation_tasks: set[asyncio.Task] = set()


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

    task = asyncio.create_task(run_in_background())
    active_negotiation_tasks.add(task)
    task.add_done_callback(active_negotiation_tasks.discard)
    return {
        "status": "negotiating",
        "driver": driver.model_dump(),
        "message": "Negotiation started in background. Listen on /ws for live rounds.",
    }


async def execute_booking_confirmation(booking: dict, order_id: str, capture_res: dict) -> tuple[dict, str]:
    booking_id = booking["booking_id"]
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
    return confirmed_booking, qr_token


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
    if order.get("order_id"):
        await set_booking_order_id(booking_id, order["order_id"])
    return order


@app.post("/api/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str, req: ConfirmRequest):
    booking = await get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Idempotent: If already confirmed with QR token, return existing pass
    if booking.get("status") == "CONFIRMED" and booking.get("qr_token"):
        return {
            "status": "CONFIRMED",
            "booking": booking,
            "qr_token": booking["qr_token"],
            "capture": {"status": "COMPLETED", "order_id": booking.get("paypal_order_id")},
        }

    order_id = req.order_id or booking.get("paypal_order_id")
    if not order_id:
        raise HTTPException(
            status_code=400,
            detail="Missing required order_id. Payment must be initiated and approved before confirmation.",
        )

    # Bind the order to this booking: confirmation requires a checkout first,
    # and the presented order id must be the one issued for this booking.
    # Anything else (fabricated id, or an id issued for another booking) is
    # rejected as forged — payment can never be bypassed or borrowed.
    recorded_order_id = booking.get("paypal_order_id")
    if not recorded_order_id:
        raise HTTPException(
            status_code=402,
            detail="No payment order was issued for this booking. Complete checkout first. Gate pass denied.",
        )
    if order_id != recorded_order_id:
        raise HTTPException(
            status_code=402,
            detail=f"Order ID '{order_id}' does not match the order issued for this booking. Gate pass denied.",
        )

    provider = get_payment_provider()
    try:
        capture_res = await provider.capture_order(order_id)
    except Exception as e:
        logger.error(f"[PayPal Capture Error] Order {order_id} failed: {e}")
        raise HTTPException(
            status_code=402,
            detail=f"Payment capture failed or order not approved by buyer: {str(e)}. Gate pass denied.",
        )

    if not isinstance(capture_res, dict) or capture_res.get("status") != "COMPLETED":
        status_val = capture_res.get("status") if isinstance(capture_res, dict) else "FAILED"
        raise HTTPException(
            status_code=402,
            detail=f"PayPal order status '{status_val}' is not COMPLETED. Gate pass denied.",
        )

    confirmed_booking, qr_token = await execute_booking_confirmation(booking, order_id, capture_res)
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


@app.get("/api/paypal-return", response_class=HTMLResponse)
async def paypal_return(
    booking_id: str,
    token: Optional[str] = None,
    order_id: Optional[str] = None,
    PayerID: Optional[str] = None,
):
    """
    PayPal v2 Checkout approval redirect landing page.
    Captures order, confirms booking, issues HMAC QR pass, and notifies connected clients via WebSocket.
    """
    effective_order_id = token or order_id
    booking = await get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found")

    if not effective_order_id:
        effective_order_id = booking.get("paypal_order_id")

    if not effective_order_id:
        raise HTTPException(status_code=400, detail="Missing order ID token in PayPal return callback")

    # Same order-to-booking binding as /confirm: reject forged return tokens.
    recorded_order_id = booking.get("paypal_order_id")
    if not recorded_order_id:
        raise HTTPException(
            status_code=402,
            detail="No payment order was issued for this booking. Complete checkout first. Gate pass denied.",
        )
    if effective_order_id != recorded_order_id:
        raise HTTPException(
            status_code=402,
            detail=f"Order ID '{effective_order_id}' does not match the order issued for this booking. Gate pass denied.",
        )

    provider = get_payment_provider()
    # Check if already confirmed (idempotent)
    if booking.get("status") == "CONFIRMED" and booking.get("qr_token"):
        qr_token = booking["qr_token"]
        confirmed_booking = booking
    else:
        try:
            capture_res = await provider.capture_order(effective_order_id)
        except Exception as e:
            logger.error(f"[PayPal Return Capture Error] {e}")
            raise HTTPException(
                status_code=402,
                detail=f"PayPal capture failed: {str(e)}. Gate pass denied."
            )

        if not isinstance(capture_res, dict) or capture_res.get("status") != "COMPLETED":
            status_val = capture_res.get("status") if isinstance(capture_res, dict) else "FAILED"
            raise HTTPException(
                status_code=402,
                detail=f"PayPal status '{status_val}' is not COMPLETED. Gate pass denied."
            )

        confirmed_booking, qr_token = await execute_booking_confirmation(booking, effective_order_id, capture_res)

    paid_rupees = round(confirmed_booking.get("total_paise", 0) / 100)
    usd_str = f"{(confirmed_booking.get('usd_cents', 0) / 100):.2f}"
    slot_str = confirmed_booking.get("slot_id", "A-01")
    lot_str = confirmed_booking.get("lot_id", "LOT_A")

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Approved — Agentic Parking Pass</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }}
            .card {{ background: #1e293b; border: 1px solid #334155; padding: 2.5rem 2rem; border-radius: 16px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }}
            .badge {{ background: #065f46; color: #34d399; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; border: 1px solid #059669; display: inline-block; margin-bottom: 1rem; }}
            .token-box {{ background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 0.75rem; font-family: monospace; font-size: 0.75rem; color: #94a3b8; word-break: break-all; margin: 1rem 0; text-align: left; }}
            .btn {{ background: #10b981; color: #022c22; padding: 0.85rem 1.75rem; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-block; margin-top: 1.25rem; font-size: 0.95rem; transition: background 0.2s; }}
            .btn:hover {{ background: #059669; }}
            h2 {{ margin: 0 0 0.5rem; color: #ffffff; }}
            p {{ color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0.5rem 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #334155; font-size: 0.85rem; }}
            .detail-label {{ color: #64748b; }}
            .detail-val {{ font-weight: 600; color: #f8fafc; }}
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">PAYMENT CAPTURED &amp; VERIFIED</span>
            <h2>Reservation Confirmed!</h2>
            <p>Your PayPal payment was successfully captured. Slot <strong>{slot_str}</strong> is reserved and your cryptographic gate pass has been issued.</p>
            
            <div style="margin: 1.5rem 0; text-align: left;">
                <div class="detail-row">
                    <span class="detail-label">Booking ID</span>
                    <span class="detail-val">{booking_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Lot / Slot</span>
                    <span class="detail-val">{lot_str} / Slot {slot_str}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">PayPal Order</span>
                    <span class="detail-val">{effective_order_id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Paid</span>
                    <span class="detail-val">₹{paid_rupees} (${usd_str} USD)</span>
                </div>
            </div>

            <div class="token-box">
                <strong style="color: #38bdf8;">HMAC-SHA256 Token:</strong><br/>
                {qr_token}
            </div>

            <p style="font-size: 0.8rem; color: #64748b;">Your dashboard was updated automatically in real time via WebSocket.</p>
            <a href="{FRONTEND_URL}" class="btn">Open Parking Dashboard</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/api/paypal-cancel", response_class=HTMLResponse)
async def paypal_cancel(booking_id: str, token: Optional[str] = None):
    """PayPal buyer cancellation return landing page."""
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Cancelled</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem; }}
            .card {{ background: #1e293b; border: 1px solid #334155; padding: 2rem; border-radius: 16px; max-width: 440px; width: 100%; text-align: center; }}
            .badge {{ background: #7f1d1d; color: #fca5a5; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; border: 1px solid #b91c1c; display: inline-block; margin-bottom: 1rem; }}
            .btn {{ background: #334155; color: #f8fafc; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 1.25rem; font-size: 0.9rem; }}
            .btn:hover {{ background: #475569; }}
            p {{ color: #94a3b8; font-size: 0.9rem; }}
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">CHECKOUT CANCELLED</span>
            <h2>PayPal Payment Not Completed</h2>
            <p>Booking <code>{booking_id}</code> was not charged. No gate pass has been issued.</p>
            <a href="{FRONTEND_URL}" class="btn">Return to Dashboard</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.post("/api/paypal-webhook")
async def paypal_webhook(payload: dict = Body(...)):
    """Receives asynchronous PayPal webhooks (e.g. PAYMENT.CAPTURE.COMPLETED, CHECKOUT.ORDER.APPROVED)."""
    event_type = payload.get("event_type", "UNKNOWN")
    resource = payload.get("resource", {})
    logger.info(f"[PayPal Webhook] Event: {event_type}")
    order_id = resource.get("id") or resource.get("supplementary_data", {}).get("related_ids", {}).get("order_id")
    return {"status": "received", "event_type": event_type, "order_id": order_id}


@app.get("/api/mock-paypal-approve", response_class=HTMLResponse)
async def mock_paypal_approve(order_id: str, booking_id: str):
    """Offline simulated PayPal approval page redirecting to paypal_return."""
    return await paypal_return(booking_id=booking_id, token=order_id)


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
