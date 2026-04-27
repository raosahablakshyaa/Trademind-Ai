import yfinance as yf
import pandas as pd
from datetime import datetime, time as dtime
from threading import Lock
import time
import pytz

INTERVAL_MAP = {
    "1m":  ("1d",  "1m"),
    "5m":  ("5d",  "5m"),
    "15m": ("5d",  "15m"),
    "1h":  ("1mo", "1h"),
    "1d":  ("1y",  "1d"),
    "1wk": ("5y",  "1wk"),
}

# ── In-memory cache (symbol -> {data, expires_at}) ──
_cache: dict = {}
_cache_lock = Lock()
CACHE_TTL = 15  # seconds — cache each quote for 15s

def _get_cached(symbol: str):
    with _cache_lock:
        entry = _cache.get(symbol)
        if entry and time.time() < entry["expires_at"]:
            return entry["data"]
    return None

def _set_cache(symbol: str, data: dict):
    with _cache_lock:
        _cache[symbol] = {"data": data, "expires_at": time.time() + CACHE_TTL}

# ── Market hours ──
MARKET_HOURS = {
    "NASDAQ": {"tz": "America/New_York", "open": dtime(9, 30),  "close": dtime(16, 0),  "days": range(0, 5)},
    "NYSE":   {"tz": "America/New_York", "open": dtime(9, 30),  "close": dtime(16, 0),  "days": range(0, 5)},
    "NSE":    {"tz": "Asia/Kolkata",     "open": dtime(9, 15),  "close": dtime(15, 30), "days": range(0, 5)},
    "BSE":    {"tz": "Asia/Kolkata",     "open": dtime(9, 15),  "close": dtime(15, 30), "days": range(0, 5)},
    "LSE":    {"tz": "Europe/London",    "open": dtime(8, 0),   "close": dtime(16, 30), "days": range(0, 5)},
    "TSE":    {"tz": "Asia/Tokyo",       "open": dtime(9, 0),   "close": dtime(15, 30), "days": range(0, 5)},
    "CRYPTO": {"tz": "UTC",             "open": dtime(0, 0),   "close": dtime(23, 59), "days": range(0, 7)},
    "FOREX":  {"tz": "UTC",             "open": dtime(0, 0),   "close": dtime(23, 59), "days": range(0, 5)},
    # Gold/Silver trade nearly 24h on weekdays (COMEX + Globex)
    "COMEX":  {"tz": "America/New_York", "open": dtime(6, 0),   "close": dtime(17, 0),  "days": range(0, 5)},
    # Crude Oil trades nearly 24h on weekdays
    "NYMEX":  {"tz": "America/New_York", "open": dtime(6, 0),   "close": dtime(17, 0),  "days": range(0, 5)},
    # Indices — same as their primary exchange
    "INDEX":  {"tz": "America/New_York", "open": dtime(9, 30),  "close": dtime(16, 0),  "days": range(0, 5)},
}

def get_exchange(symbol: str) -> str:
    s = symbol.upper()
    if s.endswith("-USD"):  return "CRYPTO"
    if s.endswith("=X"):    return "FOREX"
    if s.endswith(".NS") or s in ("^NSEI", "^BSESN", "^NSEBANK"): return "NSE"
    if s.endswith(".BO"):   return "BSE"
    if s.endswith(".L"):    return "LSE"
    if s == "^N225":        return "TSE"
    if s in ("^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"): return "INDEX"
    if s in ("^HSI",):      return "HKEX"
    if s in ("^FTSE",):     return "LSE"
    if s in ("^GDAXI", "^FCHI", "^STOXX50E"): return "LSE"  # European — use LSE hours approx
    if s in ("GC=F", "SI=F", "HG=F", "PL=F", "PA=F"): return "COMEX"
    if s in ("CL=F", "BZ=F", "NG=F"): return "NYMEX"
    if s in ("ZW=F", "ZC=F", "ZS=F", "KC=F", "CT=F", "SB=F"): return "COMEX"
    return "NASDAQ"

def is_market_open(exchange: str) -> bool:
    # HKEX not in MARKET_HOURS — fallback to closed
    h = MARKET_HOURS.get(exchange)
    if not h:
        return False
    tz  = pytz.timezone(h["tz"])
    now = datetime.now(tz)
    if now.weekday() not in h["days"]:
        return False
    return h["open"] <= now.time() <= h["close"]

def get_quote(symbol: str) -> dict:
    # Return cached if fresh
    cached = _get_cached(symbol)
    if cached:
        # Always recompute market_open (time-sensitive, not worth caching)
        exchange = cached["exchange"]
        cached = dict(cached)
        cached["market_open"] = is_market_open(exchange)
        return cached

    ticker = yf.Ticker(symbol)

    # Try intraday first, then daily fallback
    hist = ticker.history(period="1d", interval="5m")
    if hist.empty:
        hist = ticker.history(period="2d", interval="1m")
    if hist.empty:
        hist = ticker.history(period="5d", interval="1d")
    if hist.empty:
        hist = ticker.history(period="1mo", interval="1d")

    if hist.empty:
        raise ValueError(f"No data found for symbol: {symbol}")

    current    = float(hist["Close"].iloc[-1])
    info       = ticker.fast_info
    prev_close = float(info.previous_close) if hasattr(info, "previous_close") and info.previous_close else float(hist["Close"].iloc[0])
    change     = current - prev_close
    change_pct = (change / prev_close) * 100 if prev_close else 0
    exchange   = get_exchange(symbol)

    result = {
        "symbol":      symbol.upper(),
        "price":       round(current, 4),
        "change":      round(change, 4),
        "change_pct":  round(change_pct, 3),
        "high":        round(float(hist["High"].max()), 4),
        "low":         round(float(hist["Low"].min()), 4),
        "volume":      int(hist["Volume"].sum()),
        "prev_close":  round(prev_close, 4),
        "timestamp":   datetime.utcnow().isoformat(),
        "market_open": is_market_open(exchange),
        "exchange":    exchange,
    }

    _set_cache(symbol, result)
    return result

def get_chart_data(symbol: str, interval: str = "1d") -> dict:
    period, tf = INTERVAL_MAP.get(interval, ("1y", "1d"))
    ticker = yf.Ticker(symbol)
    hist   = ticker.history(period=period, interval=tf)

    if hist.empty:
        raise ValueError(f"No data for {symbol}")

    hist.index = pd.to_datetime(hist.index)
    candles = []
    for ts, row in hist.iterrows():
        t = int(ts.timestamp()) if hasattr(ts, "timestamp") else int(ts.value // 1e9)
        candles.append({
            "time":   t,
            "open":   round(float(row["Open"]),  4),
            "high":   round(float(row["High"]),  4),
            "low":    round(float(row["Low"]),   4),
            "close":  round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
        })

    return {"symbol": symbol.upper(), "interval": interval, "candles": candles}

def search_symbols(query: str) -> list:
    ALL = [
        {"symbol": "AAPL",         "name": "Apple Inc.",                  "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "MSFT",         "name": "Microsoft Corp.",             "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "GOOGL",        "name": "Alphabet Inc.",               "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "AMZN",         "name": "Amazon.com Inc.",             "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "NVDA",         "name": "NVIDIA Corp.",                "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "TSLA",         "name": "Tesla Inc.",                  "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "META",         "name": "Meta Platforms",              "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "NFLX",         "name": "Netflix Inc.",                "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "AMD",          "name": "Advanced Micro Devices",      "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "INTC",         "name": "Intel Corp.",                 "type": "Stock",     "exchange": "NASDAQ"},
        {"symbol": "JPM",          "name": "JPMorgan Chase",              "type": "Stock",     "exchange": "NYSE"},
        {"symbol": "BAC",          "name": "Bank of America",             "type": "Stock",     "exchange": "NYSE"},
        {"symbol": "WMT",          "name": "Walmart Inc.",                "type": "Stock",     "exchange": "NYSE"},
        {"symbol": "DIS",          "name": "Walt Disney Co.",             "type": "Stock",     "exchange": "NYSE"},
        {"symbol": "UBER",         "name": "Uber Technologies",           "type": "Stock",     "exchange": "NYSE"},
        {"symbol": "RELIANCE.NS",  "name": "Reliance Industries",         "type": "Stock",     "exchange": "NSE"},
        {"symbol": "TCS.NS",       "name": "Tata Consultancy Services",   "type": "Stock",     "exchange": "NSE"},
        {"symbol": "INFY.NS",      "name": "Infosys Ltd.",                "type": "Stock",     "exchange": "NSE"},
        {"symbol": "HDFCBANK.NS",  "name": "HDFC Bank",                   "type": "Stock",     "exchange": "NSE"},
        {"symbol": "ICICIBANK.NS", "name": "ICICI Bank",                  "type": "Stock",     "exchange": "NSE"},
        {"symbol": "WIPRO.NS",     "name": "Wipro Ltd.",                  "type": "Stock",     "exchange": "NSE"},
        {"symbol": "TATAMOTORS.NS","name": "Tata Motors",                 "type": "Stock",     "exchange": "NSE"},
        {"symbol": "BAJFINANCE.NS","name": "Bajaj Finance",               "type": "Stock",     "exchange": "NSE"},
        {"symbol": "ADANIENT.NS",  "name": "Adani Enterprises",           "type": "Stock",     "exchange": "NSE"},
        {"symbol": "SBIN.NS",      "name": "State Bank of India",         "type": "Stock",     "exchange": "NSE"},
        {"symbol": "BTC-USD",      "name": "Bitcoin",                     "type": "Crypto",    "exchange": "Crypto"},
        {"symbol": "ETH-USD",      "name": "Ethereum",                    "type": "Crypto",    "exchange": "Crypto"},
        {"symbol": "BNB-USD",      "name": "Binance Coin",                "type": "Crypto",    "exchange": "Crypto"},
        {"symbol": "SOL-USD",      "name": "Solana",                      "type": "Crypto",    "exchange": "Crypto"},
        {"symbol": "XRP-USD",      "name": "XRP",                         "type": "Crypto",    "exchange": "Crypto"},
        {"symbol": "ADA-USD",      "name": "Cardano",                     "type": "Crypto",    "exchange": "Crypto"},
        {"symbol": "DOGE-USD",     "name": "Dogecoin",                    "type": "Crypto",    "exchange": "Crypto"},
        {"symbol": "EURUSD=X",     "name": "EUR/USD",                     "type": "Forex",     "exchange": "Forex"},
        {"symbol": "GBPUSD=X",     "name": "GBP/USD",                     "type": "Forex",     "exchange": "Forex"},
        {"symbol": "USDJPY=X",     "name": "USD/JPY",                     "type": "Forex",     "exchange": "Forex"},
        {"symbol": "USDINR=X",     "name": "USD/INR",                     "type": "Forex",     "exchange": "Forex"},
        {"symbol": "AUDUSD=X",     "name": "AUD/USD",                     "type": "Forex",     "exchange": "Forex"},
        {"symbol": "USDCAD=X",     "name": "USD/CAD",                     "type": "Forex",     "exchange": "Forex"},
        {"symbol": "USDCHF=X",     "name": "USD/CHF",                     "type": "Forex",     "exchange": "Forex"},
        {"symbol": "^GSPC",        "name": "S&P 500",                     "type": "Index",     "exchange": "INDEX"},
        {"symbol": "^DJI",         "name": "Dow Jones",                   "type": "Index",     "exchange": "INDEX"},
        {"symbol": "^IXIC",        "name": "NASDAQ Composite",            "type": "Index",     "exchange": "INDEX"},
        {"symbol": "^NSEI",        "name": "Nifty 50",                    "type": "Index",     "exchange": "NSE"},
        {"symbol": "^BSESN",       "name": "BSE Sensex",                  "type": "Index",     "exchange": "BSE"},
        {"symbol": "^N225",        "name": "Nikkei 225",                  "type": "Index",     "exchange": "TSE"},
        {"symbol": "GC=F",         "name": "Gold Futures",                "type": "Commodity", "exchange": "COMEX"},
        {"symbol": "SI=F",         "name": "Silver Futures",              "type": "Commodity", "exchange": "COMEX"},
        {"symbol": "CL=F",         "name": "Crude Oil WTI",               "type": "Commodity", "exchange": "NYMEX"},
    ]
    q = query.lower()
    return [s for s in ALL if q in s["symbol"].lower() or q in s["name"].lower()][:10]
