from fastapi import APIRouter, HTTPException
import httpx
import xml.etree.ElementTree as ET
import re
import random

router = APIRouter()

COMPANIES = {
    # ── US Mega Cap ──
    "Apple": "AAPL", "Tesla": "TSLA", "Nvidia": "NVDA", "Microsoft": "MSFT",
    "Google": "GOOGL", "Alphabet": "GOOGL", "Amazon": "AMZN", "Meta": "META",
    "Netflix": "NFLX", "AMD": "AMD", "Intel": "INTC", "Uber": "UBER",
    "Salesforce": "CRM", "Oracle": "ORCL", "Cisco": "CSCO", "IBM": "IBM",
    "Qualcomm": "QCOM", "Broadcom": "AVGO", "Texas Instruments": "TXN",
    "Micron": "MU", "Applied Materials": "AMAT", "ASML": "ASML",
    "Palantir": "PLTR", "Snowflake": "SNOW", "CrowdStrike": "CRWD",
    "Datadog": "DDOG", "Cloudflare": "NET", "MongoDB": "MDB",
    "ServiceNow": "NOW", "Workday": "WDAY", "Zoom": "ZM",
    "Spotify": "SPOT", "Airbnb": "ABNB", "DoorDash": "DASH",
    "Lyft": "LYFT", "Snap": "SNAP", "Pinterest": "PINS", "Reddit": "RDDT",
    "Robinhood": "HOOD", "Coinbase": "COIN", "Block": "SQ", "PayPal": "PYPL",
    "Visa": "V", "Mastercard": "MA", "American Express": "AXP",
    "JPMorgan": "JPM", "Goldman Sachs": "GS", "Morgan Stanley": "MS",
    "Bank of America": "BAC", "Wells Fargo": "WFC", "Citigroup": "C",
    "BlackRock": "BLK", "Charles Schwab": "SCHW",
    # ── US Healthcare / Pharma ──
    "Johnson & Johnson": "JNJ", "Pfizer": "PFE", "Moderna": "MRNA",
    "AbbVie": "ABBV", "Eli Lilly": "LLY", "Merck": "MRK",
    "Bristol-Myers": "BMY", "Amgen": "AMGN", "Gilead": "GILD",
    "UnitedHealth": "UNH", "CVS": "CVS",
    # ── US Consumer / Retail ──
    "Walmart": "WMT", "Target": "TGT", "Costco": "COST",
    "Home Depot": "HD", "Nike": "NKE", "Starbucks": "SBUX",
    "McDonald's": "MCD", "Coca-Cola": "KO", "PepsiCo": "PEP",
    "Procter & Gamble": "PG", "Colgate": "CL",
    # ── US Energy ──
    "ExxonMobil": "XOM", "Chevron": "CVX", "ConocoPhillips": "COP",
    "Schlumberger": "SLB", "Halliburton": "HAL",
    # ── US EV / Auto ──
    "Ford": "F", "General Motors": "GM", "Rivian": "RIVN", "Lucid": "LCID",
    # ── US Aerospace / Defense ──
    "Boeing": "BA", "Lockheed Martin": "LMT", "Raytheon": "RTX",
    "Northrop Grumman": "NOC", "SpaceX": "SPCE",
    # ── US Indices ──
    "S&P 500": "SPY", "Nasdaq": "QQQ", "Dow Jones": "DIA",
    "Russell 2000": "IWM", "VIX": "VIX",
    # ── India — Full Nifty 50 ──
    "Reliance": "RELIANCE.NS", "Reliance Industries": "RELIANCE.NS",
    "TCS": "TCS.NS", "Tata Consultancy": "TCS.NS",
    "Infosys": "INFY.NS",
    "HDFC Bank": "HDFCBANK.NS", "HDFC": "HDFCBANK.NS",
    "ICICI Bank": "ICICIBANK.NS", "ICICI": "ICICIBANK.NS",
    "Kotak Mahindra": "KOTAKBANK.NS", "Kotak": "KOTAKBANK.NS",
    "Axis Bank": "AXISBANK.NS",
    "SBI": "SBIN.NS", "State Bank": "SBIN.NS",
    "Bajaj Finance": "BAJFINANCE.NS",
    "Bajaj Finserv": "BAJAJFINSV.NS",
    "Bajaj Auto": "BAJAJ-AUTO.NS",
    "Wipro": "WIPRO.NS",
    "HCL Technologies": "HCLTECH.NS", "HCL": "HCLTECH.NS",
    "Tech Mahindra": "TECHM.NS",
    "Tata Motors": "TATAMOTORS.NS",
    "Tata Steel": "TATASTEEL.NS",
    "Tata Consumer": "TATACONSUM.NS",
    "Adani Enterprises": "ADANIENT.NS", "Adani": "ADANIENT.NS",
    "Adani Ports": "ADANIPORTS.NS",
    "Adani Green": "ADANIGREEN.NS",
    "Sun Pharma": "SUNPHARMA.NS",
    "Dr Reddy": "DRREDDY.NS", "Dr. Reddy": "DRREDDY.NS",
    "Cipla": "CIPLA.NS",
    "Divi's Laboratories": "DIVISLAB.NS", "Divi's": "DIVISLAB.NS",
    "Asian Paints": "ASIANPAINT.NS",
    "Nestle India": "NESTLEIND.NS",
    "ITC": "ITC.NS",
    "Hindustan Unilever": "HINDUNILVR.NS", "HUL": "HINDUNILVR.NS",
    "Bharti Airtel": "BHARTIARTL.NS", "Airtel": "BHARTIARTL.NS",
    "ONGC": "ONGC.NS",
    "NTPC": "NTPC.NS",
    "Power Grid": "POWERGRID.NS",
    "Coal India": "COALINDIA.NS",
    "JSW Steel": "JSWSTEEL.NS",
    "Maruti Suzuki": "MARUTI.NS", "Maruti": "MARUTI.NS",
    "Hero MotoCorp": "HEROMOTOCO.NS", "Hero": "HEROMOTOCO.NS",
    "Eicher Motors": "EICHERMOT.NS",
    "Mahindra": "M&M.NS", "M&M": "M&M.NS",
    "UltraTech Cement": "ULTRACEMCO.NS", "UltraTech": "ULTRACEMCO.NS",
    "Grasim": "GRASIM.NS",
    "Shree Cement": "SHREECEM.NS",
    "IndusInd Bank": "INDUSINDBK.NS", "IndusInd": "INDUSINDBK.NS",
    "LTIMindtree": "LTIM.NS",
    "L&T": "LT.NS", "Larsen": "LT.NS", "Larsen & Toubro": "LT.NS",
    "Titan": "TITAN.NS",
    "Britannia": "BRITANNIA.NS",
    "Apollo Hospitals": "APOLLOHOSP.NS", "Apollo": "APOLLOHOSP.NS",
    "Hindalco": "HINDALCO.NS",
    "Vedanta": "VEDL.NS",
    "BPCL": "BPCL.NS",
    "IOC": "IOC.NS", "Indian Oil": "IOC.NS",
    "Nifty": "^NSEI", "Nifty 50": "^NSEI", "Sensex": "^BSESN", "Bank Nifty": "^NSEBANK",
    # ── Europe ──
    "LVMH": "MC.PA", "SAP": "SAP", "Siemens": "SIE.DE",
    "Volkswagen": "VOW3.DE", "BMW": "BMW.DE", "Mercedes": "MBG.DE",
    "Shell": "SHEL", "BP": "BP", "TotalEnergies": "TTE",
    "Nestle": "NESN.SW", "Novartis": "NVS", "Roche": "ROG.SW",
    "HSBC": "HSBC", "Barclays": "BCS", "UBS": "UBS",
    "Unilever": "UL", "AstraZeneca": "AZN", "GSK": "GSK",
    "Spotify": "SPOT", "Adyen": "ADYEN.AS",
    # ── Asia / Other ──
    "Samsung": "005930.KS", "TSMC": "TSM", "Sony": "SONY",
    "Toyota": "TM", "Honda": "HMC", "SoftBank": "9984.T",
    "Alibaba": "BABA", "Tencent": "TCEHY", "Baidu": "BIDU",
    "JD.com": "JD", "NIO": "NIO", "BYD": "BYDDY",
    # ── Crypto ──
    "Bitcoin": "BTC-USD", "Ethereum": "ETH-USD", "Solana": "SOL-USD",
    "BNB": "BNB-USD", "XRP": "XRP-USD", "Cardano": "ADA-USD",
    "Dogecoin": "DOGE-USD", "Avalanche": "AVAX-USD", "Polkadot": "DOT-USD",
    "Chainlink": "LINK-USD", "Polygon": "MATIC-USD", "Shiba Inu": "SHIB-USD",
    "Litecoin": "LTC-USD", "Uniswap": "UNI-USD", "Stellar": "XLM-USD",
    # ── Commodities ──
    "Gold": "GC=F", "Silver": "SI=F", "Crude Oil": "CL=F",
    "Brent": "BZ=F", "Natural Gas": "NG=F", "Copper": "HG=F",
    "Platinum": "PL=F", "Wheat": "ZW=F", "Corn": "ZC=F",
    # ── Forex ──
    "EUR/USD": "EURUSD=X", "GBP/USD": "GBPUSD=X", "USD/JPY": "JPY=X",
    "USD/INR": "INR=X", "AUD/USD": "AUDUSD=X", "USD/CAD": "CAD=X",
    "USD/CHF": "CHF=X", "EUR/GBP": "EURGBP=X",
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
    # US stocks
    "https://news.google.com/rss/search?q=Apple+Tesla+Nvidia+Microsoft+Amazon+Meta+Google+stock+earnings&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=AMD+Intel+Qualcomm+Broadcom+Palantir+Coinbase+PayPal+Visa+stock&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=JPMorgan+Goldman+Morgan+Stanley+BlackRock+bank+stock+earnings&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Pfizer+Moderna+Eli+Lilly+UnitedHealth+pharma+stock&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Boeing+Ford+Tesla+Rivian+ExxonMobil+Chevron+stock&hl=en-US&gl=US&ceid=US:en",
    # India stocks
    "https://news.google.com/rss/search?q=Reliance+TCS+Infosys+HDFC+SBI+Wipro+Adani+stock+NSE&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=Tata+Motors+Bajaj+ICICI+Airtel+Sun+Pharma+Nifty+Sensex&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=Maruti+HCL+Kotak+Axis+Bank+L%26T+Titan+ITC+Hindustan+Unilever+NSE&hl=en-IN&gl=IN&ceid=IN:en",
    "https://news.google.com/rss/search?q=Hero+MotoCorp+Mahindra+UltraTech+Hindalco+ONGC+NTPC+Coal+India+NSE&hl=en-IN&gl=IN&ceid=IN:en",
    # Crypto
    "https://news.google.com/rss/search?q=Bitcoin+Ethereum+Solana+crypto+BNB+XRP+Dogecoin&hl=en-US&gl=US&ceid=US:en",
    # Commodities + Forex
    "https://news.google.com/rss/search?q=Gold+Silver+crude+oil+natural+gas+commodity+market&hl=en-US&gl=US&ceid=US:en",
    # General market
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
    return {"news": unique[:40], "total": len(unique)}
