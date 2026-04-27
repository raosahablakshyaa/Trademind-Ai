"""
ProTraderDecisionEngine — Enhanced ML Signal Engine
Combines: RandomForest + GradientBoosting + Technical Indicators
          + Risk Management Formulas + Smart Money Concepts
"""
import os
import numpy as np
import pandas as pd
import joblib
import ta

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler


MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../../data/models")
ENGINE_PATH = os.path.join(MODEL_DIR, "pro_trader_engine.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "pro_trader_scaler.pkl")


class ProTraderDecisionEngine:
    """
    Enhanced ML engine trained on 25+ technical features.
    Uses ensemble of RandomForest + GradientBoosting for higher accuracy.
    """

    def __init__(self):
        # Ensemble: RF + GBM voting
        rf = RandomForestClassifier(
            n_estimators=500,
            max_depth=12,
            min_samples_split=10,
            min_samples_leaf=5,
            max_features="sqrt",
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )
        gbm = GradientBoostingClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
        )
        self.model = VotingClassifier(
            estimators=[("rf", rf), ("gbm", gbm)],
            voting="soft",
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = []
        self.accuracy = 0.0

    # ─────────────────────────────────────────
    #  INDICATOR CALCULATIONS
    # ─────────────────────────────────────────

    def _rsi(self, close: pd.Series, period: int = 14) -> pd.Series:
        return ta.momentum.RSIIndicator(close, window=period).rsi()

    def _macd(self, close: pd.Series):
        m = ta.trend.MACD(close)
        return m.macd(), m.macd_signal(), m.macd_diff()

    def _ema(self, close: pd.Series, period: int) -> pd.Series:
        return ta.trend.EMAIndicator(close, window=period).ema_indicator()

    def _sma(self, close: pd.Series, period: int) -> pd.Series:
        return ta.trend.SMAIndicator(close, window=period).sma_indicator()

    def _vwap(self, df: pd.DataFrame) -> pd.Series:
        tp = (df["high"] + df["low"] + df["close"]) / 3
        return (tp * df["volume"]).cumsum() / df["volume"].cumsum()

    def _atr(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        return ta.volatility.AverageTrueRange(df["high"], df["low"], df["close"], window=period).average_true_range()

    def _adx(self, df: pd.DataFrame, period: int = 14):
        adx = ta.trend.ADXIndicator(df["high"], df["low"], df["close"], window=period)
        return adx.adx(), adx.adx_pos(), adx.adx_neg()

    def _bollinger(self, close: pd.Series):
        bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
        return bb.bollinger_hband(), bb.bollinger_lband(), bb.bollinger_pband()

    def _stoch_rsi(self, close: pd.Series):
        try:
            s = ta.momentum.StochRSIIndicator(close)
            return s.stochrsi_k(), s.stochrsi_d()
        except Exception:
            return pd.Series([0.5] * len(close)), pd.Series([0.5] * len(close))

    # ─────────────────────────────────────────
    #  RISK MANAGEMENT FORMULAS
    # ─────────────────────────────────────────

    def risk_reward_ratio(self, entry: float, stop_loss: float, target: float) -> float:
        risk = abs(entry - stop_loss)
        reward = abs(target - entry)
        return round(reward / risk, 2) if risk > 0 else 0.0

    def position_size(self, capital: float, risk_pct: float, entry: float, stop_loss: float) -> int:
        account_risk = capital * (risk_pct / 100)
        per_share_risk = abs(entry - stop_loss)
        return int(account_risk / per_share_risk) if per_share_risk > 0 else 0

    def expected_value(self, win_rate: float, avg_profit: float, avg_loss: float) -> float:
        return round((win_rate * avg_profit) - ((1 - win_rate) * avg_loss), 2)

    def break_even_win_rate(self, rr: float) -> float:
        return round((1 / (1 + rr)) * 100, 1) if rr > 0 else 50.0

    # ─────────────────────────────────────────
    #  FEATURE ENGINEERING (25+ features)
    # ─────────────────────────────────────────

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df.columns = [c.lower() for c in df.columns]
        df.sort_values("date", inplace=True)
        df.reset_index(drop=True, inplace=True)

        close  = df["close"]
        high   = df["high"]
        low    = df["low"]
        volume = df["volume"]

        # ── Momentum ──
        df["rsi_14"]    = self._rsi(close, 14)
        df["rsi_7"]     = self._rsi(close, 7)
        df["rsi_slope"] = df["rsi_14"].diff(3)          # RSI momentum

        # ── MACD ──
        df["macd"], df["macd_signal"], df["macd_hist"] = self._macd(close)
        df["macd_hist_slope"] = df["macd_hist"].diff(2)  # histogram acceleration

        # ── Trend ──
        df["ema_9"]   = self._ema(close, 9)
        df["ema_20"]  = self._ema(close, 20)
        df["ema_50"]  = self._ema(close, 50)
        df["sma_200"] = self._sma(close, 200)

        # Price vs MAs (normalized distance)
        df["price_vs_ema20"]  = (close - df["ema_20"])  / df["ema_20"]
        df["price_vs_ema50"]  = (close - df["ema_50"])  / df["ema_50"]
        df["price_vs_sma200"] = (close - df["sma_200"]) / df["sma_200"]
        df["ema9_vs_ema20"]   = (df["ema_9"] - df["ema_20"]) / df["ema_20"]

        # ── Volatility ──
        df["atr"]     = self._atr(df, 14)
        df["atr_pct"] = df["atr"] / close
        bb_up, bb_lo, bb_pct = self._bollinger(close)
        df["bb_upper"] = bb_up
        df["bb_lower"] = bb_lo
        df["bb_pct"]   = bb_pct
        df["bb_width"] = (bb_up - bb_lo) / close       # normalized bandwidth

        # ── Volume ──
        df["vol_ratio"]  = volume / volume.rolling(20).mean()
        df["vol_trend"]  = volume.rolling(5).mean() / volume.rolling(20).mean()

        # ── VWAP ──
        df["vwap"]         = self._vwap(df)
        df["price_vs_vwap"] = (close - df["vwap"]) / df["vwap"]

        # ── ADX ──
        df["adx"], df["adx_pos"], df["adx_neg"] = self._adx(df, 14)
        df["adx_diff"] = df["adx_pos"] - df["adx_neg"]  # directional bias

        # ── Stochastic RSI ──
        df["stoch_k"], df["stoch_d"] = self._stoch_rsi(close)
        df["stoch_diff"] = df["stoch_k"] - df["stoch_d"]

        # ── Price Action ──
        df["body_pct"]   = abs(close - df["open"]) / (high - low + 1e-9)
        df["upper_wick"] = (high - close.clip(lower=df["open"])) / (high - low + 1e-9)
        df["lower_wick"] = (close.clip(upper=df["open"]) - low) / (high - low + 1e-9)
        df["range_pct"]  = (high - low) / close         # daily range normalized

        # ── Market Structure ──
        df["hh"] = (high > high.shift(5)).astype(int)
        df["hl"] = (low  > low.shift(5)).astype(int)
        df["lh"] = (high < high.shift(5)).astype(int)
        df["ll"] = (low  < low.shift(5)).astype(int)

        # ── Pivot Position ──
        df["pivot"]      = (high + low + close) / 3
        df["price_vs_pivot"] = (close - df["pivot"]) / df["pivot"]

        # ── Returns ──
        df["ret_1d"]  = close.pct_change(1)
        df["ret_5d"]  = close.pct_change(5)
        df["ret_20d"] = close.pct_change(20)

        # ── Target: 1 = price up next day, 0 = down ──
        df["target"] = (close.shift(-1) > close).astype(int)

        df.dropna(inplace=True)
        return df

    @property
    def FEATURES(self):
        return [
            "rsi_14", "rsi_7", "rsi_slope",
            "macd", "macd_signal", "macd_hist", "macd_hist_slope",
            "price_vs_ema20", "price_vs_ema50", "price_vs_sma200", "ema9_vs_ema20",
            "atr_pct", "bb_pct", "bb_width",
            "vol_ratio", "vol_trend",
            "price_vs_vwap",
            "adx", "adx_diff",
            "stoch_k", "stoch_diff",
            "body_pct", "upper_wick", "lower_wick", "range_pct",
            "hh", "hl", "lh", "ll",
            "price_vs_pivot",
            "ret_1d", "ret_5d", "ret_20d",
        ]

    # ─────────────────────────────────────────
    #  TRAIN
    # ─────────────────────────────────────────

    def train(self, csv_path: str, symbol: str = "STOCK") -> dict:
        df = pd.read_csv(csv_path)
        # Normalize date column
        for col in ["Date", "date", "Datetime", "datetime"]:
            if col in df.columns:
                df.rename(columns={col: "date"}, inplace=True)
                break
        if "date" not in df.columns:
            df["date"] = pd.RangeIndex(len(df))

        required = ["Open", "High", "Low", "Close", "Volume"]
        for col in required:
            if col not in df.columns:
                raise ValueError(f"Missing column: {col}")

        df = self.prepare_features(df)

        X = df[self.FEATURES]
        y = df["target"]

        # Time-series split (no shuffle — respects temporal order)
        split = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        # Scale
        X_train_s = self.scaler.fit_transform(X_train)
        X_test_s  = self.scaler.transform(X_test)

        # Train ensemble
        self.model.fit(X_train_s, y_train)
        self.is_trained = True
        self.feature_names = self.FEATURES

        # Evaluate
        preds = self.model.predict(X_test_s)
        self.accuracy = round(accuracy_score(y_test, preds) * 100, 2)

        print(f"\n{'='*50}")
        print(f"  ProTraderEngine — {symbol}")
        print(f"  Accuracy: {self.accuracy}%")
        print(f"  Features: {len(self.FEATURES)}")
        print(f"  Train samples: {len(X_train)} | Test: {len(X_test)}")
        print(f"{'='*50}")
        print(classification_report(y_test, preds, target_names=["SELL/HOLD", "BUY"]))

        # Save
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.model,  ENGINE_PATH)
        joblib.dump(self.scaler, SCALER_PATH)
        print(f"Model saved: {ENGINE_PATH}")

        return {
            "accuracy": self.accuracy,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "features": len(self.FEATURES),
        }

    # ─────────────────────────────────────────
    #  LOAD SAVED MODEL
    # ─────────────────────────────────────────

    def load(self) -> bool:
        if os.path.exists(ENGINE_PATH) and os.path.exists(SCALER_PATH):
            self.model   = joblib.load(ENGINE_PATH)
            self.scaler  = joblib.load(SCALER_PATH)
            self.is_trained = True
            return True
        return False

    # ─────────────────────────────────────────
    #  LIVE PREDICTION FROM DATAFRAME
    # ─────────────────────────────────────────

    def predict_from_df(self, df: pd.DataFrame, capital: float = 1_000_000) -> dict:
        """
        Takes a yfinance DataFrame, runs full analysis, returns trade decision.
        """
        if not self.is_trained:
            if not self.load():
                return {"error": "Model not trained. Run train() first."}

        prepared = self.prepare_features(df)
        if prepared.empty:
            return {"error": "Not enough data to generate features."}

        latest = prepared[self.FEATURES].iloc[-1:]
        latest_s = self.scaler.transform(latest)

        prediction  = self.model.predict(latest_s)[0]
        proba       = self.model.predict_proba(latest_s)[0]
        confidence  = round(float(max(proba)) * 100, 2)
        signal      = "BUY" if prediction == 1 else "SELL"

        # Current price data
        p    = float(prepared["close"].iloc[-1])
        atr  = float(prepared["atr"].iloc[-1])
        vwap = float(prepared["vwap"].iloc[-1])
        rsi  = float(prepared["rsi_14"].iloc[-1])
        adx  = float(prepared["adx"].iloc[-1])

        # ATR-based levels
        if signal == "BUY":
            entry     = round(p, 4)
            stop_loss = round(p - atr * 1.5, 4)
            target_1  = round(p + atr * 2.0, 4)
            target_2  = round(p + atr * 3.5, 4)
            target_3  = round(p + atr * 5.0, 4)
        else:
            entry     = round(p, 4)
            stop_loss = round(p + atr * 1.5, 4)
            target_1  = round(p - atr * 2.0, 4)
            target_2  = round(p - atr * 3.5, 4)
            target_3  = round(p - atr * 5.0, 4)

        sl_dist = abs(entry - stop_loss)
        rr_1    = self.risk_reward_ratio(entry, stop_loss, target_1)
        rr_2    = self.risk_reward_ratio(entry, stop_loss, target_2)
        rr_3    = self.risk_reward_ratio(entry, stop_loss, target_3)
        qty     = self.position_size(capital, 1.0, entry, stop_loss)
        ev      = self.expected_value(0.55, abs(target_1 - entry), sl_dist)
        be_wr   = self.break_even_win_rate(rr_1)

        # Risk score
        risk_score = (
            "LOW"    if confidence >= 70 and rr_1 >= 2 else
            "MEDIUM" if confidence >= 55 else
            "HIGH"
        )

        # Action label
        if signal == "BUY":
            action = "✅ BUY NOW" if confidence >= 60 else "⚠️ WEAK BUY — Wait for confirmation"
        else:
            action = "🚫 AVOID BUYING" if confidence >= 60 else "⚠️ CAUTION — Bearish lean"

        return {
            "signal":     signal,
            "confidence": confidence,
            "risk_score": risk_score,
            "action":     action,
            "ml_accuracy": self.accuracy,

            "trade_plan": {
                "entry":     entry,
                "stop_loss": stop_loss,
                "target_1":  target_1,
                "target_2":  target_2,
                "target_3":  target_3,
                "rr_1": rr_1, "rr_2": rr_2, "rr_3": rr_3,
                "pos_size":       qty,
                "risk_amount":    round(capital * 0.01, 2),
                "ev":             ev,
                "ev_positive":    ev > 0,
                "break_even_wr":  be_wr,
            },

            "indicators": {
                "rsi":    round(rsi, 2),
                "adx":    round(adx, 2),
                "vwap":   round(vwap, 4),
                "atr":    round(atr, 4),
                "above_vwap": p > vwap,
            },
        }


# ─────────────────────────────────────────
#  Singleton — reuse across requests
# ─────────────────────────────────────────
_engine_instance: ProTraderDecisionEngine = None

def get_engine() -> ProTraderDecisionEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = ProTraderDecisionEngine()
        _engine_instance.load()   # load saved model if exists
    return _engine_instance
