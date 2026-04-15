import ccxt
import os
import time
from typing import Dict, List

import requests


class MarketDataClient:
    """Cliente para datos de mercado y análisis - EXCLUSIVAMENTE OKX"""

    def __init__(self):
        self.client = ccxt.okx({"enableRateLimit": True})
        self.client.options["defaultType"] = "swap"
        self._okx_markets_cache = None
        self._cache_time = 0

    def _normalize_symbol(self, symbol: str) -> str:
        """Normaliza símbolo al formato base OKX (SYM/USDT)"""
        sym = symbol.replace(":USDT", "").replace("-USDT", "")
        if not sym.endswith("/USDT"):
            sym = sym.replace("USDT", "/USDT")
        return sym

    def _coingecko_id(self, symbol: str) -> str | None:
        base = symbol.split("/")[0].replace("-USDT", "").replace("USDT", "").upper()
        mapping = {
            "BTC": "bitcoin",
            "ETH": "ethereum",
            "SOL": "solana",
            "BNB": "binancecoin",
            "XRP": "ripple",
            "ADA": "cardano",
            "DOGE": "dogecoin",
            "AVAX": "avalanche-2",
            "DOT": "polkadot",
            "LINK": "chainlink",
            "LTC": "litecoin",
            "UNI": "uniswap",
            "ATOM": "cosmos",
            "NEAR": "near",
            "APT": "aptos",
            "ARB": "arbitrum",
            "OP": "optimism",
        }
        return mapping.get(base)

    def _base_asset(self, symbol: str) -> str:
        return symbol.split("/")[0].replace("-USDT", "").replace("USDT", "").upper()

    def _get_okx_markets(self) -> set:
        """Obtiene lista de mercados disponibles en OKX (~582 USDT) con cache"""
        now = time.time()
        if self._okx_markets_cache and (now - self._cache_time) < 300:
            return self._okx_markets_cache

        try:
            okx = ccxt.okx({"enableRateLimit": True})
            okx.options["defaultType"] = "swap"
            markets = okx.load_markets()
            verified = set(
                s.replace("/USDT", "USDT")
                for s in markets.keys()
                if "/USDT" in s and markets[s].get("active")
            )
            self._okx_markets_cache = verified
            self._cache_time = now
            return verified
        except Exception as e:
            return self._get_fallback_markets()

    def _get_fallback_markets(self) -> set:
        """Fallback con monedas principales"""
        return {
            "BTCUSDT",
            "ETHUSDT",
            "BNBUSDT",
            "SOLUSDT",
            "XRPUSDT",
            "ADAUSDT",
            "DOGEUSDT",
            "AVAXUSDT",
            "DOTUSDT",
            "MATICUSDT",
            "LINKUSDT",
            "LTCUSDT",
            "UNIUSDT",
            "ATOMUSDT",
            "ETCUSDT",
            "XLMUSDT",
            "NEARUSDT",
            "APTUSDT",
            "FILUSDT",
            "ARBUSDT",
            "OPUSDT",
            "AAVEUSDT",
            "VETUSDT",
            "ICPUSDT",
            "ALGOUSDT",
            "SANDUSDT",
            "MANAUSDT",
            "AXSUSDT",
            "EOSUSDT",
            "THETAUSDT",
        }

    def get_ohlcv(self, symbol: str, timeframe: str = "1h", limit: int = 200):
        """Obtiene OHLCV desde OKX"""
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

    def get_derivatives_data(self, symbol: str = "BTC/USDT:USDT") -> Dict:
        """Obtiene datos de derivados: funding, open interest y liquidaciones."""
        result = {
            "funding": None,
            "open_interest": None,
            "liquidations": None,
            "liquidation_zones": None,
            "error": None,
        }
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
            open_interest = self.client.fetch_open_interest(swap_sym)
            result["open_interest"] = {
                "amount": open_interest.get("openInterestAmount")
                or open_interest.get("openInterestValue")
                or open_interest.get("openInterest"),
                "value": open_interest.get("openInterestValue"),
                "timestamp": open_interest.get("timestamp"),
            }
        except Exception as e:
            result["open_interest_error"] = str(e)

        try:
            liquidations = self.client.fetch_liquidations(swap_sym, limit=20)
            longs_liq = sum(1 for l in liquidations if l.get("side") == "buy")
            shorts_liq = sum(1 for l in liquidations if l.get("side") == "sell")
            liquidation_prices = [
                float(l.get("price") or l.get("info", {}).get("price") or 0)
                for l in liquidations
                if float(l.get("price") or l.get("info", {}).get("price") or 0) > 0
            ]
            result["liquidations"] = {
                "total": len(liquidations),
                "longs": longs_liq,
                "shorts": shorts_liq,
                "recent": liquidations[:5],
            }
            if liquidation_prices:
                result["liquidation_zones"] = {
                    "upper_cluster": round(max(liquidation_prices), 2),
                    "lower_cluster": round(min(liquidation_prices), 2),
                    "average_cluster": round(
                        sum(liquidation_prices) / len(liquidation_prices), 2
                    ),
                }
        except Exception as e:
            result["liquidation_error"] = str(e)

        return result

    def get_market_context(self, symbol: str) -> Dict:
        """Obtiene contexto externo complementario con degradacion segura."""
        base_asset = self._base_asset(symbol)
        result = {
            "spot": None,
            "news": [],
            "macro": [],
            "notes": [],
        }
        coin_id = self._coingecko_id(symbol)
        if not coin_id:
            result["notes"].append("No existe mapeo de CoinGecko para este activo.")
            return result

        try:
            response = requests.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": coin_id,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_market_cap": "true",
                    "include_24hr_vol": "true",
                },
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json().get(coin_id, {})
            if payload:
                result["spot"] = {
                    "source": "CoinGecko",
                    "price": payload.get("usd"),
                    "change_24h_pct": payload.get("usd_24h_change"),
                    "market_cap": payload.get("usd_market_cap"),
                    "volume_24h": payload.get("usd_24h_vol"),
                }
        except Exception as e:
            result["notes"].append(f"No se pudo obtener spot complementario: {e}")

        try:
            response = requests.get(
                "https://min-api.cryptocompare.com/data/v2/news/",
                params={
                    "categories": f"{base_asset},regulation,blockchain",
                    "excludeCategories": "Sponsored",
                    "lang": "EN",
                    "sortOrder": "latest",
                    "extraParams": "CoinExTrader",
                },
                timeout=10,
            )
            response.raise_for_status()
            payload = response.json()
            articles = payload.get("Data", [])[:5]
            result["news"] = [
                {
                    "title": article.get("title"),
                    "source": article.get("source_info", {}).get("name")
                    or article.get("source"),
                    "published_at": article.get("published_on"),
                    "url": article.get("url"),
                    "sentiment": article.get("categories"),
                }
                for article in articles
                if article.get("title")
            ]
        except Exception as e:
            result["notes"].append(f"No se pudo obtener news flow: {e}")

        result["macro"] = [
            {
                "evento": "Sin calendario macro integrado",
                "impacto": "Si hay CPI, FOMC, ETF flow o headlines regulatorios, deben validarse fuera de la app.",
            },
            {
                "evento": "Fuente principal de estructura",
                "impacto": "La estructura se calcula con OHLCV real de OKX, no con TradingView.",
            },
        ]
        result["notes"].append(
            "La app prioriza datos en tiempo real de OKX/CoinGecko/CoinEx cuando la fuente responde."
        )
        return result

    def get_all_markets(self, verified_only: bool = False) -> List[Dict]:
        """
        Obtiene todos los mercados de futuros disponibles en OKX.
        Si verified_only=True, filtra solo mercados activos.
        """
        try:
            self.client.load_markets()
            markets = []
            for sym, market in self.client.markets.items():
                if "/USDT" not in sym:
                    continue
                if verified_only and not market.get("active"):
                    continue
                base, quote = sym.split("/")
                markets.append(
                    {
                        "symbol": sym,
                        "base": base,
                        "quote": quote,
                        "active": market.get("active", False),
                    }
                )
            markets.sort(key=lambda x: x["base"])
            return markets
        except Exception as e:
            return {"error": str(e)}

    def get_top_markets(self, limit: int = 30, sort_by: str = "change") -> List[Dict]:
        """
        Obtiene los mejores mercados ordenados por capitalización o cambio 24h.
        sort_by: 'change' (top gainers 24h), 'volume', 'oi' (open interest)
        """
        import requests

        try:
            resp = requests.get(
                "https://api.okx.com/api/v5/market/tickers?instType=SWAP"
            )
            data = resp.json()
            if data.get("code") != "0":
                raise Exception(f"OKX API error: {data}")

            tickers = data.get("data", [])
            valid_tickers = []

            for t in tickers:
                sym = t.get("instId", "")
                if not sym.endswith("-USDT-SWAP"):
                    continue

                base = sym.replace("-USDT-SWAP", "")
                open_price = float(t.get("open24h", 0) or 0)
                last_price = float(t.get("last", 0) or 0)

                if open_price <= 0:
                    continue

                pct = ((last_price - open_price) / open_price) * 100

                val = {
                    "symbol": f"{base}/USDT",
                    "base": base,
                    "quote": "USDT",
                    "percentage": pct,
                    "last": last_price,
                    "up": last_price > open_price,
                    "volume": float(t.get("vol24h", 0) or 0),
                    "open_interest": float(t.get("openInterest", 0) or 0),
                }
                valid_tickers.append(val)

            if sort_by == "change":
                valid_tickers.sort(key=lambda x: x["percentage"], reverse=True)
            elif sort_by == "volume":
                valid_tickers.sort(key=lambda x: x["volume"], reverse=True)
            elif sort_by == "oi":
                valid_tickers.sort(key=lambda x: x["open_interest"], reverse=True)
            else:
                valid_tickers.sort(key=lambda x: x["percentage"], reverse=True)

            return valid_tickers[:limit]
        except Exception as e:
            return {"error": str(e)}


class TradingClient:
    """Cliente de ejecución de órdenes - EXCLUSIVAMENTE COINEX"""

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

    def _get_okx_verified_markets(self) -> set:
        """Obtiene mercados verificados desde OKX para cross-check"""
        try:
            okx = ccxt.okx({"enableRateLimit": True})
            okx.options["defaultType"] = "swap"
            markets = okx.load_markets()
            return set(
                s.replace("/USDT", "USDT")
                for s in markets.keys()
                if "/USDT" in s and markets[s].get("active")
            )
        except Exception as e:
            return set()

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
        """Crea una orden con SL y TP automáticos en modo aislado."""
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
                raise Exception(
                    f"Posición muy pequeña: {amount} {symbol.split('/')[0]}. El mínimo en CoinEx para este par es {min_amount}. Sube el Capital o el Riesgo %."
                )

            amount = float(self.client.amount_to_precision(symbol, amount))
        except Exception as e:
            return {"error": str(e)}

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
            opposite_side = "sell" if side.lower() == "long" else "buy"
            return self.execute_order(
                symbol, opposite_side, amount, order_type="market"
            )
        except Exception as e:
            return {"error": str(e)}

    def get_all_markets(self, verified_only: bool = False) -> List[Dict]:
        """
        Obtiene todos los mercados de futuros disponibles en CoinEx.
        Si verified_only=True, filtra usando OKX como referencia.
        """
        import requests

        try:
            verified_markets = (
                self._get_okx_verified_markets() if verified_only else set()
            )

            resp = requests.get("https://api.coinex.com/v2/futures/market")
            data = resp.json()
            if data.get("code") != 0:
                raise Exception(f"API error: {data}")

            markets = []
            for market in data["data"]:
                sym = market["market"]
                if sym.endswith("USDT"):
                    symbol = f"{sym[:-4]}/USDT"
                    base = sym[:-4]
                    quote = "USDT"
                elif sym.endswith("USDC"):
                    symbol = f"{sym[:-4]}/USDC"
                    base = sym[:-4]
                    quote = "USDC"
                else:
                    symbol = sym
                    base = sym
                    quote = ""

                if verified_only and sym not in verified_markets:
                    continue

                markets.append(
                    {"symbol": symbol, "base": base, "quote": quote, "active": True}
                )
            return markets
        except Exception as e:
            return {"error": str(e)}

    def get_top_markets(
        self, limit: int = 30, sort_by: str = "change", verified_only: bool = False
    ) -> List[Dict]:
        """
        Obtiene los mejores mercados ordenados desde CoinEx.
        sort_by: 'change' (top gainers 24h), 'volume', 'oi', 'value'
        Si verified_only=True, filtra usando OKX como referencia.
        """
        import requests

        try:
            verified_markets = (
                self._get_okx_verified_markets() if verified_only else set()
            )

            resp = requests.get("https://api.coinex.com/v2/futures/ticker")
            data = resp.json()
            if data.get("code") != 0:
                raise Exception(f"API error: {data}")

            tickers = data["data"]
            valid_tickers = []

            for m in tickers:
                sym = m["market"]
                if not sym.endswith("USDT"):
                    continue

                if verified_only and sym not in verified_markets:
                    continue

                open_price = float(m["open"])
                last_price = float(m["last"])

                if open_price <= 0:
                    continue

                pct = ((last_price - open_price) / open_price) * 100

                clean_sym = f"{sym[:-4]}/USDT"
                base = sym[:-4]

                if base in ["USDC", "DAI", "TUSD"]:
                    continue

                val = {
                    "symbol": clean_sym,
                    "base": base,
                    "quote": "USDT",
                    "percentage": pct,
                    "last": last_price,
                    "up": last_price > open_price,
                    "volume": float(m["volume"]),
                    "open_interest": float(m.get("open_interest_volume", 0)),
                    "value": float(m.get("value", 0)),
                    "trades": float(m.get("volume_buy", 0))
                    + float(m.get("volume_sell", 0)),
                }
                valid_tickers.append(val)

            if sort_by == "change":
                valid_tickers.sort(key=lambda x: x["percentage"], reverse=True)
            elif sort_by == "volume":
                valid_tickers.sort(key=lambda x: x["volume"], reverse=True)
            elif sort_by == "oi":
                valid_tickers.sort(key=lambda x: x["open_interest"], reverse=True)
            elif sort_by == "value":
                valid_tickers.sort(key=lambda x: x["value"], reverse=True)
            elif sort_by == "trades":
                valid_tickers.sort(key=lambda x: x["trades"], reverse=True)
            else:
                valid_tickers.sort(key=lambda x: x["percentage"], reverse=True)

            return valid_tickers[:limit]
        except Exception as e:
            return {"error": str(e)}

    def get_realized_pnl(self, limit: int = 50) -> Dict:
        """Obtiene el PnL total: realizado + no realizado + fees"""
        try:
            total_pnl = 0.0
            realized_pnl = 0.0
            unrealized_pnl = 0.0
            total_fees = 0.0
            pnl_records = []
            positions = []

            try:
                positions = self.client.fetch_positions()
                for pos in positions:
                    if pos.get("contracts", 0) > 0:
                        un_pnl = float(pos.get("unrealizedPnl", 0) or 0)
                        unrealized_pnl += un_pnl
            except Exception:
                pass

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
            except Exception:
                pass

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
