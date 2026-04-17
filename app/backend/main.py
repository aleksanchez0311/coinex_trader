import os
import json
import asyncio
import time
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from typing import Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Motores
from engines.analysis import AnalysisEngine
from engines.scoring import ScoringEngine
from engines.risk import RiskEngine

# Utilidades
from utils.history_manager import HistoryManager
from utils.exchange_clients import TradingClient, MarketDataClient
from utils.websocket_manager import manager

# Modelos
from models.trading import (
    AnalysisRequest, RiskRequest, TradeExecutionRequest, 
    CredentialsRequest, ClosePositionRequest, TickersBatchRequest, TPPositionRequest
)

load_dotenv()

# --- UTILIDADES DE SERIALIZACIÓN ---
def convert_numpy_types(obj: Any) -> Any:
    if isinstance(obj, (np.integer, np.int64)): return int(obj)
    if isinstance(obj, (np.floating, np.float64)): return float(obj)
    if isinstance(obj, (np.bool_)): return bool(obj)
    if isinstance(obj, np.ndarray): return obj.tolist()
    if isinstance(obj, dict): return {k: convert_numpy_types(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)): return [convert_numpy_types(i) for i in obj]
    return obj

# --- GESTIÓN DE CICLO DE VIDA ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(price_pusher_task())
    yield
    task.cancel()
    try: await task
    except asyncio.CancelledError: pass

app = FastAPI(title="CoinEx Trader API", lifespan=lifespan)

# --- CACHE & CLIENTS ---
ohlcv_cache: Dict[str, tuple] = {}
market_client = None

def get_market_client():
    global market_client
    if market_client is None: market_client = MarketDataClient()
    return market_client

# --- MIDDLEWARE & ERRORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(req, exc):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# --- BACKGROUND TASKS ---
async def price_pusher_task():
    while True:
        try:
            all_subs = set()
            for subs in manager.subscriptions.values(): all_subs.update(subs)
            if all_subs:
                client = get_market_client()
                for symbol in all_subs:
                    if symbol == "ALL": continue
                    ticker = await asyncio.to_thread(client.get_ticker, symbol)
                    if ticker and "error" not in ticker:
                        await manager.broadcast_to_subscribers(symbol, ticker)
            await asyncio.sleep(2)
        except Exception: await asyncio.sleep(5)

# --- ENDPOINTS: MERCADO & DESCUBRIMIENTO ---
@app.get("/discover-markets")
async def discover_markets():
    try:
        t_client = TradingClient(api_key="", secret="") # Cliente público
        coinex_markets = t_client.client.load_markets()
        coinex_symbols = {
            s.replace("/USDT", "").replace(":USDT", "") 
            for s in coinex_markets.keys() if "/USDT" in s and coinex_markets[s].get("active")
        }
        client = get_market_client()
        okx_tickers = client.get_top_markets(limit=200, sort_by="volume")
        verified = [m for m in okx_tickers if m["base"] in coinex_symbols]
        return {
            "volume": sorted(verified, key=lambda x: x["volume"], reverse=True),
            "price": sorted(verified, key=lambda x: x["last"], reverse=True),
            "gainers": sorted(verified, key=lambda x: x["percentage"], reverse=True),
            "count": len(verified)
        }
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("type") == "subscribe":
                await manager.subscribe(websocket, message.get("symbols", []))
            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except Exception: pass
    finally: manager.disconnect(websocket)

@app.post("/analyze")
async def analyze_pair(req: AnalysisRequest):
    symbol = req.symbol or "BTC/USDT"
    client = get_market_client()
    ohlcv = client.get_ohlcv(symbol, req.timeframe)
    if isinstance(ohlcv, dict) and "error" in ohlcv: raise HTTPException(status_code=400, detail=ohlcv["error"])
    
    df = pd.DataFrame(ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"])
    engine = AnalysisEngine(df)
    analysis = engine.analyze_all(
        symbol=symbol, country=req.country or "Cuba", capital=req.capital or 10.0,
        ticker=client.get_ticker(symbol), derivatives=client.get_derivatives_data(symbol),
        market_context=client.get_market_context(symbol)
    )
    score = ScoringEngine().calculate_score(analysis)
    risk = RiskEngine().get_recommendations(analysis, score)
    return convert_numpy_types({
        "symbol": symbol, "analysis": analysis, "scoring": score, "risk_recommendations": risk
    })

# --- ENDPOINTS: TRADING ---
@app.post("/risk-management")
async def calculate_risk(req: RiskRequest):
    risk_engine = RiskEngine()
    pos_data = risk_engine.calculate_position_with_70_pct(
        capital=req.capital, risk_pct=30.0, entry_price=req.entry_price,
        stop_loss=req.stop_loss, leverage=20, operation_size_pct=70.0
    )
    if isinstance(pos_data, dict) and "error" in pos_data: raise HTTPException(status_code=422, detail=pos_data["error"])
    bias = "Alcista" if req.entry_price > req.stop_loss else "Bajista"
    plan = risk_engine.get_trade_plan(req.entry_price, req.stop_loss, bias)
    return {"position": pos_data, "plan": plan}

@app.post("/execute-trade")
async def execute_trade(req: TradeExecutionRequest):
    if not req.amount or req.amount <= 0: raise HTTPException(status_code=400, detail="Monto ínvalido")
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    result = client.create_order_with_sl_tp(
        symbol=req.symbol, side=req.side, amount=req.amount,
        entry_price=req.entry_price, stop_loss=req.stop_loss,
        take_profit=req.take_profit, leverage=20,
        margin_mode=req.margin_mode, order_type=req.order_type
    )
    if "error" in result: raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/balance")
async def get_balance(req: CredentialsRequest):
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    balance = client.get_balance_fast()
    if "error" in balance: raise HTTPException(status_code=400, detail=balance["error"])
    return balance

@app.post("/positions")
async def get_positions(req: CredentialsRequest):
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    positions = client.get_positions_fast()
    if isinstance(positions, dict) and "error" in positions: raise HTTPException(status_code=400, detail=positions["error"])
    return convert_numpy_types(positions)

@app.post("/close-position")
async def close_position(req: ClosePositionRequest):
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    result = client.close_position(req.symbol, req.side, req.amount)
    if isinstance(result, dict) and "error" in result: raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/trading-history")
async def get_trading_history(req: CredentialsRequest):
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    stats_data = client.get_realized_pnl_fast()
    if stats_data and "history" in stats_data: HistoryManager.save_trades(stats_data["history"])
    return {
        "stats": HistoryManager.get_stats(),
        "history": HistoryManager.get_history()[:50]
    }

@app.get("/tickers")
async def get_tickers_batch(symbols: str):
    client = get_market_client()
    results = {}
    for sym in symbols.split(','):
        ticker = client.get_ticker(sym)
        if "error" not in ticker: results[sym] = ticker
    return results

@app.get("/health")
async def health(): return {"status": "ok", "engine": "Quant Trader v2.1"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
