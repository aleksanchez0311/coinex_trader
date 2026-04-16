from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class AnalysisRequest(BaseModel):
    symbol: str
    timeframe: str = "1h"
    country: str = "Cuba"
    capital: float = Field(default=10.0, gt=0)
    api_key: Optional[str] = None
    secret: Optional[str] = None


class RiskRequest(BaseModel):
    capital: float
    risk_pct: float = 30.0
    entry_price: float
    stop_loss: float
    take_profit: Optional[float] = None
    leverage: int = 20
    operation_size_pct: Optional[float] = 70.0


class TradeExecutionRequest(BaseModel):
    symbol: str
    side: str
    amount: float
    entry_price: Optional[float] = None
    api_key: Optional[str] = None
    secret: Optional[str] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    leverage: int = 20
    margin_mode: str = "isolated"
    order_type: str = "limit"


class CredentialsRequest(BaseModel):
    api_key: str
    secret: str


class ClosePositionRequest(CredentialsRequest):
    symbol: str
    side: str
    amount: float = Field(gt=0)


class TickersBatchRequest(BaseModel):
    symbols: List[str]


class TPPositionRequest(BaseModel):
    market: str
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    amount: Optional[float] = None
    api_key: str
    secret: str
