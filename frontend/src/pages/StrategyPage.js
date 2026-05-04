import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import api, { getErrorMsg } from "../utils/api";
import useAuthStore from "../store/authStore";
import AuthGate from "../components/dashboard/AuthGate";

const STRATEGY_META = {
  scalping:   { icon: "⚡", desc: "Very short-term trades, seconds to minutes. High frequency, small gains." },
  intraday:   { icon: "☀️", desc: "Trades opened and closed within the same day. No overnight risk." },
  swing:      { icon: "〰️", desc: "Trades held for days to weeks. Captures medium-term price moves." },
  positional: { icon: "📅", desc: "Long-term trades held for weeks to months. Follows major trends." },
};

const fmt = (v) => {
  const n = Number(v);
  return (n >= 0 ? "+" : "") + "₹" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p className="font-bold capitalize mb-1 t1">{d.strategy}</p>
      <p style={{ color: d.total_pnl >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(d.total_pnl)} P&L</p>
      <p className="muted">{d.win_rate}% win rate</p>
    </div>
  );
};

export default function StrategyPage() {
  const { token } = useAuthStore();
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (token) analyze(); }, [token]);

  if (!token) return <AuthGate feature="Strategy Analyzer" />;

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await api.get("/strategy/analyze");
      setResult(res.data);
    } catch (err) {
      toast.error(getErrorMsg(err, "Analysis failed"));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0a0a0a" }}>Strategy Analyzer</h1>
          <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>
            Compare your performance across scalping, intraday, swing and positional strategies
          </p>
        </div>
        <button onClick={analyze} className="btn-ghost" disabled={loading} style={{ fontSize: "13px" }}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              Analyzing…
            </span>
          ) : "↻ Refresh"}
        </button>
      </div>

      {loading && !result && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl animate-shimmer" style={{ background: "var(--bg3)" }} />)}
        </div>
      )}

      {result && !loading && (
        <>
          {result.strategies.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-4">📊</p>
              <p className="font-semibold text-base" style={{ color: "#0a0a0a" }}>No strategy data yet</p>
              <p className="text-sm mt-1" style={{ color: "#9a9a9a" }}>
                Log trades with different strategies in your Journal to see comparisons here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Best strategy banner */}
              {result.best_strategy && (
                <div
                  className="rounded-xl p-5 flex items-center gap-4 animate-cardIn"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <span className="text-3xl">🏆</span>
                  <div>
                    <p className="font-bold text-base capitalize" style={{ color: "#15803d" }}>
                      {result.best_strategy} is your best strategy
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "#16a34a" }}>{result.recommendation}</p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="card">
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#9a9a9a" }}>
                  Total P&L by Strategy
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={result.strategies} barSize={40}>
                    <XAxis
                      dataKey="strategy"
                      tick={{ fill: "#6b6b6b", fontSize: 12, fontFamily: "Inter" }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#9a9a9a", fontSize: 11, fontFamily: "Inter" }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg2)" }} />
                    <ReferenceLine y={0} stroke="#e2e2e2" />
                    <Bar dataKey="total_pnl" radius={[6, 6, 0, 0]}>
                      {result.strategies.map((s, i) => (
                        <Cell key={i} fill={s.total_pnl >= 0 ? "#0a0a0a" : "#e2e2e2"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Strategy cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.strategies.map((s, i) => {
                  const meta = STRATEGY_META[s.strategy] || { icon: "📈", desc: "" };
                  const isBest = s.strategy === result.best_strategy;
                  return (
                    <div
                      key={s.strategy}
                      className="card animate-cardIn"
                      style={{
                        animationDelay: `${i * 60}ms`,
                        border: isBest ? "1px solid #0a0a0a" : "1px solid #e2e2e2",
                      }}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-base capitalize" style={{ color: "#0a0a0a" }}>{s.strategy}</p>
                              {isBest && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#0a0a0a", color: "#fff" }}>
                                  Best
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>{meta.desc}</p>
                          </div>
                        </div>
                        <p
                          className="text-xl font-black"
                          style={{ color: s.total_pnl >= 0 ? "#16a34a" : "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {fmt(s.total_pnl)}
                        </p>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Trades",    value: s.total_trades,                  color: "#0a0a0a" },
                          { label: "Win Rate",  value: `${s.win_rate}%`,                color: s.win_rate >= 50 ? "#16a34a" : "#dc2626" },
                          { label: "Wins",      value: s.wins,                          color: "#16a34a" },
                          { label: "Avg P&L",   value: fmt(s.avg_pnl_per_trade),        color: s.avg_pnl_per_trade >= 0 ? "#16a34a" : "#dc2626" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center rounded-lg py-2.5" style={{ background: "#f7f7f7" }}>
                            <p className="text-sm font-bold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Win/loss bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1" style={{ color: "#9a9a9a" }}>
                          <span>{s.wins} wins</span>
                          <span>{s.losses} losses</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: "#f0f0f0" }}>
                          <div
                            className="h-1.5 transition-all duration-700"
                            style={{ width: `${s.win_rate}%`, background: "#0a0a0a", borderRadius: "99px 0 0 99px" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insight */}
              <div className="card" style={{ background: "#fafafa" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9a9a9a" }}>How to use this data</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: "🎯", title: "Double down on winners", desc: "Allocate more capital and time to your best-performing strategy." },
                    { icon: "✂️", title: "Cut losing strategies", desc: "If a strategy has a win rate below 40%, consider dropping it entirely." },
                    { icon: "📈", title: "Track over time", desc: "Log more trades to get statistically significant results (50+ trades per strategy)." },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{icon}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#0a0a0a" }}>{title}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#6b6b6b" }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
