# BTC Intraday Trading Backend (FastAPI)
# Simple production-ready scaffold for signal generation + risk management

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Tuple, Dict
import random

app = FastAPI(title="BTC Intraday Trading Engine", version="1.0")


# ==========================
# CONFIG
# ==========================
CAPITAL = 30
LEVERAGE = 20
RISK_MAX = 0.5  # 50%


# ==========================
# MODELS
# ==========================
class MarketData(BaseModel):
    price: float


class SignalResponse(BaseModel):
    bias: str
    entry: Tuple[float, float] | None
    sl: float | None
    tp1: float | None
    tp2: float | None
    confidence: float
    rr: float | None


class RiskRequest(BaseModel):
    entry: float
    sl: float


# ==========================
# MARKET DATA (MOCK)
# ==========================
def get_btc_price() -> float:
    # Replace with Binance/CoinGecko API
    return 74400 + random.randint(-200, 200)


# ==========================
# STRATEGY ENGINE
# ==========================
def generate_signal(price: float) -> Dict:
    """
    Simplified liquidity + range strategy
    """

    # RANGE BIAS LOGIC
    if 74000 <= price <= 75500:
        bias = "SHORT"
        entry = (74300, 75200)
        sl = 76300
        tp1 = 71600
        tp2 = 69200
        confidence = 0.72

    elif price > 76200:
        bias = "LONG"
        entry = (76300, 76800)
        sl = 75000
        tp1 = 78000
        tp2 = None
        confidence = 0.65

    else:
        bias = "NO_TRADE"
        entry = None
        sl = None
        tp1 = None
        tp2 = None
        confidence = 0.4

    rr = None
    if entry and sl and tp1:
        risk = abs(entry[0] - sl)
        reward = abs(tp1 - entry[0])
        rr = round(reward / risk, 2) if risk != 0 else None

    return {
        "bias": bias,
        "entry": entry,
        "sl": sl,
        "tp1": tp1,
        "tp2": tp2,
        "confidence": confidence,
        "rr": rr
    }


# ==========================
# RISK ENGINE
# ==========================
def calculate_position_size(entry: float, sl: float) -> Dict:
    risk_amount = CAPITAL * RISK_MAX

    sl_distance_pct = abs(entry - sl) / entry
    if sl_distance_pct == 0:
        return {"error": "Invalid SL distance"}

    position_size = (risk_amount * LEVERAGE) / sl_distance_pct

    return {
        "risk_amount": risk_amount,
        "sl_distance_pct": round(sl_distance_pct * 100, 2),
        "position_size_usd": round(position_size, 2),
        "leverage": LEVERAGE
    }


# ==========================
# API ENDPOINTS
# ==========================
@app.get("/market/btc")
def market_price():
    price = get_btc_price()
    return {"price": price}


@app.post("/signal/generate", response_model=SignalResponse)
def signal(data: MarketData):
    return generate_signal(data.price)


@app.post("/risk/calc")
def risk(data: RiskRequest):
    return calculate_position_size(data.entry, data.sl)


@app.get("/health")
def health():
    return {"status": "ok"}


# ==========================
# RUN
# ==========================
# uvicorn main:app --reload
