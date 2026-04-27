import { create } from "zustand";
import api from "../utils/api";

// Symbols that are already priced in INR — no conversion needed
const INR_SYMBOLS = new Set([
  // NSE stocks
  "RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS","KOTAKBANK.NS",
  "AXISBANK.NS","SBIN.NS","INDUSINDBK.NS","BAJFINANCE.NS","BAJAJFINSV.NS","BAJAJ-AUTO.NS",
  "WIPRO.NS","HCLTECH.NS","TECHM.NS","LTIM.NS","LT.NS","TATAMOTORS.NS","TATASTEEL.NS",
  "TATACONSUM.NS","ADANIENT.NS","ADANIPORTS.NS","ADANIGREEN.NS","SUNPHARMA.NS","DRREDDY.NS",
  "CIPLA.NS","DIVISLAB.NS","APOLLOHOSP.NS","ASIANPAINT.NS","NESTLEIND.NS","ITC.NS",
  "HINDUNILVR.NS","BRITANNIA.NS","TITAN.NS","BHARTIARTL.NS","ONGC.NS","NTPC.NS",
  "POWERGRID.NS","COALINDIA.NS","BPCL.NS","IOC.NS","MARUTI.NS","HEROMOTOCO.NS",
  "EICHERMOT.NS","M&M.NS","ULTRACEMCO.NS","GRASIM.NS","SHREECEM.NS","HINDALCO.NS",
  "JSWSTEEL.NS","VEDL.NS",
  // NSE Indices
  "^NSEI","^BSESN","^NSEBANK",
]);

let _refreshTimer = null;

const useFxStore = create((set, get) => ({
  usdInr: 84.0,   // fallback rate
  lastFetched: null,

  fetchRate: async () => {
    try {
      const res = await api.get("/market/quote/USDINR%3DX");
      const rate = res.data?.price;
      if (rate && rate > 50) {
        set({ usdInr: rate, lastFetched: Date.now() });
      }
    } catch {}
  },

  startRefresh: () => {
    get().fetchRate();
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(() => get().fetchRate(), 5 * 60 * 1000); // every 5 min
  },

  stopRefresh: () => {
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  },

  // Convert a price to INR
  toInr: (price, symbol) => {
    if (!price) return null;
    if (INR_SYMBOLS.has(symbol)) return price;
    return price * get().usdInr;
  },

  // Format price with ₹ symbol
  fmtInr: (price, symbol, decimals) => {
    const inr = get().toInr(price, symbol);
    if (inr == null) return "—";
    const d = decimals ?? (inr >= 100 ? 2 : inr >= 1 ? 2 : 4);
    if (inr >= 10000000) return `₹${(inr / 10000000).toFixed(2)}Cr`;
    if (inr >= 100000)   return `₹${(inr / 100000).toFixed(2)}L`;
    if (inr >= 1000)     return `₹${inr.toLocaleString("en-IN", { maximumFractionDigits: d })}`;
    return `₹${inr.toFixed(d)}`;
  },

  isInr: (symbol) => INR_SYMBOLS.has(symbol),
}));

export { INR_SYMBOLS };
export default useFxStore;
