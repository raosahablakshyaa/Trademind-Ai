import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api, { getErrorMsg } from "../utils/api";
import useAuthStore from "../store/authStore";
import AuthGate from "../components/dashboard/AuthGate";

const EMOTIONS = ["neutral", "confident", "fear", "greed", "anxious", "revenge"];
const STRATEGIES = ["scalping", "intraday", "swing", "positional"];
const EMPTY = {
  symbol: "", strategy: "intraday", entry_price: "", exit_price: "",
  quantity: "", entry_date: "", exit_date: "", pnl: "",
  emotional_state: "neutral", reason: "", notes: "",
};

const EMOTION_EMOJI = { neutral: "😐", confident: "😎", fear: "😨", greed: "🤑", anxious: "😰", revenge: "😤" };
const STRATEGY_LABEL = { scalping: "Scalping", intraday: "Intraday", swing: "Swing", positional: "Positional" };

const fmt = (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function JournalPage() {
  const { token } = useAuthStore();
  const [trades, setTrades]     = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]     = useState("all");

  const fetchTrades = async () => {
    try { const res = await api.get("/journal/"); setTrades(res.data); }
    catch { toast.error("Couldn't load trades"); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (token) fetchTrades(); }, [token]);

  if (!token) return <AuthGate feature="Trade Journal" />;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calculate P&L when prices change
  const handlePriceChange = (k, v) => {
    const updated = { ...form, [k]: v };
    if (updated.entry_price && updated.exit_price && updated.quantity) {
      const pnl = (Number(updated.exit_price) - Number(updated.entry_price)) * Number(updated.quantity);
      updated.pnl = pnl.toFixed(2);
    }
    setForm(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/journal/", {
        ...form,
        entry_price: +form.entry_price, exit_price: +form.exit_price,
        quantity: +form.quantity, pnl: +form.pnl,
      });
      toast.success("Trade logged successfully");
      setForm(EMPTY); setShowForm(false); fetchTrades();
    } catch (err) {
      toast.error(getErrorMsg(err, "Failed to save trade"));
    } finally { setLoading(false); }
  };

  const deleteTrade = async (id) => {
    if (!window.confirm("Delete this trade?")) return;
    try { await api.delete(`/journal/${id}`); toast.success("Trade deleted"); fetchTrades(); }
    catch { toast.error("Delete failed"); }
  };

  const totalPnl  = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const wins      = trades.filter(t => t.pnl > 0).length;
  const losses    = trades.filter(t => t.pnl < 0).length;
  const winRate   = trades.length ? Math.round(wins / trades.length * 100) : 0;
  const avgPnl    = trades.length ? totalPnl / trades.length : 0;

  const filtered = filter === "all" ? trades
    : filter === "wins" ? trades.filter(t => t.pnl > 0)
    : trades.filter(t => t.pnl <= 0);

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0a0a0a" }}>Trade Journal</h1>
          <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>
            {trades.length > 0 ? `${trades.length} trades logged · ${winRate}% win rate` : "Log your trades to track performance over time"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          style={{ fontSize: "14px" }}
        >
          {showForm ? "✕ Cancel" : "+ Log Trade"}
        </button>
      </div>

      {/* Stats */}
      {trades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Trades", value: trades.length, sub: `${wins}W · ${losses}L`, color: "#0a0a0a" },
            { label: "Total P&L",    value: `${totalPnl >= 0 ? "+" : ""}₹${fmt(Math.abs(totalPnl))}`, sub: "All time", color: totalPnl >= 0 ? "#16a34a" : "#dc2626" },
            { label: "Win Rate",     value: `${winRate}%`, sub: `${wins} winning trades`, color: winRate >= 50 ? "#16a34a" : "#dc2626" },
            { label: "Avg P&L",      value: `${avgPnl >= 0 ? "+" : ""}₹${fmt(Math.abs(avgPnl))}`, sub: "Per trade", color: avgPnl >= 0 ? "#16a34a" : "#dc2626" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="card text-center" style={{ padding: "20px 16px" }}>
              <p className="text-2xl font-black mb-1" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
              <p className="text-sm font-semibold" style={{ color: "#0a0a0a" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Log Trade Form */}
      {showForm && (
        <div className="card animate-slideUp" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h2 className="font-bold text-base mb-5" style={{ color: "#0a0a0a" }}>New Trade Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Symbol</label>
                <input className="input" placeholder="AAPL" value={form.symbol}
                  onChange={e => set("symbol", e.target.value.toUpperCase())} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Strategy</label>
                <select className="input" value={form.strategy} onChange={e => set("strategy", e.target.value)}>
                  {STRATEGIES.map(s => <option key={s} value={s}>{STRATEGY_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Emotion</label>
                <select className="input" value={form.emotional_state} onChange={e => set("emotional_state", e.target.value)}>
                  {EMOTIONS.map(em => <option key={em} value={em}>{EMOTION_EMOJI[em]} {em}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Quantity</label>
                <input className="input" type="number" min="1" placeholder="10" value={form.quantity}
                  onChange={e => handlePriceChange("quantity", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Entry Price</label>
                <input className="input" type="number" step="0.01" placeholder="150.00" value={form.entry_price}
                  onChange={e => handlePriceChange("entry_price", e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Exit Price</label>
                <input className="input" type="number" step="0.01" placeholder="155.00" value={form.exit_price}
                  onChange={e => handlePriceChange("exit_price", e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>
                  P&L
                  <span className="text-xs ml-1" style={{ color: "#9a9a9a" }}>(auto)</span>
                </label>
                <input className="input" type="number" step="0.01" value={form.pnl}
                  onChange={e => set("pnl", e.target.value)}
                  style={{ color: Number(form.pnl) >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Reason</label>
                <input className="input" placeholder="Breakout, reversal…" value={form.reason}
                  onChange={e => set("reason", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Entry Date & Time</label>
                <input className="input" type="datetime-local" value={form.entry_date}
                  onChange={e => set("entry_date", e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Exit Date & Time</label>
                <input className="input" type="datetime-local" value={form.exit_date}
                  onChange={e => set("exit_date", e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>Notes</label>
              <textarea className="input resize-none" rows={2} placeholder="What went well? What would you do differently?"
                value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>

            <button type="submit" className="btn-primary w-full justify-center" style={{ padding: "11px", fontSize: "14px" }} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : "Save Trade"}
            </button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      {trades.length > 0 && (
        <div className="flex gap-2">
          {[["all", "All Trades"], ["wins", "Wins"], ["losses", "Losses"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
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

      {/* Trade list */}
      {fetching ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-shimmer" style={{ background: "var(--bg3)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">📓</p>
          <p className="font-semibold text-base t1">No trades yet</p>
          <p className="text-sm mt-1 muted">Click "+ Log Trade" to record your first trade</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => (
            <div
              key={t._id}
              className="card animate-cardIn"
              style={{ animationDelay: `${i * 30}ms`, padding: "16px 20px" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Color bar */}
                  <div className="w-1 h-12 rounded-full shrink-0" style={{ background: t.pnl >= 0 ? "#16a34a" : "#dc2626" }} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base" style={{ color: "#0a0a0a" }}>{t.symbol}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f0f0f0", color: "#6b6b6b" }}>
                        {STRATEGY_LABEL[t.strategy] || t.strategy}
                      </span>
                      <span className="text-xs">{EMOTION_EMOJI[t.emotional_state]} {t.emotional_state}</span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "#6b6b6b" }}>
                      Entry ₹{t.entry_price} → Exit ₹{t.exit_price} · {t.quantity} shares
                      {t.reason && <span> · {t.reason}</span>}
                    </p>
                    {t.notes && <p className="text-xs mt-0.5 italic" style={{ color: "#9a9a9a" }}>{t.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xl font-black" style={{ color: t.pnl >= 0 ? "#16a34a" : "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>
                      {t.pnl >= 0 ? "+" : ""}₹{fmt(Math.abs(t.pnl))}
                    </p>
                    <p className="text-xs" style={{ color: "#9a9a9a" }}>
                      {new Date(t.entry_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTrade(t._id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all"
                    style={{ color: "#9a9a9a", background: "#f7f7f7" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f7f7f7"; e.currentTarget.style.color = "#9a9a9a"; }}
                  >✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
