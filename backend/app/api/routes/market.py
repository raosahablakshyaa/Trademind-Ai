from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from app.services.market_service import get_quote, get_chart_data, search_symbols
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=12)

async def _fetch_quote_async(symbol: str):
    """Run blocking yfinance call in thread pool."""
    loop = asyncio.get_event_loop()
    try:
        return await loop.run_in_executor(_executor, get_quote, symbol)
    except Exception:
        return None

@router.get("/quote/{symbol}")
async def quote(symbol: str):
    try:
        result = await _fetch_quote_async(symbol)
        if result is None:
            raise HTTPException(status_code=400, detail=f"No data for {symbol}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/chart/{symbol}")
async def chart(symbol: str, interval: str = Query("1d")):
    try:
        return get_chart_data(symbol, interval)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    return search_symbols(q)

@router.get("/watchlist")
async def watchlist():
    """Fetch watchlist symbols in parallel — includes Indian + US + Crypto."""
    symbols = [
        # Indian Indices
        "^NSEI", "^BSESN", "^NSEBANK",
        # Nifty 50 top stocks
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
        "WIPRO.NS", "SBIN.NS", "BAJFINANCE.NS", "TATAMOTORS.NS", "ADANIENT.NS",
        "HCLTECH.NS", "AXISBANK.NS", "KOTAKBANK.NS", "LT.NS", "ITC.NS",
        "SUNPHARMA.NS", "MARUTI.NS", "TITAN.NS", "BHARTIARTL.NS", "ONGC.NS",
        # US Stocks
        "AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN", "META", "AMD",
        "JPM", "V", "NFLX", "UBER", "COIN", "PLTR",
        # Crypto
        "BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "DOGE-USD",
        # Forex
        "EURUSD=X", "GBPUSD=X", "USDINR=X", "USDJPY=X",
        # Commodities
        "GC=F", "SI=F", "CL=F",
        # Global Indices
        "^GSPC", "^DJI", "^IXIC", "^N225",
    ]
    results = await asyncio.gather(*[_fetch_quote_async(s) for s in symbols])
    return [r for r in results if r is not None]

@router.websocket("/ws/live/{symbol}")
async def live_price(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        while True:
            data = await _fetch_quote_async(symbol)
            try:
                if data:
                    await websocket.send_text(json.dumps(data))
            except Exception:
                break  # client disconnected
            await asyncio.sleep(15)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
