import os
import numpy as np
import pandas as pd
from app.core.config import settings

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None

PATTERN_NAMES = ["Doji", "Hammer", "BullishEngulfing", "BearishEngulfing", "MorningStar", "EveningStar"]
WINDOW = 5
_cnn_model = None

def _load_cnn():
    if not TF_AVAILABLE:
        return None
    global _cnn_model
    if _cnn_model is None:
        path = os.path.join(settings.MODEL_PATH, "cnn_patterns.keras")
        if not os.path.exists(path):
            return None
        _cnn_model = tf.keras.models.load_model(path)
    return _cnn_model

def detect_patterns(df: pd.DataFrame) -> dict:
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]
    ohlc = df[["open", "high", "low", "close"]].values.astype(np.float32)

    if len(ohlc) < WINDOW:
        return {"patterns": [], "dominant_pattern": None}

    model = _load_cnn()
    if model:
        window = ohlc[-WINDOW:]
        normalized = (window - window.mean(axis=0)) / (window.std(axis=0) + 1e-9)
        X = normalized.reshape(1, WINDOW, 4)
        probs = model.predict(X, verbose=0)[0]
        top_idx = int(np.argmax(probs))
        patterns = [
            {"pattern": PATTERN_NAMES[i], "probability": round(float(p) * 100, 2)}
            for i, p in enumerate(probs) if p > 0.1
        ]
        patterns.sort(key=lambda x: x["probability"], reverse=True)
        dominant = PATTERN_NAMES[top_idx] if probs[top_idx] > 0.4 else None
    else:
        patterns, dominant = _rule_based_patterns(ohlc)

    return {"patterns": patterns, "dominant_pattern": dominant}

def _rule_based_patterns(ohlc: np.ndarray):
    o, h, l, c = ohlc[-1]
    body = abs(c - o)
    total_range = h - l + 1e-9
    lower_wick = min(o, c) - l
    upper_wick = h - max(o, c)
    detected = []

    if body / total_range < 0.1:
        detected.append({"pattern": "Doji", "probability": 85.0})
    if lower_wick > 2 * body and upper_wick < body:
        detected.append({"pattern": "Hammer", "probability": 78.0})
    if len(ohlc) >= 2:
        po, ph, pl, pc = ohlc[-2]
        if pc < po and c > o and o < pc and c > po:
            detected.append({"pattern": "BullishEngulfing", "probability": 82.0})
        if pc > po and c < o and o > pc and c < po:
            detected.append({"pattern": "BearishEngulfing", "probability": 82.0})

    dominant = detected[0]["pattern"] if detected else None
    return detected, dominant
