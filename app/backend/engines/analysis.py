import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import concurrent.futures
from datetime import datetime
from zoneinfo import ZoneInfo


class AnalysisEngine:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.df["high"] = self.df["high"].astype(float)
        self.df["low"] = self.df["low"].astype(float)
        self.df["close"] = self.df["close"].astype(float)
        self.df["volume"] = self.df["volume"].astype(float)
        self._swings_cache = None
        self._fvgs_cache = None

    def detect_swings(self):
        self.df["is_swing_high"] = (self.df["high"] > self.df["high"].shift(1)) & (
            self.df["high"] > self.df["high"].shift(-1)
        )
        self.df["is_swing_low"] = (self.df["low"] < self.df["low"].shift(1)) & (
            self.df["low"] < self.df["low"].shift(-1)
        )

    def detect_market_structure(self):
        if self._swings_cache is not None:
            return self._swings_cache

        self.detect_swings()

        swings = []
        last_high = None
        last_low = None

        for i in range(1, len(self.df) - 1):
            if self.df["is_swing_high"].iloc[i]:
                price = self.df["high"].iloc[i]
                if last_high is None:
                    label = "LH"
                elif price > last_high:
                    label = "HH"
                else:
                    label = "LH"
                last_high = price
                swings.append(
                    {"index": i, "type": label, "price": price, "role": "resistance"}
                )

            if self.df["is_swing_low"].iloc[i]:
                price = self.df["low"].iloc[i]
                if last_low is None:
                    label = "HL"
                elif price < last_low:
                    label = "LL"
                else:
                    label = "HL"
                last_low = price
                swings.append(
                    {"index": i, "type": label, "price": price, "role": "support"}
                )

        result = swings[-10:] if len(swings) > 10 else swings
        self._swings_cache = result
        return result

    def detect_bos_choch(self, swings=None):
        if swings is None:
            swings = self.detect_market_structure()
        if len(swings) < 4:
            return {"bos": None, "choch": None, "trend": "Neutral"}

        swing_types = [s["type"] for s in swings]

        trend = "Neutral"
        bos = None
        choch = None

        last_5 = swing_types[-5:]

        if (last_5.count("HH") >= 2 and last_5.count("HL") >= 1) or (last_5.count("HH") >= 1 and last_5.count("HL") >= 1 and self.df["close"].iloc[-1] > self.df["ema_20"].iloc[-1] if "ema_20" in self.df else True):
            trend = "Alcista"
            if len(swings) >= 2:
                last_idx = swings[-1]["index"]
                prev_idx = swings[-2]["index"]
                # BOS alcista: cierre por encima del máximo anterior
                if self.df["close"].iloc[-1] > self.df["high"].iloc[prev_idx]:
                    bos = {"type": "Alcista", "index": last_idx, "valid": True}
        elif (last_5.count("LL") >= 2 and last_5.count("LH") >= 1) or (last_5.count("LL") >= 1 and last_5.count("LH") >= 1 and self.df["close"].iloc[-1] < self.df["ema_20"].iloc[-1] if "ema_20" in self.df else True):
            trend = "Bajista"
            if len(swings) >= 2:
                last_idx = swings[-1]["index"]
                prev_idx = swings[-2]["index"]
                # BOS bajista: cierre por debajo del mínimo anterior
                if self.df["close"].iloc[-1] < self.df["low"].iloc[prev_idx]:
                    bos = {"type": "Bajista", "index": last_idx, "valid": True}

        return {"bos": bos, "choch": choch, "trend": trend}

    def detect_liquidity_zones(self):
        liquidity = {"highs": [], "lows": [], "clusters": []}

        highs = []
        lows = []

        for i in range(2, len(self.df) - 2):
            if self.df["high"].iloc[i] == self.df["high"].iloc[i - 1]:
                if not any(abs(h - self.df["high"].iloc[i]) < 0.001 for h in highs):
                    highs.append(self.df["high"].iloc[i])
            if self.df["low"].iloc[i] == self.df["low"].iloc[i - 1]:
                if not any(abs(l - self.df["low"].iloc[i]) < 0.001 for l in lows):
                    lows.append(self.df["low"].iloc[i])

        liquidity["highs"] = sorted(highs, reverse=True)[:3]
        liquidity["lows"] = sorted(lows)[:3]

        return liquidity

    def get_fvgs(self) -> List[Dict]:
        if self._fvgs_cache is not None:
            return self._fvgs_cache

        fvgs = []
        for i in range(1, len(self.df) - 1):
            low_i1 = self.df["low"].iloc[i + 1]
            high_i_1 = self.df["high"].iloc[i - 1]

            if low_i1 > high_i_1 and self.df["close"].iloc[i] > self.df["open"].iloc[i]:
                fvgs.append(
                    {
                        "type": "Alcista",
                        "top": low_i1,
                        "bottom": high_i_1,
                        "index": i,
                        "valid": True,
                    }
                )
            elif (
                self.df["high"].iloc[i + 1] < self.df["low"].iloc[i - 1]
                and self.df["close"].iloc[i] < self.df["open"].iloc[i]
            ):
                fvgs.append(
                    {
                        "type": "Bajista",
                        "top": self.df["low"].iloc[i - 1],
                        "bottom": self.df["high"].iloc[i + 1],
                        "index": i,
                        "valid": True,
                    }
                )

        return fvgs[-5:] if len(fvgs) > 5 else fvgs

    def get_order_blocks(self, fvgs=None) -> List[Dict]:
        if fvgs is None:
            fvgs = self.get_fvgs()
        obs = []

        for fvg in fvgs:
            idx = fvg["index"]
            if fvg["type"] == "Alcista":
                obs.append(
                    {
                        "type": "OB Alcista",
                        "zone": f"${self.df['low'].iloc[idx - 1]:.2} - ${self.df['low'].iloc[idx]:.2}",
                        "price": self.df["low"].iloc[idx - 1],
                        "strength": "Alta" if idx > len(self.df) - 20 else "Media",
                    }
                )
            else:
                obs.append(
                    {
                        "type": "OB Bajista",
                        "zone": f"${self.df['high'].iloc[idx]:.2} - ${self.df['high'].iloc[idx - 1]:.2}",
                        "price": self.df["high"].iloc[idx - 1],
                        "strength": "Alta" if idx > len(self.df) - 20 else "Media",
                    }
                )

        return obs

    def get_volume_analysis(self):
        recent_vol = self.df["volume"].tail(20)
        avg_volume = recent_vol.mean()
        last_volume = self.df["volume"].iloc[-1]

        volume_ratio = last_volume / avg_volume if avg_volume > 0 else 0

        return {
            "avg_volume": round(avg_volume, 2),
            "last_volume": last_volume,
            "ratio": round(volume_ratio, 2),
            "signal": "Alto"
            if volume_ratio > 1.3
            else "Normal"
            if volume_ratio > 0.8
            else "Bajo",
        }

    def get_indicators(self):
        df = self.df.copy()

        df["ema_20"] = df["close"].ewm(span=20, adjust=False).mean()
        df["ema_50"] = df["close"].ewm(span=50, adjust=False).mean()
        df["ema_200"] = df["close"].ewm(span=200, adjust=False).mean()

        delta = df["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df["rsi"] = 100 - (100 / (1 + rs))

        high_low = df["high"] - df["low"]
        high_close = np.abs(df["high"] - df["close"].shift())
        low_close = np.abs(df["low"] - df["close"].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = np.max(ranges, axis=1)
        df["atr"] = true_range.rolling(14).mean()

        return df.tail(1).to_dict("records")[0]

    def calculate_sl_based_on_atr(self, bias: str, last_price: float, atr: float):
        sl_distance = atr * 1.5

        if bias == "Alcista":
            sl = last_price - sl_distance
        elif bias == "Bajista":
            sl = last_price + sl_distance
        else:
            sl = (
                last_price - sl_distance
                if last_price > self.df["close"].iloc[-10:].mean()
                else last_price + sl_distance
            )

        return {
            "sl_price": round(sl, 4),
            "sl_distance": round(sl_distance, 4),
            "sl_pct": round((sl_distance / last_price) * 100, 2),
        }

    def _get_timezone(self, country: str) -> str:
        mapping = {
            "cuba": "America/Havana",
            "usa": "America/New_York",
            "united states": "America/New_York",
            "mexico": "America/Mexico_City",
            "spain": "Europe/Madrid",
            "españa": "Europe/Madrid",
            "argentina": "America/Argentina/Buenos_Aires",
            "colombia": "America/Bogota",
            "venezuela": "America/Caracas",
        }
        return mapping.get((country or "Cuba").strip().lower(), "America/Havana")

    def _get_fecha_hora(self, country: str = "Cuba"):
        meses = {
            "January": "Enero",
            "February": "Febrero",
            "March": "Marzo",
            "April": "Abril",
            "May": "Mayo",
            "June": "Junio",
            "July": "Julio",
            "August": "Agosto",
            "September": "Septiembre",
            "October": "Octubre",
            "November": "Noviembre",
            "December": "Diciembre",
        }
        timezone = self._get_timezone(country)
        now_local = datetime.now(ZoneInfo(timezone))
        fecha_hora = now_local.strftime("%d de %B, %Y - %H:%M")
        for eng, esp in meses.items():
            fecha_hora = fecha_hora.replace(eng, esp)
        return f"{fecha_hora} ({timezone})"

    def _round_levels(self, values: List[float]) -> List[float]:
        return [round(float(v), 4) for v in values if float(v) > 0]

    def _probable_sweep(self, current_price: float, highs: List[float], lows: List[float]):
        upper = min(highs, key=lambda x: abs(x - current_price)) if highs else None
        lower = min(lows, key=lambda x: abs(x - current_price)) if lows else None
        return {
            "buy_side": round(upper, 4) if upper else None,
            "sell_side": round(lower, 4) if lower else None,
        }

    def _detect_traps(
        self,
        bias: str,
        current_price: float,
        support: float,
        resistance: float,
        funding_rate: float,
        volume_ratio: float,
        liquidation_zones: Optional[Dict] = None,
    ) -> Dict:
        liquidation_zones = liquidation_zones or {}
        upper_liq = liquidation_zones.get("upper_cluster")
        lower_liq = liquidation_zones.get("lower_cluster")
        
        # Cálculo de distancia a zonas clave
        dist_to_resistance = abs(current_price - resistance) / current_price if resistance > 0 else float('inf')
        dist_to_support = abs(current_price - support) / current_price if support > 0 else float('inf')
        dist_to_upper_liq = abs(current_price - upper_liq) / current_price if upper_liq else float('inf')
        dist_to_lower_liq = abs(current_price - lower_liq) / current_price if lower_liq else float('inf')
        
        # Umbrales de proximidad
        near_resistance = dist_to_resistance < 0.003
        near_support = dist_to_support < 0.003
        near_upper_liq = dist_to_upper_liq < 0.004
        near_lower_liq = dist_to_lower_liq < 0.004
        
        # Cálculo de probabilidad de trap (0-100%)
        bull_trap_probability = 0
        bear_trap_probability = 0
        
        # Bull Trap: Sesgo alcista + cerca de zona peligrosa
        if bias == "Alcista":
            factors = []
            if near_resistance: factors.append(30)  # Cerca de resistencia
            if near_upper_liq: factors.append(25)  # Cerca de liquidez superior
            if funding_rate > 0.0008: factors.append(25)  # Funding sobrecargado
            if volume_ratio < 1.05: factors.append(20)  # Volumen bajo
            
            bull_trap_probability = sum(factors)
            
        # Bear Trap: Sesgo bajista + cerca de zona peligrosa  
        elif bias == "Bajista":
            factors = []
            if near_support: factors.append(30)  # Cerca de soporte
            if near_lower_liq: factors.append(25)  # Cerca de liquidez inferior
            if funding_rate < -0.0008: factors.append(25)  # Funding extremo negativo
            if volume_ratio < 1.05: factors.append(20)  # Volumen bajo
            
            bear_trap_probability = sum(factors)
        
        return {
            "bull_trap": {
                "active": bull_trap_probability > 50,
                "probability": min(bull_trap_probability, 100),
                "factors": {
                    "near_resistance": near_resistance,
                    "near_upper_liq": near_upper_liq,
                    "funding_high": funding_rate > 0.0008,
                    "volume_low": volume_ratio < 1.05
                }
            },
            "bear_trap": {
                "active": bear_trap_probability > 50,
                "probability": min(bear_trap_probability, 100),
                "factors": {
                    "near_support": near_support,
                    "near_lower_liq": near_lower_liq,
                    "funding_extreme": funding_rate < -0.0008,
                    "volume_low": volume_ratio < 1.05
                }
            }
        }

    def _verify_position_vs_traps(
        self,
        proposed_entry: float,
        proposed_direction: str,
        current_price: float,
        support: float,
        resistance: float,
        funding_rate: float,
        volume_ratio: float,
        liquidation_zones: Optional[Dict] = None,
    ) -> Dict:
        """Verifica si la posición propuesta caería en zona de trap"""
        
        # Calcular distancias relativas
        dist_to_resistance = abs(current_price - resistance) / current_price if resistance > 0 else float('inf')
        dist_to_support = abs(current_price - support) / current_price if support > 0 else float('inf')
        
        # Obtener zonas de liquidación
        liquidation_zones = liquidation_zones or {}
        upper_liq = liquidation_zones.get("upper_cluster")
        lower_liq = liquidation_zones.get("lower_cluster")
        
        # Calcular distancias a zonas de liquidez
        dist_to_upper_liq = abs(current_price - upper_liq) / current_price if upper_liq else float('inf')
        dist_to_lower_liq = abs(current_price - lower_liq) / current_price if lower_liq else float('inf')
        
        # Umbrales de peligro
        danger_threshold = 0.005  # 0.5%
        trap_zone_threshold = 0.004  # 0.4%
        
        # Verificar si la entrada propuesta está en zona peligrosa
        in_danger_zone = False
        trap_risk = "BAJO"
        trap_probability = 0
        
        if proposed_direction.upper() == "LONG":
            # LONG: Verificar si está cerca de resistencia o liquidez superior
            if (dist_to_resistance < danger_threshold or 
                dist_to_upper_liq < trap_zone_threshold):
                in_danger_zone = True
                trap_risk = "ALTO"
                
                # Calcular probabilidad de bull trap
                factors = []
                if dist_to_resistance < danger_threshold: factors.append(35)
                if dist_to_upper_liq < trap_zone_threshold: factors.append(30)
                if funding_rate > 0.0008: factors.append(20)
                if volume_ratio < 1.05: factors.append(15)
                
                trap_probability = min(sum(factors), 100)
                
        elif proposed_direction.upper() == "SHORT":
            # SHORT: Verificar si está cerca de soporte o liquidez inferior
            if (dist_to_support < danger_threshold or 
                dist_to_lower_liq < trap_zone_threshold):
                in_danger_zone = True
                trap_risk = "ALTO"
                
                # Calcular probabilidad de bear trap
                factors = []
                if dist_to_support < danger_threshold: factors.append(35)
                if dist_to_lower_liq < trap_zone_threshold: factors.append(30)
                if funding_rate < -0.0008: factors.append(20)
                if volume_ratio < 1.05: factors.append(15)
                
                trap_probability = min(sum(factors), 100)
        
        return {
            "en_zona_peligrosa": in_danger_zone,
            "trap_riesgo": trap_risk,
            "probabilidad_trap": trap_probability,
            "distancia_resistencia": round(dist_to_resistance * 100, 2) if dist_to_resistance != float('inf') else None,
            "distancia_soporte": round(dist_to_support * 100, 2) if dist_to_support != float('inf') else None,
            "distancia_liq_superior": round(dist_to_upper_liq * 100, 2) if dist_to_upper_liq != float('inf') else None,
            "distancia_liq_inferior": round(dist_to_lower_liq * 100, 2) if dist_to_lower_liq != float('inf') else None,
            "recomendacion": {
                "accion": "CONTRARRESTAR" if in_danger_zone else "PROCEDER",
                "justificacion": (
                    f"Posición {proposed_direction} con {trap_probability}% de probabilidad de trap. "
                    f"{'Evitar entrada y esperar contra-ataque' if in_danger_zone else 'Entrada con riesgo moderado'}."
                )
            }
        }

    def _build_contingency_trade(
        self,
        trap_name: str,
        active: bool,
        direction: str,
        current_price: float,
        trigger_level: float,
        atr: float,
        capital: float,
    ) -> Dict:
        entry = round(trigger_level, 4)
        if direction == "SHORT":
            stop_loss = round(entry + atr * 0.9, 4)
            tp1 = round(entry - atr * 1.5, 4)
            tp2 = round(entry - atr * 2.3, 4)
            trigger_signal = (
                f"Barrida por encima de {entry} seguida de rechazo y cierre nuevamente por debajo."
            )
        else:
            stop_loss = round(entry - atr * 0.9, 4)
            tp1 = round(entry + atr * 1.5, 4)
            tp2 = round(entry + atr * 2.3, 4)
            trigger_signal = (
                f"Barrida por debajo de {entry} seguida de recuperación y cierre nuevamente por encima."
            )

        metrics = self._position_metrics(
            capital=capital,
            entry=entry,
            stop_loss=stop_loss,
            leverage=20,
            risk_pct=30.0,
            operation_size_pct=70.0,
        )
        rr = round(abs(tp1 - entry) / abs(entry - stop_loss), 2) if entry != stop_loss else 0
        return {
            "tipo": trap_name,
            "activa": active,
            "senal_confirmacion": trigger_signal,
            "contra_operacion": {
                "direccion": direction,
                "entry": entry,
                "stop_loss": stop_loss,
                "tp1": tp1,
                "tp2": tp2,
                "rr_tp1": rr,
                "margen_utilizado": metrics["margin_used"],
                "exposicion_total": metrics["exposure"],
                "perdida_maxima": metrics["loss_amount"],
            },
            "invalidacion_tesis_inicial": (
                f"Si esta contingencia se activa, la tesis principal queda invalidada porque el movimiento se interpreta como {trap_name.lower()} confirmado."
            ),
        }

    def _position_metrics(
        self,
        capital: float,
        entry: float,
        stop_loss: float,
        leverage: int = 20,
        risk_pct: float = 30.0,
        operation_size_pct: float = 70.0,
    ) -> Dict:
        if capital <= 0 or entry <= 0 or entry == stop_loss:
            return {
                "position_size": 0,
                "margin_used": 0,
                "exposure": 0,
                "loss_amount": 0,
                "risk_pct_real": 0,
                "operation_capital": 0,
                "max_risk_amount": 0,
            }

        operation_capital = capital * (operation_size_pct / 100)
        max_risk_amount = capital * (risk_pct / 100)
        sl_distance_pct = abs(entry - stop_loss) / entry
        initial_exposure = operation_capital * leverage
        loss_at_sl = initial_exposure * sl_distance_pct

        if loss_at_sl > max_risk_amount and sl_distance_pct > 0:
            exposure = max_risk_amount / sl_distance_pct
            margin_used = exposure / leverage
        else:
            exposure = initial_exposure
            margin_used = operation_capital

        position_size = exposure / entry if entry > 0 else 0
        loss_amount = exposure * sl_distance_pct

        return {
            "position_size": round(position_size, 6),
            "margin_used": round(margin_used, 2),
            "exposure": round(exposure, 2),
            "loss_amount": round(loss_amount, 2),
            "risk_pct_real": round((loss_amount / capital) * 100, 2) if capital > 0 else 0,
            "operation_capital": round(operation_capital, 2),
            "max_risk_amount": round(max_risk_amount, 2),
        }

    def analyze_all(
        self,
        symbol: str = "BTC/USDT",
        country: str = "Cuba",
        capital: float = 10.0,
        ticker: Optional[Dict] = None,
        derivatives: Optional[Dict] = None,
        market_context: Optional[Dict] = None,
    ):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_structure = executor.submit(self.detect_market_structure)
            future_liquidity = executor.submit(self.detect_liquidity_zones)
            future_volume = executor.submit(self.get_volume_analysis)
            future_indicators = executor.submit(self.get_indicators)

            structure = future_structure.result()
            structure_signal = self.detect_bos_choch(structure)

            fvgs = self.get_fvgs()
            obs = self.get_order_blocks(fvgs)

            liquidity = future_liquidity.result()
            volume = future_volume.result()
            indicators = future_indicators.result()

        derivatives = derivatives or {}
        market_context = market_context or {}
        ticker = ticker or {}

        last_close = float(self.df["close"].iloc[-1])
        current_price = float(ticker.get("last") or last_close)

        # Extraer ATR y RSI temprano para evitar UnboundLocalError
        rsi = float(indicators.get("rsi", 70) or 50)
        atr = float(indicators.get("atr", 0) or 0)
        if atr <= 0:
            return {
                "error": "No se pudo calcular el analisis. ATR invalido o precio no disponible."
            }

        ema_20 = indicators.get("ema_20", 0)
        ema_50 = indicators.get("ema_50", 0)
        ema_200 = indicators.get("ema_200", 0)

        # EMA bias calculation
        if ema_20 > ema_50 > ema_200:
            ema_bias = "Alcista"
        elif ema_20 < ema_50 < ema_200:
            ema_bias = "Bajista"
        else:
            ema_bias = "Neutral"
        
        # Structure bias calculation
        structure_bias = "Neutral"
        if structure_signal.get("bos"):
            bos_type = structure_signal.get("bos", {}).get("type", "")
            if "Alcista" in bos_type:
                structure_bias = "Alcista"
            elif "Bajista" in bos_type:
                structure_bias = "Bajista"
        
        # Open Interest bias
        oi_bias = "Neutral"
        oi_trend = market_context.get("oi_trend", "stable")
        if oi_trend == "increasing":
            oi_bias = "Alcista"
        elif oi_trend == "decreasing":
            oi_bias = "Bajista"
        
        # Final bias decision - weighted logic
        bias_score = 0
        bias_reasons = []
        
        # EMA weight: 30%
        if ema_bias == "Alcista":
            bias_score += 3
            bias_reasons.append("EMA alcista")
        elif ema_bias == "Bajista":
            bias_score -= 3
            bias_reasons.append("EMA bajista")
        
        # Structure weight: 40%
        if structure_bias == "Alcista":
            bias_score += 4
            bias_reasons.append("Estructura alcista")
        elif structure_bias == "Bajista":
            bias_score -= 4
            bias_reasons.append("Estructura bajista")
        
        # OI weight: 20%
        if oi_bias == "Alcista":
            bias_score += 2
            bias_reasons.append("OI creciente")
        elif oi_bias == "Bajista":
            bias_score -= 2
            bias_reasons.append("OI decreciente")
        
        # Calculate support and resistance for price position
        support = min(liquidity["lows"]) if liquidity["lows"] else current_price - atr * 2
        resistance = (
            max(liquidity["highs"]) if liquidity["highs"] else current_price + atr * 2
        )
        
        # Price position weight: 10%
        price_position = (current_price - support) / (resistance - support)
        if price_position > 0.7:  # Near resistance
            bias_score -= 1
            bias_reasons.append("Precio cerca de resistencia")
        elif price_position < 0.3:  # Near support
            bias_score += 1
            bias_reasons.append("Precio cerca de soporte")
        
        # Final bias determination
        if bias_score >= 3:
            bias = "Alcista"
        elif bias_score <= -3:
            bias = "Bajista"
        else:
            bias = "Neutral"
        
        print(f">>> Bias calculation: score={bias_score}, reasons={bias_reasons}, final={bias}")

        sl_data = self.calculate_sl_based_on_atr(bias, current_price, atr)

        entry_zones = []
        if bias == "Alcista" and obs:
            entry_zones = [ob["price"] for ob in obs if "Alcista" in ob["type"]]
        elif bias == "Bajista" and obs:
            entry_zones = [ob["price"] for ob in obs if "Bajista" in ob["type"]]

        checks = {
            "tendencia_ema": bias != "Neutral",
            "estructura_bos": structure_signal.get("bos") is not None,
            "liquidez_presente": len(liquidity["highs"]) > 0
            or len(liquidity["lows"]) > 0,
            "ob_fvg_presente": len(obs) > 0 or len(fvgs) > 0,
            "rsi_en_zona": (40 < rsi < 60) if bias == "Alcista" else (30 < rsi < 55) if bias == "Bajista" else (40 < rsi < 60),
            "volumen_ok": volume["signal"] in ["Alto", "Normal"],
        }

        checks_passed = sum(checks.values())

        invalidation = (
            support - (atr * 1.5) if bias == "Alcista" else resistance + (atr * 1.5)
        )

        trading_plan = self._generate_trading_plan(
            symbol=symbol,
            country=country,
            capital=capital,
            bias=bias,
            current_price=current_price,
            support=support,
            resistance=resistance,
            invalidation=invalidation,
            sl_data=sl_data,
            atr=atr,
            checks_passed=checks_passed,
            total_checks=len(checks),
            liquidity=liquidity,
            volume=volume,
            structure_signal=structure_signal,
            derivatives=derivatives,
            market_context=market_context,
        )

        return {
            "symbol": symbol,
            "country": country,
            "bias": bias,
            "decision": trading_plan["sesgo_principal"],
            "trend_detail": structure_signal.get("trend", "Neutral"),
            "indicators": indicators,
            "structure_points": structure[-5:],
            "bos": structure_signal.get("bos"),
            "market_structure_shift": structure_signal.get("choch"),
            "liquidity": liquidity,
            "probable_sweeps": self._probable_sweep(
                current_price, liquidity["highs"], liquidity["lows"]
            ),
            "fvgs": fvgs[:3],
            "order_blocks": obs[:3],
            "volume": volume,
            "last_price": round(current_price, 4),
            "close_price": round(last_close, 4),
            "rsi": round(rsi, 2),
            "atr": round(atr, 4),
            "sl_data": sl_data,
            "entry_zones": self._round_levels(entry_zones[:2]),
            "pre_trade_checks": checks,
            "checks_passed": checks_passed,
            "total_checks": len(checks),
            "recommendation": trading_plan["sesgo_principal"],
            "trading_plan": trading_plan,
            "estructura_mercado": trading_plan["estructura_mercado"],
            "liquidez_contexto": trading_plan["liquidez_contexto"],
            "plan_entrada": trading_plan["plan_entrada"],
            "objetivos_operativos": trading_plan["objetivos"],
            "trampas_mercado": trading_plan["trampas_mercado"],
            "support": round(support, 4),
            "resistance": round(resistance, 4),
            "invalidation": round(invalidation, 4),
            "derivatives_summary": trading_plan["derivados"],
            "external_context": trading_plan["contexto_externo"],
        }

    def _generate_trading_plan(
        self,
        symbol,
        country,
        capital,
        bias,
        current_price,
        support,
        resistance,
        invalidation,
        sl_data,
        atr,
        checks_passed,
        total_checks,
        liquidity,
        volume,
        structure_signal=None,
        derivatives=None,
        market_context=None,
    ):
        derivatives = derivatives or {}
        market_context = market_context or {}
        fecha_hora = self._get_fecha_hora(country)
        liquidity_highs = self._round_levels(liquidity.get("highs", []))
        liquidity_lows = self._round_levels(liquidity.get("lows", []))
        probable_sweep = self._probable_sweep(current_price, liquidity_highs, liquidity_lows)

        funding_raw = (derivatives.get("funding") or {}).get("current")
        funding_rate = float(funding_raw or 0)
        open_interest = (derivatives.get("open_interest") or {}).get("value") or (derivatives.get("open_interest") or {}).get("amount")
        liquidations = derivatives.get("liquidations") or {}
        liquidation_zones = derivatives.get("liquidation_zones") or {}
        derivatives_errors = []
        if not derivatives.get("funding"):
            derivatives_errors.append("Funding no disponible en tiempo real.")
        if not derivatives.get("open_interest"):
            derivatives_errors.append("Open interest no disponible en tiempo real.")
        if not liquidations:
            derivatives_errors.append("Liquidaciones no disponibles en tiempo real.")
        if not liquidation_zones:
            derivatives_errors.append(
                "Zonas de liquidacion no disponibles; se usan niveles estructurales como proxy."
            )
        traps = self._detect_traps(
            bias,
            current_price,
            support,
            resistance,
            funding_rate,
            float(volume.get("ratio", 0) or 0),
            liquidation_zones,
        )

        # Verificar si la posición propuesta caería en zona de trap
        proposed_entry = None
        proposed_direction = None
        if bias == "Alcista":
            proposed_entry = round(min(resistance, current_price + atr * 0.35), 4)
            proposed_direction = "LONG"
        elif bias == "Bajista":
            proposed_entry = round(max(support, current_price - atr * 0.35), 4)
            proposed_direction = "SHORT"
        else:
            proposed_entry = current_price
            proposed_direction = "NEUTRAL"

        # Verificar riesgo de trap para la posición propuesta
        trap_risk_analysis = self._verify_position_vs_traps(
            proposed_entry=proposed_entry,
            proposed_direction=proposed_direction,
            current_price=current_price,
            support=support,
            resistance=resistance,
            funding_rate=funding_rate,
            volume_ratio=float(volume.get("ratio", 0) or 0),
            liquidation_zones=liquidation_zones,
        )

        long_entry = round(max(support, current_price - atr * 0.35), 4)
        short_entry = round(min(resistance, current_price + atr * 0.35), 4)
        long_sl = round(min(invalidation, long_entry - atr * 1.2), 4)
        short_sl = round(max(invalidation, short_entry + atr * 1.2), 4)

        long_risk = abs(long_entry - long_sl)
        short_risk = abs(short_entry - short_sl)

        long_tp1 = round(long_entry + long_risk * 1.5, 4)
        long_tp2 = round(long_entry + long_risk * 2.2, 4)
        long_tp3 = round(long_entry + long_risk * 3.2, 4)
        short_tp1 = round(short_entry - short_risk * 1.5, 4)
        short_tp2 = round(short_entry - short_risk * 2.2, 4)
        short_tp3 = round(short_entry - short_risk * 3.2, 4)

        decision = "NO TRADE"
        reason = None
        if checks_passed < 4:
            reason = f"Confluencias insuficientes ({checks_passed}/{total_checks})."
        elif bias == "Neutral":
            reason = "Estructura en rango sin sesgo claro."
        elif bias == "Alcista" and traps["bull_trap"]:
            reason = "Riesgo de bull trap en resistencia con funding sobrecargado."
        elif bias == "Bajista" and traps["bear_trap"]:
            reason = "Riesgo de bear trap en soporte con funding extremo."
        elif trap_risk_analysis["en_zona_peligrosa"]:
            reason = f"Posición {proposed_direction} con {trap_risk_analysis['probabilidad_trap']}% de probabilidad de trap. {trap_risk_analysis['recomendacion']['justificacion']}"
            decision = "NO TRADE"  # Esperar contra-ataque
        else:
            decision = "LONG" if bias == "Alcista" else "SHORT"

        if decision == "LONG":
            entry_ideal = long_entry
            entry_alternativa = round(current_price, 4)
            stop_level = long_sl
            take_profits = [
                {"tp": "TP1", "nivel": long_tp1, "rr": 1.5, "accion": "Reducir 40%", "logica": "Primera toma en liquidez superior cercana."},
                {"tp": "TP2", "nivel": long_tp2, "rr": 2.2, "accion": "Reducir 40%", "logica": "Objetivo principal en siguiente resistencia."},
                {"tp": "TP3", "nivel": long_tp3, "rr": 3.2, "accion": "Dejar 20%", "logica": "Extension si continua el squeeze."},
            ]
        elif decision == "SHORT":
            entry_ideal = short_entry
            entry_alternativa = round(current_price, 4)
            stop_level = short_sl
            take_profits = [
                {"tp": "TP1", "nivel": short_tp1, "rr": 1.5, "accion": "Reducir 40%", "logica": "Primera toma en liquidez inferior cercana."},
                {"tp": "TP2", "nivel": short_tp2, "rr": 2.2, "accion": "Reducir 40%", "logica": "Objetivo principal en siguiente soporte."},
                {"tp": "TP3", "nivel": short_tp3, "rr": 3.2, "accion": "Dejar 20%", "logica": "Extension si continua el displacement."},
            ]
        else:
            entry_ideal = None
            entry_alternativa = None
            stop_level = round(invalidation, 4)
            take_profits = []

        metrics = self._position_metrics(capital, entry_ideal or current_price, stop_level)
        supply_zone = [round(max(current_price, resistance - atr * 0.5), 4), round(resistance, 4)]
        demand_zone = [round(support, 4), round(min(current_price, support + atr * 0.5), 4)]
        technical_reason = (
            f"Tendencia {bias}, BOS {'confirmado' if structure_signal and structure_signal.get('bos') else 'no confirmado'}, "
            f"liquidez superior {liquidity_highs[:2] or 'N/D'}, liquidez inferior {liquidity_lows[:2] or 'N/D'}."
        )
        derivatives_reason = (
            f"Funding {round(funding_rate * 100, 4)}%, OI {open_interest if open_interest is not None else 'N/D'}, "
            f"liquidaciones L/S {liquidations.get('longs', 0)}/{liquidations.get('shorts', 0)}."
        )
        justification = (
            reason if decision == "NO TRADE"
            else f"{technical_reason} {derivatives_reason} Se favorece {decision} por alineacion entre estructura, liquidez y derivados."
        )
        bulltrap_plan = self._build_contingency_trade(
            trap_name="Bull Trap",
            active=traps["bull_trap"],
            direction="SHORT",
            current_price=current_price,
            trigger_level=resistance,
            atr=atr,
            capital=capital,
        )
        beartrap_plan = self._build_contingency_trade(
            trap_name="Bear Trap",
            active=traps["bear_trap"],
            direction="LONG",
            current_price=current_price,
            trigger_level=support,
            atr=atr,
            capital=capital,
        )

        return {
            "decision": decision,
            "decision_unica": decision,
            "sesgo_principal": decision,
            "por_que": justification,
            "contexto_temporal": {
                "fecha_hora": fecha_hora,
                "pais": country or "Cuba",
                "horizonte": "12-24 horas",
                "precio_actual": round(current_price, 4),
                "apalancamiento_fijo": "20x",
                "fuentes": "OKX + CoinEx + CoinGecko",
                "fuente_precio": "OKX ticker",
            },
            "sesgo_mercado": {
                "direccion": decision,
                "justificacion": justification,
                "estructura": technical_reason,
                "derivados": derivatives_reason,
            },
            "analisis_trap": {
                "propuesta_entry": proposed_entry,
                "propuesta_direccion": proposed_direction,
                "riesgo_trap": trap_risk_analysis,
                "recomendacion_trap": trap_risk_analysis.get("recomendacion", {}),
            },
            "estructura_mercado": {
                "tendencia": bias,
                "bos": structure_signal.get("bos"),
                "mss": structure_signal.get("choch"),
                "rango": bias == "Neutral",
                "soporte_principal": round(support, 4),
                "resistencia_principal": round(resistance, 4),
                "zona_demanda": demand_zone,
                "zona_oferta": supply_zone,
                "atr": round(atr, 2),
            },
            "liquidez_contexto": {
                "buy_side_liquidity": liquidity_highs,
                "sell_side_liquidity": liquidity_lows,
                "sweeps_probables": probable_sweep,
                "zonas_liquidacion": liquidation_zones,
            },
            "niveles_clave": {
                "soporte": round(support, 4),
                "resistencia": round(resistance, 4),
                "invalidation": round(invalidation, 4),
                "zonas_liquidez": {"soportes": liquidity_lows, "resistencias": liquidity_highs},
                "sweep_probable": probable_sweep,
                "liquidation_zones": liquidation_zones,
            },
            "plan_entrada": {
                "entrada_ideal": entry_ideal,
                "entrada_ideal_tipo": "Limit",
                "entrada_alternativa": entry_alternativa,
                "entrada_alternativa_tipo": "Market/Confirmacion",
                "nivel_invalidacion_estructural": round(invalidation, 4),
            },
            "configuracion_entrada": {
                "entry_ideal": entry_ideal,
                "entry_ideal_tipo": "Limit",
                "entry_alternativa": entry_alternativa,
                "entry_alternativa_tipo": "Market/Confirmacion",
                "logica_entry": "Retesteo en demanda/oferta con confirmacion." if decision != "NO TRADE" else "Esperar confirmacion estructural.",
            },
            "stop_loss": {
                "nivel": stop_level,
                "logica": f"SL por estructura + volatilidad (ATR {round(atr, 4)}).",
                "distancia_pct": f"{round(abs((entry_ideal or current_price) - stop_level) / (entry_ideal or current_price) * 100, 2)}%",
            },
            "take_profits": take_profits,
            "objetivos": {
                "tp1": take_profits[0] if len(take_profits) > 0 else None,
                "tp2": take_profits[1] if len(take_profits) > 1 else None,
                "tp3": take_profits[2] if len(take_profits) > 2 else None,
            },
            "riesgo_beneficio": {
                "minimo_requerido": "1:1.5",
                "esperado": f"1:{take_profits[1]['rr']}" if len(take_profits) > 1 else "N/D",
                "tp1": "1:1.5" if take_profits else "N/D",
                "tp2": f"1:{take_profits[1]['rr']}" if len(take_profits) > 1 else "N/D",
                "tp3": f"1:{take_profits[2]['rr']}" if len(take_profits) > 2 else "N/D",
            },
            "gestion_riesgo": {
                "leverage": 20,
                "risk_max_pct": 30,
                "operation_size_pct": 70,
                "stop_loss": stop_level,
                "justificacion_sl": f"Estructura + volatilidad. ATR actual: {round(atr, 4)}.",
                "risk_pct_real": metrics["risk_pct_real"],
                "perdida_monetaria_si_sl": metrics["loss_amount"],
            },
            "calculo_posicion": {
                "capital": round(capital, 2),
                "margen_utilizado": metrics["margin_used"],
                "exposicion_total": metrics["exposure"],
                "tamano_posicion": metrics["position_size"],
                "capital_objetivo_operacion": metrics["operation_capital"],
                "escenario_perdida_maxima": metrics["loss_amount"],
            },
            "derivados": {
                "funding_rate": funding_rate,
                "open_interest": open_interest,
                "liquidaciones": liquidations,
                "zonas_liquidacion": liquidation_zones,
                "availability": {
                    "funding": bool(derivatives.get("funding")),
                    "open_interest": bool(derivatives.get("open_interest")),
                    "liquidaciones": bool(liquidations),
                    "zonas_liquidacion": bool(liquidation_zones),
                },
                "warnings": derivatives_errors,
            },
            "contexto_externo": {
                "spot_context": market_context.get("spot"),
                "news": market_context.get("news", []),
                "macro": market_context.get("macro", []),
                "notas": market_context.get("notes", []),
                "availability": "partial" if market_context.get("notes") else "full",
            },
            "trampas_mercado": {
                "bulltrap": bulltrap_plan,
                "beartrap": beartrap_plan,
            },
            "trampas": {
                "bull_trap": traps["bull_trap"],
                "bear_trap": traps["bear_trap"],
            },
            "condiciones_minimas": f"Checks {checks_passed}/{total_checks}, RR >= 1.5, leverage 20x, riesgo max 30%, tamano 70%.",
            "escenarios_alternativos": {
                "long": {"activo": decision == "LONG", "entry": long_entry, "sl": long_sl, "tp1": long_tp1, "tp2": long_tp2, "tp3": long_tp3, "rr": "1:2.2"},
                "short": {"activo": decision == "SHORT", "entry": short_entry, "sl": short_sl, "tp1": short_tp1, "tp2": short_tp2, "tp3": short_tp3, "rr": "1:2.2"},
            },
        }
