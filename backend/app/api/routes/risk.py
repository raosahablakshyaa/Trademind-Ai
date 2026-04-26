from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.risk_service import analyze_risk

router = APIRouter()

class RiskRequest(BaseModel):
    entry_price: float
    stop_loss: float
    target_price: float
    capital: float
    risk_percent: float = 1.0
    volatility: float = None

@router.post("/analyze")
async def risk(body: RiskRequest):
    try:
        return analyze_risk(body.entry_price, body.stop_loss, body.target_price,
                            body.capital, body.risk_percent, body.volatility)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
