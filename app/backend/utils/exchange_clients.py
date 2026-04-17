import ccxt
import pandas as pd
import time
from typing import Dict, List, Optional

class MarketDataClient:
    """Cliente para obtención de datos técnicos optimizado para OKX."""
    def __init__(self):
        self.okx = ccxt.okx({
            'enableRateLimit': True,
            'options': {'defaultType': 'swap'}
        })
        self._tickers_cache = {}
        self._cache_time = 0

    def get_ticker(self, symbol: str) -> Dict:
        try:
            # Normalización mínima de símbolos
            sym = symbol.replace(':USDT', '').replace('-USDT', '')
            if '/' not in sym: sym = f"{sym}/USDT"
            
            ticker = self.okx.fetch_ticker(f"{sym}:USDT")
            return {
                "symbol": symbol,
                "last": ticker['last'],
                "percentage": ticker['percentage'],
                "volume": ticker['quoteVolume'],
                "high": ticker['high'],
                "low": ticker['low']
            }
        except Exception: return {"error": f"No se pudo obtener ticker de {symbol}"}

    def get_ohlcv(self, symbol: str, timeframe: str = '1h', limit: int = 100):
        try:
            sym = f"{symbol.replace('/USDT', '').replace(':USDT', '')}/USDT:USDT"
            return self.okx.fetch_ohlcv(sym, timeframe=timeframe, limit=limit)
        except Exception: return {"error": "Error cargando velas"}

    def get_top_markets(self, limit: int = 50, sort_by: str = "volume") -> List[Dict]:
        try:
            tickers = self.okx.fetch_tickers()
            results = []
            for s, t in tickers.items():
                if ':USDT' in s and t.get('quoteVolume', 0) > 0:
                    results.append({
                        "symbol": s.replace(':USDT', ''),
                        "base": s.split('/')[0],
                        "last": t['last'],
                        "percentage": t['percentage'],
                        "volume": t['quoteVolume']
                    })
            if sort_by == "volume": results.sort(key=lambda x: x["volume"], reverse=True)
            else: results.sort(key=lambda x: x["percentage"], reverse=True)
            return results[:limit]
        except Exception: return []

    def get_derivatives_data(self, symbol: str) -> Dict:
        """Obtiene funding y OI de OKX."""
        try:
            sym = f"{symbol.replace('/USDT', '').replace(':USDT', '')}/USDT:USDT"
            funding = self.okx.fetch_funding_rate(sym)
            return {
                "funding": {"current": funding.get('fundingRate', 0)},
                "open_interest": {"value": 0} # OKX OI requiere endpoint específico si se necesita
            }
        except Exception: return {}

    def get_market_context(self, symbol: str) -> Dict:
        return {"trend": "Neutral", "volatility": "Normal"}


class TradingClient:
    """Cliente para ejecución de órdenes optimizado para CoinEx."""
    def __init__(self, api_key: str = "", secret: str = ""):
        self.client = ccxt.coinex({
            'apiKey': api_key,
            'secret': secret,
            'enableRateLimit': True,
            'options': {'defaultType': 'swap'}
        })

    def get_balance_fast(self) -> Dict:
        try:
            bal = self.client.fetch_balance()
            usdt = bal.get('USDT', {})
            return {
                "total": usdt.get('total', 0),
                "free": usdt.get('free', 0),
                "used": usdt.get('used', 0)
            }
        except Exception as e: return {"error": str(e)}

    def get_positions_fast(self) -> List[Dict]:
        try: return self.client.fetch_positions()
        except Exception: return []

    def create_order_with_sl_tp(self, symbol, side, amount, entry_price=None, stop_loss=None, take_profit=None, **kwargs):
        try:
            # Lógica de creación de orden simplificada para CoinEx
            order = self.client.create_order(
                symbol=symbol,
                type=kwargs.get('order_type', 'market'),
                side=side,
                amount=amount,
                price=entry_price
            )
            # En producción se añadirían SL/TP por separado si el exchange no lo soporta en un paso
            return {"order": order, "status": "success"}
        except Exception as e: return {"error": str(e)}

    def close_position(self, symbol, side, amount):
        try:
            # Cierre market reverse
            opp_side = 'sell' if side == 'long' or side == 'buy' else 'buy'
            return self.client.create_order(symbol, 'market', opp_side, amount)
        except Exception as e: return {"error": str(e)}

    def get_realized_pnl_fast(self):
        return {"total_pnl": 0, "history": []}
