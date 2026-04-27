import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api, { getErrorMsg } from "../utils/api";
import useLivePrice from "../hooks/useLivePrice";
import useSignalStore from "../store/signalStore";

const fmt = (v, d = 2) =>
  v == null ? "—" : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const SYMBOLS = [
  // ─ US Stocks
  { symbol:"AAPL",   name:"Apple",           cat:"US Stocks" },
  { symbol:"NVDA",   name:"NVIDIA",          cat:"US Stocks" },
  { symbol:"TSLA",   name:"Tesla",           cat:"US Stocks" },
  { symbol:"MSFT",   name:"Microsoft",       cat:"US Stocks" },
  { symbol:"GOOGL",  name:"Google",          cat:"US Stocks" },
  { symbol:"AMZN",   name:"Amazon",          cat:"US Stocks" },
  { symbol:"META",   name:"Meta",            cat:"US Stocks" },
  { symbol:"AMD",    name:"AMD",             cat:"US Stocks" },
  { symbol:"INTC",   name:"Intel",           cat:"US Stocks" },
  { symbol:"QCOM",   name:"Qualcomm",        cat:"US Stocks" },
  { symbol:"AVGO",   name:"Broadcom",        cat:"US Stocks" },
  { symbol:"ORCL",   name:"Oracle",          cat:"US Stocks" },
  { symbol:"CRM",    name:"Salesforce",      cat:"US Stocks" },
  { symbol:"CSCO",   name:"Cisco",           cat:"US Stocks" },
  { symbol:"IBM",    name:"IBM",             cat:"US Stocks" },
  { symbol:"PLTR",   name:"Palantir",        cat:"US Stocks" },
  { symbol:"CRWD",   name:"CrowdStrike",     cat:"US Stocks" },
  { symbol:"NET",    name:"Cloudflare",      cat:"US Stocks" },
  { symbol:"SNOW",   name:"Snowflake",       cat:"US Stocks" },
  { symbol:"COIN",   name:"Coinbase",        cat:"US Stocks" },
  { symbol:"HOOD",   name:"Robinhood",       cat:"US Stocks" },
  { symbol:"UBER",   name:"Uber",            cat:"US Stocks" },
  { symbol:"ABNB",   name:"Airbnb",          cat:"US Stocks" },
  { symbol:"SPOT",   name:"Spotify",         cat:"US Stocks" },
  { symbol:"NFLX",   name:"Netflix",         cat:"US Stocks" },
  { symbol:"DIS",    name:"Disney",          cat:"US Stocks" },
  { symbol:"PYPL",   name:"PayPal",          cat:"US Stocks" },
  { symbol:"SQ",     name:"Block",           cat:"US Stocks" },
  { symbol:"V",      name:"Visa",            cat:"US Stocks" },
  { symbol:"MA",     name:"Mastercard",      cat:"US Stocks" },
  { symbol:"JPM",    name:"JPMorgan",        cat:"US Stocks" },
  { symbol:"GS",     name:"Goldman Sachs",   cat:"US Stocks" },
  { symbol:"BAC",    name:"Bank of America", cat:"US Stocks" },
  { symbol:"WFC",    name:"Wells Fargo",     cat:"US Stocks" },
  { symbol:"MS",     name:"Morgan Stanley",  cat:"US Stocks" },
  { symbol:"BLK",    name:"BlackRock",       cat:"US Stocks" },
  { symbol:"LLY",    name:"Eli Lilly",       cat:"US Stocks" },
  { symbol:"PFE",    name:"Pfizer",          cat:"US Stocks" },
  { symbol:"MRNA",   name:"Moderna",         cat:"US Stocks" },
  { symbol:"UNH",    name:"UnitedHealth",    cat:"US Stocks" },
  { symbol:"JNJ",    name:"J&J",             cat:"US Stocks" },
  { symbol:"ABBV",   name:"AbbVie",          cat:"US Stocks" },
  { symbol:"MRK",    name:"Merck",           cat:"US Stocks" },
  { symbol:"WMT",    name:"Walmart",         cat:"US Stocks" },
  { symbol:"COST",   name:"Costco",          cat:"US Stocks" },
  { symbol:"HD",     name:"Home Depot",      cat:"US Stocks" },
  { symbol:"NKE",    name:"Nike",            cat:"US Stocks" },
  { symbol:"MCD",    name:"McDonald's",      cat:"US Stocks" },
  { symbol:"KO",     name:"Coca-Cola",       cat:"US Stocks" },
  { symbol:"PEP",    name:"PepsiCo",         cat:"US Stocks" },
  { symbol:"XOM",    name:"ExxonMobil",      cat:"US Stocks" },
  { symbol:"CVX",    name:"Chevron",         cat:"US Stocks" },
  { symbol:"BA",     name:"Boeing",          cat:"US Stocks" },
  { symbol:"LMT",    name:"Lockheed",        cat:"US Stocks" },
  { symbol:"F",      name:"Ford",            cat:"US Stocks" },
  { symbol:"GM",     name:"Gen. Motors",     cat:"US Stocks" },
  { symbol:"RIVN",   name:"Rivian",          cat:"US Stocks" },
  { symbol:"TSM",    name:"TSMC",            cat:"US Stocks" },
  { symbol:"ASML",   name:"ASML",            cat:"US Stocks" },
  // ─ Nifty 50
  { symbol:"RELIANCE.NS",  name:"Reliance",       cat:"Nifty 50" },
  { symbol:"TCS.NS",       name:"TCS",            cat:"Nifty 50" },
  { symbol:"INFY.NS",      name:"Infosys",        cat:"Nifty 50" },
  { symbol:"HDFCBANK.NS",  name:"HDFC Bank",      cat:"Nifty 50" },
  { symbol:"ICICIBANK.NS", name:"ICICI Bank",     cat:"Nifty 50" },
  { symbol:"KOTAKBANK.NS", name:"Kotak Bank",     cat:"Nifty 50" },
  { symbol:"AXISBANK.NS",  name:"Axis Bank",      cat:"Nifty 50" },
  { symbol:"SBIN.NS",      name:"SBI",            cat:"Nifty 50" },
  { symbol:"INDUSINDBK.NS",name:"IndusInd Bank",  cat:"Nifty 50" },
  { symbol:"BAJFINANCE.NS",name:"Bajaj Finance",  cat:"Nifty 50" },
  { symbol:"BAJAJFINSV.NS",name:"Bajaj Finserv",  cat:"Nifty 50" },
  { symbol:"BAJAJ-AUTO.NS",name:"Bajaj Auto",     cat:"Nifty 50" },
  { symbol:"WIPRO.NS",     name:"Wipro",          cat:"Nifty 50" },
  { symbol:"HCLTECH.NS",   name:"HCL Tech",       cat:"Nifty 50" },
  { symbol:"TECHM.NS",     name:"Tech Mahindra",  cat:"Nifty 50" },
  { symbol:"LTIM.NS",      name:"LTIMindtree",    cat:"Nifty 50" },
  { symbol:"LT.NS",        name:"L&T",            cat:"Nifty 50" },
  { symbol:"TATAMOTORS.NS",name:"Tata Motors",    cat:"Nifty 50" },
  { symbol:"TATASTEEL.NS", name:"Tata Steel",     cat:"Nifty 50" },
  { symbol:"TATACONSUM.NS",name:"Tata Consumer",  cat:"Nifty 50" },
  { symbol:"ADANIENT.NS",  name:"Adani Ent.",     cat:"Nifty 50" },
  { symbol:"ADANIPORTS.NS",name:"Adani Ports",    cat:"Nifty 50" },
  { symbol:"ADANIGREEN.NS",name:"Adani Green",    cat:"Nifty 50" },
  { symbol:"SUNPHARMA.NS", name:"Sun Pharma",     cat:"Nifty 50" },
  { symbol:"DRREDDY.NS",   name:"Dr Reddy's",     cat:"Nifty 50" },
  { symbol:"CIPLA.NS",     name:"Cipla",          cat:"Nifty 50" },
  { symbol:"DIVISLAB.NS",  name:"Divi's Lab",     cat:"Nifty 50" },
  { symbol:"APOLLOHOSP.NS",name:"Apollo Hosp.",   cat:"Nifty 50" },
  { symbol:"ASIANPAINT.NS",name:"Asian Paints",   cat:"Nifty 50" },
  { symbol:"NESTLEIND.NS", name:"Nestle India",   cat:"Nifty 50" },
  { symbol:"ITC.NS",       name:"ITC",            cat:"Nifty 50" },
  { symbol:"HINDUNILVR.NS",name:"HUL",            cat:"Nifty 50" },
  { symbol:"BRITANNIA.NS", name:"Britannia",      cat:"Nifty 50" },
  { symbol:"TITAN.NS",     name:"Titan",          cat:"Nifty 50" },
  { symbol:"BHARTIARTL.NS",name:"Airtel",         cat:"Nifty 50" },
  { symbol:"ONGC.NS",      name:"ONGC",           cat:"Nifty 50" },
  { symbol:"NTPC.NS",      name:"NTPC",           cat:"Nifty 50" },
  { symbol:"POWERGRID.NS", name:"Power Grid",     cat:"Nifty 50" },
  { symbol:"COALINDIA.NS", name:"Coal India",     cat:"Nifty 50" },
  { symbol:"BPCL.NS",      name:"BPCL",           cat:"Nifty 50" },
  { symbol:"IOC.NS",       name:"Indian Oil",     cat:"Nifty 50" },
  { symbol:"MARUTI.NS",    name:"Maruti",         cat:"Nifty 50" },
  { symbol:"HEROMOTOCO.NS",name:"Hero Moto",      cat:"Nifty 50" },
  { symbol:"EICHERMOT.NS", name:"Eicher",         cat:"Nifty 50" },
  { symbol:"M&M.NS",       name:"Mahindra",       cat:"Nifty 50" },
  { symbol:"ULTRACEMCO.NS",name:"UltraTech",      cat:"Nifty 50" },
  { symbol:"GRASIM.NS",    name:"Grasim",         cat:"Nifty 50" },
  { symbol:"HINDALCO.NS",  name:"Hindalco",       cat:"Nifty 50" },
  { symbol:"JSWSTEEL.NS",  name:"JSW Steel",      cat:"Nifty 50" },
  { symbol:"VEDL.NS",      name:"Vedanta",        cat:"Nifty 50" },
  { symbol:"^NSEI",        name:"Nifty 50",       cat:"Nifty 50" },
  { symbol:"^BSESN",       name:"Sensex",         cat:"Nifty 50" },
  { symbol:"^NSEBANK",     name:"Bank Nifty",     cat:"Nifty 50" },
  // ─ Indices
  { symbol:"^GSPC",    name:"S&P 500",          cat:"Indices" },
  { symbol:"^DJI",     name:"Dow Jones",        cat:"Indices" },
  { symbol:"^IXIC",    name:"NASDAQ",           cat:"Indices" },
  { symbol:"^RUT",     name:"Russell 2000",     cat:"Indices" },
  { symbol:"^VIX",     name:"VIX",              cat:"Indices" },
  { symbol:"^N225",    name:"Nikkei 225",       cat:"Indices" },
  { symbol:"^HSI",     name:"Hang Seng",        cat:"Indices" },
  { symbol:"^FTSE",    name:"FTSE 100",         cat:"Indices" },
  { symbol:"^GDAXI",   name:"DAX",              cat:"Indices" },
  { symbol:"^FCHI",    name:"CAC 40",           cat:"Indices" },
  { symbol:"^STOXX50E",name:"Euro Stoxx 50",    cat:"Indices" },
  { symbol:"^AXJO",    name:"ASX 200",          cat:"Indices" },
  { symbol:"^KS11",    name:"KOSPI",            cat:"Indices" },
  { symbol:"^TWII",    name:"Taiwan Weighted",  cat:"Indices" },
  // ─ Crypto
  { symbol:"BTC-USD",  name:"Bitcoin",    cat:"Crypto" },
  { symbol:"ETH-USD",  name:"Ethereum",   cat:"Crypto" },
  { symbol:"SOL-USD",  name:"Solana",     cat:"Crypto" },
  { symbol:"BNB-USD",  name:"BNB",        cat:"Crypto" },
  { symbol:"XRP-USD",  name:"XRP",        cat:"Crypto" },
  { symbol:"DOGE-USD", name:"Dogecoin",   cat:"Crypto" },
  { symbol:"ADA-USD",  name:"Cardano",    cat:"Crypto" },
  { symbol:"AVAX-USD", name:"Avalanche",  cat:"Crypto" },
  { symbol:"DOT-USD",  name:"Polkadot",   cat:"Crypto" },
  { symbol:"LINK-USD", name:"Chainlink",  cat:"Crypto" },
  { symbol:"SHIB-USD", name:"Shiba Inu",  cat:"Crypto" },
  { symbol:"LTC-USD",  name:"Litecoin",   cat:"Crypto" },
  { symbol:"XLM-USD",  name:"Stellar",    cat:"Crypto" },
  { symbol:"ATOM-USD", name:"Cosmos",     cat:"Crypto" },
  { symbol:"NEAR-USD", name:"NEAR",       cat:"Crypto" },
  { symbol:"ARB-USD",  name:"Arbitrum",   cat:"Crypto" },
  { symbol:"OP-USD",   name:"Optimism",   cat:"Crypto" },
  { symbol:"APT21794-USD", name:"Aptos",  cat:"Crypto" },
  // ─ Forex
  { symbol:"EURUSD=X", name:"EUR/USD",  cat:"Forex" },
  { symbol:"GBPUSD=X", name:"GBP/USD",  cat:"Forex" },
  { symbol:"USDINR=X", name:"USD/INR",  cat:"Forex" },
  { symbol:"USDJPY=X", name:"USD/JPY",  cat:"Forex" },
  { symbol:"AUDUSD=X", name:"AUD/USD",  cat:"Forex" },
  { symbol:"USDCAD=X", name:"USD/CAD",  cat:"Forex" },
  { symbol:"USDCHF=X", name:"USD/CHF",  cat:"Forex" },
  { symbol:"EURGBP=X", name:"EUR/GBP",  cat:"Forex" },
  { symbol:"EURJPY=X", name:"EUR/JPY",  cat:"Forex" },
  { symbol:"GBPJPY=X", name:"GBP/JPY",  cat:"Forex" },
  { symbol:"NZDUSD=X", name:"NZD/USD",  cat:"Forex" },
  { symbol:"USDSGD=X", name:"USD/SGD",  cat:"Forex" },
  { symbol:"USDCNY=X", name:"USD/CNY",  cat:"Forex" },
  // ─ Commodities
  { symbol:"GC=F",  name:"Gold",        cat:"Commodity" },
  { symbol:"SI=F",  name:"Silver",      cat:"Commodity" },
  { symbol:"CL=F",  name:"Crude Oil",   cat:"Commodity" },
  { symbol:"BZ=F",  name:"Brent Crude", cat:"Commodity" },
  { symbol:"NG=F",  name:"Natural Gas", cat:"Commodity" },
  { symbol:"HG=F",  name:"Copper",      cat:"Commodity" },
  { symbol:"PL=F",  name:"Platinum",    cat:"Commodity" },
  { symbol:"ZW=F",  name:"Wheat",       cat:"Commodity" },
  { symbol:"ZC=F",  name:"Corn",        cat:"Commodity" },
  { symbol:"ZS=F",  name:"Soybeans",    cat:"Commodity" },
  { symbol:"KC=F",  name:"Coffee",      cat:"Commodity" },
];

const CATS = ["All", "US Stocks", "Nifty 50", "Indices", "Crypto", "Forex", "Commodity"];

// Signal rank for sorting: BUY=0, HOLD=1, SELL=2
const SIG_RANK = { BUY: 0, HOLD: 1, SELL: 2 };

const sigStyle = {
  BUY:  { color: "#26a69a", bg: "rgba(38,166,154,0.08)",  border: "rgba(38,166,154,0.25)", badge: "rgba(38,166,154,0.15)", verdict: "✅ Good to Buy",  sub: "Signal is bullish. Conditions support a long position." },
  SELL: { color: "#ef5350", bg: "rgba(239,83,80,0.08)",   border: "rgba(239,83,80,0.25)",  badge: "rgba(239,83,80,0.15)",  verdict: "🚫 Do Not Buy",  sub: "Signal is bearish. Avoid buying at this level." },
  HOLD: { color: "#f9a825", bg: "rgba(249,168,37,0.08)",  border: "rgba(249,168,37,0.25)", badge: "rgba(249,168,37,0.15)", verdict: "⚠️ Wait & Watch", sub: "No clear direction. Stay on the sidelines." },
};

export default function SignalsPage() {
  const [symbol, setSymbol]     = useState(null);
  const [cat, setCat]           = useState("All");
  const [search, setSearch]     = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [training, setTraining] = useState(false);
  const [mlAccuracy, setMlAccuracy] = useState(null);

  const { scans, scan, isFresh, clearScan, startAutoRefresh, stopAutoRefresh } = useSignalStore();

  const quote = useLivePrice(symbol);

  // Current scan state for active category
  const catKey    = cat;
  const scanState = scans[catKey] || {};
  const scanResults  = scanState.results   || {};
  const scanning     = scanState.scanning  || false;
  const scanProgress = scanState.progress  || 0;
  const scannedAt    = scanState.scannedAt || null;

  useEffect(() => {
    if (!symbol) return;
    setResult(null);
    generate(symbol);
  }, [symbol]);

  // Auto-refresh timer — restart when category changes
  useEffect(() => {
    const syms = SYMBOLS
      .filter(s => cat === "All" || s.cat === cat)
      .map(s => s.symbol);

    startAutoRefresh(catKey, syms);
    return () => stopAutoRefresh();
  }, [catKey]);

  const generate = async (sym) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("symbol", sym);
      fd.append("dl_direction", "UP");
      fd.append("dl_confidence", 65);
      const res = await api.post("/signals/generate", fd);
      setResult(res.data);
    } catch (err) {
      toast.error(getErrorMsg(err, "Signal generation failed"));
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    const syms = filtered.map(s => s.symbol);
    await scan(catKey, syms);
    const results = useSignalStore.getState().scans[catKey]?.results || {};
    const buyCount = Object.values(results).filter(r => r.signal === "BUY").length;
    toast.success(`Scan complete — ${buyCount} BUY signals found`);
  };

  const trainModel = async () => {
    setTraining(true);
    try {
      // Train on top Nifty50 + US stocks
      const fd = new FormData();
      fd.append("symbols", "RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,AAPL,NVDA,TSLA,MSFT,BTC-USD,ETH-USD");
      fd.append("period", "3y");
      const res = await api.post("/signals/train", fd);
      setMlAccuracy(res.data.accuracy);
      toast.success(`🧠 ML Model trained! Accuracy: ${res.data.accuracy}% on ${res.data.symbols_trained} symbols`);
    } catch (err) {
      toast.error(getErrorMsg(err, "Training failed — check backend logs"));
    } finally {
      setTraining(false);
    }
  };

  const filtered = SYMBOLS.filter(s =>
    (cat === "All" || s.cat === cat) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort by signal rank if scan results exist
  const sortedFiltered = [...filtered].sort((a, b) => {
    const ra = scanResults[a.symbol];
    const rb = scanResults[b.symbol];
    if (!ra && !rb) return 0;
    if (!ra) return 1;
    if (!rb) return -1;
    const rankDiff = (SIG_RANK[ra.signal] ?? 1) - (SIG_RANK[rb.signal] ?? 1);
    if (rankDiff !== 0) return rankDiff;
    return (rb.confidence || 0) - (ra.confidence || 0);
  });

  const sig = result?.signal;
  const ss = sigStyle[sig] || null;

  const p    = quote?.price;
  const atr  = p ? (quote.high - quote.low) : 0;
  const sl   = p ? +(p - atr * 1.5).toFixed(4) : null;
  const t1   = p ? +(p + atr * 2).toFixed(4)   : null;
  const t2   = p ? +(p + atr * 3.5).toFixed(4) : null;
  const rr1  = sl && t1 ? (Math.abs(t1 - p) / Math.abs(p - sl)).toFixed(2) : null;
  const rr2  = sl && t2 ? (Math.abs(t2 - p) / Math.abs(p - sl)).toFixed(2) : null;

  const buyCount  = Object.values(scanResults).filter(r => r.signal === "BUY").length;
  const sellCount = Object.values(scanResults).filter(r => r.signal === "SELL").length;
  const holdCount = Object.values(scanResults).filter(r => r.signal === "HOLD").length;

  // Re-render every minute to update "scanned X min ago" display
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Time since last scan
  const minsAgo    = scannedAt ? Math.floor((Date.now() - scannedAt) / 60000) : null;
  const nextScanIn = scannedAt ? Math.max(0, 7 - Math.floor((Date.now() - scannedAt) / 60000)) : null;

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold t1">Signal Generator</h1>
          <p className="muted text-sm mt-0.5">Hybrid AI · RSI · MACD · EMA · Bollinger Bands · Smart Money · ML Engine</p>
          {mlAccuracy && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
              style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
              🧠 ML Model Active · {mlAccuracy}% accuracy
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runScan}
            disabled={scanning}
            className="btn-primary shrink-0"
            style={{ fontSize: "13px" }}
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning {scanProgress}/{filtered.length}…
              </span>
            ) : scannedAt ? "↻ Re-scan" : "⚡ Scan All & Rank"}
          </button>
          <button
            onClick={trainModel}
            disabled={training}
            className="btn-ghost shrink-0"
            style={{ fontSize: "13px" }}
          >
            {training ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Training…
              </span>
            ) : "🧠 Train ML"}
          </button>
        </div>
      </div>

      {/* ── Scan summary bar ── */}
      {Object.keys(scanResults).length > 0 && !scanning && (
        <div className="flex items-center gap-3 flex-wrap animate-fadeIn">
          <span className="text-xs font-bold muted uppercase tracking-widest">Scan Results:</span>
          {[
            { label: "BUY",  count: buyCount,  color: "#26a69a", bg: "rgba(38,166,154,0.1)"  },
            { label: "HOLD", count: holdCount, color: "#f9a825", bg: "rgba(249,168,37,0.1)" },
            { label: "SELL", count: sellCount, color: "#ef5350", bg: "rgba(239,83,80,0.1)"  },
          ].map(({ label, count, color, bg }) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: bg, color }}>
              {label} {count}
            </span>
          ))}
          {minsAgo !== null && (
            <span className="text-xs muted">
              · scanned {minsAgo === 0 ? "just now" : `${minsAgo}m ago`}
              {nextScanIn !== null && nextScanIn > 0 && ` · auto-refresh in ${nextScanIn}m`}
            </span>
          )}
          <button onClick={() => clearScan(catKey)}
            className="text-xs muted hover:t1 transition-colors ml-auto">
            ✕ Clear
          </button>
        </div>
      )}

      {/* ── Symbol Selector ── */}
      <div className="card space-y-3">
        {/* Search + category filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            className="input w-56"
            placeholder="Search symbol…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-1.5 overflow-x-auto">
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="shrink-0 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                style={{
                  background: cat === c ? "var(--accent)" : "var(--bg3)",
                  color:      cat === c ? "#fff"          : "var(--muted)",
                  border:     `1px solid ${cat === c ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Scan progress bar */}
        {scanning && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(scanProgress / filtered.length) * 100}%`, background: "#26a69a" }}
            />
          </div>
        )}

        {/* Symbol grid — sorted by signal rank after scan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {sortedFiltered.map(({ symbol: sym, name }) => {
            const isActive  = symbol === sym;
            const scanRes   = scanResults[sym];
            const ss2       = scanRes ? sigStyle[scanRes.signal] : null;
            const label     = sym.replace("=X","").replace("-USD","").replace(".NS","").replace("^","");
            return (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all"
                style={{
                  background:  isActive ? "rgba(41,98,255,0.08)" : ss2 ? ss2.bg : "var(--bg3)",
                  border:      `1px solid ${isActive ? "var(--accent)" : ss2 ? ss2.border : "var(--border)"}`,
                  borderLeft:  `3px solid ${isActive ? "var(--accent)" : ss2 ? ss2.color : "transparent"}`,
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: isActive ? "var(--accent)" : ss2 ? ss2.color : "var(--text)" }}>
                    {label}
                  </p>
                  <p className="text-[11px] truncate muted">{name}</p>
                </div>
                <div className="shrink-0 ml-1 flex items-center gap-1">
                  {isActive && loading && (
                    <span className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                  )}
                  {ss2 && !isActive && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: ss2.badge, color: ss2.color }}>
                      {scanRes.signal}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Result ── */}
      {!symbol && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4 opacity-20">◉</div>
          <p className="font-semibold t2">Select a symbol above to generate signal</p>
          <p className="muted text-sm mt-1">AI will analyze RSI, MACD, EMA, Bollinger Bands instantly</p>
        </div>
      )}

      {symbol && loading && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          <p className="font-semibold t2">Analyzing {symbol}…</p>
          <p className="muted text-sm mt-1">Running RSI · MACD · EMA · Bollinger Bands · AI model</p>
        </div>
      )}

      {result && ss && !loading && (
        <div className="space-y-5 animate-fadeIn">

          {/* ── PRO TRADE CARD ── */}
          {result.trade_plan && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${ss.color}` }}>

              {/* Action Banner */}
              <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ background: ss.bg }}>
                <div>
                  <p className="text-2xl font-black" style={{ color: ss.color }}>{result.trade_plan.action}</p>
                  <p className="text-sm mt-1 font-medium" style={{ color: ss.color, opacity: 0.85 }}>
                    {result.market_structure} · {result.pattern}
                  </p>
                  {result.ml_boost && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                      style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
                      🧠 ML + Rules Agree · {result.ml_accuracy}% model accuracy
                    </span>
                  )}
                  {result.ml_signal && !result.ml_boost && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                      style={{ background: "rgba(249,168,37,0.15)", color: "#f9a825" }}>
                      ⚠️ ML says {result.ml_signal} · Rules say {sig}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-black" style={{ color: ss.color, fontFamily: "'JetBrains Mono', monospace" }}>{result.probability}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: ss.color, opacity: 0.7 }}>Win Probability</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black" style={{ color: ss.color, fontFamily: "'JetBrains Mono', monospace" }}>{result.confidence}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: ss.color, opacity: 0.7 }}>AI Confidence</p>
                  </div>
                </div>
              </div>
              <div className="h-2" style={{ background: "var(--bg3)" }}>
                <div className="h-2 transition-all duration-700" style={{ width: `${result.probability}%`, background: ss.color }} />
              </div>

              {/* When to Buy / Sell / Risk */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ background: "var(--bg)" }}>
                <div className="rounded-xl p-4" style={{ background: "rgba(38,166,154,0.06)", border: "1px solid rgba(38,166,154,0.2)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#26a69a" }}>📈 When to Buy</p>
                  <p className="text-sm font-medium t1 leading-relaxed">{result.trade_plan.when_to_buy}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(239,83,80,0.06)", border: "1px solid rgba(239,83,80,0.2)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#ef5350" }}>📉 When to Sell / Exit</p>
                  <p className="text-sm font-medium t1 leading-relaxed">{result.trade_plan.when_to_sell}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(249,168,37,0.06)", border: "1px solid rgba(249,168,37,0.2)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#f9a825" }}>🛡️ Risk Management</p>
                  <p className="text-sm font-medium t1 leading-relaxed">{result.trade_plan.risk_note}</p>
                </div>
              </div>

              {/* Entry / SL / Targets */}
              <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-5 gap-3" style={{ background: "var(--bg)" }}>
                {[
                  { label: "Entry",     value: result.trade_plan.entry,     color: "var(--text)", note: "Buy zone" },
                  { label: "Stop Loss", value: result.trade_plan.stop_loss, color: "#ef5350",     note: "Max loss" },
                  { label: "Target 1",  value: result.trade_plan.target_1,  color: "#26a69a",     note: `R/R ${result.trade_plan.rr_1}x` },
                  { label: "Target 2",  value: result.trade_plan.target_2,  color: "#26a69a",     note: `R/R ${result.trade_plan.rr_2}x` },
                  { label: "Target 3",  value: result.trade_plan.target_3,  color: "#10b981",     note: `R/R ${result.trade_plan.rr_3}x (Swing)` },
                ].map(({ label, value, color, note }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide muted">{label}</p>
                    <p className="text-base font-black mt-1" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
                      ₹{Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] muted mt-0.5">{note}</p>
                  </div>
                ))}
              </div>

              {/* Position Sizing */}
              <div className="px-5 pb-5 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ background: "var(--bg)" }}>
                {[
                  { label: "Suggested Qty",  value: result.trade_plan.pos_size > 0 ? `${result.trade_plan.pos_size} shares` : "—", sub: "1% risk rule", cls: "t1" },
                  { label: "Risk Amount",    value: `₹${Number(result.trade_plan.risk_amount).toLocaleString("en-IN")}`, sub: "1% of ₹10L", cls: "t1" },
                  { label: "Break-even WR",  value: `${result.trade_plan.break_even_wr}%`, sub: `At ${result.trade_plan.rr_1}x R/R`, cls: "t1" },
                  { label: "Expected Value", value: `${result.trade_plan.ev_positive ? "+" : ""}₹${Math.abs(result.trade_plan.ev).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "Per trade avg", cls: result.trade_plan.ev_positive ? "up" : "down" },
                ].map(({ label, value, sub, cls }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] muted font-bold uppercase tracking-wide">{label}</p>
                    <p className={`text-lg font-black mt-1 ${cls}`}>{value}</p>
                    <p className="text-[10px] muted">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

            {/* ── Left: Deep Analysis ── */}
            <div className="space-y-4">

              {/* Market Structure + Smart Money */}
              <div className="card">
                <p className="text-xs font-bold uppercase tracking-widest mb-3 muted">Market Structure & Smart Money</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Structure",   value: result.market_structure },
                    { label: "Candlestick", value: result.pattern },
                    { label: "Volume",      value: `${result.volume_trend} (${result.vol_ratio}x avg)` },
                    { label: "ADX",         value: `${result.adx} — ${result.adx_trend}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg p-3" style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}>
                      <p className="text-[10px] muted font-semibold uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-bold t1 mt-1">{value}</p>
                    </div>
                  ))}
                  {result.liquidity_grab && (
                    <div className="col-span-2 rounded-lg p-3" style={{ background: "rgba(249,168,37,0.08)", border: "1px solid rgba(249,168,37,0.3)" }}>
                      <p className="text-sm font-semibold" style={{ color: "#f9a825" }}>⚡ {result.liquidity_grab}</p>
                    </div>
                  )}
                  {result.order_block_bull && (
                    <div className="rounded-lg p-3" style={{ background: "rgba(38,166,154,0.06)", border: "1px solid rgba(38,166,154,0.2)" }}>
                      <p className="text-[10px] muted font-semibold uppercase tracking-wide">Bullish Order Block</p>
                      <p className="text-sm font-bold up mt-1">₹{Number(result.order_block_bull).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {result.order_block_bear && (
                    <div className="rounded-lg p-3" style={{ background: "rgba(239,83,80,0.06)", border: "1px solid rgba(239,83,80,0.2)" }}>
                      <p className="text-[10px] muted font-semibold uppercase tracking-wide">Bearish Order Block</p>
                      <p className="text-sm font-bold down mt-1">₹{Number(result.order_block_bear).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vote breakdown */}
              <div className="card">
                <p className="text-xs font-bold uppercase tracking-widest mb-3 muted">Signal Votes (Weighted Score)</p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(result.scores).map(([k, v]) => {
                    const c = k === "BUY" ? "#26a69a" : k === "SELL" ? "#ef5350" : "#f9a825";
                    const isWinner = k === sig;
                    const total = Object.values(result.scores).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round(v / total * 100) : 0;
                    return (
                      <div key={k} className="rounded-xl p-4 text-center" style={{
                        background: isWinner ? `${c}18` : "var(--bg3)",
                        border: `1px solid ${isWinner ? c + "44" : "var(--border)"}`,
                      }}>
                        <p className="text-3xl font-black" style={{ color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: isWinner ? c : "var(--muted)" }}>{k}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: c, opacity: 0.7 }}>{pct}% weight</p>
                        {isWinner && <p className="text-[10px] font-black mt-1" style={{ color: c }}>★ Winner</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="card">
                <p className="text-xs font-bold uppercase tracking-widest mb-3 muted">Technical Indicators</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(result.indicators).map(([k, v]) => {
                    let color = "var(--text)";
                    if (k === "rsi")     color = v < 30 ? "#26a69a" : v > 70 ? "#ef5350" : "var(--text)";
                    if (k === "macd")    color = v > 0  ? "#26a69a" : "#ef5350";
                    if (k === "stoch_k") color = v < 20 ? "#26a69a" : v > 80 ? "#ef5350" : "var(--text)";
                    if (k === "adx")     color = v > 25 ? "#26a69a" : "var(--muted)";
                    return (
                      <div key={k} className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide muted">{k.replace(/_/g, " ")}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{v}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Right: Live Price + Key Levels ── */}
            <div className="space-y-4">

              {/* Live price */}
              {quote && (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-black text-lg t1">{symbol.replace(".NS","").replace("-USD","").replace("=X","").replace("^","")}</p>
                      <p className="text-xs muted">{SYMBOLS.find(s => s.symbol === symbol)?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black t1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        ₹{Number(quote.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm font-bold ${quote.change_pct >= 0 ? "up" : "down"}`}>
                        {quote.change_pct >= 0 ? "▲ +" : "▼ "}{Number(quote.change_pct).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[["High", quote.high], ["Low", quote.low], ["Prev", quote.prev_close]].map(([l, v]) => (
                      <div key={l} className="text-center rounded-lg py-2" style={{ background: "var(--bg3)" }}>
                        <p className="text-[10px] muted">{l}</p>
                        <p className="text-xs font-bold t1 mt-0.5">₹{Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Levels */}
              {result.pivot && (
                <div className="card">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 muted">Key Levels</p>
                  <div className="space-y-1.5">
                    {[
                      { l: "R3", v: result.r3, c: "text-emerald-700" },
                      { l: "R2", v: result.r2, c: "text-emerald-600" },
                      { l: "R1", v: result.r1, c: "up" },
                      { l: "Pivot", v: result.pivot, c: "muted", bold: true },
                      { l: "S1", v: result.s1, c: "down" },
                      { l: "S2", v: result.s2, c: "text-red-600" },
                      { l: "S3", v: result.s3, c: "text-red-700" },
                    ].map(({ l, v, c, bold }) => (
                      <div key={l} className="flex justify-between items-center px-3 py-1.5 rounded-lg" style={{
                        background: l === "Pivot" ? "var(--bg3)" : "transparent",
                        border: l === "Pivot" ? "1px solid var(--border)" : "none",
                      }}>
                        <span className={`text-xs font-bold ${c}`}>{l}</span>
                        <span className={`text-xs font-mono ${bold ? "font-black t1" : "t2"}`}>₹{Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fibonacci */}
              <div className="card">
                <p className="text-xs font-bold uppercase tracking-widest mb-3 muted">Fibonacci Levels</p>
                <div className="space-y-1.5">
                  {[
                    { l: "61.8%", v: result.fib_618 },
                    { l: "38.2%", v: result.fib_382 },
                    { l: "23.6%", v: result.fib_236 },
                  ].filter(x => x.v).map(({ l, v }) => (
                    <div key={l} className="flex justify-between items-center">
                      <span className="text-xs muted font-semibold">{l}</span>
                      <span className="text-xs font-mono t2">₹{Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* VWAP */}
              <div className="card">
                <p className="text-xs font-bold uppercase tracking-widest mb-2 muted">VWAP (Institutional Level)</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm muted">VWAP</span>
                  <span className="text-sm font-black t1 font-mono">₹{Number(result.vwap).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <p className={`text-xs font-semibold mt-1 ${result.above_vwap ? "up" : "down"}`}>
                  {result.above_vwap ? "▲ Above VWAP — Bullish" : "▼ Below VWAP — Bearish"}
                </p>
              </div>

              <div className="rounded-lg px-3 py-2.5 text-[11px] text-center" style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--muted2)" }}>
                AI signals for educational purposes only · Not financial advice · Always use stop loss
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
