import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";

const INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1wk"];

export default function CandlestickChart({ candles = [], interval, onIntervalChange }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "#0f1629" }, textColor: "#9ca3af" },
      grid: { vertLines: { color: "#1a2235" }, horzLines: { color: "#1a2235" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#243047" },
      timeScale: { borderColor: "#243047", timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: 420,
    });

    chartRef.current = chart;

    // v5 API: addSeries(SeriesType, options)
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    volumeRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const ro = new ResizeObserver(() => {
      if (chart && containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    seriesRef.current.setData(sorted);
    volumeRef.current?.setData(
      sorted.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e33" : "#ef444433",
      }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {INTERVALS.map((iv) => (
          <button
            key={iv}
            onClick={() => onIntervalChange(iv)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              interval === iv
                ? "bg-accent text-white"
                : "muted hover:t1"
            }`}
          >
            {iv}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />
    </div>
  );
}
