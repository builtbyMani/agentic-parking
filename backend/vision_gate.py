import base64
import logging
import time
from typing import Optional, Tuple, Dict, Any

import cv2
import numpy as np

try:
    from .payments import verify_signed_qr_token
    from .serial_bridge import bridge
except ImportError:
    from payments import verify_signed_qr_token
    from serial_bridge import bridge

logger = logging.getLogger("vision_gate")


class VisionGateScanner:
    def __init__(self, cooldown_sec: float = 5.0):
        self.detector = cv2.QRCodeDetector()
        self.last_trigger_time: float = 0
        self.cooldown_sec: float = cooldown_sec

    def decode_frame(self, frame: np.ndarray) -> Tuple[bool, str]:
        """Detects and decodes QR payload from an OpenCV image frame."""
        if frame is None or frame.size == 0:
            return False, ""
        decoded_info, points, _ = self.detector.detectAndDecode(frame)
        if decoded_info:
            return True, decoded_info.strip()
        return False, ""

    async def verify_and_actuate(self, qr_text: str) -> Dict[str, Any]:
        """Validates cryptographic HMAC QR pass and actuates gate upon genuine token presentation."""
        ok, result = verify_signed_qr_token(qr_text)
        if not ok:
            logger.warning(f"[Vision Gate] Access Denied: {result}")
            return {
                "status": "ACCESS_DENIED",
                "valid": False,
                "reason": str(result),
            }

        now = time.time()
        if now - self.last_trigger_time < self.cooldown_sec:
            remaining = round(self.cooldown_sec - (now - self.last_trigger_time), 1)
            return {
                "status": "COOLDOWN_ACTIVE",
                "valid": True,
                "message": f"Gate was recently actuated. Cooldown active ({remaining}s remaining).",
                "pass_data": result,
            }

        # Valid cryptographic pass!
        self.last_trigger_time = now
        logger.info(f"[Vision Gate] Access Granted for booking: {result.get('bid')} at slot {result.get('slot')}")
        gate_res = await bridge.trigger_gate_open(5.0)

        return {
            "status": "ACCESS_GRANTED",
            "valid": True,
            "pass_data": result,
            "gate": gate_res,
        }

    async def process_image_file(self, image_path: str) -> Dict[str, Any]:
        """Reads image file from disk, scans for QR pass, and executes access verification."""
        frame = cv2.imread(image_path)
        if frame is None:
            return {"status": "ERROR", "reason": f"Could not read image file at {image_path}"}
        found, text = self.decode_frame(frame)
        if not found:
            return {"status": "NO_QR_DETECTED", "reason": "No QR code detected in image"}
        return await self.verify_and_actuate(text)

    async def scan_base64_frame(self, b64_img: str) -> Dict[str, Any]:
        """Decodes base64 JPEG/PNG from web frontend video stream and verifies access pass."""
        try:
            if "," in b64_img:
                b64_img = b64_img.split(",", 1)[1]
            img_bytes = base64.b64decode(b64_img)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            return {"status": "ERROR", "reason": f"Invalid base64 frame: {e}"}

        found, text = self.decode_frame(frame)
        if not found:
            return {"status": "NO_QR_DETECTED", "reason": "No QR code detected in frame"}
        return await self.verify_and_actuate(text)


vision_scanner = VisionGateScanner()
