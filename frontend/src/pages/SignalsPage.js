import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import useLivePrice from "../hooks/useLivePrice";

const fmt = (v, d = 2) =>
  v == null ? "—" : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const SYMBOLS = [
  { symbol: "AAPL",        name: "Apple",       cat: "US" },
  { symbol: "NVDA",        name: "NVIDIA",      cat: "US" },
  { symbol: "TSLA",        name: "Tesla",       cat: "US" },
  { symbol: "MSFT",        name: "Microsoft",   cat: "US" },
  { symbol: "GOOGL",       name: "Google",      cat: "US" },
  { symbol: "AMZN",        name: "Amazon",      cat: "US" },
  { symbol: "META",        name: "Meta",        cat: "US" },
  { symbol: "AMD",         name: "AMD",         cat: "US" },
  { symbol: "BTC-USD",     name: "Bitcoin",     cat: "Crypto" },
  { symbol: "ETH-USD",     name: "Ethereum",    cat: "Crypto" },
  { symbol: "SOL-USD",     name: "Solana",      cat: "Crypto" },
  { symbol: "BNB-USD",     name: "BNB",         cat: "Crypto" },
  { symbol: "RELIANCE.NS", name: "Reliance",    cat: "India" },
  { symbol: "TCS.NS",      name: "TCS",         cat: "India" },
  { symbol: "INFY.NS",     name: "Infosys",     cat: "India" },
  { symbol: "^NSEI",       name: "Nifty 50",    cat: "India" },
  { symbol: "GC=F",        name: "Gold",        cat: "Commodity" },
  { symbol: "CL=F",        name: "Crude Oil",   cat: "Commodity" },
  { symbol: "EURUSD=X",    name: "EUR/USD",     cat: "Forex" },
  { symbol: "GBPUSD=X",    name: "GBP/USD",     cat: "Forex" },
];

const CATS = ["All", "US", "Crypto", "India", "Forex", "Commodity"];

export default function SignalsPage() {
  const [symbol, setSymbol]   = useState(null);
  const [cat, setCat]         = useState("All");
  const [search, setSearch]   = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const quote = useLivePrice(symbol);

  // Auto-generate when symbol changes
  useEffect(() => {
    if (!symbol) return;
    setResult(null);
    generate(symbol);
  }, [symbol]);

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
      toast.error(err.response?.data?.detail || "Signal generation failed");
    } finally {
      setLoading(false);
    }
  };

  const filtered = SYMBOLS.filter(s =>
    (cat === "All" || s.cat === cat) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  const sig = result?.signal;
  const sigStyle = {
    BUY:  { color: "#26a69a", bg: "rgba(38,166,154,0.08)",  border: "rgba(38,166,154,0.25)",  label: "BUY",  verdict: "✅ Good to Buy",  sub: "Signal is bullish. Conditions support a long position." },
    SELL: { color: "#ef5350", bg: "rgba(239,83,80,0.08)",   border: "rgba(239,83,80,0.25)",   label: "SELL", verdict: "🚫 Do Not Buy",  sub: "Signal is bearish. Avoid buying at this level." },
    HOLD: { color: "#f9a825", bg: "rgba(249,168,37,0.08)",  border: "rgba(249,168,37,0.25)",  label: "HOLD", verdict: "⚠️ Wait & Watch", sub: "No clear direction. Stay on the sidelines." },
  };
  const ss = sigStyle[sig] || null;

  // Trade levels from quote
  const p    = quote?.price;
  const atr  = p ? (quote.high - quote.low) : 0;
  const sl   = p ? +(p - atr * 1.5).toFixed(4) : null;
  const t1   = p ? +(p + atr * 2).toFixed(4)   : null;
  const t2   = p ? +(p + atr * 3.5).toFixed(4) : null;
  const rr1  = sl && t1 ? (Math.abs(t1 - p) / Math.abs(p - sl)).toFixed(2) : null;
  const rr2  = sl && t2 ? (Math.abs(t2 - p) / Math.abs(p - sl)).toFixed(2) : null;

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold t1">Signal Generator</h1>
        <p className="muted text-sm mt-0.5">Hybrid AI · RSI · MACD · EMA · Bollinger Bands — click any symbol to analyze</p>
      </div>

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

        {/* Symbol grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filtered.map(({ symbol: sym, name, cat: c }) => {
            const isActive = symbol === sym;
            return (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all"
                style={{
                  background:  isActive ? "rgba(41,98,255,0.1)" : "var(--bg3)",
                  border:      `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                  borderLeft:  `3px solid ${isActive ? "var(--accent)" : "transparent"}`,
                }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: isActive ? "var(--accent)" : "var(--text)" }}>
                    {sym.replace("=X","").replace("-USD","").replace(".NS","").replace("^","")}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--muted)" }}>{name}</p>
                </div>
                {isActive && loading && (
                  <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin shrink-0 ml-1" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                )}
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
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 animate-fadeIn">

          {/* ── Left: Signal details ── */}
          <div className="space-y-4">

            {/* Verdict banner */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${ss.border}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ background: ss.bg }}>
                <div>
                  <p className="text-2xl font-black" style={{ color: ss.color }}>{ss.verdict}</p>
                  <p className="text-sm mt-1" style={{ color: ss.color, opacity: 0.8 }}>{ss.sub}</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black" style={{ color: ss.color, fontFamily: "'JetBrains Mono', monospace" }}>
                    {sig}
                  </p>
                  <p className="text-xs font-semibold mt-1" style={{ color: ss.color, opacity: 0.7 }}>
                    {result.confidence}% confidence
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="h-1.5" style={{ background: "var(--bg3)" }}>
                <div
                  className="h-1.5 transition-all duration-700"
                  style={{ width: `${result.confidence}%`, background: ss.color }}
                />
              </div>
            </div>

            {/* Vote breakdown */}
            <div className="card">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Signal Votes</p>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(result.scores).map(([k, v]) => {
                  const c = k === "BUY" ? "#26a69a" : k === "SELL" ? "#ef5350" : "#f9a825";
                  const isWinner = k === sig;
                  return (
                    <div
                      key={k}
                      className="rounded-lg p-3 text-center"
                      style={{
                        background: isWinner ? `${c}18` : "var(--bg3)",
                        border: `1px solid ${isWinner ? c + "44" : "var(--border)"}`,
                      }}
                    >
                      <p className="text-2xl font-black" style={{ color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</p>
                      <p className="text-xs font-bold mt-1" style={{ color: isWinner ? c : "var(--muted)" }}>{k}</p>
                      {isWinner && <p className="text-[10px] mt-0.5" style={{ color: c }}>Winner</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indicators */}
            <div className="card">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Technical Indicators</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(result.indicators).map(([k, v]) => (
                  <div key={k} className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                      {k.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-bold mt-0.5 t1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Trade plan ── */}
          <div className="space-y-4">

            {/* Live price */}
            {quote && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-black text-lg t1">{symbol}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {SYMBOLS.find(s => s.symbol === symbol)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black t1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ${fmt(quote.price, 2)}
                    </p>
                    <p className={`text-sm font-bold ${quote.change_pct >= 0 ? "up" : "down"}`}>
                      {quote.change_pct >= 0 ? "▲ +" : "▼ "}{Number(quote.change_pct).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["High", quote.high], ["Low", quote.low], ["Prev", quote.prev_close]].map(([l, v]) => (
                    <div key={l} className="text-center rounded-lg py-2" style={{ background: "var(--bg3)" }}>
                      <p className="text-[10px]" style={{ color: "var(--muted)" }}>{l}</p>
                      <p className="text-xs font-bold t1 mt-0.5">{fmt(v, 2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trade levels */}
            {p && sig === "BUY" && (
              <div className="card" style={{ borderLeft: "3px solid #26a69a" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Trade Plan</p>
                <div className="space-y-2">
                  {[
                    { label: "Entry Price",  value: `$${fmt(p, 4)}`,  color: "var(--text)",  note: "Buy now" },
                    { label: "Stop Loss",    value: `$${fmt(sl, 4)}`, color: "#ef5350",      note: "Exit if wrong" },
                    { label: "Target 1",     value: `$${fmt(t1, 4)}`, color: "#26a69a",      note: `R/R ${rr1}x` },
                    { label: "Target 2",     value: `$${fmt(t2, 4)}`, color: "#26a69a",      note: `R/R ${rr2}x` },
                  ].map(({ label, value, color, note }) => (
                    <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-xs font-semibold t2">{label}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted)" }}>{note}</p>
                      </div>
                      <p className="text-sm font-black" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk warning for SELL/HOLD */}
            {sig !== "BUY" && (
              <div className="rounded-lg p-4" style={{ background: "rgba(239,83,80,0.06)", border: "1px solid rgba(239,83,80,0.2)" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "#ef5350" }}>⚠️ Do Not Buy</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  The signal engine has detected {sig === "SELL" ? "bearish" : "neutral"} conditions.
                  Buying at this level carries significant risk. Wait for a BUY signal before entering.
                  Never trade with money you cannot afford to lose.
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-lg px-3 py-2.5 text-[11px] text-center" style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--muted2)" }}>
              AI signals are for educational purposes only · Not financial advice
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
