import React, { useState, useEffect, useCallback, useRef } from "react";
import useDemoStore from "../store/demoStore";
import useAuthStore from "../store/authStore";
import useFxStore from "../store/fxStore";
import AuthGate from "../components/dashboard/AuthGate";
import api from "../utils/api";

const STARTING_BALANCE = 1000000; // ₹10,00,000
const QUICK = ["RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","AAPL","NVDA","BTC-USD","ETH-USD","GC=F","USDINR=X"];

// Format number with commas (Indian style for large, standard for small)
const fmtNum = (v, d = 2) => {
  if (v == null || isNaN(Number(v))) return "—";
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
  if (Math.abs(n) >= 1)    return n.toFixed(d);
  return n.toFixed(4);
};

const WARN_PCT     = -2;
const DANGER_PCT   = -5;
const CRITICAL_PCT = -8;

function RiskAlert({ alert, onDismiss, onSell }) {
  const styles = {
    critical:       { bg: "#fef2f2", border: "#fca5a5", title: "#b91c1c", text: "#dc2626", btn: "#dc2626" },
    danger:         { bg: "#fff7ed", border: "#fdba74", title: "#c2410c", text: "#ea580c", btn: "#ea580c" },
    warn:           { bg: "#fefce8", border: "#fde047", title: "#a16207", text: "#ca8a04", btn: "#ca8a04" },
    profit_protect: { bg: "#f0fdf4", border: "#86efac", title: "#15803d", text: "#16a34a", btn: "#16a34a" },
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
  const { account, loading, fetch, buy, sell, reset, livePrices, riskAlerts, dismissAlert } = useDemoStore();
  const { usdInr, toInr, fmtInr, isInr, startRefresh, stopRefresh } = useFxStore();

  const [symbol, setSymbol] = useState("RELIANCE.NS");
  const [qty, setQty]       = useState(1);
  const [quote, setQuote]   = useState(null);
  const [msg, setMsg]       = useState(null);
  const [busy, setBusy]     = useState(false);
  const timerRef            = useRef(null);

  useEffect(() => {
    if (token) fetch();
    startRefresh();
    return () => stopRefresh();
  }, [token]);

  // Trigger price poll when portfolio loads
  const { _pollPrices } = useDemoStore();
  useEffect(() => {
    if (account?.portfolio && Object.keys(account.portfolio).length > 0) {
      _pollPrices();
    }
  }, [JSON.stringify(Object.keys(account?.portfolio || {}))]);

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
  }, [symbol]); // removed fetchQuote from deps to avoid stale closure

  if (!token) return <AuthGate feature="Demo Account" />;

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  // Raw price from API (always send this to backend — no conversion)
  const rawPrice = quote?.price ?? null;

  const handleBuy = async () => {
    if (!rawPrice) return flash("Waiting for live price…", false);
    setBusy(true);
    const res = await buy(symbol, rawPrice, Number(qty));
    setBusy(false);
    res.error ? flash(res.error, false) : flash(`✓ Bought ${qty} × ${symbol} @ ${fmtInr(rawPrice, symbol)}`);
  };

  const handleSell = async () => {
    if (!rawPrice) return flash("Waiting for live price…", false);
    setBusy(true);
    const res = await sell(symbol, rawPrice, Number(qty));
    setBusy(false);
    if (res.error) { flash(res.error, false); return; }
    // P&L from backend is in raw currency — convert to INR for display
    const pnlInr = isInr(symbol) ? res.pnl : res.pnl * usdInr;
    flash(`✓ Sold ${qty} × ${symbol} @ ${fmtInr(rawPrice, symbol)} · P&L: ${pnlInr >= 0 ? "+" : ""}₹${fmtNum(Math.abs(pnlInr))}`);
  };

  const handleReset = async () => {
    if (!window.confirm("Reset demo account? All trades and positions will be cleared.")) return;
    await reset();
    flash("Account reset to ₹10,00,000");
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
    // livePrices stores raw prices now — use directly
    const lp = livePrices[sym];
    if (!h || !lp) return;
    setBusy(true);
    const res = await sell(sym, lp, h.qty);
    setBusy(false);
    if (res.error) { flash(res.error, false); return; }
    const pnlInr = useFxStore.getState().isInr(sym) ? res.pnl : res.pnl * usdInr;
    flash(`✓ Sold all ${h.qty} × ${sym} · P&L: ${pnlInr >= 0 ? "+" : ""}₹${fmtNum(Math.abs(pnlInr))}`);
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

  // avg_price is always raw (same currency as API) — convert to INR for display only
  const toInrAvg = (avgPrice, sym) => {
    if (!avgPrice) return null;
    return toInr(avgPrice, sym) ?? avgPrice;
  };
  const portfolio   = account?.portfolio || {};
  const trades      = account?.trades || [];
  const balance     = account?.balance ?? STARTING_BALANCE;
  const realizedPnl = account?.realized_pnl ?? 0;
  const holding     = portfolio[symbol];
  // livePrices stores raw prices — convert to INR for display
  const liveForSym = livePrices[symbol] != null ? toInr(livePrices[symbol], symbol) : (rawPrice ? toInr(rawPrice, symbol) : null);
  const holdingSyms = Object.keys(portfolio);

  const allLoaded = holdingSyms.length === 0 || holdingSyms.every(s => livePrices[s] != null);

  // livePrices stores raw prices — convert to INR for P&L calculation
  const unrealizedPnl = allLoaded
    ? holdingSyms.reduce((sum, sym) => {
        const h      = portfolio[sym];
        const rawLp  = livePrices[sym];
        if (rawLp == null) return sum;
        const lpInr  = toInr(rawLp, sym) ?? rawLp;
        const avgInr = toInrAvg(h.avg_price, sym);
        return sum + (lpInr - avgInr) * h.qty;
      }, 0)
    : null;

  const portfolioValue = holdingSyms.reduce((sum, sym) => {
    const h     = portfolio[sym];
    const rawLp = livePrices[sym];
    const lpInr = rawLp != null ? (toInr(rawLp, sym) ?? rawLp) : toInrAvg(h.avg_price, sym);
    return sum + lpInr * h.qty;
  }, 0);

  const totalPnl = unrealizedPnl != null ? realizedPnl + unrealizedPnl : null;

  // Helper: format INR value (already in INR)
  const fmtRs = (v, d = 2) => {
    if (v == null || isNaN(v)) return "—";
    const n = Number(v);
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (Math.abs(n) >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
    return `₹${fmtNum(Math.abs(n), d)}`;
  };

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold t1">Demo Account</h1>
          <p className="muted text-sm mt-0.5">
            Paper trading · ₹10,00,000 virtual · Live prices · 1 USD = ₹{fmtNum(usdInr, 2)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRecalculate} disabled={busy} className="btn-ghost text-xs">
            {busy ? "Fixing…" : "↻ Fix P&L"}
          </button>
          <button onClick={handleReset} className="btn-ghost text-xs">Reset Account</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Cash Balance",    value: fmtRs(balance),                                                          sub: `${fmtNum((balance / STARTING_BALANCE) * 100)}% of capital`, cls: "t1" },
          { label: "Portfolio Value", value: fmtRs(portfolioValue),                                                    sub: `${holdingSyms.length} position${holdingSyms.length !== 1 ? "s" : ""}`, cls: "t1" },
          { label: "Realized P&L",    value: `${realizedPnl >= 0 ? "+" : "-"}${fmtRs(Math.abs(realizedPnl))}`,        sub: "From closed trades", cls: realizedPnl >= 0 ? "up" : "down" },
          {
            label: "Unrealized P&L",
            value: unrealizedPnl != null ? `${unrealizedPnl >= 0 ? "+" : "-"}${fmtRs(Math.abs(unrealizedPnl))}` : null,
            sub:   totalPnl != null ? `Total: ${totalPnl >= 0 ? "+" : "-"}${fmtRs(Math.abs(totalPnl))}` : "Fetching…",
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
                <span className="text-xs muted">Loading…</span>
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
                {s.replace("-USD","").replace(".NS","")}
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

          {/* Price panel */}
          <div className="panel">
            {quote ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    {/* INR price — big */}
                    <p className="text-xl font-black t1">{fmtInr(quote.price, symbol)}</p>
                    {/* Show original USD price if converted */}
                    {!isInr(symbol) && (
                      <p className="text-[10px] muted">${fmtNum(quote.price, 4)} × ₹{fmtNum(usdInr, 2)}</p>
                    )}
                    <p className={`text-xs font-semibold ${quote.change_pct >= 0 ? "up" : "down"}`}>
                      {quote.change_pct >= 0 ? "▲ +" : "▼ "}{Number(quote.change_pct).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] muted">Order Value</p>
                    <p className="font-bold t1">{fmtInr(quote.price * qty, symbol)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  {[["High", quote.high], ["Low", quote.low], ["Prev", quote.prev_close]].map(([l, v]) => (
                    <div key={l} className="text-center">
                      <p className="text-[10px] muted">{l}</p>
                      <p className="text-xs font-mono t1">{fmtInr(v, symbol)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-12 rounded-lg animate-pulse" style={{ background: "var(--bg3)" }} />
            )}
          </div>

          {/* Open position */}
          {holding && (
            <div className="panel space-y-1.5 text-sm">
              <p className="text-[10px] muted font-semibold uppercase tracking-wide">Open Position</p>
              {(() => {
                const avgInr  = toInrAvg(holding.avg_price, symbol);
                const currInr = liveForSym;
                const upnl    = currInr != null ? (currInr - avgInr) * holding.qty : null;
                const upct    = currInr != null ? ((currInr - avgInr) / avgInr) * 100 : null;
                return (
                  <>
                    {[
                      ["Shares",      holding.qty],
                      ["Avg Buy",     fmtRs(avgInr)],
                      ["Current",     currInr ? fmtRs(currInr) : "—"],
                      ["Invested",    fmtRs(avgInr * holding.qty)],
                      ["Curr. Value", currInr ? fmtRs(currInr * holding.qty) : "—"],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span className="muted">{l}</span>
                        <span className="t1 font-mono font-semibold">{v}</span>
                      </div>
                    ))}
                    {upnl != null && (
                      <div className="flex justify-between pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="muted">Unrealized P&L</span>
                        <span className={`font-bold font-mono ${upnl >= 0 ? "up" : "down"}`}>
                          {upnl >= 0 ? "+" : "-"}{fmtRs(Math.abs(upnl))} ({upnl >= 0 ? "+" : ""}{fmtNum(upct)}%)
                        </span>
                      </div>
                    )}
                  </>
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
            <button onClick={handleBuy} disabled={!rawPrice || busy} className="btn-buy py-3 disabled:opacity-40">
              {busy ? "…" : "BUY"}
            </button>
            <button onClick={handleSell} disabled={!rawPrice || !holding || busy} className="btn-sell py-3 disabled:opacity-40">
              {busy ? "…" : "SELL"}
            </button>
          </div>
          <p className="text-[10px] muted text-center">Demo only · Not real money</p>
        </div>

        {/* Right: Positions + History */}
        <div className="space-y-4">

          {/* Open Positions */}
          <div className="card overflow-x-auto">
            <h3 className="font-semibold t1 text-sm mb-4">Open Positions</h3>
            {holdingSyms.length === 0 ? (
              <p className="muted text-sm text-center py-10">No open positions.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] muted uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Symbol","Qty","Avg Cost","LTP","Invested","Mkt Value","Unreal. P&L","P&L %","Risk"].map(h => (
                      <th key={h} className={`pb-2.5 font-medium ${h === "Symbol" ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(portfolio).map(([sym, h]) => {
                    const rawLp   = livePrices[sym];
                    const lpInr   = rawLp != null ? (toInr(rawLp, sym) ?? rawLp) : null;
                    const avgInr  = toInrAvg(h.avg_price, sym);
                    const invested = avgInr * h.qty;
                    const mktVal  = lpInr != null ? lpInr * h.qty : null;
                    const upnl    = lpInr != null ? (lpInr - avgInr) * h.qty : null;
                    const upct    = lpInr != null ? ((lpInr - avgInr) / avgInr) * 100 : null;
                    return (
                      <tr key={sym} onClick={() => setSymbol(sym)}
                        className="cursor-pointer hover:bg-[var(--bg3)] transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="py-3 font-bold t1">{sym.replace(".NS","")}</td>
                        <td className="py-3 text-right t2">{h.qty}</td>
                        <td className="py-3 text-right font-mono t2">{fmtRs(toInrAvg(h.avg_price, sym))}</td>
                        <td className="py-3 text-right font-mono t1 font-semibold">
                          {lpInr != null ? fmtRs(lpInr) : <span className="muted animate-pulse text-xs">loading…</span>}
                        </td>
                        <td className="py-3 text-right font-mono t2">{fmtRs(invested)}</td>
                        <td className="py-3 text-right font-mono t1">{mktVal != null ? fmtRs(mktVal) : "—"}</td>
                        <td className="py-3 text-right font-mono font-bold">
                          {upnl != null
                            ? <span className={upnl >= 0 ? "up" : "down"}>{upnl >= 0 ? "+" : "-"}{fmtRs(Math.abs(upnl))}</span>
                            : <span className="muted">—</span>}
                        </td>
                        <td className="py-3 text-right font-mono font-bold">
                          {upct != null
                            ? <span className={upct >= 0 ? "up" : "down"}>{upct >= 0 ? "+" : ""}{fmtNum(upct)}%</span>
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

          {/* Order History */}
          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold t1 text-sm">Order History</h3>
              <div className="flex gap-4 text-xs">
                <span className="muted">Realized: <span className={realizedPnl >= 0 ? "up font-bold" : "down font-bold"}>{realizedPnl >= 0 ? "+" : "-"}{fmtRs(Math.abs(realizedPnl))}</span></span>
                <span className="muted">Unrealized: <span className={unrealizedPnl != null && unrealizedPnl >= 0 ? "up font-bold" : "down font-bold"}>{unrealizedPnl != null ? `${unrealizedPnl >= 0 ? "+" : "-"}${fmtRs(Math.abs(unrealizedPnl))}` : "—"}</span></span>
              </div>
            </div>
            {trades.length === 0 ? (
              <p className="muted text-sm text-center py-10">No trades yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: "var(--bg2)" }}>
                    <tr className="text-[11px] muted uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Time","Type","Symbol","Qty","Price (₹)","Value (₹)","P&L (₹)"].map(h => (
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
                        <td className="py-2.5 font-bold t1">{(t.symbol || "").replace(".NS","")}</td>
                        <td className="py-2.5 text-right t2">{t.qty}</td>
                        <td className="py-2.5 text-right font-mono t2">{fmtRs(t.price)}</td>
                        <td className="py-2.5 text-right font-mono t1">{fmtRs(t.total)}</td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          {t.pnl != null
                            ? <span className={t.pnl >= 0 ? "up" : "down"}>{t.pnl >= 0 ? "+" : "-"}{fmtRs(Math.abs(t.pnl))}</span>
                            : <span className="muted text-xs">—</span>}
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
