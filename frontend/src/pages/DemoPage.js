import React, { useState, useEffect, useCallback, useRef } from "react";
import useDemoStore from "../store/demoStore";
import useAuthStore from "../store/authStore";
import AuthGate from "../components/dashboard/AuthGate";
import api from "../utils/api";

const STARTING_BALANCE = 10000;
const QUICK = ["AAPL", "NVDA", "TSLA", "MSFT", "BTC-USD", "ETH-USD", "RELIANCE.NS", "GOOGL", "AMZN", "GC=F"];

const fmt = (v, d = 2) => {
  if (v == null || isNaN(Number(v))) return "—";
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  if (Math.abs(n) >= 1) return n.toFixed(d);
  return n.toFixed(4);
};

const PnlCell = ({ value }) => {
  if (value == null || isNaN(value)) return <span className="muted">—</span>;
  const n = Number(value);
  return <span className={n >= 0 ? "up" : "down"}>{n >= 0 ? "+" : ""}${fmt(Math.abs(n))}</span>;
};

const WARN_PCT     = -2;
const DANGER_PCT   = -5;
const CRITICAL_PCT = -8;

function RiskAlert({ alert, onDismiss, onSell }) {
  const styles = {
    critical: { bg: "#fef2f2", border: "#fca5a5", title: "#b91c1c", text: "#dc2626", btn: "#dc2626" },
    danger:   { bg: "#fff7ed", border: "#fdba74", title: "#c2410c", text: "#ea580c", btn: "#ea580c" },
    warn:     { bg: "#fefce8", border: "#fde047", title: "#a16207", text: "#ca8a04", btn: "#ca8a04" },
  };
  const s = styles[alert.level];
  return (
    <div className="rounded-xl p-4 animate-slideUp" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-bold text-sm mb-1" style={{ color: s.title }}>{alert.title}</p>
          <p className="text-xs leading-relaxed" style={{ color: s.text }}>{alert.msg}</p>
        </div>
        <button onClick={onDismiss} className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ color: s.text, background: s.border }}>×</button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => onSell(alert.sym)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:brightness-110"
          style={{ background: s.btn }}>{alert.action} {alert.sym}</button>
        <button onClick={onDismiss} className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ color: s.text, border: `1px solid ${s.border}` }}>Dismiss</button>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const { token } = useAuthStore();
  // Pull everything from global store — livePrices & riskAlerts persist across page changes
  const { account, loading, fetch, buy, sell, reset, livePrices, riskAlerts, dismissAlert } = useDemoStore();

  const [symbol, setSymbol] = useState("AAPL");
  const [qty, setQty]       = useState(1);
  const [quote, setQuote]   = useState(null);
  const [msg, setMsg]       = useState(null);
  const [busy, setBusy]     = useState(false);
  const timerRef            = useRef(null);

  // Load account once on mount
  useEffect(() => { if (token) fetch(); }, [token]);

  // Quote for selected symbol (order panel display only)
  const fetchQuote = useCallback(async (sym) => {
    try {
      const res = await api.get(`/market/quote/${encodeURIComponent(sym)}`);
      setQuote(res.data);
    } catch { setQuote(null); }
  }, []);

  useEffect(() => {
    fetchQuote(symbol);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchQuote(symbol), 15000);
    return () => clearInterval(timerRef.current);
  }, [symbol, fetchQuote]);

  if (!token) return <AuthGate feature="Demo Account" />;

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const handleBuy = async () => {
    if (!quote?.price) return flash("Waiting for live price…", false);
    setBusy(true);
    const res = await buy(symbol, quote.price, Number(qty));
    setBusy(false);
    res.error ? flash(res.error, false) : flash(`✓ Bought ${qty} × ${symbol} @ $${fmt(quote.price, 4)}`);
  };

  const handleSell = async () => {
    if (!quote?.price) return flash("Waiting for live price…", false);
    setBusy(true);
    const res = await sell(symbol, quote.price, Number(qty));
    setBusy(false);
    if (res.error) { flash(res.error, false); return; }
    flash(`✓ Sold ${qty} × ${symbol} @ $${fmt(quote.price, 4)} · P&L: ${res.pnl >= 0 ? "+" : ""}$${fmt(res.pnl)}`);
  };

  const handleReset = async () => {
    if (!window.confirm("Reset demo account? All trades and positions will be cleared.")) return;
    await reset();
    flash("Account reset to $10,000");
  };

  const handleRecalculate = async () => {
    setBusy(true);
    try {
      await api.post("/demo/recalculate");
      await fetch();
      flash("✓ Portfolio recalculated from trade history");
    } catch { flash("Recalculate failed", false); }
    finally { setBusy(false); }
  };

  const sellFromAlert = async (sym) => {
    const h  = account?.portfolio?.[sym];
    const lp = livePrices[sym];
    if (!h || !lp) return;
    setBusy(true);
    const res = await sell(sym, lp, h.qty);
    setBusy(false);
    if (res.error) { flash(res.error, false); return; }
    flash(`✓ Sold all ${h.qty} × ${sym} @ $${fmt(lp, 4)} · P&L: ${res.pnl >= 0 ? "+" : ""}$${fmt(res.pnl)}`);
  };

  if (loading && !account) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "#e2e2e2", borderTopColor: "#0a0a0a" }} />
          <p className="muted text-sm">Loading your account…</p>
        </div>
      </div>
    );
  }

  const portfolio   = account?.portfolio || {};
  const trades      = account?.trades || [];
  const balance     = account?.balance ?? STARTING_BALANCE;
  const realizedPnl = account?.realized_pnl ?? 0;
  const holding     = portfolio[symbol];
  const liveForSym  = livePrices[symbol] ?? quote?.price;
  const holdingSyms = Object.keys(portfolio);

  // All prices loaded when every holding has a live price
  const allLoaded = holdingSyms.length === 0 || holdingSyms.every(s => livePrices[s] != null);

  const unrealizedPnl = allLoaded
    ? holdingSyms.reduce((sum, sym) => {
        const h  = portfolio[sym];
        const lp = livePrices[sym];
        return lp != null ? sum + (lp - h.avg_price) * h.qty : sum;
      }, 0)
    : null;

  const portfolioValue = holdingSyms.reduce((sum, sym) => {
    const h  = portfolio[sym];
    const lp = livePrices[sym] ?? h.avg_price;
    return sum + lp * h.qty;
  }, 0);

  const netWorth = balance + portfolioValue;
  const totalPnl = unrealizedPnl != null ? realizedPnl + unrealizedPnl : null;
  const totalPct = ((netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 100;

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold t1">Demo Account</h1>
          <p className="muted text-sm mt-0.5">Paper trading · $10,000 virtual · Live prices · Your personal account</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRecalculate} disabled={busy} className="btn-ghost text-xs">
            {busy ? "Fixing…" : "↻ Fix P&L Data"}
          </button>
          <button onClick={handleReset} className="btn-ghost text-xs">Reset Account</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Cash Balance",    value: `$${fmt(balance)}`,                                              sub: `${fmt((balance / STARTING_BALANCE) * 100)}% of capital`, cls: "t1" },
          { label: "Portfolio Value", value: `$${fmt(portfolioValue)}`,                                        sub: `${holdingSyms.length} position${holdingSyms.length !== 1 ? "s" : ""}`, cls: "t1" },
          { label: "Net Worth",       value: `$${fmt(netWorth)}`,                                              sub: `${totalPct >= 0 ? "+" : ""}${fmt(totalPct)}% overall`, cls: netWorth >= STARTING_BALANCE ? "up" : "down" },
          { label: "Realized P&L",    value: `${realizedPnl >= 0 ? "+" : ""}$${fmt(Math.abs(realizedPnl))}`,  sub: "From closed trades", cls: realizedPnl >= 0 ? "up" : "down" },
          {
            label: "Unrealized P&L",
            value: unrealizedPnl != null ? `${unrealizedPnl >= 0 ? "+" : ""}$${fmt(Math.abs(unrealizedPnl))}` : null,
            sub:   totalPnl != null ? `Total P&L: ${totalPnl >= 0 ? "+" : ""}$${fmt(Math.abs(totalPnl))}` : "Fetching prices…",
            cls:   unrealizedPnl != null ? (unrealizedPnl >= 0 ? "up" : "down") : "muted",
          },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className="card-sm">
            <p className="text-[11px] muted mb-1">{label}</p>
            {value != null ? (
              <p className={`text-lg font-black ${cls}`}>{value}</p>
            ) : (
              <div className="flex items-center gap-1.5 my-1">
                <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                  style={{ borderColor: "#e2e2e2", borderTopColor: "#0a0a0a" }} />
                <span className="text-xs" style={{ color: "#9a9a9a" }}>Loading…</span>
              </div>
            )}
            <p className="text-[10px] muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="space-y-2">
          {[...riskAlerts].sort((a, b) => a.pct - b.pct).map(alert => (
            <RiskAlert key={alert.key} alert={alert}
              onDismiss={() => dismissAlert(alert.key)}
              onSell={sellFromAlert} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

        {/* Order Panel */}
        <div className="card space-y-4">
          <h2 className="font-semibold t1 text-sm">Place Order</h2>

          <div className="flex flex-wrap gap-1.5">
            {QUICK.map(s => (
              <button key={s} onClick={() => setSymbol(s)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${symbol === s ? "bg-accent text-white border-accent" : "t2 hover:t1"}`}
                style={symbol !== s ? { borderColor: "var(--border)", background: "var(--bg3)" } : {}}>
                {s.replace("-USD", "").replace(".NS", "")}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs muted block mb-1">Symbol</label>
            <input className="input" value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              onBlur={() => fetchQuote(symbol)} />
          </div>

          <div>
            <label className="text-xs muted block mb-1">Quantity</label>
            <input type="number" min="1" className="input" value={qty} onChange={e => setQty(e.target.value)} />
          </div>

          <div className="panel">
            {quote ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-black t1">${fmt(quote.price, 4)}</p>
                    <p className={`text-xs font-semibold ${quote.change_pct >= 0 ? "up" : "down"}`}>
                      {quote.change_pct >= 0 ? "▲ +" : "▼ "}{Number(quote.change_pct).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] muted">Order Value</p>
                    <p className="font-bold t1">${fmt(quote.price * qty)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  {[["High", quote.high], ["Low", quote.low], ["Prev", quote.prev_close]].map(([l, v]) => (
                    <div key={l} className="text-center">
                      <p className="text-[10px] muted">{l}</p>
                      <p className="text-xs font-mono t1">{fmt(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-12 rounded-lg animate-pulse" style={{ background: "var(--bg3)" }} />
            )}
          </div>

          {holding && (
            <div className="panel space-y-1.5 text-sm">
              <p className="text-[10px] muted font-semibold uppercase tracking-wide">Open Position</p>
              {[
                ["Shares",        holding.qty],
                ["Avg Buy Price", `$${fmt(holding.avg_price, 4)}`],
                ["Current Price", liveForSym ? `$${fmt(liveForSym, 4)}` : "—"],
                ["Invested",      `$${fmt(holding.avg_price * holding.qty)}`],
                ["Curr. Value",   liveForSym ? `$${fmt(liveForSym * holding.qty)}` : "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="muted">{l}</span>
                  <span className="t1 font-mono font-semibold">{v}</span>
                </div>
              ))}
              {liveForSym != null && (() => {
                const upnl = (liveForSym - holding.avg_price) * holding.qty;
                const upct = ((liveForSym - holding.avg_price) / holding.avg_price) * 100;
                return (
                  <div className="flex justify-between pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="muted">Unrealized P&L</span>
                    <span className={`font-bold font-mono ${upnl >= 0 ? "up" : "down"}`}>
                      {upnl >= 0 ? "+" : ""}${fmt(upnl)} ({upnl >= 0 ? "+" : ""}{fmt(upct)}%)
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {msg && (
            <div className={`p-3 rounded-xl text-xs font-semibold text-center ${
              msg.ok ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                     : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}>{msg.text}</div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleBuy} disabled={!quote?.price || busy} className="btn-buy py-3 disabled:opacity-40">
              {busy ? "…" : "BUY"}
            </button>
            <button onClick={handleSell} disabled={!quote?.price || !holding || busy} className="btn-sell py-3 disabled:opacity-40">
              {busy ? "…" : "SELL"}
            </button>
          </div>
          <p className="text-[10px] muted text-center">Demo only · Not real money</p>
        </div>

        {/* Right: Positions + History */}
        <div className="space-y-4">

          <div className="card overflow-x-auto">
            <h3 className="font-semibold t1 text-sm mb-4">Open Positions</h3>
            {holdingSyms.length === 0 ? (
              <p className="muted text-sm text-center py-10">No open positions.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] muted uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Symbol", "Qty", "Avg Cost", "LTP", "Invested", "Mkt Value", "Unreal. P&L", "P&L %", "Risk"].map(h => (
                      <th key={h} className={`pb-2.5 font-medium ${h === "Symbol" ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(portfolio).map(([sym, h]) => {
                    const lp      = livePrices[sym];
                    const invested = h.avg_price * h.qty;
                    const mktVal  = lp != null ? lp * h.qty : null;
                    const upnl    = lp != null ? (lp - h.avg_price) * h.qty : null;
                    const upct    = lp != null ? ((lp - h.avg_price) / h.avg_price) * 100 : null;
                    return (
                      <tr key={sym} onClick={() => setSymbol(sym)}
                        className="cursor-pointer hover:bg-[var(--bg3)] transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="py-3 font-bold t1">{sym}</td>
                        <td className="py-3 text-right t2">{h.qty}</td>
                        <td className="py-3 text-right font-mono t2">${fmt(h.avg_price, 4)}</td>
                        <td className="py-3 text-right font-mono t1 font-semibold">
                          {lp != null ? `$${fmt(lp, 4)}` : <span className="muted animate-pulse text-xs">loading…</span>}
                        </td>
                        <td className="py-3 text-right font-mono t2">${fmt(invested)}</td>
                        <td className="py-3 text-right font-mono t1">{mktVal != null ? `$${fmt(mktVal)}` : "—"}</td>
                        <td className="py-3 text-right font-mono font-bold"><PnlCell value={upnl} /></td>
                        <td className="py-3 text-right font-mono font-bold">
                          {upct != null
                            ? <span className={upct >= 0 ? "up" : "down"}>{upct >= 0 ? "+" : ""}{fmt(upct)}%</span>
                            : <span className="muted">—</span>}
                        </td>
                        <td className="py-3 text-right">
                          {upct == null && <span className="muted text-xs">—</span>}
                          {upct != null && upct <= CRITICAL_PCT && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#fef2f2", color: "#b91c1c" }}>🚨 CRITICAL</span>}
                          {upct != null && upct > CRITICAL_PCT && upct <= DANGER_PCT && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#fff7ed", color: "#c2410c" }}>⚠️ SELL</span>}
                          {upct != null && upct > DANGER_PCT && upct <= WARN_PCT && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#fefce8", color: "#a16207" }}>🟡 WATCH</span>}
                          {upct != null && upct > WARN_PCT && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#f0fdf4", color: "#15803d" }}>✓ OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold t1 text-sm">Order History</h3>
              <div className="flex gap-4 text-xs">
                <span className="muted">Realized: <span className={realizedPnl >= 0 ? "up font-bold" : "down font-bold"}>{realizedPnl >= 0 ? "+" : ""}${fmt(Math.abs(realizedPnl))}</span></span>
                <span className="muted">Unrealized: <span className={unrealizedPnl != null && unrealizedPnl >= 0 ? "up font-bold" : "down font-bold"}>{unrealizedPnl != null ? `${unrealizedPnl >= 0 ? "+" : ""}$${fmt(Math.abs(unrealizedPnl))}` : "—"}</span></span>
              </div>
            </div>
            {trades.length === 0 ? (
              <p className="muted text-sm text-center py-10">No trades yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: "var(--bg2)" }}>
                    <tr className="text-[11px] muted uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Time", "Type", "Symbol", "Qty", "Price", "Value", "Realized P&L"].map(h => (
                        <th key={h} className={`pb-2 font-medium ${["Time","Type","Symbol"].includes(h) ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t, i) => (
                      <tr key={t.id || i} className="hover:bg-[var(--bg3)] transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="py-2.5 text-xs muted whitespace-nowrap">
                          {new Date(t.time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            t.type === "BUY" ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
                          }`}>{t.type}</span>
                        </td>
                        <td className="py-2.5 font-bold t1">{t.symbol}</td>
                        <td className="py-2.5 text-right t2">{t.qty}</td>
                        <td className="py-2.5 text-right font-mono t2">${fmt(t.price, 4)}</td>
                        <td className="py-2.5 text-right font-mono t1">${fmt(t.total)}</td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          {t.pnl != null ? <PnlCell value={t.pnl} /> : <span className="muted text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
