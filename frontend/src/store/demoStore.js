import { create } from "zustand";
import api, { getErrorMsg } from "../utils/api";
import { INR_SYMBOLS } from "./fxStore";

let _pollTimer    = null;
let _accountTimer = null;

// Convert raw price to INR using current rate
const toInrPrice = (price, symbol, usdInr = 84) => {
  if (!price) return null;
  if (INR_SYMBOLS.has(symbol)) return price;
  return price * usdInr;
};

const useDemoStore = create((set, get) => ({
  account:     null,
  loading:     false,
  error:       null,
  livePrices:  {},
  riskAlerts:  [],
  dismissed:   new Set(),

  // ── Fetch account ──
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/demo/account");
      set({ account: res.data, loading: false });
      get()._startPolling();
    } catch (e) {
      set({ loading: false, error: getErrorMsg(e, "Failed to load account") });
    }
  },

  // ── Buy ──
  buy: async (symbol, price, qty) => {
    try {
      const res = await api.post("/demo/buy", { symbol, price, qty });
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

  // ── Internal: fetch all holding prices ──
  _pollPrices: async () => {
    const portfolio = get().account?.portfolio || {};
    const syms = Object.keys(portfolio);
    if (!syms.length) { set({ livePrices: {} }); return; }

    // Get current USD/INR rate
    let usdInr = 84;
    try {
      const fx = await api.get("/market/quote/USDINR%3DX");
      if (fx.data?.price > 50) usdInr = fx.data.price;
    } catch {}

    const results = await Promise.allSettled(
      syms.map(s => api.get(`/market/quote/${encodeURIComponent(s)}`))
    );

    const prices = { ...get().livePrices };
    results.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value.data?.price) {
        // Store raw price (same as API) — frontend converts to INR for display
        prices[syms[i]] = r.value.data.price;
      }
    });

    set({ livePrices: prices });

    // ── Risk alerts ──
    const WARN = -2, DANGER = -5, CRITICAL = -8;
    const dismissed = get().dismissed;
    const newAlerts = [];

    // Profit protection — fetch signals for profit positions
    const profitSyms = syms.filter(sym => {
      const rawLp = prices[sym];
      const h     = portfolio[sym];
      if (!rawLp || !h?.avg_price) return false;
      return rawLp > h.avg_price; // compare in same raw currency
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
      if (r.status === "fulfilled" && r.value.data?.signal === "SELL")
        bearishSyms.add(profitSyms[i]);
    });

    Object.entries(portfolio).forEach(([sym, h]) => {
      const rawLp = prices[sym];
      const avg   = h.avg_price; // raw price stored by backend
      if (!rawLp || !avg) return;
      const pct = ((rawLp - avg) / avg) * 100;
      const pnlRaw = (rawLp - avg) * h.qty;
      // Convert P&L to INR for display in alerts
      const pnlInr = INR_SYMBOLS.has(sym) ? pnlRaw : pnlRaw * usdInr;

      // Loss alerts
      let level = null;
      if (pct <= CRITICAL)    level = "critical";
      else if (pct <= DANGER) level = "danger";
      else if (pct <= WARN)   level = "warn";

      if (level) {
        const key = `${sym}_${level}`;
        if (!dismissed.has(key)) {
          const LABELS = {
            critical: { title: `🚨 Critical Loss — ${sym}`, action: "Sell Now", msg: `Down ${Math.abs(pct).toFixed(2)}% · Loss ₹${Math.abs(pnlInr).toFixed(0)} · Sell immediately.` },
            danger:   { title: `⚠️ Sell Alert — ${sym}`,    action: "Sell Now", msg: `Down ${Math.abs(pct).toFixed(2)}% · Loss ₹${Math.abs(pnlInr).toFixed(0)} · Position moving against you.` },
            warn:     { title: `🟡 Watch Out — ${sym}`,     action: "Review",   msg: `Down ${Math.abs(pct).toFixed(2)}% · Loss ₹${Math.abs(pnlInr).toFixed(0)} · Monitor closely.` },
          };
          newAlerts.push({ sym, pct, pnl: pnlInr, level, key, ...LABELS[level] });
        }
      }

      // Profit protect
      if (pct > 0 && bearishSyms.has(sym)) {
        const key = `${sym}_profit_protect`;
        if (!dismissed.has(key)) {
          newAlerts.push({
            sym, pct, pnl: pnlInr, level: "profit_protect", key,
            title:  `💡 Lock Profit — ${sym}`,
            action: "Sell & Lock Profit",
            msg:    `Up +${pct.toFixed(2)}% (+₹${pnlInr.toFixed(0)}) · AI detects bearish reversal · Consider selling to lock profit.`,
          });
        }
      }
    });

    const currentKeys = new Set(newAlerts.map(a => a.key));
    set(s => {
      const existing = new Map(s.riskAlerts.map(a => [a.key, a]));
      newAlerts.forEach(a => existing.set(a.key, a));
      existing.forEach((_, k) => { if (!currentKeys.has(k)) existing.delete(k); });
      return { riskAlerts: Array.from(existing.values()) };
    });
  },

  // ── Start background polling ──
  _startPolling: () => {
    if (_pollTimer)    clearInterval(_pollTimer);
    if (_accountTimer) clearInterval(_accountTimer);

    _pollTimer = setInterval(() => {
      if (Object.keys(get().account?.portfolio || {}).length > 0)
        get()._pollPrices();
    }, 15000);

    _accountTimer = setInterval(async () => {
      try {
        const res = await api.get("/demo/account");
        set(s => ({ account: { ...s.account, ...res.data } }));
      } catch {}
    }, 60000);

    get()._pollPrices();
  },
}));

export default useDemoStore;
