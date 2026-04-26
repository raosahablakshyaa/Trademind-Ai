from fastapi import APIRouter, HTTPException
import httpx
import xml.etree.ElementTree as ET
import re
import random

router = APIRouter()

COMPANIES = {
    "Apple": "AAPL", "Tesla": "TSLA", "Nvidia": "NVDA",
    "Microsoft": "MSFT", "Google": "GOOGL", "Alphabet": "GOOGL",
    "Amazon": "AMZN", "Meta": "META", "Netflix": "NFLX",
    "AMD": "AMD", "Intel": "INTC", "Uber": "UBER",
    "Reliance": "RELIANCE.NS", "TCS": "TCS.NS", "Infosys": "INFY.NS",
    "HDFC": "HDFCBANK.NS", "SBI": "SBIN.NS", "Wipro": "WIPRO.NS",
    "Bitcoin": "BTC-USD", "Ethereum": "ETH-USD", "Solana": "SOL-USD",
}

POSITIVE = ["surge", "record", "jump", "soar", "profit", "beat", "upgrade",
            "higher", "growth", "buy", "gain", "rally", "outperform",
            "dividend", "bullish", "boost", "strong", "rebound", "high", "rise"]
NEGATIVE = ["plunge", "drop", "miss", "downgrade", "fall", "lower", "loss",
            "sue", "fine", "sell", "decline", "crash", "underperform",
            "bearish", "lawsuit", "slump", "down", "weak", "selloff", "cut"]

SHORT_TERM = ["earnings", "report", "profit", "revenue", "loss", "record",
              "jump", "crash", "plunge", "surge", "drop", "dividend", "miss", "beat"]
MID_TERM   = ["upgrade", "downgrade", "buy", "sell", "target", "forecast", "rally", "rebound"]
LONG_TERM  = ["deal", "partnership", "launch", "acquire", "merger", "lawsuit",
              "invest", "ai", "chip", "future", "growth", "demand"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
    "Accept-Language": "en-US,en;q=0.9",
}

RSS_FEEDS = [
    "https://news.google.com/rss/search?q=stock+market+earnings+shares+AAPL+TSLA+NVDA+MSFT&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Reliance+TCS+Infosys+HDFC+Bitcoin+Ethereum+stock&hl=en-US&gl=US&ceid=US:en",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
]

def score_sentiment(text: str):
    t = text.lower()
    pos = sum(1 for w in POSITIVE if re.search(r'\b' + w + r'\b', t))
    neg = sum(1 for w in NEGATIVE if re.search(r'\b' + w + r'\b', t))
    if pos > neg:   return "BULLISH"
    if neg > pos:   return "BEARISH"
    return "NEUTRAL"

def get_timeframe(text: str):
    t = text.lower()
    if any(w in t for w in LONG_TERM):  return "1–3 Months"
    if any(w in t for w in MID_TERM):   return "1–2 Weeks"
    if any(w in t for w in SHORT_TERM): return "1–3 Days"
    return "3–5 Days"

def get_analysis(text: str, sentiment: str):
    t = text.lower()
    if any(w in t for w in ["record", "beat", "crash", "profit", "loss", "earnings"]):
        prob, strength = random.randint(82, 95), "High Conviction"
    elif any(w in t for w in ["upgrade", "downgrade", "deal", "partnership", "acquire"]):
        prob, strength = random.randint(70, 81), "Moderate Conviction"
    else:
        prob, strength = random.randint(55, 69), "Speculative"

    if sentiment == "BULLISH":
        if any(w in t for w in ["earnings", "profit", "revenue", "beat"]):
            thesis = "Strong financial results drive institutional buying and valuation upgrades."
        elif any(w in t for w in ["upgrade", "target"]):
            thesis = "Analyst upgrades attract momentum traders and increase price target consensus."
        elif any(w in t for w in ["deal", "ai", "launch", "acquire"]):
            thesis = "Strategic expansion unlocks new revenue streams and long-term fundamental value."
        else:
            thesis = "Positive catalysts are generating buying momentum and breaking technical resistance."
    else:
        if any(w in t for w in ["loss", "miss", "earnings"]):
            thesis = "Financial underperformance triggers algorithmic sell-offs and analyst downgrades."
        elif any(w in t for w in ["downgrade", "cut"]):
            thesis = "Institutional downgrades cause portfolio rebalancing and increased selling pressure."
        elif any(w in t for w in ["lawsuit", "sue", "fine"]):
            thesis = "Legal risks create uncertainty, suppressing valuation multiples."
        else:
            thesis = "Negative headlines are breaking key support levels and triggering stop-losses."

    return {"probability": prob, "strength": strength, "thesis": thesis, "timeframe": get_timeframe(t)}

def parse_feed(xml_text: str):
    results = []
    try:
        root = ET.fromstring(xml_text)
        items = root.findall(".//item")
        for item in items[:80]:
            try:
                title_el = item.find("title")
                link_el  = item.find("link")
                date_el  = item.find("pubDate")
                if title_el is None: continue
                raw_title = title_el.text or ""
                title = raw_title.rsplit(" - ", 1)[0].strip()
                link  = link_el.text if link_el is not None else "#"
                date  = date_el.text if date_el is not None else ""

                company, symbol = None, None
                for c, s in COMPANIES.items():
                    if re.search(r'\b' + re.escape(c) + r'\b', title, re.IGNORECASE):
                        company, symbol = c, s
                        break
                if not company:
                    continue

                sentiment = score_sentiment(title)
                if sentiment == "NEUTRAL":
                    continue

                analysis = get_analysis(title, sentiment)
                results.append({
                    "title": title, "link": link, "company": company,
                    "symbol": symbol, "sentiment": sentiment,
                    "probability": analysis["probability"],
                    "strength": analysis["strength"],
                    "thesis": analysis["thesis"],
                    "timeframe": analysis["timeframe"],
                    "published": date,
                })
            except Exception:
                continue
    except ET.ParseError:
        pass
    return results

@router.get("/analyze")
async def analyze_news():
    all_news = []
    errors = []

    async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
        for url in RSS_FEEDS:
            try:
                resp = await client.get(url, headers=HEADERS)
                if resp.status_code == 200:
                    parsed = parse_feed(resp.text)
                    all_news.extend(parsed)
                    if len(all_news) >= 20:
                        break
            except Exception as e:
                errors.append(str(e))
                continue

    if not all_news:
        raise HTTPException(
            status_code=503,
            detail=f"Could not fetch news from any source. Errors: {'; '.join(errors[:2])}"
        )

    # Deduplicate by title
    seen, unique = set(), []
    for n in all_news:
        if n["title"] not in seen:
            seen.add(n["title"])
            unique.append(n)

    unique.sort(key=lambda x: x["probability"], reverse=True)
    return {"news": unique[:20], "total": len(unique)}
