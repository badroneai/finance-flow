/*
  قيد العقار (Finance Flow)
  Stage 3.1 — storage facade

  الهدف:
  - طبقة موحدة للوصول للتخزين (بدون تغيير سلوك).
  - في هذه المرحلة نُبقي التنفيذ فوق core/storage الحالي.
*/

import { storage } from '../../assets/js/core/storage.js';

export const storageFacade = {
  // Raw string API (same semantics as core/storage)
  getRaw: (key) => storage.getRaw(key),
  setRaw: (key, value) => storage.setRaw(key, value),
  removeRaw: (key) => storage.removeRaw(key),

  // JSON convenience (no schema changes; just helpers)
  getJSON: (key, fallback = null) => {
    try {
      const raw = storage.getRaw(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  setJSON: (key, value) => {
    try {
      storage.setRaw(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  // Small helper for batch operations (used in clear/export)
  removeMany: (keys = []) => {
    for (const k of keys) {
      try { storage.removeRaw(k); } catch {}
    }
  },
};
