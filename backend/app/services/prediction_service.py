import os
import numpy as np
import pandas as pd
import joblib
from app.ml.utils.feature_engineering import load_and_prepare, create_sequences, scale_data, SEQUENCE_LENGTH
from app.core.config import settings

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None

_model_cache = {}

def _load_model(symbol: str, model_type: str = "lstm"):
    if not TF_AVAILABLE:
        raise RuntimeError("TensorFlow not available — LSTM/GRU prediction disabled.")
    key = f"{symbol}_{model_type}"
    if key not in _model_cache:
        path = os.path.join(settings.MODEL_PATH, f"{key}.keras")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model not found: {path}. Train it first.")
        _model_cache[key] = tf.keras.models.load_model(path)
    return _model_cache[key]

def predict_movement(df: pd.DataFrame, symbol: str, model_type: str = "lstm") -> dict:
    if not TF_AVAILABLE:
        # Fallback: simple momentum-based prediction
        close = df["Close"] if "Close" in df.columns else df["close"]
        chg = float(close.pct_change(5).iloc[-1]) * 100
        direction = "UP" if chg > 0 else "DOWN"
        confidence = min(abs(chg) * 10 + 50, 75)
        return {
            "symbol": symbol,
            "direction": direction,
            "confidence": round(confidence, 2),
            "probability_up": round(confidence if direction == "UP" else 100 - confidence, 2),
            "probability_down": round(confidence if direction == "DOWN" else 100 - confidence, 2),
            "model_used": "MOMENTUM_FALLBACK",
        }

    raw, _ = load_and_prepare(df)
    scaler_path = os.path.join(settings.MODEL_PATH, f"{symbol}_scaler.pkl")
    scaled, _ = scale_data(raw, scaler_path=scaler_path, fit=False)

    if len(scaled) < SEQUENCE_LENGTH:
        raise ValueError(f"Need at least {SEQUENCE_LENGTH} rows of data.")

    sequence = scaled[-SEQUENCE_LENGTH:].reshape(1, SEQUENCE_LENGTH, scaled.shape[1])
    model = _load_model(symbol, model_type)
    prob = float(model.predict(sequence, verbose=0)[0][0])

    direction = "UP" if prob >= 0.5 else "DOWN"
    confidence = prob if prob >= 0.5 else 1 - prob

    return {
        "symbol": symbol,
        "direction": direction,
        "confidence": round(confidence * 100, 2),
        "probability_up": round(prob * 100, 2),
        "probability_down": round((1 - prob) * 100, 2),
        "model_used": model_type.upper(),
    }
