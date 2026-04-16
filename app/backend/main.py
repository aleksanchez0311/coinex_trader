import os
import json
from dotenv import load_dotenv
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
from contextlib import asynccontextmanager
import pandas as pd
import numpy as np
import time
from engines.analysis import AnalysisEngine
from engines.scoring import ScoringEngine
from engines.risk import RiskEngine
from utils.history_manager import HistoryManager
from utils.exchange_clients import TradingClient, MarketDataClient
from models.trading import (
    AnalysisRequest,
    RiskRequest,
    TradeExecutionRequest,
    CredentialsRequest,
    ClosePositionRequest,
    TickersBatchRequest,
    TPPositionRequest,
)
import asyncio
from utils.websocket_manager import manager

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def convert_numpy_types(obj: Any) -> Any:
    """
    Convierte recursivamente tipos numpy a tipos Python estándar para JSON serialization
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj

load_dotenv()

# Instancias
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(price_pusher_task())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(title="CoinEx Trader API", lifespan=lifespan)

ohlcv_cache: Dict[str, tuple] = {}
derivatives_cache: Dict[str, tuple] = {}
CACHE_TTL = 30
market_client = None

def get_market_client():
    global market_client
    if market_client is None:
        market_client = MarketDataClient()
    return market_client


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(req, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


# Configuración de CORS para el frontend
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://coinex-trader.vercel.app")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def price_pusher_task():
    """Tarea en segundo plano que actualiza precios cada 2 segundos para pares activos"""
    print(">>> Iniciando Price Pusher Task...")
    while True:
        try:
            # Obtener lista única de todos los símbolos suscritos
            all_subs = set()
            for subs in manager.subscriptions.values():
                all_subs.update(subs)
            
            if all_subs:
                client = get_market_client()
                for symbol in all_subs:
                    if symbol == "ALL": continue
                    # Usamos to_thread para no bloquear el loop de asyncio con CCXT (que es síncrono aquí)
                    ticker = await asyncio.to_thread(client.get_ticker, symbol)
                    if ticker and "error" not in ticker:
                        await manager.broadcast_to_subscribers(symbol, ticker)
            
            await asyncio.sleep(2)  # Intervalo de actualización
        except Exception as e:
            print(f">>> Error in price pusher task: {e}")
            await asyncio.sleep(5)



@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe":
                symbols = message.get("symbols", [])
                await manager.subscribe(websocket, symbols)
                
            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except Exception as e:
        print(f">>> WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)


@app.get("/")
async def root():
    return {"status": "online", "message": "Quant Trader Engine Ready"}


@app.post("/analyze")
async def analyze_pair(req: AnalysisRequest):
    symbol = req.symbol or "BTC/USDT"
    country = req.country or "Cuba"
    capital = req.capital if req.capital and req.capital > 0 else 10.0
    cache_key = f"{symbol}:{req.timeframe}:{req.api_key[:8] if req.api_key else ''}"
    current_time = time.time()

    if cache_key in ohlcv_cache:
        cached_time, cached_ohlcv = ohlcv_cache[cache_key]
        if current_time - cached_time < CACHE_TTL:
            ohlcv = cached_ohlcv
        else:
            client = get_market_client()
            ohlcv = client.get_ohlcv(symbol, req.timeframe)
            if not isinstance(ohlcv, dict) or "error" not in ohlcv:
                ohlcv_cache[cache_key] = (current_time, ohlcv)
    else:
        client = get_market_client()
        ohlcv = client.get_ohlcv(symbol, req.timeframe)
        if not isinstance(ohlcv, dict) or "error" not in ohlcv:
            ohlcv_cache[cache_key] = (current_time, ohlcv)

    if isinstance(ohlcv, dict) and "error" in ohlcv:
        raise HTTPException(status_code=400, detail=ohlcv["error"])

    client = get_market_client()
    derivatives = client.get_derivatives_data(symbol)
    ticker = client.get_ticker(symbol)
    market_context = client.get_market_context(symbol)
    derivatives_cache_key = f"derivatives:{symbol}"
    derivatives_cache[derivatives_cache_key] = (current_time, derivatives)

    df = pd.DataFrame(
        ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"]
    )

    engine = AnalysisEngine(df)
    analysis = engine.analyze_all(
        symbol=symbol,
        country=country,
        capital=capital,
        ticker=ticker,
        derivatives=derivatives,
        market_context=market_context,
    )

    scoring = ScoringEngine()
    score_result = scoring.calculate_score(analysis)

    risk_engine = RiskEngine()
    risk_recommendations = risk_engine.get_recommendations(analysis, score_result)

    result = {
        "symbol": symbol,
        "analysis": analysis,
        "scoring": score_result,
        "risk_recommendations": risk_recommendations,
        "derivatives": derivatives,
    }
    
    # Convertir todos los tipos numpy a tipos Python estándar
    return convert_numpy_types(result)


@app.post("/risk-management")
async def calculate_risk(req: RiskRequest):
    risk_engine = RiskEngine()
    fixed_risk_pct = 30.0
    fixed_leverage = 20
    fixed_operation_size_pct = 70.0

    use_70_pct = True

    if req.entry_price <= 0:
        raise HTTPException(status_code=422, detail="entry_price debe ser mayor a 0")
    if req.leverage <= 0:
        raise HTTPException(status_code=422, detail="leverage debe ser mayor a 0")
    if req.entry_price == req.stop_loss:
        raise HTTPException(
            status_code=422, detail="entry_price y stop_loss no pueden ser iguales"
        )

    if use_70_pct:
        pos_data = risk_engine.calculate_position_with_70_pct(
            capital=req.capital,
            risk_pct=fixed_risk_pct,
            entry_price=req.entry_price,
            stop_loss=req.stop_loss,
            leverage=fixed_leverage,
            operation_size_pct=fixed_operation_size_pct,
        )
    else:
        pos_data = risk_engine.calculate_position(
            req.capital, req.risk_pct, req.entry_price, req.stop_loss, req.leverage
        )
    if isinstance(pos_data, dict) and "error" in pos_data:
        raise HTTPException(status_code=422, detail=pos_data["error"])

    bias = "Alcista" if req.entry_price > req.stop_loss else "Bajista"

    if req.take_profit:
        price_distance = abs(req.entry_price - req.stop_loss)
        if price_distance == 0:
            raise HTTPException(
                status_code=422,
                detail="No se puede calcular R:R con entry_price igual a stop_loss",
            )
        plan = {
            "entry": req.entry_price,
            "stop_loss": req.stop_loss,
            "tp1": req.take_profit,
            "tp2": None,
            "tp3": None,
            "rr_ratio": round(
                abs(req.take_profit - req.entry_price) / price_distance,
                2,
            ),
        }
    else:
        plan = risk_engine.get_trade_plan(req.entry_price, req.stop_loss, bias)

    return {
        "position": pos_data,
        "plan": plan,
        "fixed_params": {
            "leverage": fixed_leverage,
            "risk_pct": fixed_risk_pct,
            "operation_size_pct": fixed_operation_size_pct,
        },
    }


@app.post("/execute-trade")
async def execute_trade(req: TradeExecutionRequest):
    """Ejecuta una orden de trading con TP y SL"""
    print(f"=== EXECUTE TRADE REQUEST ===")
    print(f"Symbol: {req.symbol}")
    print(f"Side: {req.side}")
    print(f"Amount: {req.amount}")
    print(f"Entry Price: {req.entry_price}")
    print(f"Stop Loss: {req.stop_loss}")
    print(f"Take Profit: {req.take_profit}")
    print(f"Leverage: {req.leverage}")
    print(f"Margin Mode: {req.margin_mode}")
    print(f"Order Type: {req.order_type}")
    print(f"API Key: {req.api_key[:10]}..." if req.api_key else "None")
    print(f"Secret: {'***' if req.secret else 'None'}")
    print(f"============================")

    # Validar que los valores no sean None o 0
    if not req.symbol:
        print("ERROR: Symbol is None or empty")
        raise HTTPException(status_code=400, detail="Symbol is required")
    if not req.side:
        print("ERROR: Side is None or empty")
        raise HTTPException(status_code=400, detail="Side is required")
    if not req.amount or req.amount <= 0:
        print(f"ERROR: Invalid amount: {req.amount}")
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    if not req.stop_loss or req.stop_loss <= 0:
        print(f"ERROR: Invalid stop_loss: {req.stop_loss}")
        raise HTTPException(status_code=400, detail="Stop loss must be greater than 0")

    client = TradingClient(api_key=req.api_key, secret=req.secret)

    result = client.create_order_with_sl_tp(
        symbol=req.symbol,
        side=req.side,
        amount=req.amount,
        entry_price=req.entry_price,
        stop_loss=req.stop_loss,
        take_profit=req.take_profit,
        leverage=20,
        margin_mode=req.margin_mode,
        order_type=req.order_type,
    )

    print(f"RESULT: {result}")
    print(f"========================")

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.post("/balance")
async def get_balance(req: CredentialsRequest):
    """Obtiene el balance de la cuenta (Swap por defecto)"""
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    balance = client.get_balance_fast()

    if "error" in balance:
        raise HTTPException(status_code=400, detail=balance["error"])

    return balance


@app.post("/positions")
async def get_positions(req: CredentialsRequest):
    """Obtiene las posiciones abiertas"""
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    positions = client.get_positions_fast()

    if isinstance(positions, dict) and "error" in positions:
        raise HTTPException(status_code=400, detail=positions["error"])

    return convert_numpy_types(positions)


@app.post("/open-orders")
async def get_open_orders(req: CredentialsRequest):
    """Obtiene las órdenes pendientes"""
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    orders = client.get_open_orders_fast()

    if isinstance(orders, dict) and "error" in orders:
        raise HTTPException(status_code=400, detail=orders["error"])

    return convert_numpy_types(orders)


@app.post("/cancel-order")
async def cancel_order(req: dict):
    """Cancela una orden pendiente"""
    try:
        order_id = req.get("order_id")
        symbol = req.get("symbol")
        
        if not order_id or not symbol:
            raise HTTPException(status_code=400, detail="order_id y symbol son requeridos")
        
        client = TradingClient(api_key=req.get("api_key"), secret=req.get("secret"))
        result = client.cancel_order(order_id, symbol)
        
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/close-position")
async def close_position(req: ClosePositionRequest):
    """Cierra una posición abierta"""
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    result = client.close_position(req.symbol, req.side, req.amount)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@app.post("/pnl-stats")
async def get_pnl_stats(req: CredentialsRequest):
    """Obtiene estadísticas de PnL de CoinEx"""
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    stats = client.get_realized_pnl_fast()

    if isinstance(stats, dict) and "error" in stats:
        raise HTTPException(status_code=400, detail=stats["error"])

    return convert_numpy_types(stats)

@app.post("/trading-history")
async def get_trading_history(req: CredentialsRequest):
    """Obtiene historial persistente y sincroniza nuevos trades desde CoinEx"""
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    
    # 1. Obtener trades actuales del exchange
    stats_data = client.get_realized_pnl_fast()
    
    if stats_data and "history" in stats_data:
        # 2. Guardar trades nuevos en persistencia local
        HistoryManager.save_trades(stats_data["history"])
    
    # 3. Obtener historial completo y estadísticas agregadas
    full_history = HistoryManager.get_history()
    aggregated_stats = HistoryManager.get_stats()
    
    return {
        "stats": aggregated_stats,
        "recent_exchange_pnl": stats_data,
        "history": full_history[:50] # Limitamos a los últimos 50 para la vista principal
    }

@app.post("/check-position")
async def check_position(req: CredentialsRequest, market: str):
    """Verifica si existe posición activa para un market"""
    print(f"=== CHECK POSITION REQUEST ===")
    print(f"Market: {market}")
    print(f"API Key: {req.api_key[:10]}..." if req.api_key else "None")
    print(f"========================")

    if not market:
        raise HTTPException(status_code=400, detail="Market is required")

    client = TradingClient(api_key=req.api_key, secret=req.secret)
    
    # Verificar si existe posición activa
    position_check = client.check_position_exists(market)
    
    print(f">>> Position check result: {position_check}")
    
    return position_check

@app.post("/set-position-tp-sl")
async def set_position_tp_sl(req: TPPositionRequest):
    """Establece TP/SL en posición activa de CoinEx"""
    print(f"=== SET POSITION TP/SL REQUEST ===")
    print(f"Market: {req.market}")
    print(f"Stop Loss: {req.stop_loss}")
    print(f"Take Profit: {req.take_profit}")
    print(f"Amount: {req.amount}")
    print(f"API Key: {req.api_key[:10]}..." if req.api_key else "None")
    print(f"==============================")

    # Validar que los valores no sean None o 0
    if not req.market:
        print("ERROR: Market is None or empty")
        raise HTTPException(status_code=400, detail="Market is required")
    if not req.stop_loss and not req.take_profit:
        print("ERROR: No stop_loss or take_profit provided")
        raise HTTPException(status_code=400, detail="At least stop_loss or take_profit is required")

    client = TradingClient(api_key=req.api_key, secret=req.secret)
    
    # Establecer TP/SL usando los métodos específicos de CoinEx
    results = client.set_position_tp_sl_after_order(
        market=req.market,
        stop_loss=req.stop_loss,
        take_profit=req.take_profit,
        amount=req.amount
    )
    
    print(f">>> TP/SL Results: {results}")
    
    if results.get("errors") and len(results["errors"]) > 0:
        print(f"ERRORS: {results['errors']}")
        raise HTTPException(status_code=400, detail={"errors": results["errors"]})
    
    return {
        "success": True,
        "stop_loss": results["stop_loss"],
        "take_profit": results["take_profit"],
        "position_check": results.get("position_check"),
        "message": "TP/SL establecidos correctamente"
    }


@app.post("/balance")
async def get_balance(req: CredentialsRequest):
    """Obtiene balance de la cuenta de CoinEx"""
    client = TradingClient(api_key=req.api_key, secret=req.secret)
    balance = client.get_balance()

    if isinstance(balance, dict) and "error" in balance:
        raise HTTPException(status_code=400, detail=balance["error"])

    return balance


@app.get("/markets")
async def get_all_markets(verified_only: bool = False, sort_by: str = "symbol"):
    """Obtiene todos los pares disponibles para futuros.
    Si verified_only=True, filtra solo los mercados disponibles en OKX.
    sort_by: 'symbol' (alfabético), 'volume' (capitalización), 'oi' (open interest)"""
    trading_client = TradingClient()
    markets = trading_client.get_all_markets(verified_only=verified_only)

    if isinstance(markets, dict) and "error" in markets:
        raise HTTPException(status_code=400, detail=markets["error"])

    if sort_by == "volume":
        markets.sort(key=lambda x: x.get("volume", 0), reverse=True)
    elif sort_by == "oi":
        markets.sort(key=lambda x: x.get("open_interest", 0), reverse=True)
    else:
        markets.sort(key=lambda x: x.get("base", ""))

    return markets


@app.get("/top-gainers")
async def get_top_gainers_endpoint(
    limit: int = 20, sort_by: str = "change", verified_only: bool = False
):
    """Obtiene el top de monedas segun criterio (por defecto: crecimiento 24h).
    Si verified_only=True, filtra solo los mercados disponibles en OKX."""
    client = TradingClient()
    gainers = client.get_top_markets(
        limit=limit, sort_by=sort_by, verified_only=verified_only
    )

    if isinstance(gainers, dict) and "error" in gainers:
        raise HTTPException(status_code=400, detail=gainers["error"])

    return gainers


@app.get("/ticker/{symbol}")
async def get_ticker(symbol: str):
    """Obtiene precio actual y cambio 24h de un símbolo"""
    client = get_market_client()
    ticker = client.get_ticker(symbol)

    if isinstance(ticker, dict) and "error" in ticker:
        raise HTTPException(status_code=400, detail=ticker["error"])

    return ticker


@app.post("/tickers")
async def get_tickers_batch(req: TickersBatchRequest):
    """Obtiene precios de múltiples símbolos"""
    results = {}
    for symbol in req.symbols:
        client = get_market_client()
        ticker = client.get_ticker(symbol)
        if "error" not in ticker:
            results[symbol] = ticker

    return results


@app.get("/market-status")
async def get_status():
    # Helper para el dashboard
    market_ok = False
    coinex_ok = False
    try:
        client = get_market_client()
        ticker = client.get_ticker("BTC/USDT")
        market_ok = not (isinstance(ticker, dict) and "error" in ticker)
    except Exception:
        market_ok = False

    try:
        public_coinex = TradingClient()
        markets = public_coinex.get_all_markets(verified_only=False)
        coinex_ok = not (isinstance(markets, dict) and "error" in markets)
    except Exception:
        coinex_ok = False

    return {
        "connected_to_coinex": coinex_ok,
        "connected_to_okx": market_ok,
        "active_pairs": ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
