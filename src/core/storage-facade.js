/*
  قيد العقار (Finance Flow)
  storage-facade.js — طبقة التخزين الموحدة (SPR-003: مكتفية ذاتياً داخل src/)

  الهدف:
  - واجهة موحّدة للتعامل مع localStorage.
  - لا تستورد من خارج src/.
*/

export const storageFacade = {
  // Raw string API
  getRaw: (key) => localStorage.getItem(key),

  /** يرجِع true عند النجاح، false عند فشل الكتابة (مثلاً QuotaExceededError). */
  setRaw: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeRaw: (key) => {
    localStorage.removeItem(key);
  },

  // JSON convenience (no schema changes; just helpers)
  getJSON: (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  /** يرجِع true عند النجاح، false عند فشل الكتابة أو JSON.stringify. */
  setJSON: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  // Small helper for batch operations (used in clear/export)
  removeMany: (keys = []) => {
    for (const k of keys) {
      try {
        localStorage.removeItem(k);
      } catch {}
    }
  },
};
