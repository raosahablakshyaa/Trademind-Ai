from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from app.db.database import get_db
from app.core.security import get_current_user

router = APIRouter()

class TradeEntry(BaseModel):
    symbol: str
    strategy: str
    entry_price: float
    exit_price: float
    quantity: int
    entry_date: str
    exit_date: str
    pnl: float
    emotional_state: str = "neutral"
    reason: str = ""
    notes: str = ""

@router.post("/")
async def add_trade(body: TradeEntry, user=Depends(get_current_user)):
    db = get_db()
    doc = body.dict()
    doc["user_id"] = str(user["_id"])
    doc["created_at"] = datetime.utcnow().isoformat()
    result = await db.journal.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Trade logged"}

@router.get("/")
async def get_trades(user=Depends(get_current_user)):
    db = get_db()
    trades = await db.journal.find({"user_id": str(user["_id"])}).to_list(500)
    for t in trades:
        t["_id"] = str(t["_id"])
    return trades

@router.delete("/{trade_id}")
async def delete_trade(trade_id: str, user=Depends(get_current_user)):
    db = get_db()
    result = await db.journal.delete_one({"_id": ObjectId(trade_id), "user_id": str(user["_id"])})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trade not found")
    return {"message": "Deleted"}
