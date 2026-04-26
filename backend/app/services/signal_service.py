import pandas as pd
import ta

def generate_signals(df: pd.DataFrame, dl_direction: str, dl_confidence: float) -> dict:
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]
    df.sort_values("date", inplace=True)
    close = df["close"]

    rsi = ta.momentum.RSIIndicator(close).rsi().iloc[-1]
    macd_obj = ta.trend.MACD(close)
    macd = macd_obj.macd().iloc[-1]
    macd_signal = macd_obj.macd_signal().iloc[-1]
    ema_20 = ta.trend.EMAIndicator(close, window=20).ema_indicator().iloc[-1]
    sma_50 = ta.trend.SMAIndicator(close, window=50).sma_indicator().iloc[-1]
    bb = ta.volatility.BollingerBands(close)
    bb_upper = bb.bollinger_hband().iloc[-1]
    bb_lower = bb.bollinger_lband().iloc[-1]
    current_price = close.iloc[-1]

    scores = {"BUY": 0, "SELL": 0, "HOLD": 0}

    # RSI
    if rsi < 30: scores["BUY"] += 2
    elif rsi > 70: scores["SELL"] += 2
    else: scores["HOLD"] += 1

    # MACD
    if macd > macd_signal: scores["BUY"] += 1
    else: scores["SELL"] += 1

    # EMA/SMA trend
    if current_price > ema_20 > sma_50: scores["BUY"] += 1
    elif current_price < ema_20 < sma_50: scores["SELL"] += 1
    else: scores["HOLD"] += 1

    # Bollinger Bands
    if current_price <= bb_lower: scores["BUY"] += 1
    elif current_price >= bb_upper: scores["SELL"] += 1
    else: scores["HOLD"] += 1

    # DL model vote
    dl_weight = 2 if dl_confidence >= 70 else 1
    if dl_direction == "UP": scores["BUY"] += dl_weight
    else: scores["SELL"] += dl_weight

    signal = max(scores, key=scores.get)
    total = sum(scores.values())

    return {
        "signal": signal,
        "confidence": round(scores[signal] / total * 100, 2),
        "scores": scores,
        "indicators": {
            "rsi": round(rsi, 2),
            "macd": round(macd, 4),
            "macd_signal": round(macd_signal, 4),
            "ema_20": round(ema_20, 2),
            "sma_50": round(sma_50, 2),
            "bb_upper": round(bb_upper, 2),
            "bb_lower": round(bb_lower, 2),
            "current_price": round(current_price, 2),
        }
    }
