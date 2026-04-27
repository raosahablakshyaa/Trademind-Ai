import React, { useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

const STRENGTH_STYLE = {
  "High Conviction":     { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Moderate Conviction": { color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  "Speculative":         { color: "#6b6b6b", bg: "#f7f7f7", border: "#e2e2e2" },
};

const SENTIMENT_STYLE = {
  BULLISH: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icon: "▲" },
  BEARISH: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "▼" },
};

function formatDate(str) {
  try {
    return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return str; }
}

export default function PredictionPage() {
  const [news, setNews]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState("ALL");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get("/news/analyze");
      setNews(res.data.news);
      if (res.data.news.length === 0) toast("No actionable news right now.", { icon: "📭" });
      else toast.success(`${res.data.news.length} signals found`);
    } catch {
      toast.error("Failed to fetch news. Check backend.");
    } finally { setLoading(false); }
  };

  const filtered = filter === "ALL" ? news : news.filter(n => n.sentiment === filter);
  const bullish  = news.filter(n => n.sentiment === "BULLISH").length;
  const bearish  = news.filter(n => n.sentiment === "BEARISH").length;

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold t1">News Analyzer</h1>
          <p className="text-sm mt-1 muted">
            AI scans live business news · Identifies stocks · Predicts Bullish / Bearish impact
          </p>
        </div>
        <button onClick={fetchNews} disabled={loading} className="btn-primary shrink-0">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scanning…
            </span>
          ) : "⚡ Scan Live News"}
        </button>
      </div>

      {/* ── Stats row (only after scan) ── */}
      {news.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Signals", value: news.length,  color: "#0a0a0a" },
            { label: "Bullish",       value: bullish,       color: "#16a34a" },
            { label: "Bearish",       value: bearish,       color: "#dc2626" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center" style={{ padding: "16px" }}>
              <p className="text-2xl font-black" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
              <p className="text-xs font-medium mt-1 muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter tabs ── */}
      {news.length > 0 && (
        <div className="flex gap-2">
          {[["ALL", "All"], ["BULLISH", "▲ Bullish"], ["BEARISH", "▼ Bearish"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: filter === val ? "var(--accent)" : "var(--bg3)",
                color:      filter === val ? "#fff"          : "var(--muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Cards ── */}
      {news.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-5xl mb-4">📰</p>
          <p className="font-semibold text-base t1">No news scanned yet</p>
          <p className="text-sm mt-1 muted">
            Click "Scan Live News" to analyze Google News RSS for major stocks
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item, i) => {
            const sent  = SENTIMENT_STYLE[item.sentiment] || SENTIMENT_STYLE.BULLISH;
            const str   = STRENGTH_STYLE[item.strength]   || STRENGTH_STYLE["Speculative"];
            return (
              <div
                key={i}
                className="card animate-cardIn"
                style={{ animationDelay: `${i * 40}ms`, padding: "20px", borderLeft: `3px solid ${sent.color}` }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Prob circle */}
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ background: sent.bg, border: `1px solid ${sent.border}` }}
                    >
                      <span className="text-lg font-black leading-none" style={{ color: sent.color, fontFamily: "'JetBrains Mono', monospace" }}>
                        {item.probability}%
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: sent.color }}>Prob</span>
                    </div>

                    {/* Company */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base t1">{item.company}</span>
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: sent.bg, color: sent.color, border: `1px solid ${sent.border}` }}
                        >
                          {sent.icon} {item.sentiment}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono muted">{item.symbol}</span>
                        <span style={{ color: "#e2e2e2" }}>·</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: str.bg, color: str.color, border: `1px solid ${str.border}` }}
                        >
                          {item.strength}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeframe */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                    style={{ background: "var(--bg2)", color: "var(--muted)", border: "1px solid var(--border)" }}
                  >
                    ⏱ {item.timeframe}
                  </span>
                </div>

                {/* Thesis */}
                <div className="mb-3 rounded-lg px-3 py-2.5" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 muted">Trader's Thesis</p>
                  <p className="text-sm italic leading-relaxed t2">"{item.thesis}"</p>
                </div>

                {/* Catalyst */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 muted">Catalyst</p>
                  <p className="text-sm font-medium leading-snug t1">{item.title}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-xs muted">📅 {formatDate(item.published)}</span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold transition-colors t1"
                    onMouseEnter={e => e.currentTarget.style.color = sent.color}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text)"}
                  >
                    View Source ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
