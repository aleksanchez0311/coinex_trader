from app.services.binance_service import get_price, get_klines
from app.utils.indicators import add_indicators, detect_structure, detect_liquidity_sweep
from app.core.config import config

def score_trade(structure, rr, liquidity):
    score = 0

    if structure != "RANGE":
        score += 3

    if rr >= 2:
        score += 3
    elif rr >= 1.5:
        score += 2

    if liquidity != "NONE":
        score += 2

    return min(score, 10)


def generate_ai_narrative(analysis):

    if not config.OPENAI_API_KEY:
        return "IA no configurada"

    try:
        from openai import OpenAI
        client = OpenAI(api_key=config.OPENAI_API_KEY)

        prompt = f"""
Actúa como trader institucional.

Precio: {analysis['price']}
Bias: {analysis['bias']}
Estructura: {analysis['structure']}
Liquidez: {analysis['liquidity']}
ATR: {analysis['atr']}
Entrada: {analysis['entry']}
SL: {analysis['sl']}
TP: {analysis['tp']}
RR: {analysis['rr']}

Explica el trade con lógica Smart Money.
"""

        response = client.chat.completions.create(
            model=config.MODEL,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Error IA: {str(e)}"


def analyze(symbol: str):

    price = get_price(symbol)
    df = add_indicators(get_klines(symbol))

    atr = df['atr'].iloc[-1]
    structure = detect_structure(df)
    liquidity = detect_liquidity_sweep(df)

    if structure == "BULLISH":
        bias = "LONG"
        sl = price - atr
        tp = price + (2 * atr)

    elif structure == "BEARISH":
        bias = "SHORT"
        sl = price + atr
        tp = price - (2 * atr)

    else:
        return {"bias": "NO TRADE"}

    rr = abs(tp - price) / abs(price - sl)
    score = score_trade(structure, rr, liquidity)

    return {
        "price": price,
        "atr": atr,
        "structure": structure,
        "liquidity": liquidity,
        "bias": bias,
        "entry": price,
        "sl": sl,
        "tp": tp,
        "rr": rr,
        "score": score
    }