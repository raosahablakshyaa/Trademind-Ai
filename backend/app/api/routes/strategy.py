from fastapi import APIRouter, Depends
from app.db.database import get_db
from app.core.security import get_current_user
from app.services.strategy_service import analyze_strategies

router = APIRouter()

@router.get("/analyze")
async def strategy(user=Depends(get_current_user)):
    db = get_db()
    trades = await db.journal.find({"user_id": str(user["_id"])}).to_list(500)
    return analyze_strategies(trades)
