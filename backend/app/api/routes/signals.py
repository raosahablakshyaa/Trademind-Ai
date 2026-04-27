from fastapi import APIRouter, Form, HTTPException
import pandas as pd
from app.services.signal_service import generate_signals
from app.ml.models.pro_trader_engine import get_engine

router = APIRouter()


@router.post("/generate")
async def signals(
    symbol: str = Form(...),
    dl_direction: str = Form("UP"),
    dl_confidence: float = Form(60.0),
):
    """
    Generate trading signal using:
    1. Rule-based technical analysis (always runs)
    2. ProTraderEngine ML model (if trained, adds confidence boost)
    """
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="1y", interval="1d")

        if df.empty:
            raise ValueError(f"No data found for {symbol}")

        df.reset_index(inplace=True)
        if "Date" in df.columns:
            df.rename(columns={"Date": "date"}, inplace=True)
        elif "Datetime" in df.columns:
            df.rename(columns={"Datetime": "date"}, inplace=True)

        # ── 1. Rule-based signal (always available) ──
        rule_result = generate_signals(df, dl_direction, dl_confidence)

        # ── 2. ML Engine prediction (if model is trained) ──
        engine = get_engine()
        ml_result = None

        if engine.is_trained:
            try:
                ml_result = engine.predict_from_df(df)
            except Exception as e:
                ml_result = None  # graceful fallback

        # ── 3. Combine: ML overrides if high confidence ──
        if ml_result and not ml_result.get("error"):
            ml_signal     = ml_result["signal"]
            ml_confidence = ml_result["confidence"]
            ml_accuracy   = ml_result.get("ml_accuracy", 0)

            # Blend: if ML and rule-based agree → boost confidence
            if ml_signal == rule_result["signal"]:
                blended_conf = round(
                    rule_result["confidence"] * 0.5 + ml_confidence * 0.5, 2
                )
                rule_result["confidence"] = blended_conf
                rule_result["ml_boost"] = True
            else:
                # Disagreement: use whichever has higher confidence
                if ml_confidence > rule_result["confidence"] and ml_accuracy > 55:
                    rule_result["signal"]     = ml_signal
                    rule_result["confidence"] = round(ml_confidence * 0.8, 2)
                rule_result["ml_boost"] = False

            # Always attach ML trade plan if available
            if ml_result.get("trade_plan"):
                rule_result["trade_plan"] = ml_result["trade_plan"]
                rule_result["trade_plan"]["action"] = ml_result["action"]
                rule_result["trade_plan"]["when_to_buy"] = (
                    f"Enter near ₹{ml_result['trade_plan']['entry']:,.2f} — "
                    f"ML model {ml_accuracy}% accurate"
                )
                rule_result["trade_plan"]["when_to_sell"] = (
                    f"Book profit at ₹{ml_result['trade_plan']['target_1']:,.2f} (T1), "
                    f"₹{ml_result['trade_plan']['target_2']:,.2f} (T2)"
                )
                rule_result["trade_plan"]["risk_note"] = (
                    f"Exit if price closes below ₹{ml_result['trade_plan']['stop_loss']:,.2f}"
                )

            rule_result["ml_signal"]     = ml_signal
            rule_result["ml_confidence"] = ml_confidence
            rule_result["ml_accuracy"]   = ml_accuracy
            rule_result["ml_risk_score"] = ml_result.get("risk_score", "MEDIUM")
        else:
            rule_result["ml_boost"]    = False
            rule_result["ml_signal"]   = None
            rule_result["ml_accuracy"] = 0

        return rule_result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/train")
async def train_engine(
    symbols: str = Form("RELIANCE.NS,TCS.NS,INFY.NS,AAPL,NVDA,BTC-USD"),
    period: str = Form("3y"),
):
    """
    Train the ProTraderEngine on given symbols.
    symbols: comma-separated yfinance symbols
    period: 1y, 2y, 3y, 5y
    """
    import yfinance as yf
    import tempfile, os

    sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
    all_dfs  = []

    for sym in sym_list:
        try:
            t  = yf.Ticker(sym)
            df = t.history(period=period, interval="1d")
            if df.empty or len(df) < 200:
                continue
            df.reset_index(inplace=True)
            df.rename(columns={"Date": "date"}, inplace=True)
            all_dfs.append(df)
        except Exception:
            continue

    if not all_dfs:
        raise HTTPException(400, "No data downloaded for given symbols")

    combined = pd.concat(all_dfs, ignore_index=True)

    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="w") as f:
        combined.to_csv(f, index=False)
        tmp_path = f.name

    try:
        engine = ProTraderDecisionEngine()
        result = engine.train(tmp_path, f"MULTI_{len(all_dfs)}")
        # Update singleton
        from app.ml.models.pro_trader_engine import _engine_instance
        import app.ml.models.pro_trader_engine as eng_module
        eng_module._engine_instance = engine
        return {"ok": True, **result, "symbols_trained": len(all_dfs)}
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        os.unlink(tmp_path)


# Import for train route
from app.ml.models.pro_trader_engine import ProTraderDecisionEngine
