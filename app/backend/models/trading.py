from pydantic import BaseModel
from typing import List, Optional, Dict


class AnalysisRequest(BaseModel):
    symbol: str
    timeframe: str = "1h"
    api_key: Optional[str] = None
    secret: Optional[str] = None


class RiskRequest(BaseModel):
    capital: float
    risk_pct: float
    entry_price: float
    stop_loss: float
    take_profit: Optional[float] = None
    leverage: int = 1


class TradeExecutionRequest(BaseModel):
    symbol: str
    side: str
    amount: float
    entry_price: Optional[float] = None
    api_key: Optional[str] = None
    secret: Optional[str] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    leverage: int = 10
    margin_mode: str = "isolated"
    order_type: str = "limit"
