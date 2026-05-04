import React, { useState } from "react";
import toast from "react-hot-toast";
import api, { getErrorMsg } from "../utils/api";

export default function RiskPage() {
  const [form, setForm] = useState({ entry_price: "", stop_loss: "", target_price: "", capital: "", risk_percent: 1, volatility: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] !== "") payload[k] = Number(payload[k]); });
      if (!payload.volatility) delete payload.volatility;
      const res = await api.post("/risk/analyze", payload);
      setResult(res.data);
    } catch (err) {
      toast.error(getErrorMsg(err, "Risk analysis failed"));
    } finally { setLoading(false); }
  };

  const LEVEL_COLOR = { LOW: "up", MEDIUM: "text-yellow-500", HIGH: "down" };
  const LEVEL_BORDER = { LOW: "border-emerald-500/30 bg-emerald-500/5", MEDIUM: "border-yellow-500/30 bg-yellow-500/5", HIGH: "border-red-500/30 bg-red-500/5" };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold t1">Risk Analyzer</h1>
        <p className="muted text-sm mt-0.5">Position sizing · Stop-loss · Risk-reward · Probability of loss</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-3">
            {[["entry_price","Entry Price (₹)"],["stop_loss","Stop Loss (₹)"],["target_price","Target Price (₹)"],["capital","Total Capital (₹)"]].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs muted block mb-1">{label}</label>
                <input type="number" step="0.01" className="input" placeholder="0.00"
                  value={form[key]} onChange={e => set(key, e.target.value)} required />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs muted block mb-1">Risk % per Trade</label>
                <input type="number" step="0.1" min="0.1" max="10" className="input"
                  value={form.risk_percent} onChange={e => set("risk_percent", e.target.value)} />
              </div>
              <div>
                <label className="text-xs muted block mb-1">Volatility % (optional)</label>
                <input type="number" step="0.1" className="input" placeholder="e.g. 2.5"
                  value={form.volatility} onChange={e => set("volatility", e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Analyzing…" : "Analyze Risk"}
            </button>
          </form>
        </div>

        {result && (
          <div className="space-y-4">
            <div className={`card border text-center ${LEVEL_BORDER[result.risk_level]}`}>
              <div className={`text-5xl font-black ${LEVEL_COLOR[result.risk_level]}`}>{result.risk_score}</div>
              <p className="muted text-sm mt-1">Risk Score</p>
              <p className={`text-lg font-bold mt-1 ${LEVEL_COLOR[result.risk_level]}`}>{result.risk_level} RISK</p>
            </div>

            <div className="card grid grid-cols-2 gap-3">
              {[
                ["Risk/Reward",    result.risk_reward_ratio + "x"],
                ["Position Size",  result.position_size + " shares"],
                ["Position Value", "₹" + result.position_value],
                ["% of Capital",   result.position_pct_of_capital + "%"],
                ["Max Loss",       "₹" + result.max_loss],
                ["Max Gain",       "₹" + result.max_gain],
                ["Prob. of Loss",  result.probability_of_loss + "%"],
                ["Suggested SL",   "₹" + result.suggested_stop_loss],
              ].map(([label, value]) => (
                <div key={label} className="panel">
                  <p className="muted text-xs">{label}</p>
                  <p className="t1 font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {result.warnings.length > 0 && (
              <div className="card border border-yellow-500/30 bg-yellow-500/5">
                <h3 className="text-yellow-500 font-semibold text-sm mb-2">Warnings</h3>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="t2 text-sm flex gap-2"><span className="text-yellow-500">•</span>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
