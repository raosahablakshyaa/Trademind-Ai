"""
Generate a synthetic OHLCV CSV for testing when you don't have real data.
Usage: python generate_sample_data.py
Output: ../data/raw/sample_stock.csv
"""
import numpy as np
import pandas as pd
import os

np.random.seed(42)
n = 1000
dates = pd.date_range("2020-01-01", periods=n, freq="B")
close = 100 + np.cumsum(np.random.randn(n) * 1.5)
high = close + np.abs(np.random.randn(n) * 0.8)
low = close - np.abs(np.random.randn(n) * 0.8)
open_ = close + np.random.randn(n) * 0.5
volume = np.random.randint(1_000_000, 10_000_000, n)

df = pd.DataFrame({"Date": dates, "Open": open_, "High": high, "Low": low, "Close": close, "Volume": volume})
df = df.round(2)

out = os.path.join(os.path.dirname(__file__), "../data/raw/sample_stock.csv")
os.makedirs(os.path.dirname(out), exist_ok=True)
df.to_csv(out, index=False)
print(f"Sample data saved: {out} ({n} rows)")
