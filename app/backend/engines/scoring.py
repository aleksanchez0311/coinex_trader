from typing import Dict


class ScoringEngine:
    @staticmethod
    def calculate_score(analysis: Dict) -> Dict:
        """
        Calcula un score de 0-100 basado en metodología SMC + EMA + RSI + ATR
        Checklist ORO: Si pasan < 5 → NO OPERAR
        """
        score = 0
        confluences = []

        bias = analysis.get("bias", "Neutral")
        indicators = analysis.get("indicators", {})
        pre_trade_checks = analysis.get("pre_trade_checks", {})

        rsi = analysis.get("rsi", 50)
        atr = analysis.get("atr", 0)
        last_price = analysis.get("last_price", 0)

        checks_passed = analysis.get("checks_passed", 0)
        total_checks = analysis.get("total_checks", 6)

        if pre_trade_checks.get("tendencia_ema"):
            score += 20
            confluences.append("✓ Tendencia EMA alineada")

        if pre_trade_checks.get("estructura_bos"):
            score += 15
            confluences.append("✓ BOS/Estructura confirmada")

        if pre_trade_checks.get("liquidez_presente"):
            score += 15
            confluences.append("✓ Zonas de liquidez identificadas")

        if pre_trade_checks.get("ob_fvg_presente"):
            score += 15
            confluences.append("✓ OB/FVG válido detectado")

        if pre_trade_checks.get("rsi_en_zona"):
            score += 10
            confluences.append(f"✓ RSI en zona ({rsi})")

        if pre_trade_checks.get("volumen_ok"):
            score += 10
            confluences.append("✓ Volumen confirmado")

        if bias == "Alcista" and 40 < rsi < 60:
            score += 5
            confluences.append(f"RSI {rsi} con espacio Alcista")
        elif bias == "Bajista" and 40 < rsi < 60:
            score += 5
            confluences.append(f"RSI {rsi} con espacio Bajista")

        if len(analysis.get("fvgs", [])) > 0:
            score += 5
            confluences.append(f"{len(analysis['fvgs'])} FVG detectado(s)")

        if atr > 0 and last_price > 0:
            atr_pct = (atr / last_price) * 100
            if 0.5 < atr_pct < 5:
                score += 5
                confluences.append(f"ATR {atr:.2f} (volatilidad operativa)")

        status = "NO OPERAR"
        if score >= 70 and checks_passed >= 5:
            status = "ALTA PROBABILIDAD - EJECUTAR"
        elif score >= 50 and checks_passed >= 4:
            status = "MEDIA PROBABILIDAD - Confirmar manualmente"
        elif score >= 30:
            status = "BAJA PROBABILIDAD - No recomendado"

        return {
            "total_score": min(score, 100),
            "status": status,
            "confluences": confluences,
            "checks_passed": checks_passed,
            "total_checks": total_checks,
            "recommendation": analysis.get("recommendation", status),
        }
