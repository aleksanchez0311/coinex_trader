import pandas as pd
import numpy as np
from typing import List, Dict, Optional


import concurrent.futures


class AnalysisEngine:
    def __init__(self, df: pd.DataFrame):
        """
        df debe contener columnas: timestamp, open, high, low, close, volume
        """
        self.df = df.copy()
        self.df["high"] = self.df["high"].astype(float)
        self.df["low"] = self.df["low"].astype(float)
        self.df["close"] = self.df["close"].astype(float)
        self.df["volume"] = self.df["volume"].astype(float)
        self._swings_cache = None
        self._fvgs_cache = None

    def detect_swings(self):
        """Detecta swing highs y swing lows"""
        self.df["is_swing_high"] = (self.df["high"] > self.df["high"].shift(1)) & (
            self.df["high"] > self.df["high"].shift(-1)
        )
        self.df["is_swing_low"] = (self.df["low"] < self.df["low"].shift(1)) & (
            self.df["low"] < self.df["low"].shift(-1)
        )

    def detect_market_structure(self):
        """Detecta HH, HL, LH, LL, BOS y CHOCH"""
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
        """Detecta BOS (Break of Structure) y CHOCH (Change of Character)"""
        if swings is None:
            swings = self.detect_market_structure()
        if len(swings) < 4:
            return {"bos": None, "choch": None, "trend": "Neutral"}

        swing_types = [s["type"] for s in swings]

        trend = "Neutral"
        bos = None
        choch = None

        last_5 = swing_types[-5:]

        if last_5.count("HH") >= 2 and last_5.count("HL") >= 1:
            trend = "Alcista"
            if len(swings) >= 2:
                last_idx = swings[-1]["index"]
                prev_idx = swings[-2]["index"]
                if self.df["close"].iloc[-1] > self.df["high"].iloc[prev_idx]:
                    bos = {"type": "Alcista", "index": last_idx, "valid": True}
        elif last_5.count("LL") >= 2 and last_5.count("LH") >= 1:
            trend = "Bajista"
            if len(swings) >= 2:
                last_idx = swings[-1]["index"]
                prev_idx = swings[-2]["index"]
                if self.df["close"].iloc[-1] < self.df["low"].iloc[prev_idx]:
                    bos = {"type": "Bajista", "index": last_idx, "valid": True}

        return {"bos": bos, "choch": choch, "trend": trend}

    def detect_liquidity_zones(self):
        """Detecta zonas de liquidez: equal highs, equal lows, stop clusters"""
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
        """Detecta Fair Value Gaps (Brechas de Valor Razonable)"""
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
        """Identifica Order Blocks (Bloques de Órdenes)"""
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
        """Análisis de volumen para validar movimientos"""
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
        """Cálculo de EMAs, RSI y ATR"""
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
        """Calcula Stop Loss basado en ATR"""
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
            "sl_price": round(sl, 2),
            "sl_distance": round(sl_distance, 2),
            "sl_pct": round((sl_distance / last_price) * 100, 2),
        }

    def analyze_all(self):
        """Ejecuta análisis completo según metodología SMC + EMA + RSI + ATR"""
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

        last_price = self.df["close"].iloc[-1]

        ema_20 = indicators.get("ema_20", 0)
        ema_50 = indicators.get("ema_50", 0)
        ema_200 = indicators.get("ema_200", 0)

        if ema_20 > ema_50 > ema_200:
            bias = "Alcista"
        elif ema_20 < ema_50 < ema_200:
            bias = "Bajista"
        else:
            bias = "Neutral"

        rsi = indicators.get("rsi", 50)
        atr = indicators.get("atr", 0)

        sl_data = self.calculate_sl_based_on_atr(bias, last_price, atr)

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
            "rsi_en_zona": 40 < rsi < 60,
            "volumen_ok": volume["signal"] in ["Alto", "Normal"],
        }

        checks_passed = sum(checks.values())

        return {
            "bias": bias,
            "trend_detail": structure_signal.get("trend", "Neutral"),
            "indicators": indicators,
            "structure_points": structure[-5:],
            "bos": structure_signal.get("bos"),
            "liquidity": liquidity,
            "fvgs": fvgs[:3],
            "order_blocks": obs[:3],
            "volume": volume,
            "last_price": last_price,
            "rsi": round(rsi, 2),
            "atr": round(atr, 4),
            "sl_data": sl_data,
            "entry_zones": entry_zones[:2],
            "pre_trade_checks": checks,
            "checks_passed": checks_passed,
            "total_checks": len(checks),
            "recommendation": "ALTA PROBABILIDAD"
            if checks_passed >= 5
            else "MEDIA PROBABILIDAD"
            if checks_passed >= 3
            else "BAJA PROBABILIDAD - NO OPERAR",
        }
