"""
CNN Candlestick Pattern Training Script.
Patterns: 0=Doji, 1=Hammer, 2=BullishEngulfing, 3=BearishEngulfing, 4=MorningStar, 5=EveningStar
Usage: python train_patterns.py --csv ../../data/raw/stock_data.csv
"""
import argparse
import os
import sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from app.ml.models.architectures import build_cnn_pattern_model
from tensorflow.keras.callbacks import EarlyStopping

PATTERN_NAMES = ["Doji", "Hammer", "BullishEngulfing", "BearishEngulfing", "MorningStar", "EveningStar"]
WINDOW = 5

def label_pattern(window: np.ndarray) -> int:
    o, h, l, c = window[:, 0], window[:, 1], window[:, 2], window[:, 3]
    body = abs(c - o)
    total_range = h - l + 1e-9

    # Doji: tiny body
    if body[-1] / total_range[-1] < 0.1:
        return 0
    # Hammer: small body at top, long lower wick
    lower_wick = min(o[-1], c[-1]) - l[-1]
    if lower_wick > 2 * body[-1] and (h[-1] - max(o[-1], c[-1])) < body[-1]:
        return 1
    # Bullish Engulfing
    if c[-2] < o[-2] and c[-1] > o[-1] and o[-1] < c[-2] and c[-1] > o[-2]:
        return 2
    # Bearish Engulfing
    if c[-2] > o[-2] and c[-1] < o[-1] and o[-1] > c[-2] and c[-1] < o[-2]:
        return 3
    # Morning Star (3-candle)
    if len(window) >= 3 and c[-3] < o[-3] and body[-2] < 0.3 * body[-3] and c[-1] > o[-1]:
        return 4
    # Evening Star
    if len(window) >= 3 and c[-3] > o[-3] and body[-2] < 0.3 * body[-3] and c[-1] < o[-1]:
        return 5
    return -1  # No pattern

def generate_dataset(df: pd.DataFrame):
    ohlc = df[["open", "high", "low", "close"]].values
    X, y = [], []
    for i in range(WINDOW, len(ohlc)):
        window = ohlc[i - WINDOW:i]
        label = label_pattern(window)
        if label >= 0:
            X.append(window)
            y.append(label)
    return np.array(X, dtype=np.float32), np.array(y)

def train(csv_path: str):
    df = pd.read_csv(csv_path)
    df.columns = [c.lower() for c in df.columns]
    df.dropna(inplace=True)

    X, y = generate_dataset(df)
    print(f"Dataset: {X.shape}, Labels distribution: {np.bincount(y)}")

    # Normalize per sample
    X = (X - X.mean(axis=1, keepdims=True)) / (X.std(axis=1, keepdims=True) + 1e-9)

    split = int(len(X) * 0.8)
    model = build_cnn_pattern_model(input_shape=(WINDOW, 4), num_classes=6)

    model_dir = os.path.join(os.path.dirname(__file__), "../../../data/models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "cnn_patterns.keras")

    model.fit(X[:split], y[:split], validation_data=(X[split:], y[split:]),
              epochs=50, batch_size=32,
              callbacks=[EarlyStopping(patience=8, restore_best_weights=True)],
              verbose=1)
    model.save(model_path)
    print(f"Pattern model saved: {model_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True)
    args = parser.parse_args()
    train(args.csv)
