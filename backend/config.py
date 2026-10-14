import os
from pathlib import Path

# Load .env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

USD_TO_INR_PAISE: int = int(os.environ.get("USD_TO_INR_PAISE", "8400"))
HMAC_SECRET_KEY: str = os.environ.get("HMAC_SECRET_KEY", "super-secret-demo-hmac-key-2026")
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
LLM_MODE: str = os.environ.get("LLM_MODE", "mock_adversarial")
PAYMENT_MODE: str = os.environ.get("PAYMENT_MODE", "paypal_sandbox")
PAYPAL_CLIENT_ID: str = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET: str = os.environ.get("PAYPAL_CLIENT_SECRET", "")
PAYPAL_ENV: str = os.environ.get("PAYPAL_ENV", "SANDBOX")
ESP32_SERIAL_PORT: str = os.environ.get("ESP32_SERIAL_PORT", "")
DB_PATH: str = os.environ.get("DB_PATH", "parking.db")
