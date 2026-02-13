/*
  قيد العقار (Finance Flow)
  Stage 3 — core/storage.js

  الهدف:
  - واجهة موحّدة للتعامل مع localStorage.
  - بدون تغيير سلوك التطبيق.

  ملاحظة:
  - هذا الملف Module (ESM) ويُحمّل عبر <script type="module">.
  - نكشف storage/ffStorage على window لتستخدمه النسخة الحالية (single-file) بدون refactor كبير.
*/

import { STORAGE_KEYS } from './keys.js';

export const storage = {
  getRaw(key) {
    return localStorage.getItem(key);
  },
  setRaw(key, val) {
    localStorage.setItem(key, val);
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  getJSON(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  setJSON(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  },
};

export const ffStorage = {
  getTransactionsRaw() { return storage.getRaw(STORAGE_KEYS.TRANSACTIONS); },
  setTransactionsRaw(v) { storage.setRaw(STORAGE_KEYS.TRANSACTIONS, v); },

  getCommissionsRaw() { return storage.getRaw(STORAGE_KEYS.COMMISSIONS); },
  setCommissionsRaw(v) { storage.setRaw(STORAGE_KEYS.COMMISSIONS, v); },

  getDraftsRaw() { return storage.getRaw(STORAGE_KEYS.DRAFTS); },
  setDraftsRaw(v) { storage.setRaw(STORAGE_KEYS.DRAFTS, v); },

  getSettingsRaw() { return storage.getRaw(STORAGE_KEYS.SETTINGS); },
  setSettingsRaw(v) { storage.setRaw(STORAGE_KEYS.SETTINGS, v); },

  getSeededRaw() { return storage.getRaw(STORAGE_KEYS.SEEDED); },
  setSeededRaw(v) { storage.setRaw(STORAGE_KEYS.SEEDED, v); },
};

// Expose for legacy single-file usage (no behavior change)
if (typeof window !== 'undefined') {
  window.storage = window.storage || storage;
  window.ffStorage = window.ffStorage || ffStorage;
}
