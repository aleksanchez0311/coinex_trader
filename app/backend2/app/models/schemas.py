from pydantic import BaseModel

class TradeRequest(BaseModel):
    symbol: str
    capital: float
    risk_percent: float = 30
    leverage: int = 20