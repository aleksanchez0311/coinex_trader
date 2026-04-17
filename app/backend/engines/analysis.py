import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import concurrent.futures
from datetime import datetime
from zoneinfo import ZoneInfo

class AnalysisEngine:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        for col in ["high", "low", "close", "volume"]:
            self.df[col] = self.df[col].astype(float)
        self._swings_cache = None
        self._fvgs_cache = None

    def detect_swings(self):
        self.df["is_swing_high"] = (self.df["high"] > self.df["high"].shift(1)) & (self.df["high"] > self.df["high"].shift(-1))
        self.df["is_swing_low"] = (self.df["low"] < self.df["low"].shift(1)) & (self.df["low"] < self.df["low"].shift(-1))

    def detect_market_structure(self):
        if self._swings_cache is not None: return self._swings_cache
        self.detect_swings()
        swings = []
        l_high, l_low = None, None

        for i in range(1, len(self.df) - 1):
            if self.df["is_swing_high"].iloc[i]:
                price = self.df["high"].iloc[i]
                label = "HH" if l_high and price > l_high else "LH"
                l_high = price
                swings.append({"index": i, "type": label, "price": price, "role": "resistance"})
            if self.df["is_swing_low"].iloc[i]:
                price = self.df["low"].iloc[i]
                label = "LL" if l_low and price < l_low else "HL"
                l_low = price
                swings.append({"index": i, "type": label, "price": price, "role": "support"})
        
        self._swings_cache = swings[-12:]
        return self._swings_cache

    def detect_bos_choch(self, swings=None):
        swings = swings or self.detect_market_structure()
        if len(swings) < 4: return {"bos": None, "choch": None, "trend": "Neutral"}
        
        last_5 = [s["type"] for s in swings[-5:]]
        trend = "Alcista" if (last_5.count("HH") >= 1 and last_5.count("HL") >= 1) else "Bajista" if (last_5.count("LL") >= 1 and last_5.count("LH") >= 1) else "Neutral"
        
        bos = None
        if len(swings) >= 2:
            last_idx, prev_idx = swings[-1]["index"], swings[-2]["index"]
            if trend == "Alcista" and self.df["close"].iloc[-1] > self.df["high"].iloc[prev_idx]:
                bos = {"type": "Alcista", "index": last_idx, "valid": True}
            elif trend == "Bajista" and self.df["close"].iloc[-1] < self.df["low"].iloc[prev_idx]:
                bos = {"type": "Bajista", "index": last_idx, "valid": True}
        
        return {"bos": bos, "choch": None, "trend": trend}

    def detect_liquidity_zones(self):
        highs, lows = [], []
        for i in range(2, len(self.df) - 2):
            if self.df["high"].iloc[i] == self.df["high"].iloc[i - 1]: highs.append(self.df["high"].iloc[i])
            if self.df["low"].iloc[i] == self.df["low"].iloc[i - 1]: lows.append(self.df["low"].iloc[i])
        return {"highs": sorted(list(set(highs)), reverse=True)[:3], "lows": sorted(list(set(lows)))[:3]}

    def get_fvgs(self) -> List[Dict]:
        if self._fvgs_cache: return self._fvgs_cache
        fvgs = []
        for i in range(1, len(self.df) - 1):
            l1, h_1 = self.df["low"].iloc[i + 1], self.df["high"].iloc[i - 1]
            if l1 > h_1 and self.df["close"].iloc[i] > self.df["open"].iloc[i]:
                fvgs.append({"type": "Alcista", "top": l1, "bottom": h_1, "index": i})
            elif self.df["high"].iloc[i + 1] < self.df["low"].iloc[i - 1] and self.df["close"].iloc[i] < self.df["open"].iloc[i]:
                fvgs.append({"type": "Bajista", "top": self.df["low"].iloc[i - 1], "bottom": self.df["high"].iloc[i + 1], "index": i})
        self._fvgs_cache = fvgs[-5:]
        return self._fvgs_cache

    def get_order_blocks(self, fvgs=None) -> List[Dict]:
        fvgs = fvgs or self.get_fvgs()
        obs = []
        for fvg in fvgs:
            idx = fvg["index"]
            if fvg["type"] == "Alcista":
                obs.append({"type": "OB Alcista", "price": self.df["low"].iloc[idx - 1], "strength": "Alta" if idx > len(self.df)-20 else "Media"})
            else:
                obs.append({"type": "OB Bajista", "price": self.df["high"].iloc[idx - 1], "strength": "Alta" if idx > len(self.df)-20 else "Media"})
        return obs

    def get_indicators(self):
        df = self.df.copy()
        df["ema_20"] = df["close"].ewm(span=20, adjust=False).mean()
        df["ema_50"] = df["close"].ewm(span=50, adjust=False).mean()
        df["ema_200"] = df["close"].ewm(span=200, adjust=False).mean()
        delta = df["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        df["rsi"] = 100 - (100 / (1 + gain/loss))
        tr = pd.concat([df["high"]-df["low"], abs(df["high"]-df["close"].shift()), abs(df["low"]-df["close"].shift())], axis=1).max(axis=1)
        df["atr"] = tr.rolling(14).mean()
        return df.tail(1).to_dict("records")[0]

    def _detect_traps(self, bias, price, support, resistance, funding, vol_ratio, liq_zones=None) -> Dict:
        bull_p, bear_p = 0, 0
        upper_liq = (liq_zones or {}).get("upper_cluster")
        lower_liq = (liq_zones or {}).get("lower_cluster")
        
        if bias == "Alcista":
            if resistance > 0 and abs(price - resistance)/price < 0.003: bull_p += 40
            if upper_liq and abs(price - upper_liq)/price < 0.004: bull_p += 30
            if funding > 0.0008: bull_p += 30
        elif bias == "Bajista":
            if support > 0 and abs(price - support)/price < 0.003: bear_p += 40
            if lower_liq and abs(price - lower_liq)/price < 0.004: bear_p += 30
            if funding < -0.0008: bear_p += 30
        
        return {
            "bull_trap": {"active": bull_p > 50, "probability": min(bull_p, 100)},
            "bear_trap": {"active": bear_p > 50, "probability": min(bear_p, 100)}
        }

    def analyze_all(self, symbol="BTC/USDT", country="Cuba", capital=10.0, ticker=None, derivatives=None, market_context=None):
        structure = self.detect_market_structure()
        sig = self.detect_bos_choch(structure)
        liq, ind = self.detect_liquidity_zones(), self.get_indicators()
        price = float((ticker or {}).get("last") or self.df["close"].iloc[-1])
        atr, rsi = float(ind.get("atr", 0)), float(ind.get("rsi", 50))
        
        if atr <= 0: return {"error": "ATR Invalido"}
        
        # Bias Weighting
        score = 0
        if ind["ema_20"] > ind["ema_50"] > ind["ema_200"]: score += 3
        elif ind["ema_20"] < ind["ema_50"] < ind["ema_200"]: score -= 3
        if sig["trend"] == "Alcista": score += 4
        elif sig["trend"] == "Bajista": score -= 4
        
        bias = "Alcista" if score >= 3 else "Bajista" if score <= -3 else "Neutral"
        support = min(liq["lows"]) if liq["lows"] else price - atr*2
        resistance = max(liq["highs"]) if liq["highs"] else price + atr*2
        
        traps = self._detect_traps(bias, price, support, resistance, float((derivatives or {}).get("funding", {}).get("current", 0)), 1.0)
        
        return {
            "symbol": symbol, "bias": bias, "last_price": round(price, 4),
            "rsi": round(rsi, 2), "atr": round(atr, 4), "traps": traps,
            "liquidity": liq, "bos": sig["bos"], "trend": sig["trend"],
            "support": round(support, 4), "resistance": round(resistance, 4),
            "order_blocks": self.get_order_blocks()[:3]
        }
