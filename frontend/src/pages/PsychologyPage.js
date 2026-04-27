import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api, { getErrorMsg } from "../utils/api";
import useAuthStore from "../store/authStore";
import AuthGate from "../components/dashboard/AuthGate";

const GRADE_META = {
  A: { label: "Excellent",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", desc: "Your trading psychology is strong. Keep following your plan." },
  B: { label: "Good",       color: "#0a0a0a", bg: "#f7f7f7", border: "#e2e2e2", desc: "Solid discipline with some room to improve." },
  C: { label: "Average",    color: "#ca8a04", bg: "#fefce8", border: "#fde68a", desc: "Some emotional patterns are affecting your trades." },
  D: { label: "Needs Work", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", desc: "Emotional trading is hurting your performance significantly." },
};

const EMOTION_COLOR = {
  neutral: "#6b6b6b", confident: "#16a34a", fear: "#dc2626",
  greed: "#ca8a04", anxious: "#9a3412", revenge: "#7c3aed",
};

const BEHAVIOR_INFO = {
  "Overtrading":          { icon: "⚡", tip: "You're taking too many trades. Quality beats quantity — wait for high-probability setups only." },
  "Revenge Trading":      { icon: "😤", tip: "You're entering trades right after a loss. Take a 30-minute break after any losing trade." },
  "Fear Trading":         { icon: "😨", tip: "Fear is making you exit too early. Trust your analysis and let winners run." },
  "Greed Trading":        { icon: "🤑", tip: "Greed is pushing you into low-quality setups. Stick strictly to your entry criteria." },
  "Poor Risk Management": { icon: "⚠️", tip: "Your average loss is too large. Never risk more than 1-2% of capital per trade." },
};

export default function PsychologyPage() {
  const { token } = useAuthStore();
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (token) analyze(); }, [token]);

  if (!token) return <AuthGate feature="Psychology Analyzer" />;

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await api.get("/psychology/analyze");
      setResult(res.data);
    } catch (err) {
      toast.error(getErrorMsg(err, "Analysis failed"));
    } finally { setLoading(false); }
  };

  const grade = result ? GRADE_META[result.grade] || GRADE_META.B : null;

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0a0a0a" }}>Psychology Analyzer</h1>
          <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>
            Understand your emotional patterns and trading behavior
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
          {/* No trades state */}
          {result.total_trades === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-4">🧘</p>
              <p className="font-semibold text-base" style={{ color: "#0a0a0a" }}>No trades to analyze yet</p>
              <p className="text-sm mt-1" style={{ color: "#9a9a9a" }}>
                Log some trades in your Journal first, then come back here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* Grade card */}
              <div
                className="rounded-xl p-6 flex items-center justify-between flex-wrap gap-6 animate-cardIn"
                style={{ background: grade.bg, border: `1px solid ${grade.border}` }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-5xl font-black" style={{ color: grade.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {result.grade}
                    </span>
                    <div>
                      <p className="font-bold text-lg" style={{ color: grade.color }}>{grade.label}</p>
                      <p className="text-sm" style={{ color: grade.color, opacity: 0.8 }}>Psychology Grade</p>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: "#1a1a1a" }}>{grade.desc}</p>
                </div>

                {/* Score ring */}
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e8e8e8" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={grade.color} strokeWidth="2.5"
                        strokeDasharray={`${result.psychology_score} 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-black" style={{ color: grade.color }}>{result.psychology_score}</span>
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#9a9a9a" }}>out of 100</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Trades",  value: result.total_trades,       color: "#0a0a0a" },
                  { label: "Win Rate",      value: `${result.win_rate}%`,      color: result.win_rate >= 50 ? "#16a34a" : "#dc2626" },
                  { label: "Behavior Tags", value: result.behavior_tags.length, color: result.behavior_tags.length === 0 ? "#16a34a" : "#dc2626" },
                  { label: "Warnings",      value: result.warnings.length,     color: result.warnings.length === 0 ? "#16a34a" : "#ca8a04" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card text-center" style={{ padding: "16px" }}>
                    <p className="text-2xl font-black mb-1" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
                    <p className="text-xs font-medium" style={{ color: "#6b6b6b" }}>{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Left column */}
                <div className="space-y-4">

                  {/* AI Summary */}
                  <div className="card">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9a9a9a" }}>AI Summary</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#1a1a1a" }}>{result.summary}</p>
                  </div>

                  {/* Behavior tags */}
                  {result.behavior_tags.length > 0 ? (
                    <div className="card">
                      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9a9a9a" }}>Detected Patterns</p>
                      <div className="space-y-3">
                        {result.behavior_tags.map(tag => {
                          const info = BEHAVIOR_INFO[tag] || { icon: "⚠️", tip: "Review your trading behavior." };
                          return (
                            <div key={tag} className="rounded-lg p-3" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <span>{info.icon}</span>
                                <span className="font-semibold text-sm" style={{ color: "#dc2626" }}>{tag}</span>
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: "#6b6b6b" }}>{info.tip}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">✅</span>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#15803d" }}>No negative patterns detected</p>
                          <p className="text-xs mt-0.5" style={{ color: "#16a34a" }}>Your trading behavior looks healthy. Keep it up.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-4">

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="card">
                      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9a9a9a" }}>Warnings</p>
                      <div className="space-y-2">
                        {result.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2.5 py-2" style={{ borderBottom: i < result.warnings.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                            <span className="text-base shrink-0 mt-0.5">⚠️</span>
                            <p className="text-sm leading-relaxed" style={{ color: "#1a1a1a" }}>{w}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotion distribution */}
                  {Object.keys(result.emotion_distribution || {}).length > 0 && (
                    <div className="card">
                      <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9a9a9a" }}>Emotion Breakdown</p>
                      <div className="space-y-3">
                        {Object.entries(result.emotion_distribution || {})
                          .sort((a, b) => b[1] - a[1])
                          .map(([emotion, count]) => {
                            const pct = Math.round(count / result.total_trades * 100);
                            const color = EMOTION_COLOR[emotion] || "#6b6b6b";
                            return (
                              <div key={emotion}>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="font-medium capitalize" style={{ color: "#1a1a1a" }}>{emotion}</span>
                                  <span style={{ color: "#9a9a9a" }}>{count} trades · {pct}%</span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#f0f0f0" }}>
                                  <div
                                    className="h-2 rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%`, background: color }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="card" style={{ background: "#fafafa" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9a9a9a" }}>General Tips</p>
                    <div className="space-y-2">
                      {[
                        "Never risk more than 1-2% of your capital on a single trade.",
                        "Keep a pre-trade checklist and only enter when all conditions are met.",
                        "After 3 consecutive losses, stop trading for the day.",
                        "Review your journal weekly — patterns become obvious over time.",
                      ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-bold mt-0.5" style={{ color: "#9a9a9a" }}>{i + 1}.</span>
                          <p className="text-sm" style={{ color: "#6b6b6b" }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
