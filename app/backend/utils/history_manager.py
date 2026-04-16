import os
import json
import time
from typing import List, Dict
from datetime import datetime

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "history.json")

class HistoryManager:
    @staticmethod
    def _ensure_file():
        os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)
        if not os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "w") as f:
                json.dump([], f)

    @classmethod
    def get_history(cls) -> List[Dict]:
        cls._ensure_file()
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []

    @classmethod
    def save_trades(cls, trades: List[Dict]):
        cls._ensure_file()
        current_history = cls.get_history()
        
        # Usar un set de IDs para evitar duplicados si existen IDs en los datos
        existing_signatures = {
            f"{t.get('symbol')}_{t.get('time')}_{t.get('pnl')}" for t in current_history
        }
        
        added = 0
        for trade in trades:
            sig = f"{trade.get('symbol')}_{trade.get('time')}_{trade.get('pnl')}"
            if sig not in existing_signatures:
                current_history.append(trade)
                existing_signatures.add(sig)
                added += 1
        
        if added > 0:
            # Ordenar por tiempo descendente
            current_history.sort(key=lambda x: x.get("time", ""), reverse=True)
            with open(HISTORY_FILE, "w") as f:
                json.dump(current_history, f, indent=2)
        
        return added

    @classmethod
    def get_stats(cls):
        history = cls.get_history()
        if not history:
            return {
                "total_pnl": 0,
                "win_rate": 0,
                "total_trades": 0,
                "wins": 0,
                "losses": 0,
                "avg_pnl": 0
            }
        
        total_pnl = sum(float(t.get("pnl", 0)) for t in history)
        wins = [t for t in history if float(t.get("pnl", 0)) > 0]
        losses = [t for t in history if float(t.get("pnl", 0)) < 0]
        
        return {
            "total_pnl": round(total_pnl, 2),
            "win_rate": round((len(wins) / len(history)) * 100, 2) if history else 0,
            "total_trades": len(history),
            "wins": len(wins),
            "losses": len(losses),
            "avg_pnl": round(total_pnl / len(history), 2)
        }
