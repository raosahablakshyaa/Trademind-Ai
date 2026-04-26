from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
from app.services.pattern_service import detect_patterns

router = APIRouter()

@router.post("/detect")
async def detect(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        return detect_patterns(df)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
