import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";

export default function LiveTicker() {
  const [quotes, setQuotes] = useState([]);

  const load = async () => {
    try {
      const r = await api.get("/market/watchlist");
      if (Array.isArray(r.data)) setQuotes(r.data);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // 30s — backend caches for 15s anyway
    return () => clearInterval(t);
  }, []);

  if (!quotes.length) return null;

  const items = [...quotes, ...quotes];

  return (
    <div
      className="h-7 flex items-center overflow-hidden shrink-0"
      style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}
    >
      {/* LIVE badge */}
      <Link
        to="/app/market"
        className="shrink-0 px-3 h-full flex items-center gap-1.5 hover:bg-[var(--bg3)] transition-colors"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse2" style={{ background: "var(--green)" }} />
        <span className="text-[10px] font-bold tracking-widest" style={{ color: "var(--muted)" }}>LIVE</span>
      </Link>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        <div className="flex animate-ticker gap-8 whitespace-nowrap">
          {items.map((q, i) => {
            const up = (q.change_pct || 0) >= 0;
            const label = (q.symbol || "")
              .replace("=X", "").replace("-USD", "").replace(".NS", "").replace("^", "");
            return (
              <Link
                key={i}
                to="/app/market"
                className="inline-flex items-center gap-1.5 shrink-0 hover:opacity-70 transition-opacity"
                style={{ textDecoration: "none" }}
              >
                <span className="text-[11px] font-semibold" style={{ color: "var(--muted)" }}>{label}</span>
                <span className="text-[11px] font-mono font-medium t1">
                  {Number(q.price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] font-bold ${up ? "up" : "down"}`}>
                  {up ? "▲" : "▼"}{Math.abs(q.change_pct || 0).toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
