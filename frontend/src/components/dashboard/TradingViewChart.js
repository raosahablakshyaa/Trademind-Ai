import { useEffect, useRef } from "react";
import useThemeStore from "../../store/themeStore";

const toTVSymbol = (sym) => {
  const map = {
    "BTC-USD":"BINANCE:BTCUSDT","ETH-USD":"BINANCE:ETHUSDT","SOL-USD":"BINANCE:SOLUSDT",
    "BNB-USD":"BINANCE:BNBUSDT","XRP-USD":"BINANCE:XRPUSDT","ADA-USD":"BINANCE:ADAUSDT",
    "DOGE-USD":"BINANCE:DOGEUSDT","AVAX-USD":"BINANCE:AVAXUSDT","MATIC-USD":"BINANCE:MATICUSDT",
    "DOT-USD":"BINANCE:DOTUSDT",
    "EURUSD=X":"FX:EURUSD","GBPUSD=X":"FX:GBPUSD","USDJPY=X":"FX:USDJPY",
    "USDINR=X":"FX:USDINR","AUDUSD=X":"FX:AUDUSD","USDCAD=X":"FX:USDCAD","USDCHF=X":"FX:USDCHF",
    "^GSPC":"SP:SPX","^DJI":"DJ:DJI","^IXIC":"NASDAQ:IXIC",
    "^NSEI":"NSE:NIFTY","^BSESN":"BSE:SENSEX","^N225":"TVC:NI225",
    "GC=F":"TVC:GOLD","SI=F":"TVC:SILVER","CL=F":"TVC:USOIL",
    "RELIANCE.NS":"NSE:RELIANCE","TCS.NS":"NSE:TCS","INFY.NS":"NSE:INFY",
    "HDFCBANK.NS":"NSE:HDFCBANK","ICICIBANK.NS":"NSE:ICICIBANK","WIPRO.NS":"NSE:WIPRO",
    "TATAMOTORS.NS":"NSE:TATAMOTORS","BAJFINANCE.NS":"NSE:BAJFINANCE",
    "ADANIENT.NS":"NSE:ADANIENT","SBIN.NS":"NSE:SBIN",
  };
  return map[sym] || `NASDAQ:${sym}`;
};

export default function TradingViewChart({ symbol }) {
  const containerRef = useRef(null);
  const { dark } = useThemeStore();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const tvTheme = dark ? "dark" : "light";
    const bg      = dark ? "#1e222d" : "#ffffff";
    const id      = `tv_${Date.now()}`;
    containerRef.current.id = id;

    const existing = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.src   = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !containerRef.current) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: toTVSymbol(symbol),
        interval: "D",
        timezone: "Asia/Kolkata",
        theme: tvTheme,
        style: "1",
        locale: "en",
        toolbar_bg: bg,
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: id,
        hide_side_toolbar: false,
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies", "BB@tv-basicstudies"],
        overrides: {
          "paneProperties.background": bg,
          "paneProperties.backgroundType": "solid",
          "mainSeriesProperties.candleStyle.upColor":        "#10b981",
          "mainSeriesProperties.candleStyle.downColor":      "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor":  "#10b981",
          "mainSeriesProperties.candleStyle.borderDownColor":"#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor":    "#10b981",
          "mainSeriesProperties.candleStyle.wickDownColor":  "#ef4444",
        },
      });
    };
    document.head.appendChild(script);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ""; };
  }, [symbol, dark]);

  return <div ref={containerRef} style={{ height: "560px", width: "100%" }} />;
}
