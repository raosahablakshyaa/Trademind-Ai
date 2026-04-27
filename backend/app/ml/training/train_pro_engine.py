"""
ProTraderEngine Training Script
Usage:
  # Train on a single stock CSV:
  python train_pro_engine.py --csv ../../data/raw/sample_stock.csv --symbol RELIANCE

  # Train on multiple symbols from yfinance (auto-download):
  python train_pro_engine.py --symbols RELIANCE.NS TCS.NS INFY.NS AAPL NVDA BTC-USD --period 5y

  # Train on all Nifty 50 + US stocks:
  python train_pro_engine.py --preset nifty50
"""
import argparse
import os
import sys
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from app.ml.models.pro_trader_engine import ProTraderDecisionEngine


NIFTY50_SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "KOTAKBANK.NS", "AXISBANK.NS", "SBIN.NS", "BAJFINANCE.NS", "WIPRO.NS",
    "HCLTECH.NS", "TATAMOTORS.NS", "TATASTEEL.NS", "ADANIENT.NS", "SUNPHARMA.NS",
    "DRREDDY.NS", "ITC.NS", "HINDUNILVR.NS", "TITAN.NS", "BHARTIARTL.NS",
    "MARUTI.NS", "LT.NS", "ONGC.NS", "NTPC.NS", "COALINDIA.NS",
]

US_SYMBOLS = [
    "AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN", "META",
    "AMD", "JPM", "V", "MA", "NFLX", "COIN", "PLTR",
]

CRYPTO_SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD"]


def download_and_combine(symbols: list, period: str = "5y") -> pd.DataFrame:
    """Download multiple symbols and combine into one large training dataset."""
    import yfinance as yf
    all_dfs = []
    for sym in symbols:
        try:
            t = yf.Ticker(sym)
            df = t.history(period=period, interval="1d")
            if df.empty or len(df) < 200:
                print(f"  Skipping {sym} — not enough data ({len(df)} rows)")
                continue
            df.reset_index(inplace=True)
            df.rename(columns={"Date": "date"}, inplace=True)
            # Normalize prices so different stocks can be combined
            df["symbol"] = sym
            all_dfs.append(df)
            print(f"  ✓ {sym}: {len(df)} rows")
        except Exception as e:
            print(f"  ✗ {sym}: {e}")

    if not all_dfs:
        raise ValueError("No data downloaded")

    combined = pd.concat(all_dfs, ignore_index=True)
    print(f"\nTotal rows: {len(combined)} from {len(all_dfs)} symbols")
    return combined


def train_from_csv(csv_path: str, symbol: str):
    engine = ProTraderDecisionEngine()
    result = engine.train(csv_path, symbol)
    print(f"\nTraining complete: {result}")


def train_from_symbols(symbols: list, period: str = "5y"):
    import yfinance as yf
    import tempfile

    print(f"\nDownloading {len(symbols)} symbols ({period})...")
    combined = download_and_combine(symbols, period)

    # Save to temp CSV and train
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="w") as f:
        combined.to_csv(f, index=False)
        tmp_path = f.name

    # Rename columns to match expected format
    df = pd.read_csv(tmp_path)
    df.rename(columns={
        "Open": "Open", "High": "High", "Low": "Low",
        "Close": "Close", "Volume": "Volume", "date": "Date"
    }, inplace=True)
    df.to_csv(tmp_path, index=False)

    engine = ProTraderDecisionEngine()
    result = engine.train(tmp_path, f"MULTI_{len(symbols)}_SYMBOLS")
    os.unlink(tmp_path)
    print(f"\nTraining complete: {result}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ProTraderDecisionEngine")
    parser.add_argument("--csv",     type=str, help="Path to CSV file")
    parser.add_argument("--symbol",  type=str, default="STOCK", help="Symbol name")
    parser.add_argument("--symbols", nargs="+", help="List of yfinance symbols")
    parser.add_argument("--period",  type=str, default="5y", help="yfinance period (2y, 5y, 10y)")
    parser.add_argument("--preset",  type=str, choices=["nifty50", "us", "crypto", "all"],
                        help="Use preset symbol list")
    args = parser.parse_args()

    if args.csv:
        train_from_csv(args.csv, args.symbol)

    elif args.symbols:
        train_from_symbols(args.symbols, args.period)

    elif args.preset:
        if args.preset == "nifty50":
            syms = NIFTY50_SYMBOLS
        elif args.preset == "us":
            syms = US_SYMBOLS
        elif args.preset == "crypto":
            syms = CRYPTO_SYMBOLS
        else:  # all
            syms = NIFTY50_SYMBOLS + US_SYMBOLS + CRYPTO_SYMBOLS

        train_from_symbols(syms, args.period)

    else:
        # Default: train on sample data
        sample = os.path.join(os.path.dirname(__file__), "../../../data/raw/sample_stock.csv")
        if os.path.exists(sample):
            train_from_csv(sample, "SAMPLE")
        else:
            print("No input provided. Use --csv, --symbols, or --preset")
            print("Example: python train_pro_engine.py --preset nifty50 --period 5y")
