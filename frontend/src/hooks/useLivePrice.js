import { useEffect, useRef, useState, useCallback } from "react";
import api from "../utils/api";

export default function useLivePrice(symbol) {
  const [data, setData] = useState(null);
  const timerRef = useRef(null);

  const fetchNow = useCallback(async (sym) => {
    try {
      const res = await api.get(`/market/quote/${encodeURIComponent(sym)}`);
      setData(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!symbol) return;
    setData(null);
    fetchNow(symbol);

    // Poll every 15s — backend has 15s cache so more frequent is pointless
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => fetchNow(symbol), 15000);

    return () => clearInterval(timerRef.current);
  }, [symbol, fetchNow]);

  return data;
}
