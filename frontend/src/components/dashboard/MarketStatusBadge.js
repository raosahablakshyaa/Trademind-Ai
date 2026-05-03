import React from "react";

// Derive exchange from symbol — same logic as backend get_exchange()
function getExchangeFromSymbol(symbol) {
  if (!symbol) return "";
  const s = symbol.toUpperCase();
  if (s.endsWith("-USD")) return "CRYPTO";
  if (s.endsWith("=X"))   return "FOREX";
  if (s.endsWith(".NS") || ["^NSEI","^BSESN","^NSEBANK"].includes(s)) return "NSE";
  if (s.endsWith(".BO"))  return "BSE";
  if (s.endsWith(".L"))   return "LSE";
  if (s === "^N225")      return "TSE";
  if (["^GSPC","^DJI","^IXIC","^RUT","^VIX"].includes(s)) return "INDEX";
  if (["^FTSE","^GDAXI","^FCHI","^STOXX50E"].includes(s)) return "LSE";
  if (["GC=F","SI=F","HG=F","PL=F","PA=F","ZW=F","ZC=F","ZS=F","KC=F","CT=F","SB=F"].includes(s)) return "COMEX";
  if (["CL=F","BZ=F","NG=F"].includes(s)) return "NYMEX";
  return "NASDAQ";
}

function checkMarketOpen(exchange) {
  const now = new Date();
  if (exchange === "CRYPTO") return true;
  if (exchange === "FOREX") {
    const day = now.getUTCDay();
    return day >= 1 && day <= 5;
  }
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
  if (exchange === "NSE" || exchange === "BSE")
    return inRange("Asia/Kolkata", 9, 15, 15, 30);
  if (exchange === "NYSE" || exchange === "NASDAQ" || exchange === "INDEX")
    return inRange("America/New_York", 9, 30, 16, 0);
  if (exchange === "LSE")
    return inRange("Europe/London", 8, 0, 16, 30);
  if (exchange === "TSE")
    return inRange("Asia/Tokyo", 9, 0, 15, 30);
  if (exchange === "COMEX" || exchange === "NYMEX")
    return inRange("America/New_York", 6, 0, 17, 0);
  return false;
}

// symbol prop optional — used when quote hasn't loaded yet
export default function MarketStatusBadge({ quote, symbol, size = "sm" }) {
  // Derive exchange: prefer quote.exchange (from backend), fallback to symbol-based detection
  const exchange = quote?.exchange || getExchangeFromSymbol(symbol || quote?.symbol || "");

  const isCrypto   = exchange === "CRYPTO";
  const isForex    = exchange === "FOREX";
  const alwaysOpen = isCrypto || isForex;

  // Frontend time-based calculation — always accurate, no backend cache dependency
  const open  = alwaysOpen ? true : checkMarketOpen(exchange);
  const label = alwaysOpen ? "24/7" : open ? "Market Open" : "Closed";

  const style = open
    ? { bg: "rgba(38,166,154,0.12)", color: "#26a69a", border: "rgba(38,166,154,0.3)", dot: "#26a69a" }
    : { bg: "#f7f7f7",               color: "#9a9a9a", border: "#e2e2e2",               dot: "#9a9a9a" };

  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold rounded px-2 py-0.5"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: size === "xs" ? "10px" : "11px",
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: 6, height: 6,
          background: style.dot,
          animation: open ? "pulse2 2s ease-in-out infinite" : "none",
        }}
      />
      {label}
      {exchange && (
        <span style={{ opacity: 0.7, fontSize: "10px" }}>· {exchange}</span>
      )}
    </span>
  );
}
