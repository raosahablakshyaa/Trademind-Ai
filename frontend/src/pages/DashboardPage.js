import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const TOOLS = [
  { to: "/app/market",     icon: "↗", title: "Markets",          desc: "Live charts for stocks, crypto, forex and indices.",       tag: "Live",    tagStyle: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" } },
  { to: "/app/demo",       icon: "◷", title: "Paper Trading",    desc: "Practice with ₹10,00,000 virtual money at live prices.",      tag: "Free",    tagStyle: { bg: "#f7f7f7", color: "#6b6b6b", border: "#e2e2e2" } },
  { to: "/app/prediction", icon: "◎", title: "AI Prediction",    desc: "LSTM & GRU models predict next-day price direction.",      tag: "AI",      tagStyle: { bg: "#0a0a0a", color: "#fff",    border: "#0a0a0a" } },
  { to: "/app/signals",    icon: "⚡", title: "Buy/Sell Signals", desc: "RSI, MACD, EMA and Bollinger Bands + deep learning.",      tag: "AI",      tagStyle: { bg: "#0a0a0a", color: "#fff",    border: "#0a0a0a" } },
  { to: "/app/patterns",   icon: "◈", title: "Pattern Scanner",  desc: "CNN spots Doji, Hammer, Engulfing and more patterns.",     tag: "AI",      tagStyle: { bg: "#0a0a0a", color: "#fff",    border: "#0a0a0a" } },
  { to: "/app/risk",       icon: "◻", title: "Risk Analyzer",    desc: "Position sizing, stop-loss and risk-reward calculator.",   tag: "Free",    tagStyle: { bg: "#f7f7f7", color: "#6b6b6b", border: "#e2e2e2" } },
];

const ANALYTICS = [
  { to: "/app/journal",    icon: "◑", title: "Trade Journal",      desc: "Log every trade. Review what's working and what isn't." },
  { to: "/app/psychology", icon: "◐", title: "Psychology",         desc: "Spot fear, greed and revenge trading in your history." },
  { to: "/app/strategy",   icon: "▦", title: "Strategy Analyzer",  desc: "Compare scalping, swing and intraday performance." },
];

const STATS = [
  { value: "3",    label: "DL Models",  sub: "LSTM · GRU · CNN" },
  { value: "9",    label: "Features",   sub: "All tools included" },
  { value: "50+",  label: "Symbols",    sub: "Stocks · Crypto · Forex" },
  { value: "5s",   label: "Refresh",    sub: "Live price updates" },
];

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const firstName = user?.name?.split("@")[0]?.split(" ")[0];

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0a0a0a" }}>
            {token ? `Hey, ${firstName} 👋` : "Welcome to TradeMind"}
          </h1>
          <p className="mt-1" style={{ color: "#6b6b6b", fontSize: "14px" }}>
            {token
              ? "Here's your trading command center. What are you analyzing today?"
              : "AI-powered trading tools, completely free to use."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
            style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse2" />
            Markets live
          </span>
          {!token && (
            <Link to="/login" className="btn-primary" style={{ fontSize: "13px" }}>
              Create free account
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ value, label, sub }, i) => (
          <div key={label} className={`stat-card animate-statIn delay-${i * 50 + 50}`}>
            <p className="text-3xl font-black mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tools ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#9a9a9a" }}>Trading Tools</h2>
          <div className="flex-1 h-px" style={{ background: "#e8e8e8" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(({ to, icon, title, desc, tag, tagStyle }, i) => (
            <Link
              key={to}
              to={to}
              className={`dash-card animate-cardIn delay-${[100,150,200,250,300,350][i]}`}
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl font-light">{icon}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ background: tagStyle.bg, color: tagStyle.color, border: `1px solid ${tagStyle.border}` }}
                >
                  {tag}
                </span>
              </div>
              <p className="font-semibold text-sm mb-1.5">{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#6b6b6b" }}>{desc}</p>
              <p className="text-xs mt-4 font-medium" style={{ color: "#9a9a9a" }}>Open →</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Analytics ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#9a9a9a" }}>Analytics</h2>
          <div className="flex-1 h-px" style={{ background: "#e8e8e8" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ANALYTICS.map(({ to, icon, title, desc }, i) => (
            <Link
              key={to}
              to={to}
              className={`dash-card animate-cardIn delay-${[400,450,500][i]}`}
              style={{ textDecoration: "none" }}
            >
              <span className="text-2xl font-light block mb-3">{icon}</span>
              <p className="font-semibold text-sm mb-1.5">{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#6b6b6b" }}>{desc}</p>
              {!token && (
                <p className="text-xs mt-3 font-semibold" style={{ color: "#0a0a0a" }}>Sign in to unlock →</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div
        className="animate-cardIn delay-550 rounded-xl px-5 py-4 flex items-start gap-3"
        style={{ background: "#fafafa", border: "1px solid #e8e8e8" }}
      >
        <span style={{ color: "#9a9a9a", fontSize: "16px" }}>ⓘ</span>
        <p className="text-sm leading-relaxed" style={{ color: "#6b6b6b" }}>
          TradeMind is built for <strong style={{ color: "#0a0a0a" }}>learning and practice only</strong>.
          AI predictions are not financial advice. Always do your own research before putting real money at risk.
        </p>
      </div>
    </div>
  );
}
