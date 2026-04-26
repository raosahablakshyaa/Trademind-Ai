from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
from app.services.signal_service import generate_signals

router = APIRouter()

@router.post("/generate")
async def signals(
    symbol: str = Form(...),
    dl_direction: str = Form("UP"),
    dl_confidence: float = Form(60.0),
):
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
            
        return generate_signals(df, dl_direction, dl_confidence)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
