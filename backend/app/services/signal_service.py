import pandas as pd
import numpy as np
import ta

# ─────────────────────────────────────────────
#  Pro Trader AI Signal Engine
#  Combines: Technical Analysis + Price Action
#            + Smart Money Concepts + Probability
# ─────────────────────────────────────────────

def generate_signals(df: pd.DataFrame, dl_direction: str, dl_confidence: float) -> dict:
    df = df.copy()
    df.columns = [c.lower() for c in df.columns]
    df.sort_values("date", inplace=True)
    df.reset_index(drop=True, inplace=True)

    close  = df["close"]
    high   = df["high"]
    low    = df["low"]
    volume = df["volume"] if "volume" in df.columns else pd.Series([1]*len(df))

    p     = float(close.iloc[-1])
    prev  = float(close.iloc[-2]) if len(close) > 1 else p
    h     = float(high.iloc[-1])
    l     = float(low.iloc[-1])
    vol   = float(volume.iloc[-1])
    vol_avg = float(volume.rolling(20).mean().iloc[-1]) if len(volume) >= 20 else vol

    # ── 1. RSI ──
    rsi_series = ta.momentum.RSIIndicator(close, window=14).rsi()
    rsi = float(rsi_series.iloc[-1])
    rsi_prev = float(rsi_series.iloc[-2]) if len(rsi_series) > 1 else rsi

    # ── 2. MACD ──
    macd_obj    = ta.trend.MACD(close)
    macd        = float(macd_obj.macd().iloc[-1])
    macd_signal = float(macd_obj.macd_signal().iloc[-1])
    macd_hist   = float(macd_obj.macd_diff().iloc[-1])
    macd_hist_prev = float(macd_obj.macd_diff().iloc[-2]) if len(close) > 1 else macd_hist

    # ── 3. EMA / SMA ──
    ema_9  = float(ta.trend.EMAIndicator(close, window=9).ema_indicator().iloc[-1])
    ema_20 = float(ta.trend.EMAIndicator(close, window=20).ema_indicator().iloc[-1])
    ema_50 = float(ta.trend.EMAIndicator(close, window=50).ema_indicator().iloc[-1])
    sma_50 = float(ta.trend.SMAIndicator(close, window=50).sma_indicator().iloc[-1])
    sma_200 = float(ta.trend.SMAIndicator(close, window=200).sma_indicator().iloc[-1]) if len(close) >= 200 else ema_50

    # ── 4. Bollinger Bands ──
    bb      = ta.volatility.BollingerBands(close, window=20, window_dev=2)
    bb_up   = float(bb.bollinger_hband().iloc[-1])
    bb_lo   = float(bb.bollinger_lband().iloc[-1])
    bb_mid  = float(bb.bollinger_mavg().iloc[-1])
    bb_pct  = float(bb.bollinger_pband().iloc[-1])   # 0=lower, 1=upper

    # ── 5. ATR (Volatility) ──
    atr_series = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range()
    atr = float(atr_series.iloc[-1])
    atr_pct = (atr / p) * 100

    # ── 6. VWAP (Institutional level) ──
    try:
        vwap = float((close * volume).rolling(20).sum().iloc[-1] / volume.rolling(20).sum().iloc[-1])
    except Exception:
        vwap = p

    # ── 7. Stochastic RSI ──
    try:
        stoch = ta.momentum.StochRSIIndicator(close, window=14, smooth1=3, smooth2=3)
        stoch_k = float(stoch.stochrsi_k().iloc[-1])
        stoch_d = float(stoch.stochrsi_d().iloc[-1])
    except Exception:
        stoch_k, stoch_d = 50.0, 50.0

    # ── 8. ADX (Trend Strength) ──
    try:
        adx_obj = ta.trend.ADXIndicator(high, low, close, window=14)
        adx     = float(adx_obj.adx().iloc[-1])
        adx_pos = float(adx_obj.adx_pos().iloc[-1])
        adx_neg = float(adx_obj.adx_neg().iloc[-1])
    except Exception:
        adx, adx_pos, adx_neg = 25.0, 15.0, 15.0

    # ── 9. Pivot Points ──
    pivot = (h + l + p) / 3
    r1 = 2 * pivot - l
    r2 = pivot + (h - l)
    r3 = h + 2 * (pivot - l)
    s1 = 2 * pivot - h
    s2 = pivot - (h - l)
    s3 = l - 2 * (h - pivot)

    # ── 10. Fibonacci Retracement ──
    period_high = float(high.rolling(50).max().iloc[-1]) if len(high) >= 50 else h
    period_low  = float(low.rolling(50).min().iloc[-1])  if len(low)  >= 50 else l
    fib_range   = period_high - period_low
    fib_618 = period_high - fib_range * 0.618
    fib_382 = period_high - fib_range * 0.382
    fib_236 = period_high - fib_range * 0.236

    # ── 11. Volume Analysis ──
    vol_ratio    = vol / vol_avg if vol_avg > 0 else 1
    high_volume  = vol_ratio > 1.5
    volume_trend = "High" if vol_ratio > 1.5 else "Normal" if vol_ratio > 0.7 else "Low"

    # ── 12. Candlestick Pattern Detection ──
    body      = abs(p - prev)
    upper_wick = h - max(p, prev)
    lower_wick = min(p, prev) - l
    candle_range = h - l or 0.001
    body_pct  = body / candle_range

    pattern = "No clear pattern"
    pattern_bullish = False
    pattern_bearish = False

    if body_pct < 0.1:
        pattern = "Doji — Indecision"
    elif lower_wick > body * 2 and upper_wick < body * 0.5 and p < prev:
        pattern = "Hammer — Bullish Reversal"
        pattern_bullish = True
    elif lower_wick > body * 2 and upper_wick < body * 0.5 and p > prev:
        pattern = "Inverted Hammer — Potential Reversal"
        pattern_bullish = True
    elif upper_wick > body * 2 and lower_wick < body * 0.5 and p > prev:
        pattern = "Shooting Star — Bearish Reversal"
        pattern_bearish = True
    elif upper_wick > body * 2 and lower_wick < body * 0.5 and p < prev:
        pattern = "Hanging Man — Bearish Warning"
        pattern_bearish = True
    elif body_pct > 0.7 and p > prev:
        pattern = "Bullish Marubozu — Strong Buying"
        pattern_bullish = True
    elif body_pct > 0.7 and p < prev:
        pattern = "Bearish Marubozu — Strong Selling"
        pattern_bearish = True

    # ── 13. Market Structure ──
    recent_highs = high.rolling(5).max()
    recent_lows  = low.rolling(5).min()
    higher_high  = float(recent_highs.iloc[-1]) > float(recent_highs.iloc[-6]) if len(recent_highs) > 6 else False
    higher_low   = float(recent_lows.iloc[-1])  > float(recent_lows.iloc[-6])  if len(recent_lows)  > 6 else False
    lower_high   = float(recent_highs.iloc[-1]) < float(recent_highs.iloc[-6]) if len(recent_highs) > 6 else False
    lower_low    = float(recent_lows.iloc[-1])  < float(recent_lows.iloc[-6])  if len(recent_lows)  > 6 else False

    if higher_high and higher_low:
        market_structure = "Uptrend (HH-HL)"
    elif lower_high and lower_low:
        market_structure = "Downtrend (LH-LL)"
    else:
        market_structure = "Sideways / Consolidation"

    # ── 14. Smart Money — Order Block Detection ──
    # Bullish OB: last bearish candle before a strong bullish move
    ob_bullish = None
    ob_bearish = None
    if len(close) >= 5:
        for i in range(len(close)-2, max(len(close)-10, 0), -1):
            if float(close.iloc[i]) < float(close.iloc[i-1]):  # bearish candle
                if float(close.iloc[-1]) > float(high.iloc[i]):  # price moved above it
                    ob_bullish = round(float(low.iloc[i]), 4)
                    break
        for i in range(len(close)-2, max(len(close)-10, 0), -1):
            if float(close.iloc[i]) > float(close.iloc[i-1]):  # bullish candle
                if float(close.iloc[-1]) < float(low.iloc[i]):  # price moved below it
                    ob_bearish = round(float(high.iloc[i]), 4)
                    break

    # ── 15. Liquidity Grab ──
    liquidity_grab = None
    if lower_wick > atr * 1.5 and p > s1:
        liquidity_grab = "Bullish liquidity grab — swept lows, reversal likely"
    elif upper_wick > atr * 1.5 and p < r1:
        liquidity_grab = "Bearish liquidity grab — swept highs, reversal likely"

    # ─────────────────────────────────────────
    #  SCORING ENGINE (Weighted, 0–100)
    # ─────────────────────────────────────────
    scores = {"BUY": 0, "SELL": 0, "HOLD": 0}

    # RSI (weight: 15)
    if rsi < 30:
        scores["BUY"] += 15
    elif rsi < 45:
        scores["BUY"] += 8
    elif rsi > 70:
        scores["SELL"] += 15
    elif rsi > 55:
        scores["SELL"] += 8
    else:
        scores["HOLD"] += 5

    # RSI divergence bonus
    if rsi < 35 and rsi > rsi_prev:
        scores["BUY"] += 5   # RSI turning up from oversold

    # MACD (weight: 12)
    if macd > macd_signal and macd_hist > 0:
        scores["BUY"] += 12
    elif macd > macd_signal:
        scores["BUY"] += 6
    elif macd < macd_signal and macd_hist < 0:
        scores["SELL"] += 12
    elif macd < macd_signal:
        scores["SELL"] += 6
    else:
        scores["HOLD"] += 4

    # MACD histogram momentum
    if macd_hist > macd_hist_prev and macd_hist > 0:
        scores["BUY"] += 4
    elif macd_hist < macd_hist_prev and macd_hist < 0:
        scores["SELL"] += 4

    # EMA trend alignment (weight: 15)
    if p > ema_9 > ema_20 > ema_50:
        scores["BUY"] += 15   # perfect bullish alignment
    elif p > ema_20 > ema_50:
        scores["BUY"] += 10
    elif p > ema_20:
        scores["BUY"] += 5
    elif p < ema_9 < ema_20 < ema_50:
        scores["SELL"] += 15  # perfect bearish alignment
    elif p < ema_20 < ema_50:
        scores["SELL"] += 10
    elif p < ema_20:
        scores["SELL"] += 5
    else:
        scores["HOLD"] += 5

    # 200 SMA (long-term trend, weight: 8)
    if p > sma_200:
        scores["BUY"] += 8
    else:
        scores["SELL"] += 8

    # Bollinger Bands (weight: 10)
    if p <= bb_lo:
        scores["BUY"] += 10
    elif bb_pct < 0.2:
        scores["BUY"] += 5
    elif p >= bb_up:
        scores["SELL"] += 10
    elif bb_pct > 0.8:
        scores["SELL"] += 5
    else:
        scores["HOLD"] += 3

    # VWAP (weight: 8)
    if p > vwap * 1.005:
        scores["BUY"] += 8
    elif p < vwap * 0.995:
        scores["SELL"] += 8
    else:
        scores["HOLD"] += 4

    # ADX trend strength (weight: 8)
    if adx > 25:
        if adx_pos > adx_neg:
            scores["BUY"] += 8
        else:
            scores["SELL"] += 8
    else:
        scores["HOLD"] += 4   # weak trend

    # Stochastic RSI (weight: 6)
    if stoch_k < 20 and stoch_k > stoch_d:
        scores["BUY"] += 6
    elif stoch_k > 80 and stoch_k < stoch_d:
        scores["SELL"] += 6
    else:
        scores["HOLD"] += 2

    # Pivot position (weight: 6)
    if p > pivot:
        scores["BUY"] += 6
    else:
        scores["SELL"] += 6

    # Fibonacci support (weight: 5)
    if abs(p - fib_618) / p < 0.01:
        scores["BUY"] += 5   # near golden ratio support
    elif abs(p - fib_382) / p < 0.01:
        scores["BUY"] += 3

    # Volume confirmation (weight: 5)
    if high_volume and p > prev:
        scores["BUY"] += 5
    elif high_volume and p < prev:
        scores["SELL"] += 5

    # Market structure (weight: 8)
    if market_structure == "Uptrend (HH-HL)":
        scores["BUY"] += 8
    elif market_structure == "Downtrend (LH-LL)":
        scores["SELL"] += 8
    else:
        scores["HOLD"] += 4

    # Candlestick pattern (weight: 6)
    if pattern_bullish:
        scores["BUY"] += 6
    elif pattern_bearish:
        scores["SELL"] += 6

    # Smart Money — Order Block (weight: 5)
    if ob_bullish and p > ob_bullish:
        scores["BUY"] += 5
    if ob_bearish and p < ob_bearish:
        scores["SELL"] += 5

    # Liquidity grab (weight: 4)
    if liquidity_grab and "Bullish" in liquidity_grab:
        scores["BUY"] += 4
    elif liquidity_grab and "Bearish" in liquidity_grab:
        scores["SELL"] += 4

    # DL model vote (weight: 10)
    dl_weight = 10 if dl_confidence >= 70 else 6 if dl_confidence >= 55 else 3
    if dl_direction == "UP":
        scores["BUY"] += dl_weight
    else:
        scores["SELL"] += dl_weight

    # ─────────────────────────────────────────
    #  FINAL SIGNAL
    # ─────────────────────────────────────────
    signal = max(scores, key=scores.get)
    total  = sum(scores.values())
    confidence = round(scores[signal] / total * 100, 2)

    # ─────────────────────────────────────────
    #  TRADE PLAN (Pro Trader Formula)
    # ─────────────────────────────────────────
    # Stop Loss: ATR-based (1.5x ATR below entry for BUY)
    if signal == "BUY":
        entry      = round(p, 4)
        stop_loss  = round(p - atr * 1.5, 4)
        target_1   = round(p + atr * 2.0, 4)   # R/R 1.33x
        target_2   = round(p + atr * 3.5, 4)   # R/R 2.33x
        target_3   = round(p + atr * 5.0, 4)   # R/R 3.33x (swing target)
    elif signal == "SELL":
        entry      = round(p, 4)
        stop_loss  = round(p + atr * 1.5, 4)
        target_1   = round(p - atr * 2.0, 4)
        target_2   = round(p - atr * 3.5, 4)
        target_3   = round(p - atr * 5.0, 4)
    else:
        entry      = round(p, 4)
        stop_loss  = round(p - atr * 1.0, 4)
        target_1   = round(p + atr * 1.5, 4)
        target_2   = round(p + atr * 2.5, 4)
        target_3   = round(p + atr * 3.5, 4)

    sl_dist = abs(entry - stop_loss)
    rr_1    = round(abs(target_1 - entry) / sl_dist, 2) if sl_dist > 0 else 0
    rr_2    = round(abs(target_2 - entry) / sl_dist, 2) if sl_dist > 0 else 0
    rr_3    = round(abs(target_3 - entry) / sl_dist, 2) if sl_dist > 0 else 0

    # Position sizing (1% risk on ₹10L)
    capital      = 1_000_000
    risk_pct     = 0.01
    risk_amount  = capital * risk_pct
    pos_size     = int(risk_amount / sl_dist) if sl_dist > 0 else 0
    pos_value    = round(pos_size * entry, 2)
    pos_pct      = round((pos_value / capital) * 100, 2)

    # Break-even win rate
    break_even_wr = round((1 / (1 + rr_1)) * 100, 1) if rr_1 > 0 else 50.0

    # Expected Value (assuming 55% win rate)
    win_rate = 0.55
    ev = round((win_rate * abs(target_1 - entry)) - ((1 - win_rate) * sl_dist), 4)

    # ─────────────────────────────────────────
    #  PROBABILITY SCORE (multi-factor, 0–100)
    # ─────────────────────────────────────────
    prob = 50
    # Trend alignment
    if market_structure == "Uptrend (HH-HL)" and signal == "BUY":   prob += 12
    if market_structure == "Downtrend (LH-LL)" and signal == "SELL": prob += 12
    # RSI zone
    if signal == "BUY"  and rsi < 40: prob += 8
    if signal == "SELL" and rsi > 60: prob += 8
    # MACD confirmation
    if signal == "BUY"  and macd > macd_signal: prob += 6
    if signal == "SELL" and macd < macd_signal: prob += 6
    # Volume
    if high_volume: prob += 5
    # ADX strength
    if adx > 30: prob += 5
    # Pattern
    if pattern_bullish and signal == "BUY":   prob += 5
    if pattern_bearish and signal == "SELL":  prob += 5
    # R/R quality
    if rr_1 >= 2: prob += 5
    if rr_1 >= 3: prob += 3
    # Liquidity grab
    if liquidity_grab: prob += 4
    # Penalize weak signals
    if signal == "HOLD": prob -= 10
    if adx < 20: prob -= 5

    prob = min(92, max(15, prob))

    # ─────────────────────────────────────────
    #  SIMPLE TRADE CARD (Pro Trader Summary)
    # ─────────────────────────────────────────
    if signal == "BUY":
        action_label = "✅ BUY NOW" if confidence >= 55 else "⚠️ WAIT FOR CONFIRMATION"
        when_to_buy  = f"Enter near ₹{entry:,.2f} — current price is at support zone"
        when_to_sell = f"Book partial profit at ₹{target_1:,.2f} (T1), full exit at ₹{target_2:,.2f} (T2)"
        risk_note    = f"Exit immediately if price closes below ₹{stop_loss:,.2f}"
    elif signal == "SELL":
        action_label = "🚫 AVOID BUYING" if confidence >= 55 else "⚠️ CAUTION — BEARISH"
        when_to_buy  = f"Do NOT buy now — wait for price to reach ₹{target_2:,.2f} support"
        when_to_sell = f"If holding, exit at ₹{target_1:,.2f} or below"
        risk_note    = f"Stop loss for short: ₹{stop_loss:,.2f}"
    else:
        action_label = "⏳ WAIT & WATCH"
        when_to_buy  = f"Wait for breakout above ₹{r1:,.2f} with high volume"
        when_to_sell = f"Or wait for breakdown below ₹{s1:,.2f} to short"
        risk_note    = f"No clear edge right now — stay on sidelines"

    return {
        "signal":     signal,
        "confidence": confidence,
        "scores":     scores,

        # Trade Plan
        "trade_plan": {
            "action":       action_label,
            "when_to_buy":  when_to_buy,
            "when_to_sell": when_to_sell,
            "risk_note":    risk_note,
            "entry":        entry,
            "stop_loss":    stop_loss,
            "target_1":     target_1,
            "target_2":     target_2,
            "target_3":     target_3,
            "rr_1":         rr_1,
            "rr_2":         rr_2,
            "rr_3":         rr_3,
            "sl_distance":  round(sl_dist, 4),
            "pos_size":     pos_size,
            "pos_value":    pos_value,
            "pos_pct":      pos_pct,
            "risk_amount":  risk_amount,
            "break_even_wr": break_even_wr,
            "ev":           ev,
            "ev_positive":  ev > 0,
        },

        # Probability
        "probability": prob,

        # Analysis
        "market_structure": market_structure,
        "pattern":          pattern,
        "volume_trend":     volume_trend,
        "vol_ratio":        round(vol_ratio, 2),
        "liquidity_grab":   liquidity_grab,
        "order_block_bull": ob_bullish,
        "order_block_bear": ob_bearish,
        "adx":              round(adx, 2),
        "adx_trend":        "Strong" if adx > 25 else "Weak",
        "vwap":             round(vwap, 4),
        "above_vwap":       p > vwap,
        "fib_618":          round(fib_618, 4),
        "fib_382":          round(fib_382, 4),
        "fib_236":          round(fib_236, 4),
        "pivot":            round(pivot, 4),
        "r1": round(r1,4), "r2": round(r2,4), "r3": round(r3,4),
        "s1": round(s1,4), "s2": round(s2,4), "s3": round(s3,4),
        "atr":              round(atr, 4),
        "atr_pct":          round(atr_pct, 2),

        # Raw indicators
        "indicators": {
            "rsi":           round(rsi, 2),
            "macd":          round(macd, 4),
            "macd_signal":   round(macd_signal, 4),
            "macd_hist":     round(macd_hist, 4),
            "ema_9":         round(ema_9, 2),
            "ema_20":        round(ema_20, 2),
            "ema_50":        round(ema_50, 2),
            "sma_200":       round(sma_200, 2),
            "bb_upper":      round(bb_up, 2),
            "bb_lower":      round(bb_lo, 2),
            "bb_pct":        round(bb_pct, 3),
            "vwap":          round(vwap, 2),
            "adx":           round(adx, 2),
            "stoch_k":       round(stoch_k, 2),
            "stoch_d":       round(stoch_d, 2),
            "current_price": round(p, 4),
        }
    }
