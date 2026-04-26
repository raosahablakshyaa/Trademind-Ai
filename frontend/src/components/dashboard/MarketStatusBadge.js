import React from "react";

export default function MarketStatusBadge({ quote, size = "sm" }) {
  if (!quote) return null;

  const isOpen   = quote.market_open;
  const exchange = quote.exchange || "";
  const isCrypto = exchange === "CRYPTO";
  const isForex  = exchange === "FOREX";

  // Crypto & Forex are always open
  const alwaysOpen = isCrypto || isForex;
  const open = alwaysOpen ? true : isOpen;

  const label = alwaysOpen ? "24/7" : open ? "Market Open" : "Market Closed";

  const style = open
    ? { bg: "rgba(38,166,154,0.12)", color: "#26a69a", border: "rgba(38,166,154,0.3)", dot: "#26a69a" }
    : { bg: "rgba(239,83,80,0.12)",  color: "#ef5350", border: "rgba(239,83,80,0.3)",  dot: "#ef5350" };

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
