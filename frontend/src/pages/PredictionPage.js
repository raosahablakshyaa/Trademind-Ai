import React, { useState } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function PredictionPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get("/news/analyze");
      setNews(res.data.news);
      if (res.data.news.length === 0) {
        toast.success("No actionable news found at this moment.");
      } else {
        toast.success(`Analyzed ${res.data.news.length} news items`);
      }
    } catch (err) {
      toast.error("Failed to analyze news. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold t1">Live Market News Analyzer</h1>
          <p className="muted text-sm mt-1">
            AI scans latest business news to identify companies and predict stock impact (Bullish/Bearish).
          </p>
        </div>
        <button 
          onClick={fetchNews} 
          disabled={loading}
          className="btn-primary shrink-0 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scanning News...
            </>
          ) : "Scan Live News"}
        </button>
      </div>

      {news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {news.map((item, idx) => (
            <div key={idx} className="card border border-[#1f1f1f] hover:border-[#2a2a2a] transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl font-bold font-mono border ${
                    item.sentiment === "BULLISH" 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                    <span className="text-sm leading-none">{item.probability}%</span>
                    <span className="text-[8px] uppercase tracking-wider opacity-70">Prob</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{item.company}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-mono text-gray-500">{item.symbol}</p>
                      <span className="text-[10px] text-gray-500">•</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        item.strength === "High Conviction" ? "text-blue-400" :
                        item.strength === "Moderate Conviction" ? "text-yellow-400" : "text-gray-400"
                      }`}>{item.strength}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#8a8a8a] bg-[#1a1a1a] px-2 py-1 rounded-md border border-[#2a2a2a]">
                  ⏱️ {item.timeframe}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest muted mb-1.5 font-semibold">Trader's Thesis</p>
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-3 rounded-lg text-sm t2 italic border-l-2 border-l-[#3a3a3a]">
                  "{item.thesis}"
                </div>
              </div>

              <div className="mb-5 flex-1">
                <p className="text-[10px] uppercase tracking-widest muted mb-1.5 font-semibold">Catalyst (Proof)</p>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-gray-200 leading-snug hover:text-white transition-colors group-hover:underline decoration-[#3a3a3a] underline-offset-4">
                  {item.title}
                </a>
              </div>
              
              <div className="pt-3 border-t border-[#1f1f1f] flex justify-between items-center">
                <span className="text-[10px] muted">
                  Published: {new Date(item.published).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </span>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#3a3a3a] group-hover:text-emerald-500 transition-colors">
                  View Source ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-24 text-center border-dashed border-[#2a2a2a] mt-8">
          <div className="text-5xl mb-4 opacity-20">📰</div>
          <p className="text-white font-semibold text-lg">No news analyzed yet</p>
          <p className="muted text-sm mt-2 max-w-md">
            Click "Scan Live News" to fetch and analyze the latest Google News RSS feeds for major stocks like Apple, Tesla, Reliance, and more.
          </p>
        </div>
      )}
    </div>
  );
}
