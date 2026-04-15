import requests
import pandas as pd

BASE_URL = "https://api.binance.com/api/v3"

def get_price(symbol: str):
    res = requests.get(f"{BASE_URL}/ticker/price", params={"symbol": symbol})
    return float(res.json()["price"])


def get_klines(symbol: str, interval="5m", limit=200):
    res = requests.get(f"{BASE_URL}/klines", params={
        "symbol": symbol,
        "interval": interval,
        "limit": limit
    })

    data = res.json()

    return pd.DataFrame([{ 
        "open": float(k[1]),
        "high": float(k[2]),
        "low": float(k[3]),
        "close": float(k[4]),
        "volume": float(k[5])
    } for k in data])