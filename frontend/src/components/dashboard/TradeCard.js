import React, { useState } from "react";
import api from "../../utils/api";
import useDemoStore from "../../store/demoStore";

const fmt = (v, d = 2) => v == null ? "—" : Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export default function TradeCard({ symbol, signal, price, confidence }) {
  const [capital, setCapital] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState(null);
  const { buy, sell, portfolio, balance } = useDemoStore();

  if (!price || !signal) return null;

  const p = Number(price);
  const isBuy = signal === "BUY";
  const isSell = signal === "SELL";

  // ATR-based levels (1.5% ATR estimate)
  const atr = p * 0.015;
  const stopLoss   = isBuy  ? +(p - atr * 1.5).toFixed(4) : +(p + atr * 1.5).toFixed(4);
  const target1    = isBuy  ? +(p + atr * 2).toFixed(4)   : +(p - atr * 2).toFixed(4);
  const target2    = isBuy  ? +(p + atr * 3.5).toFixed(4) : +(p - atr * 3.5).toFixed(4);
  const riskPerShare = Math.abs(p - stopLoss);
  const riskAmount   = (capital * riskPct) / 100;
  const suggestedQty = Math.max(1, Math.floor(riskAmount / riskPerShare));
  const rr1 = (Math.abs(target1 - p) / riskPerShare).toFixed(2);
  const rr2 = (Math.abs(target2 - p) / riskPerShare).toFixed(2);
  const totalCost = (qty * p).toFixed(2);
  const maxLoss   = (qty * riskPerShare).toFixed(2);
  const maxGain1  = (qty * Math.abs(target1 - p)).toFixed(2);
  const holding   = portfolio[symbol];

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const handleBuy = () => {
    const r = buy(symbol, p, Number(qty));
    r.error ? flash(r.error, false) : flash(`✓ Bought ${qty} × ${symbol} @ ₹${fmt(p)}`);
  };
  const handleSell = () => {
    const r = sell(symbol, p, Number(qty));
    r.error ? flash(r.error, false) : flash(`✓ Sold ${qty} × ${symbol} @ ₹${fmt(p)}`);
  };

  return (
    <div className={`card border-l-4 ${isBuy ? "border-l-emerald-500" : isSell ? "border-l-red-500" : "border-l-gray-400"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-black ${isBuy ? "up" : isSell ? "down" : "muted"}`}>{signal}</span>
            <span className="font-bold t1">{symbol}</span>
            {confidence && <span className="text-xs muted">· {confidence}% confidence</span>}
          </div>
          <p className="muted text-xs mt-0.5">AI-generated trade plan · Demo account only</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black t1">₹{fmt(p, 4)}</p>
          <p className="muted text-xs">Current Price</p>
        </div>
      </div>

      {/* Trade levels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Entry",    value: fmt(p, 4),       color: "t1",   sub: "Now" },
          { label: "Stop Loss",value: fmt(stopLoss, 4),color: "down", sub: `Risk ₹${fmt(riskPerShare, 4)}/share` },
          { label: "Target 1", value: fmt(target1, 4), color: "up",   sub: `R/R ${rr1}x` },
          { label: "Target 2", value: fmt(target2, 4), color: "up",   sub: `R/R ${rr2}x` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="panel text-center">
            <p className="text-[10px] muted mb-1">{label}</p>
            <p className={`text-sm font-black font-mono ${color}`}>{value}</p>
            <p className="text-[10px] muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Position sizing */}
      <div className="panel mb-4">
        <p className="text-xs font-semibold t2 mb-3">Position Sizing Calculator</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] muted block mb-1">Capital (₹)</label>
            <input type="number" className="input text-xs py-1.5" value={capital}
              onChange={e => setCapital(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] muted block mb-1">Risk %</label>
            <input type="number" step="0.1" min="0.1" max="10" className="input text-xs py-1.5"
              value={riskPct} onChange={e => setRiskPct(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] muted block mb-1">Qty (suggested: {suggestedQty})</label>
            <input type="number" min="1" className="input text-xs py-1.5" value={qty}
              onChange={e => setQty(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            ["Total Cost",  `₹${totalCost}`],
            ["Max Loss",    `-₹${maxLoss}`],
            ["Max Gain T1", `+₹${maxGain1}`],
          ].map(([l, v]) => (
            <div key={l} className="text-center">
              <p className="text-[10px] muted">{l}</p>
              <p className="text-xs font-bold t1">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Holding info */}
      {holding && (
        <div className="panel mb-3 text-xs flex items-center justify-between">
          <span className="muted">Current position: <span className="t1 font-semibold">{holding.qty} shares @ ₹{fmt(holding.avgPrice, 4)}</span></span>
          <span className={`font-bold ${(p - holding.avgPrice) >= 0 ? "up" : "down"}`}>
            P&L: {(p - holding.avgPrice) >= 0 ? "+" : ""}₹{fmt((p - holding.avgPrice) * holding.qty)}
          </span>
        </div>
      )}

      {/* Demo order buttons */}
      {msg && (
        <div className={`p-2.5 rounded-xl text-xs font-semibold text-center mb-3 ${
          msg.ok ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                 : "bg-red-500/10 text-red-500 border border-red-500/20"
        }`}>{msg.text}</div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleBuy} className="btn-buy py-2.5 text-sm">
          Buy {qty} shares · ₹{totalCost}
        </button>
        <button onClick={handleSell} disabled={!holding} className="btn-sell py-2.5 text-sm disabled:opacity-40">
          Sell {qty} shares
        </button>
      </div>
      <p className="text-[10px] muted text-center mt-2">Demo account only · Not financial advice</p>
    </div>
  );
}
