from typing import Dict


class RiskEngine:
    @staticmethod
    def calculate_position(
        capital: float,
        risk_per_trade_pct: float,
        entry_price: float,
        stop_loss: float,
        leverage: int = 20,
    ) -> Dict:
        """
        Calculo de gestion de riesgo estricta con apalancamiento fijo 20x.
        """
        if entry_price <= 0:
            return {"error": "Entry price must be greater than zero"}
        if leverage <= 0:
            return {"error": "Leverage must be greater than zero"}
        if entry_price == stop_loss:
            return {"error": "Entry and Stop Loss cannot be the same"}

        risk_amount = capital * (risk_per_trade_pct / 100)
        risk_per_unit = abs(entry_price - stop_loss)
        sl_distance_pct = (risk_per_unit / entry_price) * 100

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
            "stop_loss_pct": round(sl_distance_pct, 2),
            "leverage": leverage,
            "tp1": round(tp1, 4),
            "tp2": round(tp2, 4),
            "tp3": round(tp3, 4),
            "rr_ratio": 1.5,
            "valid_rr": True,
        }

    @staticmethod
    def calculate_position_with_70_pct(
        capital: float,
        risk_pct: float,
        entry_price: float,
        stop_loss: float,
        leverage: int = 20,
        operation_size_pct: float = 70.0,
    ) -> Dict:
        """
        Calculo de tamano de posicion considerando tamano de operacion 70% del capital.
        """
        if entry_price <= 0:
            return {"error": "Entry price must be greater than zero"}
        if leverage <= 0:
            return {"error": "Leverage must be greater than zero"}
        if entry_price == stop_loss:
            return {"error": "Entry and Stop Loss cannot be the same"}
        if operation_size_pct <= 0 or operation_size_pct > 100:
            return {"error": "Operation size percentage must be between 0 and 100"}

        operation_capital = capital * (operation_size_pct / 100)
        max_risk_amount = capital * (risk_pct / 100)

        risk_per_unit = abs(entry_price - stop_loss)
        sl_distance_pct = (risk_per_unit / entry_price) * 100

        position_value = operation_capital * leverage
        position_size = position_value / entry_price
        margin_used = position_value / leverage

        max_loss_pct = sl_distance_pct * leverage
        potential_loss = (sl_distance_pct / 100) * position_value

        if potential_loss > max_risk_amount:
            adjusted_position_value = (max_risk_amount / sl_distance_pct) * 100
            position_size = adjusted_position_value / entry_price
            margin_used = adjusted_position_value / leverage
            potential_loss = max_risk_amount
            position_value = adjusted_position_value

        tp_distance = abs(entry_price - stop_loss)

        return {
            "position_size": round(position_size, 6),
            "notional_value": round(position_value, 2),
            "margin_required": round(margin_used, 2),
            "risk_amount": round(potential_loss, 2),
            "risk_pct": risk_pct,
            "stop_loss_pct": round(sl_distance_pct, 2),
            "leverage": leverage,
            "tp1": round(entry_price + tp_distance * 1.5, 4),
            "tp2": round(entry_price + tp_distance * 2.5, 4),
            "tp3": round(entry_price + tp_distance * 4.0, 4),
            "rr_ratio": 1.5,
            "valid_rr": True,
            "parametros": {
                "capital": round(capital, 2),
                "operation_size_pct": operation_size_pct,
                "operation_capital": round(operation_capital, 2),
                "max_risk_pct": risk_pct,
                "max_risk_amount": round(max_risk_amount, 2),
                "apalancamiento": f"{leverage}x",
            },
            "entrada": {
                "entry_price": round(entry_price, 4),
                "stop_loss": round(stop_loss, 4),
                "sl_distance": round(risk_per_unit, 4),
                "sl_distance_pct": round(sl_distance_pct, 2),
            },
            "posicion": {
                "tamano_operacion": round(operation_capital, 2),
                "exposicion_total": round(position_value, 2),
                "margen_usado": round(margin_used, 2),
                "cantidad": round(position_size, 6),
            },
            "riesgo": {
                "perdida_si_sl": round(potential_loss, 2),
                "perdida_pct_capital": round((potential_loss / capital) * 100, 2),
                "dentro_del_limite": potential_loss <= max_risk_amount,
            },
            "take_profits": {
                "tp1": round(entry_price + tp_distance * 1.5, 4),
                "tp2": round(entry_price + tp_distance * 2.5, 4),
                "tp3": round(entry_price + tp_distance * 4.0, 4),
            },
            "rr_ratio": {
                "tp1": 1.5,
                "tp2": 2.5,
                "tp3": 4.0,
            },
        }

    @staticmethod
    def get_recommendations(analysis: Dict, scoring: Dict):
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
            "stop_loss": round(recommended_sl, 4),
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
        """Genera niveles de Take Profit con R:R minimo 1.5"""
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
            "tp1": round(tp1, 4),
            "tp2": round(tp2, 4),
            "tp3": round(tp3, 4),
            "rr_ratio": 1.5,
            "min_rr_required": 1.5,
            "valid": True,
        }
