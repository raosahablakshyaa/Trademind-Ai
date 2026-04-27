import { create } from "zustand";
import api from "../utils/api";

const SCAN_TTL    = 7 * 60 * 1000; // 7 minutes in ms
const AUTO_INTERVAL = 7 * 60 * 1000;
const BATCH_SIZE  = 5;

let _autoTimer = null;

const useSignalStore = create((set, get) => ({
  // { [cat]: { results: {sym: {signal, confidence}}, scannedAt: timestamp, scanning: bool, progress: 0 } }
  scans: {},

  // ── Run scan for a given symbols list under a category key ──
  scan: async (catKey, symbols) => {
    const existing = get().scans[catKey];
    // Skip if already scanning
    if (existing?.scanning) return;

    set(s => ({
      scans: {
        ...s.scans,
        [catKey]: { results: existing?.results || {}, scanning: true, progress: 0, scannedAt: existing?.scannedAt || null },
      }
    }));

    const results = { ...(existing?.results || {}) };

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (sym) => {
          try {
            const fd = new FormData();
            fd.append("symbol", sym);
            fd.append("dl_direction", "UP");
            fd.append("dl_confidence", 65);
            const res = await api.post("/signals/generate", fd);
            results[sym] = { signal: res.data.signal, confidence: res.data.confidence };
          } catch {
            results[sym] = { signal: "HOLD", confidence: 0 };
          }
        })
      );

      set(s => ({
        scans: {
          ...s.scans,
          [catKey]: { ...s.scans[catKey], results: { ...results }, progress: Math.min(i + BATCH_SIZE, symbols.length) },
        }
      }));
    }

    set(s => ({
      scans: {
        ...s.scans,
        [catKey]: { results, scanning: false, progress: symbols.length, scannedAt: Date.now() },
      }
    }));
  },

  // ── Check if scan is fresh (within TTL) ──
  isFresh: (catKey) => {
    const scan = get().scans[catKey];
    if (!scan?.scannedAt) return false;
    return Date.now() - scan.scannedAt < SCAN_TTL;
  },

  // ── Clear a specific scan ──
  clearScan: (catKey) => {
    set(s => {
      const scans = { ...s.scans };
      delete scans[catKey];
      return { scans };
    });
  },

  // ── Start global auto-refresh timer ──
  startAutoRefresh: (catKey, symbols) => {
    if (_autoTimer) clearInterval(_autoTimer);
    _autoTimer = setInterval(() => {
      // Only auto-scan if a scan exists for this category
      const scan = get().scans[catKey];
      if (scan?.scannedAt && !scan.scanning) {
        get().scan(catKey, symbols);
      }
    }, AUTO_INTERVAL);
  },

  stopAutoRefresh: () => {
    if (_autoTimer) { clearInterval(_autoTimer); _autoTimer = null; }
  },
}));

export default useSignalStore;
