import numpy as np
import pandas as pd
import ta
from sklearn.preprocessing import MinMaxScaler
import joblib
import os
from app.core.config import settings

SEQUENCE_LENGTH = 60

def load_and_prepare(df: pd.DataFrame):
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]
    df.sort_values("date", inplace=True)
    df.reset_index(drop=True, inplace=True)

    df["rsi"] = ta.momentum.RSIIndicator(df["close"]).rsi()
    macd = ta.trend.MACD(df["close"])
    df["macd"] = macd.macd()
    df["macd_signal"] = macd.macd_signal()
    df["ema_20"] = ta.trend.EMAIndicator(df["close"], window=20).ema_indicator()
    df["sma_50"] = ta.trend.SMAIndicator(df["close"], window=50).sma_indicator()
    bb = ta.volatility.BollingerBands(df["close"])
    df["bb_upper"] = bb.bollinger_hband()
    df["bb_lower"] = bb.bollinger_lband()
    df["bb_width"] = df["bb_upper"] - df["bb_lower"]
    df.dropna(inplace=True)

    features = ["open", "high", "low", "close", "volume", "rsi", "macd", "macd_signal",
                "ema_20", "sma_50", "bb_upper", "bb_lower", "bb_width"]
    return df[features].values, features

def create_sequences(data: np.ndarray, seq_len: int = SEQUENCE_LENGTH):
    X, y = [], []
    for i in range(seq_len, len(data)):
        X.append(data[i - seq_len:i])
        y.append(1 if data[i, 3] > data[i - 1, 3] else 0)  # close[i] > close[i-1]
    return np.array(X), np.array(y)

def scale_data(data: np.ndarray, scaler_path: str = None, fit: bool = True):
    scaler = MinMaxScaler()
    if not fit and scaler_path and os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)
        return scaler.transform(data), scaler
    scaled = scaler.fit_transform(data)
    if scaler_path:
        joblib.dump(scaler, scaler_path)
    return scaled, scaler
