from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from app.db.database import get_db
from app.core.security import get_current_user

router = APIRouter()

STARTING_BALANCE = 1000000.0  # ₹10,00,000

# ── helpers ──────────────────────────────────────────────────────────────────

async def _get_account(db, user_id: str) -> dict:
    acc = await db.demo_accounts.find_one({"user_id": user_id})
    if not acc:
        acc = {
            "user_id": user_id,
            "balance": STARTING_BALANCE,
            "portfolio": {},   # { "AAPL": {"qty": 10, "avg_price": 150.0, "invested": 1500.0} }
            "trades": [],
            "realized_pnl": 0.0,
            "created_at": datetime.utcnow().isoformat(),
        }
        await db.demo_accounts.insert_one(acc)
    return acc

def _serialize(acc: dict) -> dict:
    acc = dict(acc)
    acc.pop("_id", None)
    return acc

# ── routes ────────────────────────────────────────────────────────────────────

@router.get("/account")
async def get_account(user=Depends(get_current_user)):
    db = get_db()
    acc = await _get_account(db, str(user["_id"]))
    return _serialize(acc)


class OrderRequest(BaseModel):
    symbol: str
    price: float   # live price sent from frontend
    qty: int


@router.post("/buy")
async def demo_buy(body: OrderRequest, user=Depends(get_current_user)):
    if body.price <= 0 or body.qty <= 0:
        raise HTTPException(400, "Invalid price or quantity")

    db = get_db()
    user_id = str(user["_id"])
    acc = await _get_account(db, user_id)

    cost = round(body.price * body.qty, 4)
    if cost > acc["balance"]:
        raise HTTPException(400, f"Insufficient balance. Need ₹{cost:.2f}, have ₹{acc['balance']:.2f}")

    portfolio = dict(acc["portfolio"])
    sym = body.symbol.upper()

    if sym in portfolio:
        existing = portfolio[sym]
        old_qty       = existing["qty"]
        old_avg       = existing["avg_price"]
        new_qty       = old_qty + body.qty
        # Weighted average: (old_avg * old_qty + new_price * new_qty) / total_qty
        new_avg       = (old_avg * old_qty + body.price * body.qty) / new_qty
        new_invested  = new_avg * new_qty
        portfolio[sym] = {
            "qty":       new_qty,
            "avg_price": round(new_avg, 4),
            "invested":  round(new_invested, 4),
        }
    else:
        portfolio[sym] = {
            "qty":       body.qty,
            "avg_price": round(body.price, 4),
            "invested":  round(cost, 4),
        }

    trade = {
        "id":     f"{user_id}_{datetime.utcnow().timestamp()}",
        "type":   "BUY",
        "symbol": sym,
        "price":  round(body.price, 4),
        "qty":    body.qty,
        "total":  round(cost, 2),
        "pnl":    None,
        "time":   datetime.utcnow().isoformat(),
    }

    new_balance = round(acc["balance"] - cost, 4)
    trades = [trade] + acc.get("trades", [])

    await db.demo_accounts.update_one(
        {"user_id": user_id},
        {"$set": {"balance": new_balance, "portfolio": portfolio, "trades": trades[:500]}}
    )
    return {"ok": True, "balance": new_balance, "portfolio": portfolio, "trade": trade}


@router.post("/sell")
async def demo_sell(body: OrderRequest, user=Depends(get_current_user)):
    if body.price <= 0 or body.qty <= 0:
        raise HTTPException(400, "Invalid price or quantity")

    db = get_db()
    user_id = str(user["_id"])
    acc = await _get_account(db, user_id)

    sym = body.symbol.upper()
    portfolio = dict(acc["portfolio"])

    if sym not in portfolio:
        raise HTTPException(400, f"No position in {sym}")

    holding = portfolio[sym]
    if holding["qty"] < body.qty:
        raise HTTPException(400, f"Only {holding['qty']} shares available, tried to sell {body.qty}")

    avg_cost = holding["avg_price"]
    proceeds = round(body.price * body.qty, 4)
    # P&L = (sell_price - avg_cost) * qty_sold
    pnl      = round((body.price - avg_cost) * body.qty, 4)

    new_qty = holding["qty"] - body.qty
    if new_qty == 0:
        del portfolio[sym]
    else:
        portfolio[sym] = {
            "qty":       new_qty,
            "avg_price": round(avg_cost, 4),
            "invested":  round(avg_cost * new_qty, 4),
        }

    trade = {
        "id":     f"{user_id}_{datetime.utcnow().timestamp()}",
        "type":   "SELL",
        "symbol": sym,
        "price":  round(body.price, 4),
        "qty":    body.qty,
        "total":  round(proceeds, 2),
        "pnl":    round(pnl, 2),
        "time":   datetime.utcnow().isoformat(),
    }

    new_balance      = round(acc["balance"] + proceeds, 4)
    new_realized_pnl = round(acc.get("realized_pnl", 0) + pnl, 4)
    trades = [trade] + acc.get("trades", [])

    await db.demo_accounts.update_one(
        {"user_id": user_id},
        {"$set": {
            "balance":      new_balance,
            "portfolio":    portfolio,
            "trades":       trades[:500],
            "realized_pnl": new_realized_pnl,
        }}
    )
    return {"ok": True, "balance": new_balance, "portfolio": portfolio, "trade": trade, "pnl": pnl, "realized_pnl": new_realized_pnl}


@router.post("/reset")
async def demo_reset(user=Depends(get_current_user)):
    db = get_db()
    user_id = str(user["_id"])
    await db.demo_accounts.update_one(
        {"user_id": user_id},
        {"$set": {
            "balance": STARTING_BALANCE,  # ₹10,00,000
            "portfolio": {},
            "trades": [],
            "realized_pnl": 0.0,
        }},
        upsert=True,
    )
    return {"ok": True}


@router.post("/recalculate")
async def recalculate(user=Depends(get_current_user)):
    """Rebuild portfolio avg_price from trade history (raw prices only)."""
    db = get_db()
    user_id = str(user["_id"])
    acc = await _get_account(db, user_id)

    trades = sorted(acc.get("trades", []), key=lambda t: t.get("time", ""))
    portfolio = {}
    realized_pnl = 0.0

    for t in trades:
        sym   = t["symbol"]
        qty   = t["qty"]
        price = t["price"]

        if t["type"] == "BUY":
            if sym in portfolio:
                old = portfolio[sym]
                new_qty = old["qty"] + qty
                new_avg = (old["avg_price"] * old["qty"] + price * qty) / new_qty
                portfolio[sym] = {"qty": new_qty, "avg_price": round(new_avg, 4), "invested": round(new_avg * new_qty, 4)}
            else:
                portfolio[sym] = {"qty": qty, "avg_price": round(price, 4), "invested": round(price * qty, 4)}
        elif t["type"] == "SELL" and sym in portfolio:
            avg     = portfolio[sym]["avg_price"]
            pnl     = round((price - avg) * qty, 4)
            realized_pnl += pnl
            new_qty = portfolio[sym]["qty"] - qty
            if new_qty <= 0:
                del portfolio[sym]
            else:
                portfolio[sym] = {"qty": new_qty, "avg_price": avg, "invested": round(avg * new_qty, 4)}

    # Recalculate balance from starting balance + all trade cash flows
    balance = STARTING_BALANCE
    for t in trades:
        cost = t["price"] * t["qty"]
        if t["type"] == "BUY":
            balance -= cost
        elif t["type"] == "SELL":
            balance += cost

    await db.demo_accounts.update_one(
        {"user_id": user_id},
        {"$set": {"portfolio": portfolio, "balance": round(balance, 4), "realized_pnl": round(realized_pnl, 4)}}
    )
    acc = await _get_account(db, user_id)
    return _serialize(acc)
