import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import TradingViewChart from "../components/dashboard/TradingViewChart";
import useLivePrice from "../hooks/useLivePrice";
import useDemoStore from "../store/demoStore";
import useFxStore from "../store/fxStore";
import MarketStatusBadge from "../components/dashboard/MarketStatusBadge";

/* ── Symbol catalogue ── */
const CATEGORIES = {
  "US Stocks":  [
    {symbol:"AAPL",name:"Apple"},    {symbol:"NVDA",name:"NVIDIA"},
    {symbol:"TSLA",name:"Tesla"},    {symbol:"MSFT",name:"Microsoft"},
    {symbol:"GOOGL",name:"Google"},  {symbol:"AMZN",name:"Amazon"},
    {symbol:"META",name:"Meta"},     {symbol:"AMD",name:"AMD"},
  ],
  "India":      [
    {symbol:"RELIANCE.NS",name:"Reliance"}, {symbol:"TCS.NS",name:"TCS"},
    {symbol:"INFY.NS",name:"Infosys"},      {symbol:"HDFCBANK.NS",name:"HDFC Bank"},
    {symbol:"TATAMOTORS.NS",name:"Tata Motors"},{symbol:"^NSEI",name:"Nifty 50"},
    {symbol:"^BSESN",name:"Sensex"},
  ],
  "Crypto":     [
    {symbol:"BTC-USD",name:"Bitcoin"}, {symbol:"ETH-USD",name:"Ethereum"},
    {symbol:"SOL-USD",name:"Solana"},  {symbol:"BNB-USD",name:"BNB"},
    {symbol:"XRP-USD",name:"XRP"},     {symbol:"DOGE-USD",name:"Dogecoin"},
  ],
  "Forex":      [
    {symbol:"EURUSD=X",name:"EUR/USD"},{symbol:"GBPUSD=X",name:"GBP/USD"},
    {symbol:"USDINR=X",name:"USD/INR"},{symbol:"USDJPY=X",name:"USD/JPY"},
  ],
  "Indices":    [
    {symbol:"^GSPC",name:"S&P 500"},{symbol:"^DJI",name:"Dow Jones"},
    {symbol:"^IXIC",name:"NASDAQ"}, {symbol:"^N225",name:"Nikkei"},
  ],
  "Commodities":[
    {symbol:"GC=F",name:"Gold"},{symbol:"SI=F",name:"Silver"},{symbol:"CL=F",name:"Crude Oil"},
  ],
};
const ALL = Object.values(CATEGORIES).flat();

const fmt = (v) => {
  if (v==null) return "—";
  const n=Number(v);
  if(n>=1000) return n.toLocaleString(undefined,{maximumFractionDigits:2});
  if(n>=1)    return n.toFixed(2);
  return n.toFixed(5);
};

/* ── AI Market Report ── */
function buildReport(quote, symbol) {
  if (!quote?.price) return null;
  const p = quote.price, chg = quote.change_pct || 0;
  const high = quote.high, low = quote.low, prev = quote.prev_close;

  const pivot  = (high + low + p) / 3;
  const r1 = 2*pivot - low,  r2 = pivot + (high - low);
  const s1 = 2*pivot - high, s2 = pivot - (high - low);
  const atr  = (high - low);
  const trend = chg > 1.5 ? "Strong Uptrend" : chg > 0.3 ? "Uptrend" : chg < -1.5 ? "Strong Downtrend" : chg < -0.3 ? "Downtrend" : "Sideways";
  const signal = chg > 1 ? "BUY" : chg < -1 ? "SELL" : "HOLD";
  const strength = Math.min(100, Math.round(Math.abs(chg) * 20 + 40));
  const rr = Math.abs(r1 - p) / Math.abs(p - s1) || 1;

  const bullets = [];
  if (chg > 0) bullets.push(`Price is up ${chg.toFixed(2)}% — bullish momentum`);
  else bullets.push(`Price is down ${Math.abs(chg).toFixed(2)}% — bearish pressure`);
  if (p > pivot) bullets.push(`Trading above pivot (${fmt(pivot)}) — buyers in control`);
  else bullets.push(`Trading below pivot (${fmt(pivot)}) — sellers in control`);
  bullets.push(`Key resistance: ${fmt(r1)} → ${fmt(r2)}`);
  bullets.push(`Key support: ${fmt(s1)} → ${fmt(s2)}`);
  bullets.push(`Volatility (ATR): ${fmt(atr)} — ${atr/p*100 > 3 ? "High" : atr/p*100 > 1.5 ? "Medium" : "Low"}`);
  if (signal === "BUY")  bullets.push(`Entry zone: ${fmt(s1)}–${fmt(p)} · Target: ${fmt(r1)} · Stop: ${fmt(s2)}`);
  if (signal === "SELL") bullets.push(`Entry zone: ${fmt(r1)}–${fmt(p)} · Target: ${fmt(s1)} · Stop: ${fmt(r2)}`);

  return { signal, trend, strength, pivot, r1, r2, s1, s2, rr: rr.toFixed(2), bullets,
           buyEntry: s1, buyTarget: r1, buyStop: s2,
           sellEntry: r1, sellTarget: s1, sellStop: r2,
           probScore: strength };
}

/* ── Trade Analysis Engine ── */
function analyzeTradeRisk(quote, report) {
  if (!quote?.price || !report) return null;

  const p      = quote.price;
  const chg    = quote.change_pct || 0;
  const high   = quote.high;
  const low    = quote.low;
  const prev   = quote.prev_close || p;
  const atr    = high - low;
  const atrPct = (atr / p) * 100;
  const rr     = parseFloat(report.rr);
  const pivot  = report.pivot;
  const sig    = report.signal; // BUY / SELL / HOLD

  // ── 7 weighted factors (each scored independently) ──
  const factors = [];

  // 1. Price momentum (weight: 20)
  if (chg >= 2)        { factors.push({ w: 20, score: 20, ok: true,  label: "Strong momentum",   text: `Up ${chg.toFixed(2)}% today — strong bullish momentum` }); }
  else if (chg >= 0.5) { factors.push({ w: 20, score: 14, ok: true,  label: "Positive momentum", text: `Up ${chg.toFixed(2)}% today — mild bullish momentum` }); }
  else if (chg >= 0)   { factors.push({ w: 20, score: 8,  ok: null,  label: "Flat",              text: `Up only ${chg.toFixed(2)}% — no clear momentum` }); }
  else if (chg >= -1)  { factors.push({ w: 20, score: 4,  ok: false, label: "Weak",              text: `Down ${Math.abs(chg).toFixed(2)}% today — mild bearish pressure` }); }
  else                 { factors.push({ w: 20, score: 0,  ok: false, label: "Bearish",           text: `Down ${Math.abs(chg).toFixed(2)}% today — strong bearish pressure` }); }

  // 2. AI signal (weight: 25 — highest)
  if (sig === "BUY")   { factors.push({ w: 25, score: 25, ok: true,  label: "AI: BUY",  text: "AI signal is BUY — all indicators align bullishly" }); }
  else if (sig === "HOLD") { factors.push({ w: 25, score: 10, ok: null, label: "AI: HOLD", text: "AI signal is HOLD — no strong directional bias" }); }
  else                 { factors.push({ w: 25, score: 0,  ok: false, label: "AI: SELL", text: "AI signal is SELL — indicators are bearish, avoid buying" }); }

  // 3. Risk/Reward ratio (weight: 20)
  if (rr >= 2.5)       { factors.push({ w: 20, score: 20, ok: true,  label: `R/R ${rr}x`,  text: `Excellent R/R ratio of ${rr}x — reward far outweighs risk` }); }
  else if (rr >= 1.8)  { factors.push({ w: 20, score: 15, ok: true,  label: `R/R ${rr}x`,  text: `Good R/R ratio of ${rr}x — favorable risk-reward` }); }
  else if (rr >= 1.2)  { factors.push({ w: 20, score: 10, ok: null,  label: `R/R ${rr}x`,  text: `Acceptable R/R ratio of ${rr}x — marginal risk-reward` }); }
  else                 { factors.push({ w: 20, score: 2,  ok: false, label: `R/R ${rr}x`,  text: `Poor R/R ratio of ${rr}x — risk outweighs potential reward` }); }

  // 4. Price vs Pivot (weight: 15)
  if (p > pivot * 1.005)      { factors.push({ w: 15, score: 15, ok: true,  label: "Above pivot",  text: `Price ₹${p.toFixed(2)} is above pivot ₹${pivot.toFixed(2)} — buyers in control` }); }
  else if (p > pivot * 0.995) { factors.push({ w: 15, score: 8,  ok: null,  label: "At pivot",     text: `Price is near pivot ₹${pivot.toFixed(2)} — direction unclear` }); }
  else                        { factors.push({ w: 15, score: 0,  ok: false, label: "Below pivot",  text: `Price ₹${p.toFixed(2)} is below pivot ₹${pivot.toFixed(2)} — sellers in control` }); }

  // 5. Volatility / ATR (weight: 10)
  if (atrPct <= 1.5)   { factors.push({ w: 10, score: 10, ok: true,  label: "Low volatility",    text: `Low volatility (${atrPct.toFixed(1)}% ATR) — stable price action` }); }
  else if (atrPct <= 3){ factors.push({ w: 10, score: 7,  ok: true,  label: "Normal volatility", text: `Normal volatility (${atrPct.toFixed(1)}% ATR) — manageable risk` }); }
  else if (atrPct <= 5){ factors.push({ w: 10, score: 3,  ok: null,  label: "High volatility",   text: `High volatility (${atrPct.toFixed(1)}% ATR) — large price swings expected` }); }
  else                 { factors.push({ w: 10, score: 0,  ok: false, label: "Extreme volatility",text: `Extreme volatility (${atrPct.toFixed(1)}% ATR) — very risky entry` }); }

  // 6. Price vs 52w range proxy (high/low spread, weight: 5)
  const rangePct = ((p - low) / (high - low || 1)) * 100;
  if (rangePct >= 60)  { factors.push({ w: 5, score: 5, ok: true,  label: "Strong range",  text: `Trading in upper ${rangePct.toFixed(0)}% of today's range — bullish` }); }
  else if (rangePct >= 40) { factors.push({ w: 5, score: 3, ok: null, label: "Mid range",    text: `Trading in middle of today's range — neutral` }); }
  else                 { factors.push({ w: 5, score: 0, ok: false, label: "Weak range",   text: `Trading in lower ${rangePct.toFixed(0)}% of today's range — bearish` }); }

  // 7. Trend strength (weight: 5)
  const trend = report.trend;
  if (trend === "Strong Uptrend")   { factors.push({ w: 5, score: 5, ok: true,  label: trend, text: `Trend: ${trend} — ideal buying conditions` }); }
  else if (trend === "Uptrend")     { factors.push({ w: 5, score: 4, ok: true,  label: trend, text: `Trend: ${trend} — supportive for buyers` }); }
  else if (trend === "Sideways")    { factors.push({ w: 5, score: 2, ok: null,  label: trend, text: `Trend: ${trend} — no directional edge` }); }
  else if (trend === "Downtrend")   { factors.push({ w: 5, score: 1, ok: false, label: trend, text: `Trend: ${trend} — buying against the trend` }); }
  else                              { factors.push({ w: 5, score: 0, ok: false, label: trend, text: `Trend: ${trend} — strong selling pressure` }); }

  // ── Final score (0–100) ──
  const maxScore = factors.reduce((s, f) => s + f.w, 0);   // = 100
  const rawScore = factors.reduce((s, f) => s + f.score, 0);
  const score    = Math.round((rawScore / maxScore) * 100);

  // ── Verdict ──
  const level =
    score >= 72 ? "STRONG BUY" :
    score >= 58 ? "BUY" :
    score >= 44 ? "NEUTRAL" :
    score >= 30 ? "AVOID" : "STRONG AVOID";

  const color =
    level === "STRONG BUY" ? { bg: "rgba(38,166,154,0.1)",  border: "rgba(38,166,154,0.35)", text: "#26a69a", badge: "rgba(38,166,154,0.18)" } :
    level === "BUY"        ? { bg: "rgba(38,166,154,0.06)", border: "rgba(38,166,154,0.25)", text: "#26a69a", badge: "rgba(38,166,154,0.12)" } :
    level === "NEUTRAL"    ? { bg: "rgba(249,168,37,0.08)", border: "rgba(249,168,37,0.3)",  text: "#f9a825", badge: "rgba(249,168,37,0.15)" } :
    level === "AVOID"      ? { bg: "rgba(239,83,80,0.07)",  border: "rgba(239,83,80,0.28)",  text: "#ef5350", badge: "rgba(239,83,80,0.14)" } :
                             { bg: "rgba(239,83,80,0.12)",  border: "rgba(239,83,80,0.4)",   text: "#ef5350", badge: "rgba(239,83,80,0.2)"  };

  const verdict =
    level === "STRONG BUY"  ? "✅ STRONG BUY" :
    level === "BUY"         ? "✅ GOOD TO BUY" :
    level === "NEUTRAL"     ? "⚠️ WAIT & WATCH" :
    level === "AVOID"       ? "🚫 AVOID BUYING" : "🚫 DO NOT BUY";

  const verdictSub =
    level === "STRONG BUY"  ? "All major indicators are bullish. High-confidence entry." :
    level === "BUY"         ? "Conditions are favorable. This trade is worth taking." :
    level === "NEUTRAL"     ? "Mixed signals. No clear edge — wait for confirmation." :
    level === "AVOID"       ? "Conditions are weak. Risk outweighs potential reward." :
                              "Strong bearish signals. Buying here is high risk.";

  const disclaimer =
    (level === "AVOID" || level === "STRONG AVOID")
      ? "Market conditions strongly suggest avoiding a buy at this level. You risk losing a significant portion of your capital. Do NOT enter this trade unless you have a clear stop-loss plan and can afford the loss."
      : null;

  return { score, level, color, verdict, verdictSub, factors, disclaimer };
}

function TradeAnalysis({ quote, report }) {
  const analysis = analyzeTradeRisk(quote, report);
  if (!analysis) return null;
  const { score, level, color, verdict, verdictSub, factors, disclaimer } = analysis;

  return (
    <div className="rounded-lg overflow-hidden animate-fadeIn" style={{ border: `1px solid ${color.border}` }}>

      {/* ── Verdict banner ── */}
      <div className="px-4 py-3" style={{ background: color.bg }}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-black text-base" style={{ color: color.text }}>{verdict}</p>
          <div
            className="text-center px-3 py-1 rounded-lg"
            style={{ background: color.badge, border: `1px solid ${color.border}` }}
          >
            <p className="text-xl font-black leading-none" style={{ color: color.text, fontFamily: "'JetBrains Mono', monospace" }}>{score}</p>
            <p className="text-[9px] font-bold mt-0.5" style={{ color: color.text, opacity: 0.7 }}>/ 100</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: color.text, opacity: 0.85 }}>{verdictSub}</p>
      </div>

      {/* ── Score bar ── */}
      <div className="h-2" style={{ background: "var(--bg3)" }}>
        <div
          className="h-2 transition-all duration-700"
          style={{
            width: `${score}%`,
            background: score >= 58
              ? `linear-gradient(90deg, #26a69a, #2dd4bf)`
              : score >= 44
              ? `linear-gradient(90deg, #f9a825, #fbbf24)`
              : `linear-gradient(90deg, #ef5350, #f87171)`,
          }}
        />
      </div>

      {/* ── Factor breakdown ── */}
      <div className="px-4 py-3 space-y-2" style={{ background: "var(--bg2)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
          7-Factor Analysis
        </p>
        {factors.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {/* Icon */}
            <span
              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
              style={{
                background: f.ok === true  ? "rgba(38,166,154,0.18)" :
                            f.ok === false ? "rgba(239,83,80,0.18)"  : "rgba(249,168,37,0.18)",
                color:      f.ok === true  ? "#26a69a" :
                            f.ok === false ? "#ef5350" : "#f9a825",
              }}
            >
              {f.ok === true ? "✓" : f.ok === false ? "✗" : "–"}
            </span>
            {/* Text + weight bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs leading-relaxed"
                  style={{ color: f.ok === true ? "#26a69a" : f.ok === false ? "#ef5350" : "#f9a825" }}
                >
                  {f.text}
                </p>
                <span
                  className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: f.ok === true  ? "rgba(38,166,154,0.12)" :
                                f.ok === false ? "rgba(239,83,80,0.12)"  : "rgba(249,168,37,0.12)",
                    color:      f.ok === true  ? "#26a69a" :
                                f.ok === false ? "#ef5350" : "#f9a825",
                  }}
                >
                  {f.score}/{f.w}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Risk disclaimer ── */}
      {disclaimer && (
        <div
          className="px-4 py-3 flex items-start gap-2"
          style={{ background: "rgba(239,83,80,0.06)", borderTop: "1px solid rgba(239,83,80,0.2)" }}
        >
          <span className="text-sm shrink-0">⚠️</span>
          <p className="text-xs leading-relaxed font-medium" style={{ color: "#ef5350" }}>
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

const CAT_ICONS = {
  "US Stocks":   "🇺🇸",
  "India":       "🇮🇳",
  "Crypto":      "₿",
  "Forex":       "💱",
  "Indices":     "📊",
  "Commodities": "🪙",
};

/* ── Frontend market hours (mirrors backend logic) ── */
function getExchangeFE(symbol) {
  const s = symbol.toUpperCase();
  if (s.endsWith("-USD"))  return "CRYPTO";
  if (s.endsWith("=X"))    return "FOREX";
  if (s.endsWith(".NS") || s === "^NSEI" || s === "^BSESN") return "NSE";
  if (s === "^N225")       return "TSE";
  if (s === "GC=F" || s === "SI=F") return "COMEX";
  if (s === "CL=F")        return "NYMEX";
  return "NYSE";
}

function isMarketOpenFE(exchange) {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 6=Sat

  if (exchange === "CRYPTO") return true;
  if (exchange === "FOREX")  return day >= 1 && day <= 5;

  const toLocal = (tz) => {
    try { return new Date(now.toLocaleString("en-US", { timeZone: tz })); }
    catch { return now; }
  };

  const inRange = (tz, oh, om, ch, cm) => {
    const d = toLocal(tz);
    const wd = d.getDay();
    if (wd === 0 || wd === 6) return false;
    const mins = d.getHours() * 60 + d.getMinutes();
    return mins >= oh * 60 + om && mins <= ch * 60 + cm;
  };

  if (exchange === "NYSE" || exchange === "NASDAQ") return inRange("America/New_York", 9, 30, 16, 0);
  if (exchange === "NSE"  || exchange === "BSE")    return inRange("Asia/Kolkata",      9, 15, 15, 30);
  if (exchange === "TSE")                           return inRange("Asia/Tokyo",         9, 0,  15, 30);
  if (exchange === "COMEX")                         return inRange("America/New_York",   8, 20, 13, 30);
  if (exchange === "NYMEX")                         return inRange("America/New_York",   9, 0,  14, 30);
  return false;
}

function SymbolSelector({ selected, onPick, watchlist }) {
  const [activeCat, setActiveCat] = useState("US Stocks");
  const [search, setSearch]       = useState("");
  const symbols = CATEGORIES[activeCat];

  // Build a map of symbol -> market_open from live watchlist data
  const openMap = {};
  watchlist.forEach(q => { openMap[q.symbol] = q.market_open; });

  const filtered = search
    ? symbols.filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    : symbols;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>

      {/* Category tabs + search */}
      <div className="flex items-center overflow-x-auto" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg3)" }}>
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCat(cat); setSearch(""); }}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-all"
            style={{
              color: activeCat === cat ? "var(--text)" : "var(--muted)",
              borderBottom: activeCat === cat ? "2px solid var(--accent)" : "2px solid transparent",
              background: activeCat === cat ? "var(--bg2)" : "transparent",
            }}
          >
            <span>{CAT_ICONS[cat]}</span>{cat}
          </button>
        ))}
        {/* Search input inside tab bar */}
        <div className="flex items-center gap-2 ml-auto px-3 shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="outline-none bg-transparent text-xs"
            style={{ color: "var(--text)", width: "120px" }}
            placeholder={`Search ${activeCat}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "#9a9a9a", fontSize: "14px", lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Symbol grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-0">
        {filtered.length === 0 ? (
          <div className="col-span-8 py-6 text-center text-xs" style={{ color: "var(--muted)" }}>
            No results for "{search}"
          </div>
        ) : filtered.map(({ symbol, name }) => {
          const isActive = selected === symbol;
          // Use backend market_open if available, else fallback to frontend calc
          const mktOpen  = symbol in openMap ? openMap[symbol] : isMarketOpenFE(getExchangeFE(symbol));
          return (
            <button
              key={symbol}
              onClick={() => onPick(symbol)}
              className="flex flex-col items-start px-3 py-2.5 text-left transition-all relative"
              style={{
                background:   isActive ? "rgba(41,98,255,0.1)" : "transparent",
                borderRight:  "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                borderLeft:   isActive ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-[11px] font-bold tracking-wide truncate"
                  style={{ color: isActive ? "var(--accent)" : "var(--text)" }}>
                  {symbol.replace("=X","").replace("-USD","").replace(".NS","").replace("^","")}
                </span>
                <span
                  className="shrink-0 w-1.5 h-1.5 rounded-full ml-auto"
                  style={{ background: mktOpen ? "#26a69a" : "#9a9a9a", animation: mktOpen ? "pulse2 2s ease-in-out infinite" : "none" }}
                  title={mktOpen ? "Market Open" : "Market Closed"}
                />
              </div>
              <span className="text-[10px] mt-0.5 truncate w-full" style={{ color: "var(--muted)" }}>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Simple Pro Trade Card ── */
function SimpleTradeCard({ report, quote, selected, fmtInr }) {
  const [showDetails, setShowDetails] = React.useState(false);
  if (!report || !quote?.price) return null;

  if (report.aiLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--border2)", borderTopColor: "var(--accent)" }} />
        <p className="text-sm muted">AI analyzing {selected}…</p>
      </div>
    );
  }

  const p   = quote.price;
  const chg = quote.change_pct || 0;
  const isBuy  = report.signal === "BUY";
  const isSell = report.signal === "SELL";
  const isHold = report.signal === "HOLD";

  const verdict = isBuy
    ? { label: "✅ BUY",         color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", sub: "Conditions are favorable. Enter near current price." }
    : isSell
    ? { label: "🚫 DON'T BUY",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca", sub: "Bearish setup — avoid buying. Wait for reversal." }
    : { label: "⏳ WAIT",        color: "#ca8a04", bg: "#fefce8", border: "#fde68a", sub: "No clear edge — stay on sidelines for now." };

  const safeEntry  = p;
  const safeTarget = Math.max(report.buyTarget || p, p * 1.005);
  const safeSL     = Math.min(report.buyStop   || p, p * 0.995);
  const profitPct  = (((safeTarget - safeEntry) / safeEntry) * 100).toFixed(2);
  const lossPct    = (((safeEntry - safeSL)    / safeEntry) * 100).toFixed(2);
  const rrRatio    = lossPct > 0 ? (profitPct / lossPct).toFixed(2) : report.rr;

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{ background: verdict.bg, border: `1.5px solid ${verdict.border}` }}>
        <div>
          <p className="text-2xl font-black" style={{ color: verdict.color }}>{verdict.label}</p>
          <p className="text-sm mt-0.5 font-medium" style={{ color: verdict.color, opacity: 0.8 }}>{verdict.sub}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-black" style={{ color: verdict.color, fontFamily: "'JetBrains Mono', monospace" }}>
            {report.probScore}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: verdict.color, opacity: 0.7 }}>Win Probability</p>
        </div>
      </div>

      {isBuy && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wide muted mb-1">Entry</p>
            <p className="text-base font-black t1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtInr(safeEntry, selected)}</p>
            <p className="text-[10px] muted mt-0.5">Buy at current price</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#16a34a" }}>🎯 Target (Sell here)</p>
            <p className="text-base font-black" style={{ color: "#16a34a", fontFamily: "'JetBrains Mono', monospace" }}>{fmtInr(safeTarget, selected)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#16a34a" }}>+{profitPct}% profit — book here</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#dc2626" }}>🛑 Stop Loss (Exit)</p>
            <p className="text-base font-black" style={{ color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>{fmtInr(safeSL, selected)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#dc2626" }}>-{lossPct}% — sell immediately if hits</p>
          </div>
        </div>
      )}

      {isBuy && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "var(--bg3)", color: "var(--muted)" }}>
            R/R: <span className="t1 font-black">{rrRatio}x</span>
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "var(--bg3)", color: "var(--muted)" }}>
            Trend: <span className="t1 font-black">{report.trend}</span>
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "var(--bg3)", color: "var(--muted)" }}>
            {chg >= 0 ? "▲" : "▼"} <span className="t1 font-black">{Math.abs(chg).toFixed(2)}% today</span>
          </span>
        </div>
      )}

      {isSell && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <p className="text-sm font-bold" style={{ color: "#dc2626" }}>⚠️ Why not to buy now:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center rounded-lg p-3" style={{ background: "rgba(255,255,255,0.6)" }}>
              <p className="text-[10px] font-bold muted uppercase tracking-wide">Current Price</p>
              <p className="text-base font-black t1 mt-1">{fmtInr(p, selected)}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#dc2626" }}>Bearish — avoid entry</p>
            </div>
            <div className="text-center rounded-lg p-3" style={{ background: "rgba(255,255,255,0.6)" }}>
              <p className="text-[10px] font-bold muted uppercase tracking-wide">Wait for Support</p>
              <p className="text-base font-black mt-1" style={{ color: "#16a34a" }}>{fmtInr(report.s1, selected)}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#16a34a" }}>Buy only if bounces here</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: "#dc2626" }}>
            Indicators show selling pressure. Wait for price to reach support and show reversal candle.
          </p>
        </div>
      )}

      {isHold && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-[10px] muted font-bold uppercase tracking-wide">Resistance</p>
              <p className="text-sm font-black t1 mt-1">{fmtInr(report.r1, selected)}</p>
              <p className="text-[10px] muted">Buy if breaks above with volume</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] muted font-bold uppercase tracking-wide">Support</p>
              <p className="text-sm font-black t1 mt-1">{fmtInr(report.s1, selected)}</p>
              <p className="text-[10px] muted">Avoid if breaks below</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowDetails(v => !v)}
        className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)" }}
      >
        {showDetails ? "▲ Hide Details" : "▼ Show Full Analysis"}
      </button>

      {showDetails && (
        <div className="space-y-3 animate-fadeIn">
          <div className="panel">
            <p className="text-[10px] font-bold uppercase tracking-widest muted mb-2">Key Levels</p>
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { l: "S2", v: report.s2, c: "text-red-500" },
                { l: "S1", v: report.s1, c: "down" },
                { l: "Pivot", v: report.pivot, c: "muted" },
                { l: "R1", v: report.r1, c: "up" },
                { l: "R2", v: report.r2, c: "text-emerald-600" },
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <p className={`text-[9px] font-bold ${c}`}>{l}</p>
                  <p className="text-[10px] font-mono t1 mt-0.5">{fmtInr(v, selected)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="text-[10px] font-bold uppercase tracking-widest muted mb-2">Analysis</p>
            <div className="space-y-1">
              {report.bullets.map((b, i) => (
                <p key={i} className="text-xs t2">› {b}</p>
              ))}
            </div>
          </div>
          <p className="text-[10px] muted text-center">For educational purposes only · Not financial advice · Always use stop loss</p>
        </div>
      )}
    </div>
  );
}

export default function MarketPage() {
  const [selected, setSelected]   = useState("AAPL");
  const [watchlist, setWatchlist] = useState([]);
  const [wlLoad, setWlLoad]       = useState(true);
  const [orderQty, setOrderQty]   = useState(1);
  const [orderMsg, setOrderMsg]   = useState(null);

  const { usdInr, toInr, fmtInr, startRefresh, stopRefresh } = useFxStore();
  useEffect(() => { startRefresh(); return () => stopRefresh(); }, []);

  const liveQuote = useLivePrice(selected);
  const quote     = liveQuote || {};
  const isUp      = (quote.change_pct || 0) >= 0;
  const meta      = ALL.find(s => s.symbol === selected) || { name: selected };
  const baseReport = buildReport(quote, selected);

  // Fetch backend AI signal
  const [aiSignal, setAiSignal] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!quote?.price || !selected) return;
    setAiSignal(null);
    setAiLoading(true);
    const fd = new FormData();
    fd.append("symbol", selected);
    fd.append("dl_direction", "UP");
    fd.append("dl_confidence", 65);
    api.post("/signals/generate", fd)
      .then(res => setAiSignal(res.data))
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [selected, quote?.price ? Math.round(quote.price) : 0]);

  const report = baseReport ? {
    ...baseReport,
    signal:    aiSignal?.signal    || baseReport.signal,
    probScore: aiSignal?.probability ?? baseReport.probScore,
    buyEntry:  aiSignal?.trade_plan?.entry     || baseReport.buyEntry,
    buyTarget: aiSignal?.trade_plan?.target_1  || baseReport.buyTarget,
    buyStop:   aiSignal?.trade_plan?.stop_loss || baseReport.buyStop,
    rr:        aiSignal?.trade_plan?.rr_1?.toString() || baseReport.rr,
    aiLoading,
  } : null;
  const { buy, sell, account, fetch: fetchDemo } = useDemoStore();
  const portfolio = account?.portfolio || {};
  const holding   = portfolio[selected] || null;
  const demoBalance = account?.balance ?? null;

  // Load demo account on mount
  useEffect(() => { fetchDemo(); }, []);

  useEffect(() => {
    const fetchWl = () => api.get("/market/watchlist").then(r => setWatchlist(r.data)).catch(()=>{}).finally(()=>setWlLoad(false));
    fetchWl();
    const t = setInterval(fetchWl, 30000);
    return () => clearInterval(t);
  }, []);

  const pick = (sym) => { setSelected(sym); localStorage.setItem("tm_selected_symbol", sym); };

  const flash = (text, ok=true) => { setOrderMsg({text,ok}); setTimeout(()=>setOrderMsg(null),3000); };

  const handleBuy = async () => {
    if (!quote.price) return;
    const r = await buy(selected, quote.price, Number(orderQty));
    r.error ? flash(r.error, false) : flash(`✓ Bought ${orderQty} × ${selected} @ ${fmtInr(quote.price, selected)}`);
  };
  const handleSell = async () => {
    if (!quote.price) return;
    const r = await sell(selected, quote.price, Number(orderQty));
    r.error ? flash(r.error, false) : flash(`✓ Sold ${orderQty} × ${selected} @ ${fmtInr(quote.price, selected)} · P&L: ${r.pnl >= 0 ? "+" : ""}${fmtInr(Math.abs(r.pnl), selected)}`);
  };

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* ── Top bar ── */}
      <div>
        <h1 className="text-xl font-bold t1">Live Market</h1>
        <p className="muted text-xs mt-0.5">Real-time charts · TradingView · Stocks · Crypto · Forex · Indices</p>
      </div>

      {/* ── Symbol Selector Panel ── */}
      <SymbolSelector selected={selected} onPick={pick} watchlist={watchlist} />

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

        {/* Left column */}
        <div className="space-y-4 min-w-0">

          {/* Quote bar */}
          <div className="card py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-black t1">{selected}</span>
                  <span className="text-xs muted border rounded-lg px-2 py-0.5" style={{borderColor:"var(--border)"}}>{meta.name}</span>
                  <span className="flex items-center gap-1 text-xs up">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse2" />Live
                  </span>
                  <MarketStatusBadge quote={quote} />
                </div>
                {quote.price ? (
                  <div className="flex items-baseline gap-3 mt-1.5">
                    <span className="text-3xl font-black t1">{fmt(quote.price)}</span>
                    <span className={`text-base font-bold ${isUp ? "up" : "down"}`}>
                      {isUp ? "▲ +" : "▼ "}{fmt(quote.change)} ({isUp?"+":""}{Number(quote.change_pct).toFixed(2)}%)
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-3 mt-2 animate-pulse">
                    <div className="h-9 w-36 rounded-lg" style={{background:"var(--bg3)"}} />
                    <div className="h-9 w-24 rounded-lg" style={{background:"var(--bg3)"}} />
                  </div>
                )}
              </div>
              {quote.price && (
                <div className="flex gap-4">
                  {[["High",quote.high],["Low",quote.low],["Prev",quote.prev_close],["Vol",quote.volume]].map(([l,v])=>(
                    <div key={l} className="text-center">
                      <p className="text-[10px] muted">{l}</p>
                      <p className="text-sm font-semibold t1">{l==="Vol" ? Number(v).toLocaleString() : fmt(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--border)"}}>
            <TradingViewChart symbol={selected} />
          </div>

          {/* AI Market Report */}
          {report && (
            <div className="card space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold t1">AI Market Report — {selected}</h3>
                  <p className="muted text-xs mt-0.5">Pivot analysis · Trend detection · Signal generation</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-black border ${
                    report.signal==="BUY"  ? "tag-buy" :
                    report.signal==="SELL" ? "tag-sell" : "tag-hold"
                  }`}>{report.signal}</span>
                  <span className="text-xs muted border rounded-lg px-2 py-1" style={{borderColor:"var(--border)"}}>{report.trend}</span>
                </div>
              </div>

              {/* Signal strength bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="muted">Signal Strength</span>
                  <span className="t1 font-semibold">{report.strength}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--bg3)"}}>
                  <div className={`h-2 rounded-full transition-all duration-500 ${
                    report.signal==="BUY" ? "bg-emerald-500" : report.signal==="SELL" ? "bg-red-500" : "bg-gray-400"
                  }`} style={{width:`${report.strength}%`}} />
                </div>
              </div>

              {/* Key levels */}
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  {l:"S2", v:report.s2, c:"text-red-600"},
                  {l:"S1", v:report.s1, c:"down"},
                  {l:"Pivot", v:report.pivot, c:"muted"},
                  {l:"R1", v:report.r1, c:"up"},
                  {l:"R2", v:report.r2, c:"text-emerald-600"},
                ].map(({l,v,c})=>(
                  <div key={l} className="panel text-center">
                    <p className={`text-[10px] font-bold ${c}`}>{l}</p>
                    <p className="text-xs font-mono t1 mt-0.5">{fmt(v)}</p>
                  </div>
                ))}
              </div>

              {/* Analysis bullets */}
              <div className="space-y-1.5">
                {report.bullets.map((b,i)=>(
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 shrink-0 ${report.signal==="BUY"?"up":report.signal==="SELL"?"down":"muted"}`}>›</span>
                    <span className="t2">{b}</span>
                  </div>
                ))}
              </div>

              {/* Buy / Sell zones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`p-4 rounded-xl border ${report.signal==="BUY" ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}
                  style={report.signal!=="BUY" ? {borderColor:"var(--border)", background:"var(--bg3)"} : {}}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="tag-buy">BUY ZONE</span>
                    {report.signal==="BUY" && <span className="text-xs up font-semibold">← Active</span>}
                  </div>
                  {[["Entry",fmt(report.buyEntry),"t1"],["Target",fmt(report.buyTarget),"up"],["Stop Loss",fmt(report.buyStop),"down"]].map(([l,v,c])=>(
                    <div key={l} className="flex justify-between text-sm py-1" style={{borderBottom:"1px solid var(--border)"}}>
                      <span className="muted">{l}</span><span className={`font-mono font-semibold ${c}`}>{v}</span>
                    </div>
                  ))}
                  <p className="text-xs muted mt-2">R/R: <span className="t1 font-semibold">{report.rr}x</span></p>
                </div>

                <div className={`p-4 rounded-xl border ${report.signal==="SELL" ? "border-red-500/40 bg-red-500/5" : ""}`}
                  style={report.signal!=="SELL" ? {borderColor:"var(--border)", background:"var(--bg3)"} : {}}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="tag-sell">SELL ZONE</span>
                    {report.signal==="SELL" && <span className="text-xs down font-semibold">← Active</span>}
                  </div>
                  {[["Entry",fmt(report.sellEntry),"t1"],["Target",fmt(report.sellTarget),"down"],["Stop Loss",fmt(report.sellStop),"up"]].map(([l,v,c])=>(
                    <div key={l} className="flex justify-between text-sm py-1" style={{borderBottom:"1px solid var(--border)"}}>
                      <span className="muted">{l}</span><span className={`font-mono font-semibold ${c}`}>{v}</span>
                    </div>
                  ))}
                  <p className="text-xs muted mt-2">R/R: <span className="t1 font-semibold">{report.rr}x</span></p>
                </div>
              </div>

              <p className="text-[10px] muted text-center">Based on pivot point analysis · Not financial advice</p>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Buy / Sell order panel */}
          <div className="card">
            <h3 className="font-bold t1 text-sm mb-4">Place Demo Order</h3>
            <div className="space-y-3">

              {/* Available Balance */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}
              >
                <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Available Balance</span>
                <span className="text-sm font-black" style={{ color: demoBalance != null ? (demoBalance > 0 ? "var(--green)" : "var(--red)") : "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {demoBalance != null ? `₹${demoBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                </span>
              </div>
              <div>
                <label className="text-xs muted block mb-1">Quantity</label>
                <input type="number" min="1" className="input" value={orderQty}
                  onChange={e => setOrderQty(e.target.value)} />
              </div>
              {quote.price && (
                <div className="panel flex justify-between text-sm">
                  <span className="muted">Price</span>
                  <span className="font-mono font-bold t1">{fmtInr(quote.price, selected)}</span>
                </div>
              )}
              {quote.price && (
                <div className="panel flex justify-between text-sm">
                  <span className="muted">Total</span>
                  <span className="font-mono font-bold t1">{fmtInr(quote.price * orderQty, selected)}</span>
                </div>
              )}
              {holding && (
                <div className="panel text-xs space-y-1">
                  <p className="muted">Your Position</p>
                  <p className="t1 font-semibold">{holding.qty} shares · avg {fmtInr(holding.avg_price, selected)}</p>
                  {quote.price && (
                    <p className={`font-bold ${(quote.price-holding.avg_price)>=0?"up":"down"}`}>
                      P&L: {(quote.price-holding.avg_price)>=0?"+":""}{fmtInr(Math.abs((quote.price-holding.avg_price)*holding.qty), selected)}
                    </p>
                  )}
                </div>
              )}
              {orderMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold text-center ${
                  orderMsg.ok ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}>{orderMsg.text}</div>
              )}

              {/* ── Trade Analysis ── */}
              {quote.price && <TradeAnalysis quote={quote} report={report} />}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleBuy} disabled={!quote.price} className="btn-buy py-3">BUY</button>
                <button onClick={handleSell} disabled={!quote.price || !holding} className="btn-sell py-3">SELL</button>
              </div>
            </div>
          </div>

          {/* Market overview */}
          <div className="card" style={{ padding: "16px" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold t1 text-sm">Market Overview</h3>
              <span className="text-xs muted">{watchlist.length} symbols</span>
            </div>

            {watchlist.length === 0 ? (
              <div className="space-y-2">
                {[...Array(8)].map((_,i)=>(
                  <div key={i} className="h-10 rounded-lg animate-shimmer" style={{background:"var(--bg3)"}} />
                ))}
              </div>
            ) : (
              <div className="space-y-0.5" style={{ maxHeight: "460px", overflowY: "auto" }}>
                {watchlist.map(q => {
                  const up = q.change_pct >= 0;
                  const label = q.symbol.replace("=X","").replace("-USD","").replace(".NS","").replace("^","");
                  const isActive = selected === q.symbol;
                  const sig = q.change_pct > 1.5 ? "BUY" : q.change_pct < -1.5 ? "SELL" : q.change_pct > 0.3 ? "BUY" : q.change_pct < -0.3 ? "SELL" : "HOLD";
                  const sigColor = sig === "BUY" ? "#16a34a" : sig === "SELL" ? "#dc2626" : "#ca8a04";
                  const sigBg    = sig === "BUY" ? "#f0fdf4"  : sig === "SELL" ? "#fef2f2"  : "#fefce8";
                  return (
                    <button key={q.symbol} onClick={() => pick(q.symbol)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all"
                      style={{
                        background: isActive ? "#f0f0f0" : "transparent",
                        borderLeft: isActive ? "2px solid #0a0a0a" : "2px solid transparent",
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg3)"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-xs font-bold t1 truncate">{label}</p>
                        <p className="text-[10px] font-mono muted">{fmt(q.price)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: sigBg, color: sigColor }}>{sig}</span>
                        <span className={`text-[11px] font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
                          {up ? "+" : ""}{q.change_pct?.toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
