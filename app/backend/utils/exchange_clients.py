import ccxt
import pandas as pd
import numpy as np
import requests
import os
import time
import json
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta

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


class RateLimiter:
    """Manejo de rate limits para CoinEx API"""
    
    def __init__(self):
        self.request_times = {}
        self.rate_limits = {
            "ip_limit": 400,  # 400 requests/second
            "short_cycle": {
                "spot": 20,  # 20 requests/second
                "futures": 20  # 20 requests/second
            },
            "long_cycle": {
                "reset_interval": 3600,  # 1 hour cycles
                "max_volume": 1000  # Max requests per cycle
            }
        }
    
    def wait_if_needed(self, endpoint_group: str = "futures"):
        """Espera si es necesario para evitar rate limits"""
        current_time = time.time()
        
        # Inicializar si no hay registros
        if endpoint_group not in self.request_times:
            self.request_times[endpoint_group] = []
        
        # Limpiar registros viejos (más de 1 hora)
        self.request_times[endpoint_group] = [
            req_time for req_time in self.request_times[endpoint_group]
            if current_time - req_time < 3600
        ]
        
        # Verificar short cycle rate limit
        if len(self.request_times[endpoint_group]) >= self.rate_limits["short_cycle"][endpoint_group]:
            # Calcular tiempo de espera
            oldest_request = min(self.request_times[endpoint_group])
            wait_time = 1.0 - (current_time - oldest_request)
            
            if wait_time > 0:
                print(f">>> Rate limit detected for {endpoint_group}. Waiting {wait_time:.2f}s...")
                time.sleep(wait_time)
        
        # Registrar esta solicitud
        self.request_times[endpoint_group].append(current_time)
    
    def handle_rate_limit_error(self, response_headers: dict) -> bool:
        """Maneja errores de rate limit basados en headers"""
        if not response_headers:
            return False
            
        # Verificar headers de rate limit de CoinEx
        limit_header = response_headers.get('X-RateLimit-Limit')
        remaining_header = response_headers.get('X-RateLimit-Remaining')
        
        if limit_header and remaining_header and int(remaining_header) <= 0:
            print(">>> Rate limit exceeded. Waiting...")
            return True
        
        return False


class TradingClient:
    """Cliente para trading en CoinEx con manejo mejorado de TP/SL y rate limits"""

    def __init__(self, api_key: str, secret: str):
        self.rate_limiter = RateLimiter()
        self.client = ccxt.coinex({
            "apiKey": api_key,
            "secret": secret,
            "enableRateLimit": True,
            "options": {
                "defaultType": "swap",
                "adjustForTimeDifference": True
            }
        })
        self.client.options["defaultType"] = "swap"
        self.client.options["createMarketBuyOrderRequiresPrice"] = False
        self.client.options["defaultMarginMode"] = "isolated"
        
        # Cache para actualizaciones rápidas
        self._cache = {
            "positions": {"data": None, "timestamp": 0, "ttl": 1.0},  # 1 segundo
            "balance": {"data": None, "timestamp": 0, "ttl": 2.0},    # 2 segundos
            "pnl": {"data": None, "timestamp": 0, "ttl": 3.0}         # 3 segundos
        }
        
        # Contadores para rate limit optimization
        self._request_counters = {
            "positions": 0,
            "balance": 0, 
            "pnl": 0,
            "last_reset": time.time()
        }

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
        """Crea orden con TP y SL incorporados desde el principio usando el método específico de CoinEx."""
        print(f"=== CREATE ORDER WITH TP/SL (INCORPORADOS) DEBUG ===")
        print(f"Symbol: {symbol}")
        print(f"Side: {side}")
        print(f"Amount: {amount}")
        print(f"Entry Price: {entry_price}")
        print(f"Stop Loss: {stop_loss}")
        print(f"Take Profit: {take_profit}")
        print(f"Leverage: {leverage}")
        print(f"Margin Mode: {margin_mode}")
        print(f"Order Type: {order_type}")
        print(f"==================================================")
        
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

            # CoinEx no soporta TP/SL en la orden inicial.
            # Hay que crear la orden y luego establecer TP/SL en la posición
            print(f">>> Creating initial order without TP/SL (CoinEx limitation)...")
            
            # Crear la orden simple sin TP/SL
            order = self.client.create_order(
                symbol=symbol,
                type=order_type,
                side=side,
                amount=amount,
                price=entry_price if order_type == "limit" else None,
                params={}
            )
            
            print(f">>> Initial order created: {order}")
            print(f">>> Will set TP/SL after position opens...")
            
            # Estructura de respuesta para compatibilidad
            protective = {
                "stop_loss": {
                    "requested": float(stop_loss) if stop_loss else None,
                    "status": "pending",
                    "message": "Will be set when position opens",
                    "method": "coinex_position_api"
                } if stop_loss else None,
                "take_profit": {
                    "requested": float(take_profit) if take_profit else None,
                    "status": "pending",
                    "message": "Will be set when position opens",
                    "method": "coinex_position_api"
                } if take_profit else None,
                "warnings": [
                    "CoinEx no soporta TP/SL en orden inicial. Se establecerán cuando la posición se abra.",
                    "Usando endpoints específicos: /futures/set-position-stop-loss y /futures/set-position-take-profit"
                ]
            }
            
            # Verificar si la respuesta contiene información sobre TP/SL
            if order and isinstance(order, dict):
                order_info = order.get('info', {})
                if not order_info.get('takeProfitPrice') and take_profit:
                    protective["warnings"].append(
                        "Take Profit fue solicitado pero no aparece en la respuesta de la orden"
                    )
                if not order_info.get('stopLossPrice') and stop_loss:
                    protective["warnings"].append(
                        "Stop Loss fue solicitado pero no aparece en la respuesta de la orden"
                    )
            
            return {
                "order": order,
                "protective_orders": protective,
                "method": "incorporated_tp_sl"
            }

        except Exception as e:
            print(f">>> Error creating order with TP/SL: {str(e)}")
            
            # Fallback: intentar crear orden simple y luego configurar TP/TP por separado
            print(f">>> Trying fallback: create simple order + separate TP/SL...")
            try:
                # Crear orden simple
                order_params = {}
                if order_type == "market" or not entry_price:
                    order = self.client.create_market_order(
                        symbol=symbol, side=side, amount=amount, params=order_params
                    )
                else:
                    order = self.client.create_limit_order(
                        symbol=symbol,
                        side=side,
                        amount=amount,
                        price=entry_price,
                        params=order_params,
                    )
                
                print(f">>> Simple order created, attempting to set TP/SL separately...")
                
                # Intentar configurar TP/SL por separado
                protective = {"stop_loss": None, "take_profit": None, "warnings": []}
                
                # Para órdenes market, intentar configurar TP/TP inmediatamente
                if order_type == "market":
                    if stop_loss:
                        try:
                            sl_resp = self.client.create_stop_loss_order(
                                symbol=symbol,
                                type="market",
                                side=side,
                                amount=amount,
                                stopLossPrice=float(stop_loss),
                                params={}
                            )
                            protective["stop_loss"] = {
                                "requested": float(stop_loss),
                                "status": "set",
                                "exchange_response": sl_resp,
                                "method": "fallback"
                            }
                        except Exception as sl_e:
                            protective["stop_loss"] = {
                                "requested": float(stop_loss),
                                "status": "error",
                                "error": str(sl_e)
                            }
                            protective["warnings"].append(f"Stop Loss fallback failed: {str(sl_e)[:50]}")
                    
                    if take_profit:
                        try:
                            tp_resp = self.client.create_take_profit_order(
                                symbol=symbol,
                                type="limit",
                                side=side,
                                amount=amount,
                                takeProfitPrice=float(take_profit),
                                params={}
                            )
                            protective["take_profit"] = {
                                "requested": float(take_profit),
                                "status": "set",
                                "exchange_response": tp_resp,
                                "method": "fallback"
                            }
                        except Exception as tp_e:
                            protective["take_profit"] = {
                                "requested": float(take_profit),
                                "status": "error",
                                "error": str(tp_e)
                            }
                            protective["warnings"].append(f"Take Profit fallback failed: {str(tp_e)[:50]}")
                else:
                    # Para órdenes limit, crear nueva orden con TP/SL incorporados
                    # Esto debería funcionar con el método estándar de CCXT
                    print(f">>> Creating limit order with TP/SL using standard CCXT method...")
                    
                    try:
                        # Intentar crear una nueva orden limit con TP/SL
                        order_params = {}
                        if take_profit:
                            order_params["takeProfitPrice"] = float(take_profit)
                        if stop_loss:
                            order_params["stopLossPrice"] = float(stop_loss)
                        
                        # Re-crear la orden con TP/SL
                        order_with_tp_sl = self.client.create_order(
                            symbol=symbol,
                            type="limit",
                            side=side,
                            amount=amount,
                            price=entry_price,
                            params=order_params
                        )
                        
                        print(f">>> Limit order with TP/SL created successfully: {order_with_tp_sl}")
                        
                        protective = {
                            "stop_loss": {
                                "requested": float(stop_loss) if stop_loss else None,
                                "status": "set" if stop_loss else "not_requested",
                                "exchange_response": order_with_tp_sl if stop_loss else None,
                                "method": "standard_ccxt"
                            } if stop_loss else None,
                            "take_profit": {
                                "requested": float(take_profit) if take_profit else None,
                                "status": "set" if take_profit else "not_requested",
                                "exchange_response": order_with_tp_sl if take_profit else None,
                                "method": "standard_ccxt"
                            } if take_profit else None,
                            "warnings": ["Orden limit creada con TP/SL usando método estándar de CCXT."]
                        }
                        
                        # Usar la nueva orden con TP/SL
                        order = order_with_tp_sl
                        
                    except Exception as tp_sl_error:
                        print(f">>> Error creating limit order with TP/SL: {str(tp_sl_error)}")
                        print(f">>> Falling back to simple limit order...")
                        
                        # Si falla, mantener la orden simple y marcar TP/SL como pending
                        protective = {
                            "stop_loss": {
                                "requested": float(stop_loss) if stop_loss else None,
                                "status": "pending",
                                "message": "Will be set when position opens"
                            } if stop_loss else None,
                            "take_profit": {
                                "requested": float(take_profit) if take_profit else None,
                                "status": "pending", 
                                "message": "Will be set when position opens"
                            } if take_profit else None,
                            "warnings": [f"TP/SL failed ({str(tp_sl_error)[:50]}), will set when position opens."]
                        }
                
                return {
                    "order": order,
                    "protective_orders": protective,
                    "method": "fallback_simple_order"
                }
                
            except Exception as fallback_e:
                print(f">>> Fallback also failed: {str(fallback_e)}")
                return {"error": f"Primary method failed: {str(e)}. Fallback failed: {str(fallback_e)}"}

    def set_position_stop_loss(self, market: str, stop_loss_price: float, stop_loss_amount: float = None) -> Dict:
        """Establece Stop Loss en posición activa usando API de CoinEx"""
        try:
            print(f">>> Setting position Stop Loss: {stop_loss_price}")
            
            data = {
                "market": market,
                "market_type": "FUTURES",
                "stop_loss_type": "mark_price",
                "stop_loss_price": str(stop_loss_price),
                "stop_loss_amount": str(stop_loss_amount) if stop_loss_amount else "0"
            }
            
            response = self.post_futures_private_with_retry(
                "/futures/set-position-stop-loss",
                data=data
            )
            
            print(f">>> Position Stop Loss set successfully: {response}")
            return {
                "success": True,
                "response": response,
                "price": stop_loss_price
            }
        except Exception as e:
            print(f">>> Error setting position Stop Loss: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "price": stop_loss_price
            }

    def set_position_take_profit(self, market: str, take_profit_price: float, take_profit_amount: float = None) -> Dict:
        """Establece Take Profit en posición activa usando API de CoinEx"""
        try:
            print(f">>> Setting position Take Profit: {take_profit_price}")
            
            data = {
                "market": market,
                "market_type": "FUTURES",
                "take_profit_type": "mark_price",
                "take_profit_price": str(take_profit_price),
                "take_profit_amount": str(take_profit_amount) if take_profit_amount else "0"
            }
            
            response = self.post_futures_private_with_retry(
                "/futures/set-position-take-profit",
                data=data
            )
            
            print(f">>> Position Take Profit set successfully: {response}")
            return {
                "success": True,
                "response": response,
                "price": take_profit_price
            }
        except Exception as e:
            print(f">>> Error setting position Take Profit: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "price": take_profit_price
            }

    def check_position_exists(self, market: str) -> Dict:
        """Verifica si existe posición activa para el market"""
        try:
            print(f">>> Checking if position exists for {market}...")
            
            # Obtener posiciones activas
            positions = self.client.fetch_positions([market])
            
            # Buscar posición con tamaño > 0
            active_position = None
            for pos in positions:
                if (pos.get('symbol') == market and 
                    pos.get('contracts', 0) > 0 and 
                    pos.get('side') in ['long', 'short']):
                    active_position = pos
                    break
            
            if active_position:
                print(f">>> Active position found: {active_position}")
                return {
                    "exists": True,
                    "position": active_position,
                    "contracts": float(active_position.get('contracts', 0)),
                    "side": active_position.get('side'),
                    "entry_price": float(active_position.get('entryPrice', 0))
                }
            else:
                print(f">>> No active position found for {market}")
                return {
                    "exists": False,
                    "position": None,
                    "contracts": 0,
                    "side": None,
                    "entry_price": 0
                }
                
        except Exception as e:
            print(f">>> Error checking position: {str(e)}")
            return {
                "exists": False,
                "position": None,
                "contracts": 0,
                "side": None,
                "entry_price": 0,
                "error": str(e)
            }
                
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Verifica si el cache es válido"""
        cache_entry = self._cache.get(cache_key)
        if not cache_entry or cache_entry["data"] is None:
            return False
        
        age = time.time() - cache_entry["timestamp"]
        return age < cache_entry["ttl"]
    
    def _update_cache(self, cache_key: str, data: Any):
        """Actualiza el cache"""
        self._cache[cache_key] = {
            "data": data,
            "timestamp": time.time(),
            "ttl": self._cache[cache_key]["ttl"]
        }
    
    def _get_optimal_delay(self, endpoint_type: str) -> float:
        """Calcula el delay óptimo basado en rate limits"""
        current_time = time.time()
        
        # Resetear contadores cada minuto
        if current_time - self._request_counters["last_reset"] > 60:
            self._request_counters = {
                "positions": 0,
                "balance": 0,
                "pnl": 0,
                "last_reset": current_time
            }
        
        # Rate limits: 20 req/s para futures
        max_per_second = 20
        current_per_second = self._request_counters[endpoint_type]
        
        if current_per_second >= max_per_second:
            return 1.0  # Esperar 1 segundo si alcanzamos el límite
        
        # Calcular delay para mantenerse bajo el límite
        return 0.05  # 50ms mínimo para no exceder el límite

    def set_position_tp_sl_after_order(self, market: str, stop_loss: float = None, take_profit: float = None, amount: float = None) -> Dict:
        """Establece TP/SL después de que la orden se ejecute y la posición se abra"""
        print(f">>> Setting TP/SL after order execution...")
        
        # Primero verificar si existe posición activa
        position_check = self.check_position_exists(market)
        
        if not position_check["exists"]:
            return {
                "stop_loss": None,
                "take_profit": None,
                "errors": [f"No active position found for {market}. Cannot set TP/SL without open position."],
                "position_check": position_check
            }
        
        print(f">>> Position confirmed: {position_check['contracts']} contracts, side: {position_check['side']}")
        
        results = {
            "stop_loss": None,
            "take_profit": None,
            "errors": [],
            "position_check": position_check
        }
        
        # Usar el tamaño real de la posición para TP/SL
        position_contracts = position_check["contracts"]
        
        if stop_loss:
            sl_result = self.set_position_stop_loss(market, stop_loss, position_contracts)
            results["stop_loss"] = sl_result
            if not sl_result.get("success"):
                results["errors"].append(f"Stop Loss failed: {sl_result.get('error')}")
        
        if take_profit:
            tp_result = self.set_position_take_profit(market, take_profit, position_contracts)
            results["take_profit"] = tp_result
            if not tp_result.get("success"):
                results["errors"].append(f"Take Profit failed: {tp_result.get('error')}")
        
        return results

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

    def get_balance_fast(self) -> Dict:
        """Obtiene balance con cache y rate limit optimization"""
        # Verificar cache primero
        if self._is_cache_valid("balance"):
            print(">>> Using cached balance data")
            return self._cache["balance"]["data"]
        
        # Calcular delay óptimo
        delay = self._get_optimal_delay("balance")
        if delay > 0:
            time.sleep(delay)
        
        try:
            print(">>> Fetching balance from CoinEx (fast mode)...")
            
            # Aplicar rate limit
            self.rate_limiter.wait_if_needed("futures")
            
            balance = self.client.fetch_balance()
            
            if balance and 'USDT' in balance.get('total', {}):
                usdt_balance = balance['total']['USDT']
                result = {
                    "usdt_free": usdt_balance,
                    "usdt_used": balance.get('used', {}).get('USDT', 0),
                    "usdt_total": balance.get('total', {}).get('USDT', 0),
                    "timestamp": time.time()
                }
                
                # Actualizar cache
                self._update_cache("balance", result)
                
                # Incrementar contador
                self._request_counters["balance"] += 1
                
                print(f">>> Balance fetched: {usdt_balance} USDT (cached for 2s)")
                return result
            else:
                print(">>> No USDT balance found")
                result = {"usdt_free": 0, "timestamp": time.time()}
                self._update_cache("balance", result)
                return result
                
        except Exception as e:
            print(f">>> Error fetching balance: {str(e)}")
            return {"error": str(e)}

    def get_realized_pnl_fast(self) -> Dict:
        """Obtiene PnL realizado con cache y rate limit optimization"""
        # Verificar cache primero
        if self._is_cache_valid("pnl"):
            print(">>> Using cached PnL data")
            return self._cache["pnl"]["data"]
        
        # Calcular delay óptimo
        delay = self._get_optimal_delay("pnl")
        if delay > 0:
            time.sleep(delay)
        
        try:
            print(">>> Fetching PnL from CoinEx (fast mode)...")
            
            # Aplicar rate limit
            self.rate_limiter.wait_if_needed("futures")
            
            # Obtener PnL desde CoinEx
            response = self.post_futures_private_with_retry("/futures/get-realized-pnl")
            
            if response and not response.get("error"):
                result = {
                    "realized_pnl": float(response.get("realized_pnl", 0)),
                    "unrealized_pnl": float(response.get("unrealized_pnl", 0)),
                    "total_pnl": float(response.get("total_pnl", 0)),
                    "timestamp": time.time()
                }
                
                # Actualizar cache
                self._update_cache("pnl", result)
                
                # Incrementar contador
                self._request_counters["pnl"] += 1
                
                print(f">>> PnL fetched: {result['total_pnl']} USDT (cached for 3s)")
                return result
            else:
                print(">>> No PnL data found")
                result = {"realized_pnl": 0, "unrealized_pnl": 0, "total_pnl": 0, "timestamp": time.time()}
                self._update_cache("pnl", result)
                return result
                
        except Exception as e:
            print(f">>> Error fetching PnL: {str(e)}")
            return {"error": str(e)}

    def get_realized_pnl(self) -> Dict:
        """Obtiene PnL realizado de CoinEx"""
        return self.get_realized_pnl_fast()

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

    @staticmethod
    def _position_unrealized_realized(position: Dict) -> Tuple[float, float]:
        """Lee PnL desde estructura unificada CCXT + fallback a info crudo CoinEx."""
        info = position.get("info") or {}
        u = position.get("unrealizedPnl")
        r = position.get("realizedPnl")
        if u is None:
            u = info.get("unrealized_pnl")
        if r is None:
            r = info.get("realized_pnl")
        try:
            u_f = float(u) if u is not None else 0.0
        except (TypeError, ValueError):
            u_f = 0.0
        try:
            r_f = float(r) if r is not None else 0.0
        except (TypeError, ValueError):
            r_f = 0.0
        return u_f, r_f

    @staticmethod
    def _trade_fee_cost(trade: Dict) -> float:
        fee = trade.get("fee")
        if isinstance(fee, dict) and fee.get("cost") is not None:
            try:
                return float(fee.get("cost") or 0)
            except (TypeError, ValueError):
                return 0.0
        info = trade.get("info") or {}
        try:
            return float(info.get("fee", 0) or 0)
        except (TypeError, ValueError):
            return 0.0

    def get_realized_pnl(self, limit: int = 50) -> Dict:
        """
        PnL futuros CoinEx (swap): CCXT rellena realizedPnl / unrealizedPnl en posiciones.
        Los user-deals de futuros no traen realized_pnl por fill; antes se leía info['realized_pnl']
        (inexistente) y el acumulado salía 0.
        """
        try:
            unrealized_pnl = 0.0
            realized_open = 0.0
            realized_closed = 0.0
            total_fees = 0.0
            history: List[Dict] = []
            positions_pending: List[Dict] = []

            try:
                self.client.load_markets()
            except Exception:
                pass

            try:
                positions_pending = self.client.fetch_positions() or []
                for pos in positions_pending:
                    u, r = self._position_unrealized_realized(pos)
                    unrealized_pnl += u
                    realized_open += r
            except Exception:
                positions_pending = []

            page = 1
            page_limit = min(max(limit, 10), 100)
            max_pages = 200
            method_finished = "v2PrivateGetFuturesFinishedPosition"

            while page <= max_pages:
                try:
                    batch = self.client.fetch_positions(
                        params={
                            "method": method_finished,
                            "page": page,
                            "limit": page_limit,
                        }
                    )
                except Exception:
                    break
                if not batch:
                    break
                for pos in batch:
                    _, r = self._position_unrealized_realized(pos)
                    realized_closed += r
                    sym = pos.get("symbol")
                    if sym and r != 0 and len(history) < 15:
                        history.append(
                            {
                                "symbol": sym,
                                "pnl": round(r, 8),
                                "fee": 0.0,
                                "time": pos.get("datetime"),
                                "source": "finished_position",
                            }
                        )
                if len(batch) < page_limit:
                    break
                page += 1

            symbols = list(
                {p.get("symbol") for p in positions_pending if p.get("symbol")}
            )
            for sym in symbols[:20]:
                try:
                    trades = self.client.fetch_my_trades(sym, limit=80)
                    for trade in trades or []:
                        total_fees += self._trade_fee_cost(trade)
                except Exception:
                    continue

            realized_pnl = realized_open + realized_closed
            total_pnl = realized_pnl + unrealized_pnl - total_fees

            return {
                "total_pnl": round(total_pnl, 2),
                "realized_pnl": round(realized_pnl, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
                "realized_from_open_positions": round(realized_open, 2),
                "realized_from_closed_positions": round(realized_closed, 2),
                "total_fees": round(total_fees, 2),
                "count": len(history),
                "history": history[:10],
            }
        except Exception as e:
            return {"error": str(e)}
