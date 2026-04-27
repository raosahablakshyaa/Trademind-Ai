import React, { useState } from "react";

const PATTERNS_DATA = [
  {
    category: "Single Candle Patterns",
    items: [
      { 
        name: "Marubozu", type: "Strong Trend", color: "blue", 
        desc: "A candle with a large body and no wicks. A green Marubozu indicates buyers controlled the entire session. A red Marubozu indicates sellers dominated.", 
        action: "CONTINUATION. If it appears in an uptrend, it signals strong bullish momentum. If in a downtrend, strong bearish momentum.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-20 h-16">
            <rect x="20" y="20" width="20" height="60" fill="currentColor" className="text-emerald-500" />
            <rect x="60" y="20" width="20" height="60" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
      { 
        name: "Doji", type: "Indecision", color: "muted", 
        desc: "Open and close are almost identical, creating a cross shape. Shows a tug-of-war between buyers and sellers with no clear winner.", 
        action: "WAIT. Do not trade purely on a Doji. If it appears after a long trend, it signals the trend may be exhausting and reversing.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
            <rect x="40" y="48" width="20" height="4" fill="currentColor" className="text-gray-400" />
          </svg>
        ) 
      },
      { 
        name: "Spinning Top", type: "Indecision", color: "muted", 
        desc: "Small body with long upper and lower wicks. Similar to a Doji, it represents market indecision.", 
        action: "WAIT. Represents consolidation. Look for the next candle to break above or below the Spinning Top to confirm direction.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
            <rect x="35" y="40" width="30" height="20" fill="currentColor" className="text-gray-400" />
          </svg>
        ) 
      },
      { 
        name: "Hammer", type: "Bullish Reversal", color: "emerald", 
        desc: "Small body at the top with a long lower wick (at least 2x the body). Found at the bottom of a downtrend.", 
        action: "BUY SIGNAL. Sellers pushed the price down, but buyers rejected the lower prices. Enter long if the next candle is green.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="50" y1="30" x2="50" y2="85" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="35" y="25" width="30" height="25" fill="currentColor" className="text-emerald-500" />
          </svg>
        ) 
      },
      { 
        name: "Inverted Hammer", type: "Bullish Reversal", color: "emerald", 
        desc: "Small body at the bottom with a long upper wick. Found at the bottom of a downtrend.", 
        action: "BUY SIGNAL. Buyers attempted to push the price up. Even though sellers fought back, buying pressure is building.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="50" y1="15" x2="50" y2="70" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="35" y="50" width="30" height="25" fill="currentColor" className="text-emerald-500" />
          </svg>
        ) 
      },
      { 
        name: "Hanging Man", type: "Bearish Reversal", color: "red", 
        desc: "Looks exactly like a Hammer (small body, long lower wick), but it appears at the TOP of an uptrend.", 
        action: "SELL SIGNAL. Indicates that sellers are starting to step in and test the buyers. Wait for a bearish confirmation candle before shorting.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="50" y1="30" x2="50" y2="85" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="35" y="25" width="30" height="25" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
      { 
        name: "Shooting Star", type: "Bearish Reversal", color: "red", 
        desc: "Looks exactly like an Inverted Hammer, but appears at the TOP of an uptrend.", 
        action: "SELL SIGNAL. Buyers tried to push the price higher but were aggressively rejected by sellers. Short if next candle is red.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="50" y1="15" x2="50" y2="70" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="35" y="50" width="30" height="25" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
    ]
  },
  {
    category: "Double Candle Patterns",
    items: [
      { 
        name: "Bullish Engulfing", type: "Bullish Reversal", color: "emerald", 
        desc: "A small red candle followed by a large green candle that completely engulfs the previous red body.", 
        action: "BUY SIGNAL. Total shift in momentum from sellers to buyers. Go long with a stop loss below the green candle's low.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="35" y1="40" x2="35" y2="60" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="25" y="45" width="20" height="15" fill="currentColor" className="text-red-500" />
            <line x1="65" y1="20" x2="65" y2="80" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="55" y="25" width="20" height="50" fill="currentColor" className="text-emerald-500" />
          </svg>
        ) 
      },
      { 
        name: "Bearish Engulfing", type: "Bearish Reversal", color: "red", 
        desc: "A small green candle followed by a large red candle that completely engulfs the previous green body.", 
        action: "SELL SIGNAL. Sellers have overwhelmed buyers. Go short with a stop loss above the red candle's high.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="35" y1="40" x2="35" y2="60" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="25" y="45" width="20" height="15" fill="currentColor" className="text-emerald-500" />
            <line x1="65" y1="20" x2="65" y2="80" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="55" y="25" width="20" height="50" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
      { 
        name: "Piercing Line", type: "Bullish Reversal", color: "emerald", 
        desc: "A large red candle followed by a green candle that opens lower but closes more than 50% up the red candle's body.", 
        action: "BUY SIGNAL. Buyers have recovered more than half of the previous day's losses, indicating a strong reversal.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="35" y1="20" x2="35" y2="70" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="25" y="25" width="20" height="40" fill="currentColor" className="text-red-500" />
            <line x1="65" y1="40" x2="65" y2="85" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="55" y="45" width="20" height="35" fill="currentColor" className="text-emerald-500" />
          </svg>
        ) 
      },
      { 
        name: "Dark Cloud Cover", type: "Bearish Reversal", color: "red", 
        desc: "A large green candle followed by a red candle that opens higher but closes more than 50% down the green candle's body.", 
        action: "SELL SIGNAL. Sellers have rejected the higher prices and erased more than half of the previous gains.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="35" y1="30" x2="35" y2="80" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="25" y="35" width="20" height="40" fill="currentColor" className="text-emerald-500" />
            <line x1="65" y1="15" x2="65" y2="60" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="55" y="20" width="20" height="35" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
      { 
        name: "Bullish Harami", type: "Bullish Reversal", color: "emerald", 
        desc: "A large red candle followed by a small green candle that is completely contained within the red candle's body (Inside Bar).", 
        action: "BUY SIGNAL. The strong selling momentum has paused. Indicates a potential upside reversal.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="35" y1="20" x2="35" y2="80" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="25" y="25" width="20" height="50" fill="currentColor" className="text-red-500" />
            <line x1="65" y1="45" x2="65" y2="65" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="55" y="50" width="20" height="10" fill="currentColor" className="text-emerald-500" />
          </svg>
        ) 
      },
      { 
        name: "Bearish Harami", type: "Bearish Reversal", color: "red", 
        desc: "A large green candle followed by a small red candle completely contained within the green candle's body.", 
        action: "SELL SIGNAL. The strong buying momentum has stalled. Indicates a potential downside reversal.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="35" y1="20" x2="35" y2="80" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="25" y="25" width="20" height="50" fill="currentColor" className="text-emerald-500" />
            <line x1="65" y1="45" x2="65" y2="65" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="55" y="50" width="20" height="10" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
    ]
  },
  {
    category: "Triple Candle Patterns",
    items: [
      { 
        name: "Morning Star", type: "Bullish Reversal", color: "emerald", 
        desc: "A large red candle, a small indecision candle (gapping down), and a large green candle closing well into the first red candle.", 
        action: "BUY SIGNAL. Indicates a transition from seller dominance to indecision, and finally buyer dominance.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-24 h-16">
            <line x1="20" y1="20" x2="20" y2="70" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="12" y="25" width="16" height="40" fill="currentColor" className="text-red-500" />
            <line x1="50" y1="70" x2="50" y2="90" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
            <rect x="42" y="75" width="16" height="10" fill="currentColor" className="text-gray-400" />
            <line x1="80" y1="30" x2="80" y2="80" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="72" y="35" width="16" height="40" fill="currentColor" className="text-emerald-500" />
          </svg>
        ) 
      },
      { 
        name: "Evening Star", type: "Bearish Reversal", color: "red", 
        desc: "A large green candle, a small indecision candle (gapping up), and a large red candle closing well into the first green candle.", 
        action: "SELL SIGNAL. Indicates a transition from buyer dominance to indecision, and finally seller dominance.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-24 h-16">
            <line x1="20" y1="30" x2="20" y2="80" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="12" y="35" width="16" height="40" fill="currentColor" className="text-emerald-500" />
            <line x1="50" y1="10" x2="50" y2="30" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
            <rect x="42" y="15" width="16" height="10" fill="currentColor" className="text-gray-400" />
            <line x1="80" y1="20" x2="80" y2="70" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="72" y="25" width="16" height="40" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
      { 
        name: "Three White Soldiers", type: "Strong Bullish", color: "emerald", 
        desc: "Three consecutive large green candles, each opening within the previous body and closing higher.", 
        action: "BUY SIGNAL. Extremely strong buying pressure. Best traded when emerging from a period of consolidation or at the bottom of a trend.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-24 h-16">
            <line x1="20" y1="50" x2="20" y2="90" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="12" y="55" width="16" height="30" fill="currentColor" className="text-emerald-500" />
            <line x1="50" y1="30" x2="50" y2="70" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="42" y="35" width="16" height="30" fill="currentColor" className="text-emerald-500" />
            <line x1="80" y1="10" x2="80" y2="50" stroke="currentColor" strokeWidth="2" className="text-emerald-500" />
            <rect x="72" y="15" width="16" height="30" fill="currentColor" className="text-emerald-500" />
          </svg>
        ) 
      },
      { 
        name: "Three Black Crows", type: "Strong Bearish", color: "red", 
        desc: "Three consecutive large red candles, each opening within the previous body and closing lower.", 
        action: "SELL SIGNAL. Extremely strong selling pressure. Indicates the start of a steep downtrend.", 
        svg: (
          <svg viewBox="0 0 100 100" className="w-24 h-16">
            <line x1="20" y1="10" x2="20" y2="50" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="12" y="15" width="16" height="30" fill="currentColor" className="text-red-500" />
            <line x1="50" y1="30" x2="50" y2="70" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="42" y="35" width="16" height="30" fill="currentColor" className="text-red-500" />
            <line x1="80" y1="50" x2="80" y2="90" stroke="currentColor" strokeWidth="2" className="text-red-500" />
            <rect x="72" y="55" width="16" height="30" fill="currentColor" className="text-red-500" />
          </svg>
        ) 
      },
    ]
  }
];

export default function PatternsPage() {
  const [activeTab, setActiveTab] = useState("All");

  const categories = ["All", ...PATTERNS_DATA.map(c => c.category)];
  
  const displayedData = activeTab === "All" 
    ? PATTERNS_DATA 
    : PATTERNS_DATA.filter(c => c.category === activeTab);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold t1">Candlestick Pattern Masterclass</h1>
        <p className="muted text-sm mt-1 mb-6">
          The complete A-to-Z guide on the most reliable candlestick patterns. Learn what they look like, what they mean, and exactly how to trade them in the live market.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeTab === cat ? "var(--accent)" : "var(--bg3)",
                color:      activeTab === cat ? "#fff"          : "var(--muted)",
                border:     `1px solid ${activeTab === cat ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {displayedData.map((category) => (
          <div key={category.category} className="space-y-5">
            <h2 className="text-xl font-bold t1 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
              {category.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {category.items.map((p) => (
                <div
                  key={p.name}
                  className="card transition-all flex flex-col"
                  style={{ border: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border2)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div className="flex items-start gap-5 mb-5">
                    <div
                      className="w-24 h-24 shrink-0 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}
                    >
                      {p.svg}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold t1">{p.name}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        p.color === "emerald" ? "bg-emerald-500/10 text-emerald-500" : 
                        p.color === "red" ? "bg-red-500/10 text-red-500" : 
                        p.color === "blue" ? "bg-blue-500/10 text-blue-500" : "bg-gray-500/10 text-gray-400"
                      }`}>
                        {p.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold muted uppercase tracking-wider mb-1">What it is</h4>
                      <p className="text-sm t2 leading-relaxed">{p.desc}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
                      <h4 className="text-xs font-semibold muted uppercase tracking-wider mb-1">How to Trade it</h4>
                      <p className="text-sm font-medium t1 leading-relaxed">{p.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
