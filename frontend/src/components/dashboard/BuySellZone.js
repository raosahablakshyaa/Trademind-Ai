import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const fmt = (v) => {
  if (v == null) return "—";
  const n = Number(v);
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(5);
};

export default function BuySellZone({ symbol, quote }) {
  const [zones, setZones] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quote?.price) return;
    setLoading(true);
    // Compute zones from price using ATR-style estimation
    const price = quote.price;
    const atr = price * 0.015; // ~1.5% estimated ATR

    // Support / Resistance levels (pivot-style)
    const pivot = (quote.high + quote.low + price) / 3;
    const r1 = 2 * pivot - quote.low;
    const s1 = 2 * pivot - quote.high;
    const r2 = pivot + (quote.high - quote.low);
    const s2 = pivot - (quote.high - quote.low);

    // Signal from backend
    api.get(`/market/quote/${encodeURIComponent(symbol)}`)
      .then(() => {
        const trend = quote.change_pct >= 0 ? "BULLISH" : "BEARISH";
        const signal = quote.change_pct > 1 ? "BUY" : quote.change_pct < -1 ? "SELL" : "HOLD";

        setZones({
          signal,
          trend,
          price,
          // Buy zone
          buyEntry: s1,
          buyTarget1: r1,
          buyTarget2: r2,
          buyStop: s2,
          // Sell zone
          sellEntry: r1,
          sellTarget1: s1,
          sellTarget2: s2,
          sellStop: r2,
          // Key levels
          resistance2: r2,
          resistance1: r1,
          pivot,
          support1: s1,
          support2: s2,
          rr: Math.abs(r1 - s1) / Math.abs(s1 - s2),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [symbol, quote?.price]);

  if (!quote?.price) return null;
  if (loading) return (
    <div className="card animate-pulse">
      <div className="h-4 w-40 rounded mb-3" style={{ background: "var(--bg3)" }} />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl" style={{ background: "var(--bg3)" }} />)}
      </div>
    </div>
  );
  if (!zones) return null;

  const isBuy  = zones.signal === "BUY";
  const isSell = zones.signal === "SELL";

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold t1">Buy / Sell Zones — {symbol}</h3>
          <p className="muted text-xs mt-0.5">Based on pivot levels · Support & Resistance · Trend</p>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-sm font-black"
          style={{
            background: isBuy  ? "rgba(22,163,74,0.08)"  : isSell ? "rgba(220,38,38,0.08)"  : "var(--bg3)",
            color:      isBuy  ? "#16a34a"                : isSell ? "#dc2626"                : "var(--muted)",
            border:     `1px solid ${isBuy ? "rgba(22,163,74,0.25)" : isSell ? "rgba(220,38,38,0.25)" : "var(--border)"}`,
          }}
        >
          {zones.signal} · {zones.trend}
        </div>
      </div>

      {/* Key levels bar */}
      <div className="relative h-10 rounded-xl overflow-hidden" style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}>
        <div className="absolute inset-0 flex items-center px-4">
          {[
            { label: "S2", val: zones.support2,    color: "down" },
            { label: "S1", val: zones.support1,    color: "down" },
            { label: "P",  val: zones.pivot,        color: "muted" },
            { label: "R1", val: zones.resistance1,  color: "up" },
            { label: "R2", val: zones.resistance2,  color: "up" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex-1 text-center">
              <p className={`text-[10px] font-bold ${color}`}>{label}</p>
              <p className="t1 text-[10px] font-mono">{fmt(val)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Buy zone + Sell zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUY ZONE */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: isBuy ? "rgba(22,163,74,0.06)" : "var(--bg2)",
            border: `1px solid ${isBuy ? "rgba(22,163,74,0.3)" : "var(--border)"}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="tag-buy">BUY ZONE</span>
            {isBuy && <span className="text-xs font-semibold up">← Active Signal</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Entry",    zones.buyEntry,   "t1"],
              ["Target 1", zones.buyTarget1, "up"],
              ["Target 2", zones.buyTarget2, "up"],
              ["Stop Loss",zones.buyStop,    "down"],
            ].map(([label, val, color]) => (
              <div key={label} className="rounded-lg p-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] muted">{label}</p>
                <p className={`text-sm font-bold font-mono ${color}`}>{fmt(val)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs muted mt-2">
            R/R: <span className="t1 font-semibold">{zones.rr?.toFixed(2)}x</span>
            &nbsp;·&nbsp;Risk: <span className="down font-semibold">{fmt(Math.abs(zones.buyEntry - zones.buyStop))}</span>
            &nbsp;·&nbsp;Reward: <span className="up font-semibold">{fmt(Math.abs(zones.buyTarget1 - zones.buyEntry))}</span>
          </p>
        </div>

        {/* SELL ZONE */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: isSell ? "rgba(220,38,38,0.06)" : "var(--bg2)",
            border: `1px solid ${isSell ? "rgba(220,38,38,0.3)" : "var(--border)"}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="tag-sell">SELL ZONE</span>
            {isSell && <span className="text-xs font-semibold down">← Active Signal</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Entry",    zones.sellEntry,   "t1"],
              ["Target 1", zones.sellTarget1, "down"],
              ["Target 2", zones.sellTarget2, "down"],
              ["Stop Loss",zones.sellStop,    "up"],
            ].map(([label, val, color]) => (
              <div key={label} className="rounded-lg p-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-[10px] muted">{label}</p>
                <p className={`text-sm font-bold font-mono ${color}`}>{fmt(val)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs muted mt-2">
            R/R: <span className="t1 font-semibold">{zones.rr?.toFixed(2)}x</span>
            &nbsp;·&nbsp;Risk: <span className="down font-semibold">{fmt(Math.abs(zones.sellStop - zones.sellEntry))}</span>
            &nbsp;·&nbsp;Reward: <span className="up font-semibold">{fmt(Math.abs(zones.sellEntry - zones.sellTarget1))}</span>
          </p>
        </div>
      </div>

      <p className="text-[10px] muted text-center">
        Levels calculated from pivot point analysis · Not financial advice · Always use your own judgment
      </p>
    </div>
  );
}
