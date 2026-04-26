"""
Training script for LSTM/GRU price prediction model.
Usage: python train_prediction.py --csv ../../data/raw/stock_data.csv --symbol AAPL --model lstm
"""
import argparse
import os
import sys
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from app.ml.utils.feature_engineering import load_and_prepare, create_sequences, scale_data, SEQUENCE_LENGTH
from app.ml.models.architectures import build_lstm_model, build_gru_model
from tensorflow.keras.callbacks import EarlyStopping

def train(csv_path: str, symbol: str, model_type: str = "lstm"):
    df = pd.read_csv(csv_path, parse_dates=["Date"])
    df.rename(columns={"Date": "date"}, inplace=True)

    raw_features, _ = load_and_prepare(df)
    model_dir = os.path.join(os.path.dirname(__file__), "../../../data/models")
    os.makedirs(model_dir, exist_ok=True)

    scaler_path = os.path.join(model_dir, f"{symbol}_scaler.pkl")
    scaled, _ = scale_data(raw_features, scaler_path=scaler_path, fit=True)

    X, y = create_sequences(scaled, SEQUENCE_LENGTH)
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    input_shape = (X_train.shape[1], X_train.shape[2])
    model = build_lstm_model(input_shape) if model_type == "lstm" else build_gru_model(input_shape)

    model_path = os.path.join(model_dir, f"{symbol}_{model_type}.keras")

    history = model.fit(X_train, y_train, validation_data=(X_val, y_val),
                        epochs=100, batch_size=32, verbose=1,
                        callbacks=[EarlyStopping(patience=10, restore_best_weights=True)])

    model.save(model_path)
    val_acc = max(history.history["val_accuracy"])
    print(f"\nBest Val Accuracy: {val_acc:.4f}")
    print(f"Model saved to: {model_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True)
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--model", default="lstm", choices=["lstm", "gru"])
    args = parser.parse_args()
    train(args.csv, args.symbol, args.model)
