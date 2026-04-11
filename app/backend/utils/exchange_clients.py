import ccxt
import os
import time
from typing import Dict


class MarketDataClient:
    """Cliente para datos de mercado vía OKX (OHLCV, tickers, derivados)"""

    def __init__(self):
        self.client = ccxt.okx({"enableRateLimit": True})
        self.client.options["defaultType"] = "swap"

    def _normalize_symbol(self, symbol: str) -> str:
        """Normaliza símbolo al formato base OKX (SYM/USDT)"""
        sym = symbol.replace(":USDT", "").replace("-USDT", "")
        if not sym.endswith("/USDT"):
            sym = sym.replace("USDT", "/USDT")
        return sym

    def get_ohlcv(self, symbol: str, timeframe: str = "1h", limit: int = 200):
        """Obtiene OHLCV desde OKX (más rápido que CoinEx)"""
        try:
            sym = self._normalize_symbol(symbol)
            ohlcv = self.client.fetch_ohlcv(sym, timeframe, limit=limit)
            return ohlcv
        except Exception as e:
            return {"error": str(e)}

    def get_ticker(self, symbol: str):
        """Obtiene precio actual y cambio 24h"""
        try:
            sym = self._normalize_symbol(symbol)
            ticker = self.client.fetch_ticker(sym)
            return {
                "symbol": sym,
                "last": ticker.get("last"),
                "percentage": ticker.get("percentage"),
                "up": ticker.get("last", 0) > ticker.get("open", 0),
            }
        except Exception as e:
            return {"error": str(e)}

    def get_top_gainers(self, limit: int = 20):
        """Obtiene los pares con mayor rendimiento (ganadores 24h)"""
        try:
            tickers = self.client.fetch_tickers()
            valid_tickers = []
            
            for sym, ticker in tickers.items():
                pct = ticker.get("percentage")
                # Filtramos para enfocarnos en pares basados en USDT y con data válida
                if pct is not None and "USDT" in sym and "-USDC" not in sym:
                    clean_sym = self._normalize_symbol(sym)
                    
                    # Filtro contra apalancados y stablecoins irrelevantes
                    if clean_sym.split('/')[0] not in ['USDC', 'DAI', 'TUSD']:
                        valid_tickers.append({
                            "symbol": clean_sym,
                            "base": clean_sym.split('/')[0] if '/' in clean_sym else clean_sym,
                            "quote": "USDT",
                            "percentage": pct,
                            "last": ticker.get("last"),
                            "up": ticker.get("last", 0) > ticker.get("open", 0)
                        })
                    
            # Eliminar duplicados para seguridad
            unique_tickers = {t["symbol"]: t for t in valid_tickers}
            valid_tickers = list(unique_tickers.values())
            
            # Ordenar de mayor a menor porcentaje
            valid_tickers.sort(key=lambda x: x["percentage"], reverse=True)
            return valid_tickers[:limit]
        except Exception as e:
            return {"error": str(e)}

    def get_derivatives_data(self, symbol: str = "BTC/USDT:USDT") -> Dict:
        """Obtiene datos de derivados: funding rate, liquidaciones"""
        result = {"funding": None, "liquidations": None, "error": None}
        swap_sym = f"{self._normalize_symbol(symbol)}:USDT"

        try:
            funding = self.client.fetch_funding_rate(swap_sym)
            result["funding"] = {
                "current": funding.get("fundingRate", 0),
                "next": funding.get("nextFundingRate", 0),
                "next_funding_time": funding.get("nextFundingTimestamp"),
                "mark_price": funding.get("markPrice"),
            }
        except Exception as e:
            result["error"] = f"Funding error: {e}"

        try:
            liquidations = self.client.fetch_liquidations(swap_sym, limit=20)
            longs_liq = sum(1 for l in liquidations if l.get("side") == "buy")
            shorts_liq = sum(1 for l in liquidations if l.get("side") == "sell")
            result["liquidations"] = {
                "total": len(liquidations),
                "longs": longs_liq,
                "shorts": shorts_liq,
                "recent": liquidations[:5],
            }
        except Exception as e:
            result["liquidation_error"] = str(e)

        return result


class TradingClient:
    """Cliente de ejecución de órdenes en CoinEx (futuros/swap)"""

    def __init__(self, api_key: str = None, secret: str = None):
        self.api_key = api_key or os.getenv("COINEX_API_KEY")
        self.secret = secret or os.getenv("COINEX_SECRET")

        self.client = ccxt.coinex(
            {
                "apiKey": self.api_key,
                "secret": self.secret,
                "enableRateLimit": True,
            }
        )
        self.client.options["defaultType"] = "swap"
        self.client.options["createMarketBuyOrderRequiresPrice"] = False
        self.client.options["defaultMarginMode"] = "isolated"

    def set_leverage(self, symbol: str, leverage: int, margin_mode: str = "isolated"):
        """Configura el apalancamiento y modo de margen para el símbolo"""
        try:
            self.client.load_markets()
            response = self.client.set_leverage(
                leverage,
                symbol,
                params={"margin_mode": margin_mode, "market_type": "swap"},
            )
            return response
        except Exception as e:
            return {"error": f"Error configurando apalancamiento: {str(e)}"}

    def create_order_with_sl_tp(
        self,
        symbol: str,
        side: str,
        amount: float,
        entry_price: float = None,
        stop_loss: float = None,
        take_profit: float = None,
        leverage: int = 10,
        margin_mode: str = "isolated",
        order_type: str = "limit",
    ) -> Dict:
        """
        Crea una orden con SL y TP automáticos en modo aislado.
        order_type: 'limit' o 'market'
        """
        if ":" not in symbol:
            symbol = f"{symbol}:{symbol.split('/')[-1]}"

        try:
            self.client.load_markets()
            if symbol not in self.client.markets:
                alt_symbol = symbol.split(":")[0]
                if alt_symbol in self.client.markets:
                    symbol = alt_symbol

            market = self.client.market(symbol)
            min_amount = market.get("limits", {}).get("amount", {}).get("min", 0)

            if amount < min_amount:
                raise Exception(f"Posición muy pequeña: mínimo {min_amount}")

            amount = float(self.client.amount_to_precision(symbol, amount))

            self.set_leverage(symbol, leverage, margin_mode)

            params = {}

            if stop_loss:
                if side == "buy":
                    params["stop_loss_price"] = stop_loss
                    params["stop_loss_type"] = "down"
                else:
                    params["stop_loss_price"] = stop_loss
                    params["stop_loss_type"] = "up"

            if take_profit:
                if side == "buy":
                    params["take_profit_price"] = take_profit
                    params["take_profit_type"] = "up"
                else:
                    params["take_profit_price"] = take_profit
                    params["take_profit_type"] = "down"

            if order_type == "market" or not entry_price:
                order = self.client.create_market_order(
                    symbol=symbol, side=side, amount=amount, params=params
                )
            else:
                order = self.client.create_limit_order(
                    symbol=symbol,
                    side=side,
                    amount=amount,
                    price=entry_price,
                    params=params,
                )

            return order

        except Exception as e:
            return {"error": str(e)}


    def execute_order(
        self,
        symbol: str,
        side: str,
        amount: float,
        price: float = None,
        order_type: str = "market",
    ):
        """Ejecuta orden en CoinEx (LIVE)"""

        # Para Futuros en CCXT/CoinEx, el símbolo ideal es SYMBOL/CURRENCY:CURRENCY
        if ":" not in symbol:
            symbol = f"{symbol}:{symbol.split('/')[-1]}"

        # Ajustar precisión del amount según el mercado
        try:
            self.client.load_markets()
            if symbol not in self.client.markets:
                alt_symbol = symbol.split(":")[0]
                if alt_symbol in self.client.markets:
                    symbol = alt_symbol

            market = self.client.market(symbol)
            min_amount = market.get("limits", {}).get("amount", {}).get("min", 0)

            if amount < min_amount:
                raise Exception(
                    f"Posición muy pequeña: {amount} {symbol.split('/')[0]}. El mínimo en CoinEx para este par es {min_amount}. Sube el Capital o el Riesgo %."
                )

            amount = float(self.client.amount_to_precision(symbol, amount))
        except Exception as e:
            print(f"Error ajustando precisión o cargando mercados: {e}")

        try:
            if order_type == "market":
                order = self.client.create_market_order(symbol, side, amount)
            else:
                order = self.client.create_limit_order(symbol, side, amount, price)
            return order
        except Exception as e:
            return {"error": str(e)}

    def get_balance(self):
        """Obtiene el balance real de la cuenta swap"""
        try:
            return self.client.fetch_balance()
        except Exception as e:
            return {"error": str(e)}

    def get_positions(self):
        """Obtiene las posiciones abiertas reales"""
        try:
            positions = self.client.fetch_positions()
            # Filtrar solo posiciones con tamaño > 0
            return [
                p
                for p in positions
                if float(p.get("contracts", 0)) > 0 or float(p.get("size", 0)) > 0
            ]
        except Exception as e:
            return {"error": str(e)}

    def close_position(self, symbol: str, side: str, amount: float):
        """Cierra una posición abriendo la orden contraria"""
        try:
            # Si la posición es 'long', cerramos con un 'sell'
            # Si es 'short', cerramos con un 'buy'
            opposite_side = "sell" if side.lower() == "long" else "buy"
            return self.execute_order(
                symbol, opposite_side, amount, order_type="market"
            )
        except Exception as e:
            return {"error": str(e)}

    def get_all_markets(self):
        """Obtiene todos los mercados de futuros disponibles"""
        try:
            self.client.load_markets()
            markets = []
            for symbol, market in self.client.markets.items():
                if market.get("swap"):
                    markets.append(
                        {
                            "symbol": symbol,
                            "base": market["base"],
                            "quote": market["quote"],
                            "active": market["active"],
                        }
                    )
            return markets
        except Exception as e:
            return {"error": str(e)}

    def get_realized_pnl(self, limit=50):
        """Obtiene el PnL total: realizado + no realizado + fees"""

        try:
            total_pnl = 0.0
            realized_pnl = 0.0
            unrealized_pnl = 0.0
            total_fees = 0.0
            pnl_records = []

            # 1. Obtener posiciones actuales (unrealized PnL)
            try:
                positions = self.client.fetch_positions()
                for pos in positions:
                    if pos.get("contracts", 0) > 0:
                        un_pnl = float(pos.get("unrealizedPnl", 0) or 0)
                        unrealized_pnl += un_pnl
            except Exception as e:
                print(f"Error fetching positions: {e}")

            # 2. Obtener trades cerrados (realized PnL + fees)
            try:
                symbols = list(
                    set([p.get("symbol") for p in positions if p.get("symbol")])
                )
                for sym in symbols:
                    try:
                        trades = self.client.fetch_my_trades(
                            sym, params={"type": "swap"}
                        )
                        for trade in trades:
                            info = trade.get("info", {})
                            pnl_val = float(info.get("realized_pnl", 0))
                            fee_val = float(info.get("fee", 0) or 0)

                            realized_pnl += pnl_val
                            total_fees += fee_val

                            if pnl_val != 0:
                                pnl_records.append(
                                    {
                                        "symbol": trade.get("symbol"),
                                        "pnl": pnl_val,
                                        "fee": fee_val,
                                        "time": trade.get("datetime"),
                                    }
                                )
                    except:
                        pass
            except Exception as e:
                print(f"Error fetching trades: {e}")

            # PnL total = realizado + no realizado - fees
            total_pnl = realized_pnl + unrealized_pnl - total_fees

            return {
                "total_pnl": round(total_pnl, 2),
                "realized_pnl": round(realized_pnl, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
                "total_fees": round(total_fees, 2),
                "count": len(pnl_records),
                "history": pnl_records[:10],
            }
        except Exception as e:
            return {"error": str(e)}


