# =============================
# 🚀 TRADING BACKEND PRO v3 (ELITE)
# Smart Money + Multi-Timeframe + Score + AI
# =============================

# pip install fastapi uvicorn requests pandas numpy ta openai

import os
import requests
import pandas as pd
import ta
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

# =============================
# ⚙️ CONFIG
# =============================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = "gpt-4o-mini"

# =============================
# 🚀 APP
# =============================

app = FastAPI(title="Elite Trading API")

# =============================
# 📥 INPUT
# =============================

class TradeRequest(BaseModel):
    symbol: str
    capital: float
    risk_percent: float = 30
    leverage: int = 20

# =============================
# 🔌 BINANCE
# =============================

BASE_URL = "https://api.binance.com/api/v3"

def get_price(symbol):
    return float(requests.get(f"{BASE_URL}/ticker/price", params={"symbol": symbol}).json()["price"])


def get_klines(symbol, interval, limit=200):
    data = requests.get(f"{BASE_URL}/klines", params={
        "symbol": symbol,
        "interval": interval,
        "limit": limit
    }).json()

    return pd.DataFrame([{ 
        "open": float(k[1]),
        "high": float(k[2]),
        "low": float(k[3]),
        "close": float(k[4]),
        "volume": float(k[5])
    } for k in data])

# =============================
# 📊 INDICADORES
# =============================

def add_indicators(df):
    df['atr'] = ta.volatility.AverageTrueRange(df['high'], df['low'], df['close'], window=14).average_true_range()
    return df

# =============================
# 🧠 SMART MONEY
# =============================

def detect_structure(df):
    if df['high'].iloc[-1] > df['high'].iloc[-5]:
        return "BULLISH"
    elif df['low'].iloc[-1] < df['low'].iloc[-5]:
        return "BEARISH"
    return "RANGE"


def detect_liquidity(df):
    if df['low'].iloc[-1] < df['low'].iloc[-5]:
        return "SELL_SIDE_LIQUIDITY"
    elif df['high'].iloc[-1] > df['high'].iloc[-5]:
        return "BUY_SIDE_LIQUIDITY"
    return "NONE"


def detect_order_block(df):
    # Última vela contraria antes de movimiento fuerte
    last = df.iloc[-2]
    prev = df.iloc[-3]

    if last['close'] < last['open'] and df['close'].iloc[-1] > last['high']:
        return "BULLISH_OB"

    if last['close'] > last['open'] and df['close'].iloc[-1] < last['low']:
        return "BEARISH_OB"

    return "NONE"

# =============================
# 💰 RISK
# =============================

def calculate_position(capital, risk_percent, entry, sl, leverage):
    risk_amount = capital * (risk_percent / 100)
    distance = abs(entry - sl)
    position_size = (risk_amount * leverage) / distance

    return {
        "risk_amount": risk_amount,
        "position_size": position_size
    }

# =============================
# 🎯 SCORE PRO
# =============================

def score_trade(structure, rr, liquidity, ob):
    score = 0

    if structure != "RANGE": score += 3
    if rr >= 2: score += 3
    elif rr >= 1.5: score += 2
    if liquidity != "NONE": score += 2
    if ob != "NONE": score += 2

    return min(score, 10)

# =============================
# 🤖 AI NARRATIVE
# =============================

def ai_narrative(data):
    if not OPENAI_API_KEY:
        return "Configura OPENAI_API_KEY"

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        prompt = f"""
Actúa como trader institucional experto en Smart Money Concepts.

Datos:
{data}

Explica:
- Qué hizo el precio
- Dónde tomó liquidez
- Si hay manipulación
- Por qué es buena o mala entrada
"""

        res = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}]
        )

        return res.choices[0].message.content

    except Exception as e:
        return str(e)

# =============================
# 🔥 ANALYSIS CORE (MTF)
# =============================

def analyze(symbol):

    price = get_price(symbol)

    # MULTI TIMEFRAME
    df_5m = add_indicators(get_klines(symbol, "5m"))
    df_1h = add_indicators(get_klines(symbol, "1h"))

    structure_1h = detect_structure(df_1h)
    structure_5m = detect_structure(df_5m)

    liquidity = detect_liquidity(df_5m)
    ob = detect_order_block(df_5m)

    atr = df_5m['atr'].iloc[-1]

    # CONFIRMACIÓN
    if structure_1h == "BULLISH" and structure_5m == "BULLISH":
        bias = "LONG"
        sl = price - atr
        tp = price + (2 * atr)

    elif structure_1h == "BEARISH" and structure_5m == "BEARISH":
        bias = "SHORT"
        sl = price + atr
        tp = price - (2 * atr)

    else:
        return {"bias": "NO TRADE"}

    rr = abs(tp - price) / abs(price - sl)
    score = score_trade(structure_1h, rr, liquidity, ob)

    return {
        "price": price,
        "bias": bias,
        "structure_htf": structure_1h,
        "structure_ltf": structure_5m,
        "liquidity": liquidity,
        "order_block": ob,
        "entry": price,
        "sl": sl,
        "tp": tp,
        "rr": rr,
        "score": score
    }

# =============================
# 🚀 ENDPOINT
# =============================

@app.post("/analyze")
def run(req: TradeRequest):

    analysis = analyze(req.symbol)

    if analysis.get("bias") == "NO TRADE":
        return analysis

    risk = calculate_position(req.capital, req.risk_percent, analysis['entry'], analysis['sl'], req.leverage)

    narrative = ai_narrative(analysis)

    return {
        "timestamp": datetime.utcnow(),
        "analysis": analysis,
        "risk": risk,
        "narrative": narrative,
        "valid": analysis['score'] >= 7
    }

# =============================
# ❤️ HEALTH
# =============================

@app.get("/health")
def health():
    return {"status": "ok"}
