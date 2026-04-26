import React, { useState, useEffect } from "react";
import api from "../../utils/api";

const POPULAR = [
  { symbol: "AAPL", name: "Apple" }, { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSLA", name: "Tesla" }, { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Google" }, { symbol: "AMZN", name: "Amazon" },
  { symbol: "BTC-USD", name: "Bitcoin" }, { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "RELIANCE.NS", name: "Reliance" }, { symbol: "TCS.NS", name: "TCS" },
  { symbol: "INFY.NS", name: "Infosys" }, { symbol: "^NSEI", name: "Nifty 50" },
  { symbol: "GC=F", name: "Gold" }, { symbol: "EURUSD=X", name: "EUR/USD" },
];

export default function SymbolPicker({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [quote, setQuote] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const r = await api.get(`/market/search?q=${encodeURIComponent(search)}`); setResults(r.data); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!value) return;
    setQuote(null);
    api.get(`/market/quote/${encodeURIComponent(value)}`).then(r => setQuote(r.data)).catch(() => {});
  }, [value]);

  const pick = (sym) => { onChange(sym); setSearch(""); setResults([]); setOpen(false); };

  return (
    <div className="space-y-3">
      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR.map(({ symbol, name }) => (
          <button key={symbol} onClick={() => pick(symbol)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              value === symbol ? "bg-accent text-white border-accent" : "t2 hover:t1"
            }`}
            style={value !== symbol ? { borderColor: "var(--border)", background: "var(--bg3)" } : {}}>
            {name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input className="input" placeholder="Or search any symbol…"
          value={search} onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} />
        {open && results.length > 0 && (
          <div className="absolute top-full mt-1 w-full rounded-xl shadow-xl z-50 overflow-hidden"
            style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            {results.map(r => (
              <button key={r.symbol} onClick={() => pick(r.symbol)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--bg3)] transition-colors">
                <div>
                  <p className="text-sm font-semibold t1">{r.symbol}</p>
                  <p className="text-xs muted">{r.name}</p>
                </div>
                <span className="text-xs muted">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live quote strip */}
      {value && quote && (
        <div className="panel flex items-center justify-between">
          <div>
            <span className="font-bold t1 text-sm">{value}</span>
            <span className="muted text-xs ml-2">{quote.price ? `$${Number(quote.price).toLocaleString(undefined, { maximumFractionDigits: 4 })}` : "—"}</span>
          </div>
          <span className={`text-xs font-bold ${quote.change_pct >= 0 ? "up" : "down"}`}>
            {quote.change_pct >= 0 ? "▲ +" : "▼ "}{Number(quote.change_pct).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}
