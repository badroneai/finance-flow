/*
  قيد العقار (Finance Flow)
  Stage 2 — core/storage.js

  الهدف:
  - واجهة موحّدة للتعامل مع localStorage.
  - إزالة أي globals (عدم كشف storage على window).
*/

import { STORAGE_KEYS } from './keys.js';

/**
 * نتيجة الكتابة — للتحقق من QuotaExceededError أو أخطاء التخزين.
 * @typedef {{ ok: boolean, error?: 'quota'|'storage' }} SetResult
 */

export const storage = {
  getRaw(key) {
    return localStorage.getItem(key);
  },
  /** يرجِع SetResult. عند امتلاء التخزين أو SecurityError لا يرمي بل يرجِع { ok: false, error } */
  setRaw(key, val) {
    try {
      localStorage.setItem(key, val);
      return { ok: true };
    } catch (e) {
      const name = e && e.name;
      const error = name === 'QuotaExceededError' || (e && (e.code === 22 || e.code === 1014)) ? 'quota' : 'storage';
      return { ok: false, error };
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  /** نفس remove — للتوافق مع storage-facade (استدعاء removeRaw) */
  removeRaw(key) {
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
  /** يرجِع SetResult. لا يرمي عند امتلاء التخزين. */
  setJSON(key, obj) {
    try {
      const s = JSON.stringify(obj);
      return this.setRaw(key, s);
    } catch {
      return { ok: false, error: 'storage' };
    }
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
