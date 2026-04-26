from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
from app.services.prediction_service import predict_movement

router = APIRouter()

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    symbol: str = Form(...),
    model_type: str = Form("lstm"),
):
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8")), parse_dates=["Date"])
        df.rename(columns={"Date": "date"}, inplace=True)
        result = predict_movement(df, symbol.upper(), model_type)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
