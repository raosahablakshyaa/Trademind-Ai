import { create } from "zustand";
import api, { getErrorMsg } from "../utils/api";

let _pollTimer = null;
let _accountTimer = null;

const useDemoStore = create((set, get) => ({
  account:     null,
  loading:     false,
  error:       null,
  livePrices:  {},   // { "ETH-USD": 2360.26, ... }
  riskAlerts:  [],
  dismissed:   new Set(),

  // ── Fetch account ──
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/demo/account");
      set({ account: res.data, loading: false });
      // Start polling immediately after account loads
      get()._startPolling();
    } catch (e) {
      set({ loading: false, error: getErrorMsg(e, "Failed to load account") });
    }
  },

  // ── Buy ──
  buy: async (symbol, price, qty) => {
    try {
      const res = await api.post("/demo/buy", { symbol, price, qty });
      // Use full account from server response to stay in sync
      set(s => ({
        account: {
          ...s.account,
          balance:   res.data.balance,
          portfolio: res.data.portfolio,
          trades:    [res.data.trade, ...(s.account?.trades || [])].slice(0, 500),
        }
      }));
      get()._pollPrices();
      return { ok: true };
    } catch (e) {
      return { error: getErrorMsg(e, "Buy failed") };
    }
  },

  // ── Sell ──
  sell: async (symbol, price, qty) => {
    try {
      const res = await api.post("/demo/sell", { symbol, price, qty });
      set(s => ({
        account: {
          ...s.account,
          balance:      res.data.balance,
          portfolio:    res.data.portfolio,
          trades:       [res.data.trade, ...(s.account?.trades || [])].slice(0, 500),
          realized_pnl: res.data.realized_pnl ?? ((s.account?.realized_pnl || 0) + (res.data.pnl || 0)),
        }
      }));
      get()._pollPrices();
      return { ok: true, pnl: res.data.pnl };
    } catch (e) {
      return { error: getErrorMsg(e, "Sell failed") };
    }
  },

  // ── Reset ──
  reset: async () => {
    try {
      await api.post("/demo/reset");
      set({
        account:    { balance: 1000000, portfolio: {}, trades: [], realized_pnl: 0 },
        livePrices: {},
        riskAlerts: [],
      });
      return { ok: true };
    } catch {
      return { error: "Reset failed" };
    }
  },

  // ── Dismiss risk alert ──
  dismissAlert: (key) => {
    const d = new Set(get().dismissed);
    d.add(key);
    set(s => ({
      dismissed:  d,
      riskAlerts: s.riskAlerts.filter(a => a.key !== key),
    }));
  },

  // ── Internal: fetch all holding prices in parallel ──
  _pollPrices: async () => {
    const portfolio = get().account?.portfolio || {};
    const syms = Object.keys(portfolio);
    if (!syms.length) {
      set({ livePrices: {} });
      return;
    }

    // Import fxStore dynamically to avoid circular deps
    const { default: useFxStore } = await import("./fxStore");
    const { toInr } = useFxStore.getState();

    const results = await Promise.allSettled(
      syms.map(s => api.get(`/market/quote/${encodeURIComponent(s)}`))
    );

    const prices = { ...get().livePrices };
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        const raw = r.value.data.price;
        // Store price in INR always
        prices[syms[i]] = toInr(raw, syms[i]);
      }
    });

    set({ livePrices: prices });

    const WARN = -2, DANGER = -5, CRITICAL = -8;
    const dismissed = get().dismissed;
    const newAlerts = [];

    // Fetch signals for ALL profit positions in parallel
    const profitSyms = syms.filter(sym => {
      const lp = prices[sym];
      const h  = portfolio[sym];
      return lp && h?.avg_price && lp > h.avg_price; // only profit positions
    });

    const signalResults = await Promise.allSettled(
      profitSyms.map(sym => {
        const fd = new FormData();
        fd.append("symbol", sym);
        fd.append("dl_direction", "DOWN");
        fd.append("dl_confidence", 60);
        return api.post("/signals/generate", fd);
      })
    );

    const bearishSyms = new Set();
    signalResults.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value.data?.signal === "SELL") {
        bearishSyms.add(profitSyms[i]);
      }
    });

    Object.entries(portfolio).forEach(([sym, h]) => {
      const lp = prices[sym];
      if (!lp || !h.avg_price) return;
      const pct = ((lp - h.avg_price) / h.avg_price) * 100;
      const pnl = (lp - h.avg_price) * h.qty;

      // ─ Loss alerts (existing logic) ─
      let level = null;
      if (pct <= CRITICAL)     level = "critical";
      else if (pct <= DANGER)  level = "danger";
      else if (pct <= WARN)    level = "warn";

      if (level) {
        const key = `${sym}_${level}`;
        if (!dismissed.has(key)) {
          const LABELS = {
            critical: { title: `🚨 Critical Loss — ${sym}`,  action: "Sell Now",  msg: `Down ${Math.abs(pct).toFixed(2)}% · Loss $${Math.abs(pnl).toFixed(2)} · Sell immediately to protect capital.` },
            danger:   { title: `⚠️ Sell Alert — ${sym}`,     action: "Sell Now",  msg: `Down ${Math.abs(pct).toFixed(2)}% · Loss $${Math.abs(pnl).toFixed(2)} · Position moving against you.` },
            warn:     { title: `🟡 Watch Out — ${sym}`,      action: "Review",    msg: `Down ${Math.abs(pct).toFixed(2)}% · Loss $${Math.abs(pnl).toFixed(2)} · Monitor closely.` },
          };
          newAlerts.push({ sym, pct, pnl, level, key, ...LABELS[level] });
        }
      }

      // ─ Profit protection alert: AI says SELL while you're in profit ─
      if (pct > 0 && bearishSyms.has(sym)) {
        const key = `${sym}_profit_protect`;
        if (!dismissed.has(key)) {
          newAlerts.push({
            sym, pct, pnl, level: "profit_protect", key,
            title: `💡 Lock Profit — ${sym}`,
            action: "Sell & Lock Profit",
            msg: `You're up +${pct.toFixed(2)}% (+$${pnl.toFixed(2)}) · AI detects bearish reversal · Consider selling to lock in your profit before market turns.`,
          });
        }
      }
    });

    // Merge alerts
    const currentKeys = new Set(newAlerts.map(a => a.key));
    set(s => {
      const existing = new Map(s.riskAlerts.map(a => [a.key, a]));
      newAlerts.forEach(a => existing.set(a.key, a));
      existing.forEach((_, k) => { if (!currentKeys.has(k)) existing.delete(k); });
      return { riskAlerts: Array.from(existing.values()) };
    });
  },

  // ── Internal: start global background polling ──
  _startPolling: () => {
    // Clear any existing timers
    if (_pollTimer)    clearInterval(_pollTimer);
    if (_accountTimer) clearInterval(_accountTimer);

    // Poll prices every 15s — backend cache is 15s so faster is wasteful
    _pollTimer = setInterval(() => {
      const portfolio = get().account?.portfolio || {};
      if (Object.keys(portfolio).length > 0) get()._pollPrices();
    }, 15000);

    // Sync account from backend every 60s
    _accountTimer = setInterval(async () => {
      try {
        const res = await api.get("/demo/account");
        set(s => ({ account: { ...s.account, ...res.data } }));
      } catch {}
    }, 60000);

    // Run immediately
    get()._pollPrices();
  },
}));

export default useDemoStore;
