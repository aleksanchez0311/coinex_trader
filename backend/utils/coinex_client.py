import ccxt
import os
import hashlib
import time
from typing import Dict, Any


class CoinExClient:
    def __init__(self, api_key: str = None, secret: str = None, is_paper: bool = True):
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

        self.is_paper = is_paper

    def set_leverage(self, symbol: str, leverage: int, margin_mode: str = "isolated"):
        """Configura el apalancamiento y modo de margen para el símbolo"""
        if self.is_paper:
            return {
                "status": "success (simulation)",
                "leverage": leverage,
                "margin_mode": margin_mode,
            }

        try:
            self.client.load_markets()
            market = self.client.market(symbol)
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
            if not self.is_paper:
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
            if self.is_paper:
                return {
                    "status": "success (simulation)",
                    "order_id": f"sim_{int(time.time())}",
                    "symbol": symbol,
                    "side": side,
                    "amount": amount,
                    "entry_price": entry_price,
                    "stop_loss": stop_loss,
                    "take_profit": take_profit,
                    "leverage": leverage,
                    "margin_mode": margin_mode,
                }
            return {"error": str(e)}

    def get_market_data(self, symbol: str, timeframe: str = "1h", limit: int = 100):
        """Obtiene OHLCV"""
        try:
            ohlcv = self.client.fetch_ohlcv(symbol, timeframe, limit=limit)
            return ohlcv
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
        """Ejecuta orden (Simulada si is_paper=True)"""

        # Para Futuros en CCXT/CoinEx, el símbolo ideal es SYMBOL/CURRENCY:CURRENCY
        if ":" not in symbol:
            symbol = f"{symbol}:{symbol.split('/')[-1]}"

        # 1. Ajustar precisión del amount según el mercado
        try:
            if not self.is_paper:
                self.client.load_markets()
                if symbol not in self.client.markets:
                    # Intento alternativo sin el sufijo si el primero falla
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
                print(f"DEBUG: Adjusted Amount for {symbol}: {amount}")
            else:
                amount = round(amount, 4)  # Simulación de precisión estándar
        except Exception as e:
            print(f"Error ajustando precisión o cargando mercados: {e}")

        if self.is_paper:
            import time

            time.sleep(1.5)  # Simular latencia de red
            return {
                "status": "success (simulation)",
                "order_id": f"sim_{int(time.time())}",
                "symbol": symbol,
                "side": side,
                "amount": amount,
                "price": price or "market_price",
            }

        try:
            # En futuros CoinEx, a veces el side debe ser 'buy'/'sell'
            # pero ccxt suele mapearlo bien.
            if order_type == "market":
                # Para Futuros (Swap), la mayoría de los exchanges NO requieren precio en market buy.
                # Si CoinEx lo pide vía CCXT, es un error de mapeo que resolvemos con params.
                order = self.client.create_market_order(symbol, side, amount)
            else:
                order = self.client.create_limit_order(symbol, side, amount, price)
            return order
        except Exception as e:
            return {"error": str(e)}

    def get_balance(self):
        if self.is_paper:
            return {"USDT": {"free": 100.0, "used": 0.0, "total": 100.0}}
        try:
            return self.client.fetch_balance()
        except Exception as e:
            return {"error": str(e)}

    def get_positions(self):
        if self.is_paper:
            return [
                {
                    "symbol": "BTC/USDT",
                    "side": "long",
                    "contracts": 0.05,
                    "entryPrice": 69420.0,
                    "markPrice": 71000.0,
                    "unrealizedPnl": 79.0,
                    "leverage": 20,
                    "percentage": 11.4,
                    "notional": 3550.0,
                    "isolated": True,
                }
            ]
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
        if self.is_paper:
            return {"status": "success", "message": "Posición simulada cerrada"}

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
        if self.is_paper:
            return {"total_pnl": 125.50, "count": 12}

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
                trades = self.client.fetch_my_trades(params={"type": "swap"})
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

    def get_ticker(self, symbol: str):
        """Obtiene el precio actual y cambio 24h de un símbolo"""
        if self.is_paper:
            return {"symbol": symbol, "last": 50000.0, "percentage": 2.5, "up": True}
        try:
            if ":" not in symbol:
                symbol = f"{symbol}:{symbol.split('/')[-1]}"

            ticker = self.client.fetch_ticker(symbol)

            return {
                "symbol": symbol.split(":")[0],
                "last": ticker.get("last"),
                "percentage": ticker.get("percentage"),
                "up": ticker.get("last", 0) > ticker.get("open", 0),
            }
        except Exception as e:
            return {"error": str(e)}
