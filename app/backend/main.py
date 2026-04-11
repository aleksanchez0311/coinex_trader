import os
from dotenv import load_dotenv
from typing import Dict
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from engines.analysis import AnalysisEngine
from engines.scoring import ScoringEngine
from engines.risk import RiskEngine
from utils.coinex_client import CoinExClient
from models.trading import AnalysisRequest, RiskRequest, TradeExecutionRequest

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="CoinEx Trader API")


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
    client = CoinExClient(api_key=req.api_key, secret=req.secret)
    ohlcv = client.get_market_data(req.symbol, req.timeframe)

    if isinstance(ohlcv, dict) and "error" in ohlcv:
        raise HTTPException(status_code=400, detail=ohlcv["error"])

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
    client = CoinExClient(api_key=req.api_key, secret=req.secret, is_paper=req.is_paper)

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
    is_paper = req.get("is_paper", True)

    client = CoinExClient(api_key=api_key, secret=secret, is_paper=is_paper)
    balance = client.get_balance()

    if "error" in balance:
        raise HTTPException(status_code=400, detail=balance["error"])

    return balance


@app.post("/positions")
async def get_positions(req: Dict = Body(...)):
    """Obtiene las posiciones abiertas"""
    api_key = req.get("api_key")
    secret = req.get("secret")
    is_paper = req.get("is_paper", True)

    client = CoinExClient(api_key=api_key, secret=secret, is_paper=is_paper)
    positions = client.get_positions()

    if isinstance(positions, dict) and "error" in positions:
        raise HTTPException(status_code=400, detail=positions["error"])

    return positions


@app.post("/close-position")
async def close_position(req: Dict = Body(...)):
    """Cierra una posición abierta"""
    api_key = req.get("api_key")
    secret = req.get("secret")
    is_paper = req.get("is_paper", True)
    symbol = req.get("symbol")
    side = req.get("side")
    amount = req.get("amount")

    client = CoinExClient(api_key=api_key, secret=secret, is_paper=is_paper)
    result = client.close_position(symbol, side, amount)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.post("/pnl-stats")
async def get_pnl_stats(req: Dict = Body(...)):
    """Obtiene estadísticas de PnL realizado"""
    api_key = req.get("api_key")
    secret = req.get("secret")
    is_paper = req.get("is_paper", True)

    if not api_key or not secret:
        return {"total_pnl": 0, "count": 0, "message": "Sin credenciales configuradas"}

    client = CoinExClient(api_key=api_key, secret=secret, is_paper=is_paper)
    stats = client.get_realized_pnl()

    if isinstance(stats, dict) and "error" in stats:
        raise HTTPException(status_code=400, detail=stats["error"])

    return stats


@app.get("/markets")
async def get_all_markets():
    """Obtiene todos los pares disponibles para futuros"""
    client = CoinExClient(
        is_paper=False
    )  # Usamos is_paper=False para leer mercados reales
    markets = client.get_all_markets()

    if isinstance(markets, dict) and "error" in markets:
        raise HTTPException(status_code=400, detail=markets["error"])

    return markets


@app.get("/ticker/{symbol}")
async def get_ticker(symbol: str):
    """Obtiene precio actual y cambio 24h de un símbolo"""
    client = CoinExClient(is_paper=False)
    ticker = client.get_ticker(symbol)

    if isinstance(ticker, dict) and "error" in ticker:
        raise HTTPException(status_code=400, detail=ticker["error"])

    return ticker


@app.post("/tickers")
async def get_tickers_batch(req: Dict = Body(...)):
    """Obtiene precios de múltiples símbolos"""
    symbols = req.get("symbols", [])
    client = CoinExClient(is_paper=False)

    results = {}
    for symbol in symbols:
        ticker = client.get_ticker(symbol)
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
