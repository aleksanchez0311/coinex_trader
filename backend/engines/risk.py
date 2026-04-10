from typing import Dict


class RiskEngine:
    @staticmethod
    def calculate_position(
        capital: float,
        risk_per_trade_pct: float,
        entry_price: float,
        stop_loss: float,
        leverage: int = 1,
    ) -> Dict:
        """
        Cálculo de gestión de riesgo estricta.
        """
        if entry_price == stop_loss:
            return {"error": "Entry and Stop Loss cannot be the same"}

        risk_amount = capital * (risk_per_trade_pct / 100)
        risk_per_unit = abs(entry_price - stop_loss)

        raw_position_size = risk_amount / risk_per_unit

        notional_value = raw_position_size * entry_price

        margin_required = notional_value / leverage

        if margin_required > capital:
            margin_required = capital * 0.95
            notional_value = margin_required * leverage
            raw_position_size = notional_value / entry_price

        rr_ratio = abs(entry_price - stop_loss)
        tp1 = (
            entry_price + rr_ratio * 1.5
            if entry_price > stop_loss
            else entry_price - rr_ratio * 1.5
        )
        tp2 = (
            entry_price + rr_ratio * 2.5
            if entry_price > stop_loss
            else entry_price - rr_ratio * 2.5
        )
        tp3 = (
            entry_price + rr_ratio * 4.0
            if entry_price > stop_loss
            else entry_price - rr_ratio * 4.0
        )

        return {
            "capital": capital,
            "risk_amount": round(risk_amount, 2),
            "risk_pct": risk_per_trade_pct,
            "position_size": round(raw_position_size, 6),
            "notional_value": round(notional_value, 2),
            "margin_required": round(margin_required, 2),
            "stop_loss_pct": round(abs(entry_price - stop_loss) / entry_price * 100, 2),
            "leverage": leverage,
            "tp1": round(tp1, 2),
            "tp2": round(tp2, 2),
            "tp3": round(tp3, 2),
            "rr_ratio": 1.5,
            "valid_rr": True,
        }

    @staticmethod
    def get_recommendations(analysis: Dict, scoring: Dict):
        """
        Genera recomendaciones de riesgo basadas en el análisis SMC + ATR
        """
        last_price = analysis.get("last_price", 0)
        bias = analysis.get("bias", "Neutral")

        recommended_sl = 0
        sl_found = False

        if analysis.get("sl_data"):
            sl_data = analysis["sl_data"]
            recommended_sl = sl_data.get("sl_price", last_price * 0.98)
            sl_found = True
        elif bias == "Alcista":
            obs = [
                ob
                for ob in analysis.get("order_blocks", [])
                if "Alcista" in ob.get("type", "")
            ]
            fvgs = [
                fvg for fvg in analysis.get("fvgs", []) if fvg.get("type") == "Alcista"
            ]

            support_levels = [
                ob["price"] for ob in obs if ob.get("price", 0) < last_price
            ]
            support_levels += [
                fvg["bottom"] for fvg in fvgs if fvg.get("bottom", 0) < last_price
            ]

            if support_levels:
                recommended_sl = max(support_levels) * 0.998
                sl_found = True
            else:
                recommended_sl = last_price * 0.98
        elif bias == "Bajista":
            obs = [
                ob
                for ob in analysis.get("order_blocks", [])
                if "Bajista" in ob.get("type", "")
            ]
            fvgs = [
                fvg for fvg in analysis.get("fvgs", []) if fvg.get("type") == "Bajista"
            ]

            resistance_levels = [
                ob["price"] for ob in obs if ob.get("price", 0) > last_price
            ]
            resistance_levels += [
                fvg["top"] for fvg in fvgs if fvg.get("top", 0) > last_price
            ]

            if resistance_levels:
                recommended_sl = min(resistance_levels) * 1.002
                sl_found = True
            else:
                recommended_sl = last_price * 1.02

        score = scoring.get("total_score", 0)
        if score >= 80:
            recommended_risk = 2.0
        elif score >= 60:
            recommended_risk = 1.0
        elif score >= 40:
            recommended_risk = 0.5
        else:
            recommended_risk = 0.25

        sl_dist_pct = (
            abs(last_price - recommended_sl) / last_price * 100 if last_price > 0 else 2
        )
        if sl_dist_pct > 0:
            max_safe_leverage = 100 / (sl_dist_pct * 2)
            recommended_leverage = min(int(max_safe_leverage), 20)
            if recommended_leverage < 1:
                recommended_leverage = 1
        else:
            recommended_leverage = 10

        return {
            "stop_loss": round(recommended_sl, 2),
            "risk_pct": recommended_risk,
            "leverage": recommended_leverage,
            "sl_found_via_smc": sl_found,
            "sl_based_on_atr": analysis.get("sl_data", {}),
            "confidence": scoring.get("status", "Low"),
            "pre_trade_checks": analysis.get("pre_trade_checks", {}),
            "recommendation": analysis.get("recommendation", "SIN DATOS"),
        }

    @staticmethod
    def get_trade_plan(entry: float, stop: float, bias: str):
        """Genera niveles de Take Profit con R:R mínimo 1.5"""
        risk_dist = abs(entry - stop)

        if bias == "Alcista":
            tp1 = entry + (risk_dist * 1.5)
            tp2 = entry + (risk_dist * 2.5)
            tp3 = entry + (risk_dist * 4.0)
        else:
            tp1 = entry - (risk_dist * 1.5)
            tp2 = entry - (risk_dist * 2.5)
            tp3 = entry - (risk_dist * 4.0)

        return {
            "entry": entry,
            "stop_loss": stop,
            "tp1": round(tp1, 2),
            "tp2": round(tp2, 2),
            "tp3": round(tp3, 2),
            "rr_ratio": 1.5,
            "min_rr_required": 1.5,
            "valid": True,
        }
