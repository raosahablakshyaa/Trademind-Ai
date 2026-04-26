import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const FEATURES = [
  { icon: "↗", title: "Live Market Charts",   desc: "Real-time charts for stocks, crypto, forex and indices — powered by TradingView.", tag: "Free" },
  { icon: "◎", title: "AI Price Prediction",  desc: "LSTM and GRU models trained on historical data to predict next-day direction.", tag: "Free" },
  { icon: "⚡", title: "Buy / Sell Signals",   desc: "RSI, MACD, EMA and Bollinger Bands combined with deep learning for cleaner signals.", tag: "Free" },
  { icon: "◈", title: "Pattern Recognition",  desc: "CNN model that spots Doji, Hammer, Engulfing and other candlestick patterns.", tag: "Free" },
  { icon: "◻", title: "Risk Analyzer",        desc: "Calculate position size, stop-loss levels and risk-reward before every trade.", tag: "Free" },
  { icon: "◷", title: "Paper Trading",         desc: "Practice with $10,000 virtual money. No real money, real market prices.", tag: "Free" },
  { icon: "◑", title: "Trade Journal",         desc: "Log every trade with notes, emotion and strategy. Review what works.", tag: "Premium" },
  { icon: "◐", title: "Psychology Analyzer",  desc: "Spot patterns like fear-selling, revenge trading and overconfidence in your history.", tag: "Premium" },
  { icon: "▦", title: "Strategy Analyzer",    desc: "Compare your scalping, swing and intraday performance side by side.", tag: "Premium" },
];

export default function LandingPage() {
  const { token } = useAuthStore();
  const heroRef = useRef(null);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("revealed"); });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#fff", color: "#0a0a0a" }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 h-14"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e8e8e8" }}
      >
        <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white font-black text-sm">T</div>
          <span className="font-bold text-base" style={{ color: "#0a0a0a" }}>TradeMind</span>
        </Link>

        <div className="flex items-center gap-3">
          {token ? (
            <Link to="/app" className="btn-primary text-sm">Open App →</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/login" className="btn-primary text-sm">Get started free</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center animate-fadeIn">
        <div
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
          style={{ background: "#f0f0f0", color: "#6b6b6b", border: "1px solid #e2e2e2" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse2" />
          Free to use · No signup required for most features
        </div>

        <h1
          className="font-black leading-[1.08] mb-6 tracking-tight"
          style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)", color: "#0a0a0a" }}
        >
          Trade smarter,<br />not harder.
        </h1>

        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "#6b6b6b", lineHeight: "1.7" }}>
          TradeMind gives you AI-powered signals, live charts, risk analysis
          and behavioral insights — all in one place, completely free.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/app" className="btn-primary" style={{ fontSize: "15px", padding: "11px 24px" }}>
            Start trading for free →
          </Link>
          {!token && (
            <Link to="/login" className="btn-ghost" style={{ fontSize: "15px", padding: "11px 24px" }}>
              Create account
            </Link>
          )}
        </div>

        {/* Social proof */}
        <p className="text-sm mt-8" style={{ color: "#9a9a9a" }}>
          Built with TensorFlow · FastAPI · React · MongoDB
        </p>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: "9",    l: "AI features",    s: "All included" },
            { n: "3",    l: "Deep learning",  s: "LSTM · GRU · CNN" },
            { n: "50+",  l: "Symbols",        s: "Stocks, crypto, forex" },
            { n: "Free", l: "Core access",    s: "No credit card" },
          ].map(({ n, l, s }, i) => (
            <div
              key={l}
              className={`reveal card text-center py-6 animate-statIn delay-${i * 50 + 50}`}
              style={{ animationFillMode: "both" }}
            >
              <p className="text-3xl font-black mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{n}</p>
              <p className="text-sm font-semibold">{l}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9a9a9a" }}>{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-3">Everything you need to trade well</h2>
          <p style={{ color: "#6b6b6b" }}>Free features work right away. Premium unlocks with a free account.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc, tag }, i) => (
            <div
              key={title}
              className="reveal card group"
              style={{
                animationDelay: `${i * 40}ms`,
                transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#d0d0d0"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = ""; }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl font-light" style={{ color: "#0a0a0a" }}>{icon}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={
                    tag === "Free"
                      ? { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }
                      : { background: "#0a0a0a", color: "#fff" }
                  }
                >
                  {tag}
                </span>
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6b6b6b" }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/app" className="btn-primary" style={{ fontSize: "15px", padding: "12px 28px" }}>
            Start using TradeMind — it's free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center" style={{ borderTop: "1px solid #e8e8e8" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-black flex items-center justify-center text-white text-xs font-bold">T</div>
          <span className="font-semibold text-sm">TradeMind AI</span>
        </div>
        <p className="text-sm" style={{ color: "#9a9a9a" }}>
          For educational purposes only. Not financial advice.
        </p>
      </footer>

      <style>{`
        .reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .revealed { opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}
