import os
from dotenv import load_dotenv
from typing import Dict
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import time
from engines.analysis import AnalysisEngine
from engines.scoring import ScoringEngine
from engines.risk import RiskEngine
from utils.exchange_clients import TradingClient, MarketDataClient
from models.trading import AnalysisRequest, RiskRequest, TradeExecutionRequest

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="CoinEx Trader API")

ohlcv_cache: Dict[str, tuple] = {}
derivatives_cache: Dict[str, tuple] = {}
CACHE_TTL = 30
market_client = MarketDataClient()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(req, exc):
    print(f"DEBUG: 422 Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


# Configuración de CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "online", "message": "Quant Trader Engine Ready"}


@app.post("/analyze")
async def analyze_pair(req: AnalysisRequest):
    cache_key = f"{req.symbol}:{req.timeframe}:{req.api_key[:8] if req.api_key else ''}"
    current_time = time.time()

    if cache_key in ohlcv_cache:
        cached_time, cached_ohlcv = ohlcv_cache[cache_key]
        if current_time - cached_time < CACHE_TTL:
            ohlcv = cached_ohlcv
        else:
            ohlcv = market_client.get_ohlcv(req.symbol, req.timeframe)
            if not isinstance(ohlcv, dict) or "error" not in ohlcv:
                ohlcv_cache[cache_key] = (current_time, ohlcv)
    else:
        ohlcv = market_client.get_ohlcv(req.symbol, req.timeframe)
        if not isinstance(ohlcv, dict) or "error" not in ohlcv:
            ohlcv_cache[cache_key] = (current_time, ohlcv)

    if isinstance(ohlcv, dict) and "error" in ohlcv:
        raise HTTPException(status_code=400, detail=ohlcv["error"])

    derivatives = market_client.get_derivatives_data(req.symbol)
    derivatives_cache_key = f"derivatives:{req.symbol}"
    derivatives_cache[derivatives_cache_key] = (current_time, derivatives)

    df = pd.DataFrame(
        ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"]
    )

    engine = AnalysisEngine(df)
    analysis = engine.analyze_all()

    scoring = ScoringEngine()
    score_result = scoring.calculate_score(analysis)

    risk_engine = RiskEngine()
    risk_recommendations = risk_engine.get_recommendations(analysis, score_result)

    return {
        "symbol": req.symbol,
        "analysis": analysis,
        "scoring": score_result,
        "risk_recommendations": risk_recommendations,
        "derivatives": derivatives,
    }


@app.post("/risk-management")
async def calculate_risk(req: RiskRequest):
    print(f"DEBUG: Risk Management Request: {req}")
    risk_engine = RiskEngine()
    pos_data = risk_engine.calculate_position(
        req.capital, req.risk_pct, req.entry_price, req.stop_loss, req.leverage
    )

    # Determinar sesgo implícito basándose en entry vs SL
    bias = "Alcista" if req.entry_price > req.stop_loss else "Bajista"

    # Usar TP proporcionado o generar automáticamente
    if req.take_profit:
        plan = {
            "entry": req.entry_price,
            "stop_loss": req.stop_loss,
            "tp1": req.take_profit,
            "tp2": None,
            "tp3": None,
            "rr_ratio": round(
                abs(req.take_profit - req.entry_price)
                / abs(req.entry_price - req.stop_loss),
                2,
            ),
        }
    else:
        plan = risk_engine.get_trade_plan(req.entry_price, req.stop_loss, bias)

    return {"position": pos_data, "plan": plan}


@app.post("/execute-trade")
async def execute_trade(req: TradeExecutionRequest):
    print(f"DEBUG: Trade Execution Request: {req}")
    client = TradingClient(api_key=req.api_key, secret=req.secret)

    result = client.create_order_with_sl_tp(
        symbol=req.symbol,
        side=req.side,
        amount=req.amount,
        entry_price=req.entry_price,
        stop_loss=req.stop_loss,
        take_profit=req.take_profit,
        leverage=req.leverage,
        margin_mode=req.margin_mode,
        order_type=req.order_type,
    )

    if "error" in result:
        print(f"DEBUG: Trade Execution Error: {result['error']}")
        raise HTTPException(status_code=400, detail=result["error"])

    print(f"DEBUG: Trade Execution Success: {result}")
    return result


@app.post("/balance")
async def get_balance(req: Dict = Body(...)):
    """Obtiene el balance de la cuenta (Swap por defecto)"""
    api_key = req.get("api_key")
    secret = req.get("secret")

    client = TradingClient(api_key=api_key, secret=secret)
    balance = client.get_balance()

    if "error" in balance:
        raise HTTPException(status_code=400, detail=balance["error"])

    return balance


@app.post("/positions")
async def get_positions(req: Dict = Body(...)):
    """Obtiene las posiciones abiertas"""
    api_key = req.get("api_key")
    secret = req.get("secret")

    client = TradingClient(api_key=api_key, secret=secret)
    positions = client.get_positions()

    if isinstance(positions, dict) and "error" in positions:
        raise HTTPException(status_code=400, detail=positions["error"])

    return positions


@app.post("/close-position")
async def close_position(req: Dict = Body(...)):
    """Cierra una posición abierta"""
    api_key = req.get("api_key")
    secret = req.get("secret")
    symbol = req.get("symbol")
    side = req.get("side")
    amount = req.get("amount")

    client = TradingClient(api_key=api_key, secret=secret)
    result = client.close_position(symbol, side, amount)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.post("/pnl-stats")
async def get_pnl_stats(req: Dict = Body(...)):
    """Obtiene estadísticas de PnL realizado"""
    api_key = req.get("api_key")
    secret = req.get("secret")

    if not api_key or not secret:
        return {"total_pnl": 0, "count": 0, "message": "Sin credenciales configuradas"}

    client = TradingClient(api_key=api_key, secret=secret)
    stats = client.get_realized_pnl()

    if isinstance(stats, dict) and "error" in stats:
        raise HTTPException(status_code=400, detail=stats["error"])

    return stats


@app.get("/markets")
async def get_all_markets():
    """Obtiene todos los pares disponibles para futuros"""
    client = TradingClient()
    markets = client.get_all_markets()

    if isinstance(markets, dict) and "error" in markets:
        raise HTTPException(status_code=400, detail=markets["error"])

    return markets


@app.get("/top-gainers")
async def get_top_gainers_endpoint(limit: int = 20):
    """Obtiene el top de monedas con mayor porcentaje de crecimiento 24h"""
    gainers = market_client.get_top_gainers(limit=limit)

    if isinstance(gainers, dict) and "error" in gainers:
        raise HTTPException(status_code=400, detail=gainers["error"])

    return gainers


@app.get("/ticker/{symbol}")
async def get_ticker(symbol: str):
    """Obtiene precio actual y cambio 24h de un símbolo"""
    ticker = market_client.get_ticker(symbol)

    if isinstance(ticker, dict) and "error" in ticker:
        raise HTTPException(status_code=400, detail=ticker["error"])

    return ticker


@app.post("/tickers")
async def get_tickers_batch(req: Dict = Body(...)):
    """Obtiene precios de múltiples símbolos"""
    symbols = req.get("symbols", [])

    results = {}
    for symbol in symbols:
        ticker = market_client.get_ticker(symbol)
        if "error" not in ticker:
            results[symbol] = ticker

    return results


@app.get("/market-status")
async def get_status():
    # Helper para el dashboard
    return {
        "connected_to_coinex": True,
        "active_pairs": ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
