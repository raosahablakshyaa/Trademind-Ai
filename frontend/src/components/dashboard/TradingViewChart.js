import { useEffect, useRef } from "react";
import useThemeStore from "../../store/themeStore";

const toTVSymbol = (sym) => {
  const map = {
    // ── Crypto ──
    "BTC-USD":      "BINANCE:BTCUSDT",
    "ETH-USD":      "BINANCE:ETHUSDT",
    "SOL-USD":      "BINANCE:SOLUSDT",
    "BNB-USD":      "BINANCE:BNBUSDT",
    "XRP-USD":      "BINANCE:XRPUSDT",
    "ADA-USD":      "BINANCE:ADAUSDT",
    "DOGE-USD":     "BINANCE:DOGEUSDT",
    "AVAX-USD":     "BINANCE:AVAXUSDT",
    "DOT-USD":      "BINANCE:DOTUSDT",
    "LINK-USD":     "BINANCE:LINKUSDT",
    "LTC-USD":      "BINANCE:LTCUSDT",
    "SHIB-USD":     "BINANCE:SHIBUSDT",
    "XLM-USD":      "BINANCE:XLMUSDT",
    "ATOM-USD":     "BINANCE:ATOMUSDT",
    "NEAR-USD":     "BINANCE:NEARUSDT",
    "ARB-USD":      "BINANCE:ARBUSDT",
    "OP-USD":       "BINANCE:OPUSDT",
    "APT-USD":      "BINANCE:APTUSDT",
    "APT21794-USD": "BINANCE:APTUSDT",   // yfinance alt symbol → same TV symbol
    "UNI-USD":      "BINANCE:UNIUSDT",
    "MATIC-USD":    "BINANCE:MATICUSDT",
    // ── Forex ──
    "EURUSD=X": "OANDA:EURUSD",
    "GBPUSD=X": "OANDA:GBPUSD",
    "USDJPY=X": "OANDA:USDJPY",
    "USDINR=X": "OANDA:USDINR",
    "AUDUSD=X": "OANDA:AUDUSD",
    "USDCAD=X": "OANDA:USDCAD",
    "USDCHF=X": "OANDA:USDCHF",
    "EURGBP=X": "OANDA:EURGBP",
    "EURJPY=X": "OANDA:EURJPY",
    "GBPJPY=X": "OANDA:GBPJPY",
    "NZDUSD=X": "OANDA:NZDUSD",
    "USDSGD=X": "OANDA:USDSGD",
    "USDHKD=X": "OANDA:USDHKD",
    "USDCNY=X": "OANDA:USDCNH",
    // ── Global Indices ──
    "^GSPC":    "CAPITALCOM:US500",
    "^DJI":     "CAPITALCOM:US30",
    "^IXIC":    "CAPITALCOM:USTEC",
    "^RUT":     "TVC:RUT",
    "^VIX":     "TVC:VIX",
    "^N225":    "TVC:NI225",
    "^HSI":     "TVC:HSI",
    "^FTSE":    "TVC:UKX",
    "^GDAXI":   "TVC:DEU40",
    "^FCHI":    "TVC:CAC40",
    "^STOXX50E":"TVC:SX5E",
    "^AXJO":    "TVC:ASX200",
    "^KS11":    "TVC:KOSPI",
    "^TWII":    "TVC:TWII",
    // ── India Indices ──
    "^NSEI":    "NSE:NIFTY",
    "^BSESN":   "BSE:SENSEX",
    "^NSEBANK": "NSE:BANKNIFTY",
    // ── Commodities ──
    "GC=F": "TVC:GOLD",
    "SI=F": "TVC:SILVER",
    "CL=F": "TVC:USOIL",
    "BZ=F": "TVC:UKOIL",
    "NG=F": "TVC:NATURALGAS",
    "HG=F": "COMEX:HG1!",
    "PL=F": "TVC:PLATINUM",
    "PA=F": "TVC:PALLADIUM",
    "ZW=F": "CBOT:ZW1!",
    "ZC=F": "CBOT:ZC1!",
    "ZS=F": "CBOT:ZS1!",
    "KC=F": "ICEUS:KC1!",
    "CT=F": "ICEUS:CT1!",
    "SB=F": "ICEUS:SB1!",
    // ── NSE Stocks ──
    "RELIANCE.NS":   "NSE:RELIANCE",
    "TCS.NS":        "NSE:TCS",
    "INFY.NS":       "NSE:INFY",
    "HDFCBANK.NS":   "NSE:HDFCBANK",
    "ICICIBANK.NS":  "NSE:ICICIBANK",
    "KOTAKBANK.NS":  "NSE:KOTAKBANK",
    "AXISBANK.NS":   "NSE:AXISBANK",
    "SBIN.NS":       "NSE:SBIN",
    "INDUSINDBK.NS": "NSE:INDUSINDBK",
    "BAJFINANCE.NS": "NSE:BAJFINANCE",
    "BAJAJFINSV.NS": "NSE:BAJAJFINSV",
    "BAJAJ-AUTO.NS": "NSE:BAJAJ-AUTO",
    "WIPRO.NS":      "NSE:WIPRO",
    "HCLTECH.NS":    "NSE:HCLTECH",
    "TECHM.NS":      "NSE:TECHM",
    "LTIM.NS":       "NSE:LTIM",
    "LT.NS":         "NSE:LT",
    "TATAMOTORS.NS": "NSE:TATAMOTORS",
    "TATASTEEL.NS":  "NSE:TATASTEEL",
    "TATACONSUM.NS": "NSE:TATACONSUM",
    "ADANIENT.NS":   "NSE:ADANIENT",
    "ADANIPORTS.NS": "NSE:ADANIPORTS",
    "ADANIGREEN.NS": "NSE:ADANIGREEN",
    "SUNPHARMA.NS":  "NSE:SUNPHARMA",
    "DRREDDY.NS":    "NSE:DRREDDY",
    "CIPLA.NS":      "NSE:CIPLA",
    "DIVISLAB.NS":   "NSE:DIVISLAB",
    "APOLLOHOSP.NS": "NSE:APOLLOHOSP",
    "ASIANPAINT.NS": "NSE:ASIANPAINT",
    "NESTLEIND.NS":  "NSE:NESTLEIND",
    "ITC.NS":        "NSE:ITC",
    "HINDUNILVR.NS": "NSE:HINDUNILVR",
    "BRITANNIA.NS":  "NSE:BRITANNIA",
    "TITAN.NS":      "NSE:TITAN",
    "BHARTIARTL.NS": "NSE:BHARTIARTL",
    "ONGC.NS":       "NSE:ONGC",
    "NTPC.NS":       "NSE:NTPC",
    "POWERGRID.NS":  "NSE:POWERGRID",
    "COALINDIA.NS":  "NSE:COALINDIA",
    "BPCL.NS":       "NSE:BPCL",
    "IOC.NS":        "NSE:IOC",
    "MARUTI.NS":     "NSE:MARUTI",
    "HEROMOTOCO.NS": "NSE:HEROMOTOCO",
    "EICHERMOT.NS":  "NSE:EICHERMOT",
    "M&M.NS":        "NSE:M_M",
    "ULTRACEMCO.NS": "NSE:ULTRACEMCO",
    "GRASIM.NS":     "NSE:GRASIM",
    "SHREECEM.NS":   "NSE:SHREECEM",
    "HINDALCO.NS":   "NSE:HINDALCO",
    "JSWSTEEL.NS":   "NSE:JSWSTEEL",
    "VEDL.NS":       "NSE:VEDL",
    // ── US Stocks (explicit — avoids wrong exchange prefix) ──
    "AAPL":"NASDAQ:AAPL",   "NVDA":"NASDAQ:NVDA",   "TSLA":"NASDAQ:TSLA",
    "MSFT":"NASDAQ:MSFT",   "GOOGL":"NASDAQ:GOOGL", "AMZN":"NASDAQ:AMZN",
    "META":"NASDAQ:META",   "AMD":"NASDAQ:AMD",     "INTC":"NASDAQ:INTC",
    "QCOM":"NASDAQ:QCOM",   "AVGO":"NASDAQ:AVGO",   "ORCL":"NASDAQ:ORCL",
    "CRM":"NYSE:CRM",       "CSCO":"NASDAQ:CSCO",   "IBM":"NYSE:IBM",
    "TXN":"NASDAQ:TXN",     "MU":"NASDAQ:MU",       "AMAT":"NASDAQ:AMAT",
    "PLTR":"NYSE:PLTR",     "SNOW":"NYSE:SNOW",     "CRWD":"NASDAQ:CRWD",
    "NET":"NYSE:NET",       "DDOG":"NASDAQ:DDOG",   "MDB":"NASDAQ:MDB",
    "NOW":"NYSE:NOW",       "WDAY":"NASDAQ:WDAY",   "SPOT":"NYSE:SPOT",
    "ABNB":"NASDAQ:ABNB",   "UBER":"NYSE:UBER",     "LYFT":"NASDAQ:LYFT",
    "SNAP":"NYSE:SNAP",     "PINS":"NYSE:PINS",     "RDDT":"NYSE:RDDT",
    "HOOD":"NASDAQ:HOOD",   "COIN":"NASDAQ:COIN",   "SQ":"NYSE:SQ",
    "PYPL":"NASDAQ:PYPL",   "V":"NYSE:V",           "MA":"NYSE:MA",
    "AXP":"NYSE:AXP",       "JPM":"NYSE:JPM",       "GS":"NYSE:GS",
    "MS":"NYSE:MS",         "BAC":"NYSE:BAC",       "WFC":"NYSE:WFC",
    "C":"NYSE:C",           "BLK":"NYSE:BLK",       "SCHW":"NYSE:SCHW",
    "NFLX":"NASDAQ:NFLX",   "DIS":"NYSE:DIS",       "WMT":"NYSE:WMT",
    "TGT":"NYSE:TGT",       "COST":"NASDAQ:COST",   "HD":"NYSE:HD",
    "NKE":"NYSE:NKE",       "SBUX":"NASDAQ:SBUX",   "MCD":"NYSE:MCD",
    "KO":"NYSE:KO",         "PEP":"NASDAQ:PEP",     "PG":"NYSE:PG",
    "JNJ":"NYSE:JNJ",       "PFE":"NYSE:PFE",       "MRNA":"NASDAQ:MRNA",
    "LLY":"NYSE:LLY",       "ABBV":"NYSE:ABBV",     "MRK":"NYSE:MRK",
    "AMGN":"NASDAQ:AMGN",   "UNH":"NYSE:UNH",       "XOM":"NYSE:XOM",
    "CVX":"NYSE:CVX",       "COP":"NYSE:COP",       "BA":"NYSE:BA",
    "LMT":"NYSE:LMT",       "RTX":"NYSE:RTX",       "F":"NYSE:F",
    "GM":"NYSE:GM",         "RIVN":"NASDAQ:RIVN",   "LCID":"NASDAQ:LCID",
  };

  if (map[sym]) return map[sym];

  // Smart fallback — don't just use NASDAQ for everything
  const s = sym.toUpperCase();
  if (s.endsWith(".NS"))  return `NSE:${s.replace(".NS", "")}`;
  if (s.endsWith(".BO"))  return `BSE:${s.replace(".BO", "")}`;
  if (s.endsWith("-USD")) return `BINANCE:${s.replace("-USD", "")}USDT`;
  if (s.endsWith("=X"))   return `OANDA:${s.replace("=X", "")}`;
  if (s.startsWith("^"))  return `TVC:${s.replace("^", "")}`;
  if (s.endsWith("=F") || s.endsWith("1!")) return `TVC:${s}`;
  return `NASDAQ:${s}`;
};

const fmt = (v) => {
  if (v == null) return "";
  const n = Number(v);
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(2);
  return n.toFixed(4);
};

// Price-level markers on the right edge of the chart — aligned to chart Y-axis
function SignalOverlay({ signal, report, quote, holding }) {
  if (!report || !quote?.price) return null;

  const p = quote.price;

  const hasPosition = !!holding;

  const fmt = (v) => {
    if (v == null) return "";
    const n = Number(v);
    if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
    if (n >= 1000)   return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    if (n >= 1)      return `₹${n.toFixed(2)}`;
    return `₹${n.toFixed(4)}`;
  };

  // Build markers
  const markers = [];

  if (!hasPosition && signal === "BUY") {
    markers.push({ price: report.buyEntry,  label: "▲ BUY ZONE",  color: "#10b981", bg: "#f0fdf4", border: "#86efac", bold: true });
    markers.push({ price: report.buyTarget, label: `✦ TARGET  ${fmt(report.buyTarget)}`,  color: "#10b981", bg: "#f0fdf4", border: "#86efac", bold: false });
    markers.push({ price: report.buyStop,   label: `✕ STOP  ${fmt(report.buyStop)}`,      color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", bold: false });
  } else if (!hasPosition && signal === "SELL") {
    markers.push({ price: p,          label: "▼ AVOID BUYING",  color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", bold: true });
    markers.push({ price: report.s1,  label: `↓ SUPPORT  ${fmt(report.s1)}`, color: "#f59e0b", bg: "#fefce8", border: "#fde68a", bold: false });
  } else if (!hasPosition && signal === "HOLD") {
    markers.push({ price: report.r1,  label: `▲ RESISTANCE  ${fmt(report.r1)}`, color: "#f59e0b", bg: "#fefce8", border: "#fde68a", bold: false });
    markers.push({ price: report.pivot, label: `◉ PIVOT  ${fmt(report.pivot)}`,  color: "#9a9a9a", bg: "#f7f7f7", border: "#e2e2e2", bold: true });
    markers.push({ price: report.s1,  label: `↓ SUPPORT  ${fmt(report.s1)}`,    color: "#f59e0b", bg: "#fefce8", border: "#fde68a", bold: false });
  } else if (hasPosition) {
    // avg_price is stored in INR, report prices are in raw quote currency
    // Use avg_price directly since chart shows raw prices — just display INR label
    const avgPrice = holding.avg_price;
    const pnl = ((p - avgPrice) / avgPrice) * 100;
    markers.push({ price: avgPrice,         label: `◉ YOUR BUY  ${fmt(avgPrice)}`,        color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", bold: true });
    markers.push({ price: report.buyTarget, label: `✦ SELL TARGET  ${fmt(report.buyTarget)}`, color: "#10b981", bg: "#f0fdf4", border: "#86efac", bold: false });
    markers.push({ price: report.buyStop,   label: `✕ STOP LOSS  ${fmt(report.buyStop)}`,    color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", bold: false });
    if (signal === "SELL" && pnl > 0) {
      markers.push({ price: p, label: "▼ SELL NOW (AI)", color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", bold: true });
    }
  }

  if (markers.length === 0) return null;

  // ── Price range — include all marker prices so nothing is clipped ──
  const allPrices = [p, ...markers.map(m => m.price).filter(Boolean)];
  const rangeHigh = Math.max(...allPrices) * 1.01;
  const rangeLow  = Math.min(...allPrices) * 0.99;
  const range     = rangeHigh - rangeLow || p * 0.04;

  const toY = (price) => {
    if (!price) return 50;
    const pct = ((rangeHigh - price) / range) * 100;
    return Math.min(Math.max(pct, 3), 93);
  };

  // ── Collision detection — push overlapping labels apart ──
  const MIN_GAP = 8; // % minimum gap
  const sorted = [...markers].sort((a, b) => toY(a.price) - toY(b.price));
  const yPositions = sorted.map(m => toY(m.price));

  // Push down
  for (let i = 1; i < yPositions.length; i++) {
    if (yPositions[i] - yPositions[i - 1] < MIN_GAP) {
      yPositions[i] = yPositions[i - 1] + MIN_GAP;
    }
  }
  // Push up from bottom
  for (let i = yPositions.length - 2; i >= 0; i--) {
    if (yPositions[i + 1] - yPositions[i] < MIN_GAP) {
      yPositions[i] = yPositions[i + 1] - MIN_GAP;
    }
  }
  // Clamp
  const finalY = yPositions.map(y => Math.min(Math.max(y, 3), 93));
  const yMap = new Map(sorted.map((m, i) => [m.label, finalY[i]]));

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {markers.map(({ price, label, color, bg, border, bold }) => {
        const yPos = yMap.get(label) ?? toY(price);
        return (
          <div
            key={label}
            className="absolute right-0 flex items-center"
            style={{ top: `${yPos}%`, transform: "translateY(-50%)" }}
          >
            {/* Dashed horizontal line */}
            <div style={{
              position: "absolute",
              right: "160px",
              left: 0,
              height: "1px",
              background: `repeating-linear-gradient(90deg, ${color} 0, ${color} 5px, transparent 5px, transparent 10px)`,
              opacity: 0.5,
            }} />
            {/* Label badge */}
            <div style={{
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: bold ? 800 : 600,
              color,
              whiteSpace: "nowrap",
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              minWidth: "150px",
              textAlign: "right",
              lineHeight: "1.4",
            }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TradingViewChart({ symbol, signal, report, quote, holding }) {
  const containerRef = useRef(null);
  const { dark } = useThemeStore();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const tvTheme = dark ? "dark" : "light";
    const bg      = dark ? "#1e222d" : "#ffffff";
    const id      = `tv_${Date.now()}`;
    containerRef.current.id = id;

    const existing = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src   = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !containerRef.current) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: toTVSymbol(symbol),
        interval: "D",
        timezone: "Asia/Kolkata",
        theme: tvTheme,
        style: "1",
        locale: "en",
        toolbar_bg: bg,
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: id,
        hide_side_toolbar: false,
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"],
        overrides: {
          "paneProperties.background": bg,
          "paneProperties.backgroundType": "solid",
          "mainSeriesProperties.candleStyle.upColor":        "#10b981",
          "mainSeriesProperties.candleStyle.downColor":      "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor":  "#10b981",
          "mainSeriesProperties.candleStyle.borderDownColor":"#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor":    "#10b981",
          "mainSeriesProperties.candleStyle.wickDownColor":  "#ef4444",
        },
      });
    };
    document.head.appendChild(script);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, [symbol, dark]);

  return (
    <div style={{ position: "relative", height: "560px", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <SignalOverlay signal={signal} report={report} quote={quote} holding={holding} />
    </div>
  );
}
