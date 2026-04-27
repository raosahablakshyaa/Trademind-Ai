import React, { useState, useEffect, useRef, useCallback } from "react";

/* ── Symbol Data ── */
const SYMBOLS = [
  // ── US Stocks ──
  { symbol:"AAPL",   name:"Apple Inc.",              cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"NVDA",   name:"NVIDIA Corporation",      cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"TSLA",   name:"Tesla Inc.",              cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"MSFT",   name:"Microsoft Corporation",   cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"GOOGL",  name:"Alphabet Inc.",           cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"AMZN",   name:"Amazon.com Inc.",         cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"META",   name:"Meta Platforms Inc.",     cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"AMD",    name:"Advanced Micro Devices",  cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"NFLX",   name:"Netflix Inc.",            cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"PLTR",   name:"Palantir Technologies",   cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"CRWD",   name:"CrowdStrike Holdings",    cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"COIN",   name:"Coinbase Global Inc.",    cat:"Stocks",  exchange:"NASDAQ" },
  { symbol:"JPM",    name:"JPMorgan Chase & Co.",    cat:"Stocks",  exchange:"NYSE"   },
  { symbol:"V",      name:"Visa Inc.",               cat:"Stocks",  exchange:"NYSE"   },
  { symbol:"MA",     name:"Mastercard Inc.",         cat:"Stocks",  exchange:"NYSE"   },
  { symbol:"WMT",    name:"Walmart Inc.",            cat:"Stocks",  exchange:"NYSE"   },
  { symbol:"KO",     name:"Coca-Cola Company",       cat:"Stocks",  exchange:"NYSE"   },
  { symbol:"XOM",    name:"ExxonMobil Corporation",  cat:"Stocks",  exchange:"NYSE"   },
  { symbol:"BA",     name:"Boeing Company",          cat:"Stocks",  exchange:"NYSE"   },
  { symbol:"UBER",   name:"Uber Technologies Inc.",  cat:"Stocks",  exchange:"NYSE"   },
  // ── NSE / Nifty 50 ──
  { symbol:"^NSEI",        name:"Nifty 50 Index",         cat:"NSE", exchange:"NSE" },
  { symbol:"^BSESN",       name:"BSE Sensex Index",       cat:"NSE", exchange:"BSE" },
  { symbol:"^NSEBANK",     name:"Bank Nifty Index",       cat:"NSE", exchange:"NSE" },
  { symbol:"RELIANCE.NS",  name:"Reliance Industries",    cat:"NSE", exchange:"NSE" },
  { symbol:"TCS.NS",       name:"Tata Consultancy Svcs.", cat:"NSE", exchange:"NSE" },
  { symbol:"INFY.NS",      name:"Infosys Limited",        cat:"NSE", exchange:"NSE" },
  { symbol:"HDFCBANK.NS",  name:"HDFC Bank Limited",      cat:"NSE", exchange:"NSE" },
  { symbol:"ICICIBANK.NS", name:"ICICI Bank Limited",     cat:"NSE", exchange:"NSE" },
  { symbol:"KOTAKBANK.NS", name:"Kotak Mahindra Bank",    cat:"NSE", exchange:"NSE" },
  { symbol:"AXISBANK.NS",  name:"Axis Bank Limited",      cat:"NSE", exchange:"NSE" },
  { symbol:"SBIN.NS",      name:"State Bank of India",    cat:"NSE", exchange:"NSE" },
  { symbol:"BAJFINANCE.NS",name:"Bajaj Finance Limited",  cat:"NSE", exchange:"NSE" },
  { symbol:"WIPRO.NS",     name:"Wipro Limited",          cat:"NSE", exchange:"NSE" },
  { symbol:"HCLTECH.NS",   name:"HCL Technologies",       cat:"NSE", exchange:"NSE" },
  { symbol:"TATAMOTORS.NS",name:"Tata Motors Limited",    cat:"NSE", exchange:"NSE" },
  { symbol:"TATASTEEL.NS", name:"Tata Steel Limited",     cat:"NSE", exchange:"NSE" },
  { symbol:"ADANIENT.NS",  name:"Adani Enterprises Ltd.", cat:"NSE", exchange:"NSE" },
  { symbol:"ADANIPORTS.NS",name:"Adani Ports & SEZ",      cat:"NSE", exchange:"NSE" },
  { symbol:"SUNPHARMA.NS", name:"Sun Pharmaceutical",     cat:"NSE", exchange:"NSE" },
  { symbol:"DRREDDY.NS",   name:"Dr. Reddy's Labs",       cat:"NSE", exchange:"NSE" },
  { symbol:"CIPLA.NS",     name:"Cipla Limited",          cat:"NSE", exchange:"NSE" },
  { symbol:"ITC.NS",       name:"ITC Limited",            cat:"NSE", exchange:"NSE" },
  { symbol:"HINDUNILVR.NS",name:"Hindustan Unilever",     cat:"NSE", exchange:"NSE" },
  { symbol:"NESTLEIND.NS", name:"Nestle India Limited",   cat:"NSE", exchange:"NSE" },
  { symbol:"TITAN.NS",     name:"Titan Company Limited",  cat:"NSE", exchange:"NSE" },
  { symbol:"ASIANPAINT.NS",name:"Asian Paints Limited",   cat:"NSE", exchange:"NSE" },
  { symbol:"MARUTI.NS",    name:"Maruti Suzuki India",    cat:"NSE", exchange:"NSE" },
  { symbol:"BAJAJ-AUTO.NS",name:"Bajaj Auto Limited",     cat:"NSE", exchange:"NSE" },
  { symbol:"M&M.NS",       name:"Mahindra & Mahindra",    cat:"NSE", exchange:"NSE" },
  { symbol:"LT.NS",        name:"Larsen & Toubro Ltd.",   cat:"NSE", exchange:"NSE" },
  { symbol:"BHARTIARTL.NS",name:"Bharti Airtel Limited",  cat:"NSE", exchange:"NSE" },
  { symbol:"ONGC.NS",      name:"Oil & Natural Gas Corp", cat:"NSE", exchange:"NSE" },
  { symbol:"NTPC.NS",      name:"NTPC Limited",           cat:"NSE", exchange:"NSE" },
  { symbol:"JSWSTEEL.NS",  name:"JSW Steel Limited",      cat:"NSE", exchange:"NSE" },
  { symbol:"HINDALCO.NS",  name:"Hindalco Industries",    cat:"NSE", exchange:"NSE" },
  { symbol:"ULTRACEMCO.NS",name:"UltraTech Cement",       cat:"NSE", exchange:"NSE" },
  // ── Crypto ──
  { symbol:"BTC-USD",  name:"Bitcoin",          cat:"Crypto",  exchange:"Crypto" },
  { symbol:"ETH-USD",  name:"Ethereum",         cat:"Crypto",  exchange:"Crypto" },
  { symbol:"SOL-USD",  name:"Solana",           cat:"Crypto",  exchange:"Crypto" },
  { symbol:"BNB-USD",  name:"BNB",              cat:"Crypto",  exchange:"Crypto" },
  { symbol:"XRP-USD",  name:"XRP",              cat:"Crypto",  exchange:"Crypto" },
  { symbol:"DOGE-USD", name:"Dogecoin",         cat:"Crypto",  exchange:"Crypto" },
  { symbol:"ADA-USD",  name:"Cardano",          cat:"Crypto",  exchange:"Crypto" },
  { symbol:"AVAX-USD", name:"Avalanche",        cat:"Crypto",  exchange:"Crypto" },
  { symbol:"DOT-USD",  name:"Polkadot",         cat:"Crypto",  exchange:"Crypto" },
  { symbol:"LINK-USD", name:"Chainlink",        cat:"Crypto",  exchange:"Crypto" },
  { symbol:"LTC-USD",  name:"Litecoin",         cat:"Crypto",  exchange:"Crypto" },
  { symbol:"SHIB-USD", name:"Shiba Inu",        cat:"Crypto",  exchange:"Crypto" },
  { symbol:"ATOM-USD", name:"Cosmos",           cat:"Crypto",  exchange:"Crypto" },
  { symbol:"NEAR-USD", name:"NEAR Protocol",    cat:"Crypto",  exchange:"Crypto" },
  { symbol:"ARB-USD",  name:"Arbitrum",         cat:"Crypto",  exchange:"Crypto" },
  // ── Forex ──
  { symbol:"EURUSD=X", name:"Euro / US Dollar",         cat:"Forex", exchange:"FX" },
  { symbol:"GBPUSD=X", name:"British Pound / Dollar",   cat:"Forex", exchange:"FX" },
  { symbol:"USDJPY=X", name:"US Dollar / Japanese Yen", cat:"Forex", exchange:"FX" },
  { symbol:"USDINR=X", name:"US Dollar / Indian Rupee", cat:"Forex", exchange:"FX" },
  { symbol:"AUDUSD=X", name:"Australian Dollar / USD",  cat:"Forex", exchange:"FX" },
  { symbol:"USDCAD=X", name:"US Dollar / Canadian $",   cat:"Forex", exchange:"FX" },
  { symbol:"USDCHF=X", name:"US Dollar / Swiss Franc",  cat:"Forex", exchange:"FX" },
  { symbol:"EURGBP=X", name:"Euro / British Pound",     cat:"Forex", exchange:"FX" },
  { symbol:"EURJPY=X", name:"Euro / Japanese Yen",      cat:"Forex", exchange:"FX" },
  { symbol:"GBPJPY=X", name:"British Pound / Yen",      cat:"Forex", exchange:"FX" },
  // ── Indices ──
  { symbol:"^GSPC",    name:"S&P 500 Index",         cat:"Indices", exchange:"CME"   },
  { symbol:"^DJI",     name:"Dow Jones Industrial",   cat:"Indices", exchange:"CME"   },
  { symbol:"^IXIC",    name:"Nasdaq Composite",       cat:"Indices", exchange:"CME"   },
  { symbol:"^VIX",     name:"CBOE Volatility Index",  cat:"Indices", exchange:"CBOE"  },
  { symbol:"^N225",    name:"Nikkei 225 Index",       cat:"Indices", exchange:"JPX"   },
  { symbol:"^HSI",     name:"Hang Seng Index",        cat:"Indices", exchange:"HKEX"  },
  { symbol:"^FTSE",    name:"FTSE 100 Index",         cat:"Indices", exchange:"LSE"   },
  { symbol:"^GDAXI",   name:"DAX Index",              cat:"Indices", exchange:"XETRA" },
  { symbol:"^AXJO",    name:"ASX 200 Index",          cat:"Indices", exchange:"ASX"   },
  // ── Commodities ──
  { symbol:"GC=F",  name:"Gold Futures",       cat:"Commodity", exchange:"COMEX" },
  { symbol:"SI=F",  name:"Silver Futures",     cat:"Commodity", exchange:"COMEX" },
  { symbol:"CL=F",  name:"Crude Oil WTI",      cat:"Commodity", exchange:"NYMEX" },
  { symbol:"BZ=F",  name:"Brent Crude Oil",    cat:"Commodity", exchange:"ICE"   },
  { symbol:"NG=F",  name:"Natural Gas",        cat:"Commodity", exchange:"NYMEX" },
  { symbol:"HG=F",  name:"Copper Futures",     cat:"Commodity", exchange:"COMEX" },
];

const TABS = ["All", "Stocks", "NSE", "Crypto", "Forex", "Indices", "Commodity"];

const CAT_COLORS = {
  Stocks:    { bg: "#f0f0f0",  color: "#0a0a0a"  },
  NSE:       { bg: "#fff7ed",  color: "#c2410c"  },
  Crypto:    { bg: "#fef9c3",  color: "#854d0e"  },
  Forex:     { bg: "#eff6ff",  color: "#1d4ed8"  },
  Indices:   { bg: "#f0fdf4",  color: "#15803d"  },
  Commodity: { bg: "#fdf4ff",  color: "#7e22ce"  },
};

function Highlight({ text, query }) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{ background: "#fef08a", color: "#0a0a0a", borderRadius: "2px", padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

/* ── Main Component ── */
export default function SymbolSearch({ onSelect, triggerLabel = "🔍 Search Symbols", fullWidth = false, selectedSymbol = null }) {
  const [open, setOpen]             = useState(false);
  const [query, setQuery]           = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [tab, setTab]               = useState("All");
  const [cursor, setCursor]         = useState(0);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const listRef      = useRef(null);
  const itemRefs     = useRef([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setCursor(0); }
    else { setQuery(""); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    const clickOutside = (e) => {
      // fullWidth: only close if clicking completely outside the container
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    document.addEventListener("mousedown", clickOutside);
    return () => { window.removeEventListener("keydown", handler); document.removeEventListener("mousedown", clickOutside); };
  }, []);

  const results = SYMBOLS.filter(s => {
    const matchTab = tab === "All" || s.cat === tab;
    const q = debouncedQ.toLowerCase();
    const matchQ = !q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    return matchTab && matchQ;
  });

  useEffect(() => { setCursor(0); }, [debouncedQ, tab]);
  useEffect(() => { itemRefs.current[cursor]?.scrollIntoView({ block: "nearest" }); }, [cursor]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) { handleSelect(results[cursor]); }
  }, [results, cursor]);

  const handleSelect = (item) => {
    onSelect?.(item);
    // fullWidth mode: keep open so user can quickly switch symbols
    // non-fullWidth (modal): close after selection
    if (!fullWidth) setOpen(false);
    // Clear query so results reset, but keep dropdown open
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const ResultItem = ({ item, i }) => {
    const catStyle  = CAT_COLORS[item.cat] || CAT_COLORS.Stocks;
    const isActive  = i === cursor;
    const isSelected = item.symbol === selectedSymbol;
    const label = item.symbol.replace("=X","").replace("-USD","").replace(".NS","").replace("^","").slice(0,5);
    return (
      <button
        ref={el => itemRefs.current[i] = el}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setCursor(i)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
        style={{
          background: isSelected ? "rgba(22,163,74,0.06)" : isActive ? "var(--bg2)" : "transparent",
          borderBottom: "1px solid var(--border)",
          borderLeft: isSelected ? "2px solid #16a34a" : isActive ? "2px solid var(--accent)" : "2px solid transparent",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black"
            style={{ background: catStyle.bg, color: catStyle.color }}>
            {label}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate t1">
              <Highlight text={item.symbol} query={debouncedQ} />
            </p>
            <p className="text-xs truncate muted">
              <Highlight text={item.name} query={debouncedQ} />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: catStyle.bg, color: catStyle.color }}>{item.cat}</span>
          <span className="text-[10px] font-mono muted">{item.exchange}</span>
          {isSelected && <span className="text-[10px] font-black" style={{ color: "#16a34a" }}>✓</span>}
          {isActive && !isSelected && <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg3)", color: "var(--muted)", fontFamily: "monospace" }}>↵</kbd>}
        </div>
      </button>
    );
  };

  const TabBar = () => (
    <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
      {TABS.map(t => (
        <button key={t} onClick={() => setTab(t)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: tab === t ? "var(--accent)" : "var(--bg3)",
            color:      tab === t ? "#fff"          : "var(--muted)",
          }}
        >
          {t === "NSE" ? "🇮🇳 NSE" : t}
        </button>
      ))}
      <span className="ml-auto text-xs self-center shrink-0 muted">{results.length} results</span>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-2xl mb-2">🔍</p>
      <p className="text-sm font-semibold t1">No results found</p>
      <p className="text-xs mt-1 muted">Try a different symbol or name</p>
    </div>
  );

  const Footer = () => (
    <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
      <div className="flex items-center gap-3 text-[11px] muted">
        <span><kbd style={{ fontFamily: "monospace" }}>↑↓</kbd> navigate</span>
        <span><kbd style={{ fontFamily: "monospace" }}>↵</kbd> select</span>
        <span><kbd style={{ fontFamily: "monospace" }}>ESC</kbd> close</span>
      </div>
      <span className="text-[11px] muted">TradeMind AI</span>
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: "relative", width: fullWidth ? "100%" : "auto" }}>

      {/* ── Trigger ── */}
      {fullWidth ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-text"
          style={{
            background: "var(--bg2)",
            border: `1.5px solid ${open ? "var(--text)" : "var(--border2)"}`,
            transition: "border-color 0.15s",
          }}
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 30); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={triggerLabel}
            className="flex-1 outline-none text-sm bg-transparent t1"
          />
          {query && (
            <button onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}
              className="muted" style={{ fontSize: "18px", lineHeight: 1 }}>×</button>
          )}
          {open && (
            <kbd onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="text-xs px-2 py-1 rounded cursor-pointer shrink-0 muted"
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", fontFamily: "monospace" }}
            >ESC</kbd>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-ghost flex items-center gap-2"
          style={{ fontSize: "13px", minWidth: "180px", justifyContent: "flex-start" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {triggerLabel}
        </button>
      )}

      {/* ── Inline Dropdown (fullWidth) ── */}
      {fullWidth && open && (
        <div className="absolute left-0 right-0 z-50 overflow-hidden animate-slideUp"
          style={{
            top: "calc(100% + 6px)",
            background: "var(--bg)",
            borderRadius: "12px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
            border: "1px solid var(--border2)",
          }}
        >
          <TabBar />
          <div ref={listRef} style={{ maxHeight: "380px", overflowY: "auto" }}>
            {results.length === 0 ? <EmptyState /> : results.map((item, i) => <ResultItem key={`${item.symbol}-${i}`} item={item} i={i} />)}
          </div>
          <Footer />
        </div>
      )}

      {/* ── Modal (non-fullWidth) ── */}
      {!fullWidth && open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg flex flex-col overflow-hidden animate-slideUp"
            style={{
              background: "var(--bg)", borderRadius: "16px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
              border: "1px solid var(--border2)", maxHeight: "80vh",
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2" className="shrink-0">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Search symbols..."
                className="flex-1 outline-none text-sm bg-transparent t1" />
              {query && <button onClick={() => setQuery("")} className="muted" style={{ fontSize: "18px", lineHeight: 1 }}>×</button>}
              <kbd onClick={() => setOpen(false)} className="text-xs px-2 py-1 rounded cursor-pointer muted"
                style={{ background: "var(--bg3)", border: "1px solid var(--border)", fontFamily: "monospace" }}>ESC</kbd>
            </div>
            <TabBar />
            <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: "420px" }}>
              {results.length === 0 ? <EmptyState /> : results.map((item, i) => <ResultItem key={`${item.symbol}-${i}`} item={item} i={i} />)}
            </div>
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
}
