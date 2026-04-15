import ta

def add_indicators(df):
    df['atr'] = ta.volatility.AverageTrueRange(
        df['high'], df['low'], df['close'], window=14
    ).average_true_range()
    return df


def detect_structure(df):
    if df['high'].iloc[-1] > df['high'].iloc[-5]:
        return "BULLISH"
    elif df['low'].iloc[-1] < df['low'].iloc[-5]:
        return "BEARISH"
    return "RANGE"


def detect_liquidity_sweep(df):
    if df['low'].iloc[-1] < df['low'].iloc[-5]:
        return "SELL_SIDE_LIQUIDITY"
    elif df['high'].iloc[-1] > df['high'].iloc[-5]:
        return "BUY_SIDE_LIQUIDITY"
    return "NONE"