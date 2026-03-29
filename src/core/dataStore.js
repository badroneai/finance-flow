/*
  قيد العقار — طبقة التخزين والبيانات (dataStore، safeGet، safeSet، createCrud، إلخ) مستخرجة من App.jsx
*/

import { storageFacade } from './storage-facade.js';
import { getActiveLedgerId } from './ledger-store.js';
import {
  KEYS,
  SEED_SETTINGS,
  SEED_TRANSACTIONS,
  SEED_COMMISSIONS,
  SEED_DRAFTS,
  SEED_PROPERTIES,
  SEED_UNITS,
  SEED_CONTACTS,
  SEED_CONTRACTS,
  SEED_CONTRACT_PAYMENTS,
  SEED_CONTRACT_RECEIPTS,
  STORAGE_ERROR_MESSAGE,
} from '../constants/index.js';
import { genId, now } from '../utils/helpers.js';

/** للاختبار فقط */
const SIMULATE_STORAGE_FAILURE = false;

export const getActiveLedgerIdSafe = () => {
  try {
    return getActiveLedgerId() || '';
  } catch {
    return '';
  }
};

export const safeGet = (key, fallback) => storageFacade.getJSON(key, fallback);

/** يرجع { ok: true } عند النجاح، أو { ok: false, code, message } عند الفشل */
export const safeSet = (key, val) => {
  if (SIMULATE_STORAGE_FAILURE)
    throw new DOMException('Simulated quota exceeded', 'QuotaExceededError');
  try {
    const ok = storageFacade.setJSON(key, val);
    if (ok) return { ok: true };
    return { ok: false, code: 'unknown', message: STORAGE_ERROR_MESSAGE };
  } catch (e) {
    const isQuota = e && (e.name === 'QuotaExceededError' || e.code === 22);
    const message = isQuota
      ? STORAGE_ERROR_MESSAGE
      : e && e.message
        ? String(e.message)
        : STORAGE_ERROR_MESSAGE;
    return { ok: false, code: isQuota ? 'quota' : 'unknown', message };
  }
};

export const createCrud = (key, options = {}) => {
  const {
    list: listOverride,
    sortBy = () => 0,
    enrichCreate = (d) => ({ ...d, id: genId(), createdAt: now(), updatedAt: now() }),
  } = options;
  return {
    list: listOverride || (() => (safeGet(key, []) || []).sort(sortBy)),
    create(data) {
      const items = safeGet(key, []) || [];
      const item = enrichCreate(data);
      items.push(item);
      const r = safeSet(key, items);
      if (!r.ok) return r;
      return { ok: true, item };
    },
    update(id, data) {
      const items = safeGet(key, []) || [];
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data, updatedAt: now() };
      const r = safeSet(key, items);
      if (!r.ok) return r;
      return { ok: true, item: items[idx] };
    },
    remove(id) {
      const items = (safeGet(key, []) || []).filter((i) => i.id !== id);
      const r = safeSet(key, items);
      if (!r.ok) return r;
      return { ok: true };
    },
  };
};

export const transactionsList = (filters) => {
  let items = safeGet(KEYS.transactions, []);

  try {
    const activeLedgerId = getActiveLedgerIdSafe();
    if (activeLedgerId) {
      let changed = false;
      const next = (Array.isArray(items) ? items : []).map((t) => {
        if (t && !t.ledgerId) {
          changed = true;
          return { ...t, ledgerId: activeLedgerId };
        }
        return t;
      });
      if (changed) {
        items = next;
        safeSet(KEYS.transactions, items);
      }
    }
  } catch {}

  if (!filters) return items;
  if (filters.fromDate) items = items.filter((t) => t.date >= filters.fromDate);
  if (filters.toDate) items = items.filter((t) => t.date <= filters.toDate);
  if (filters.type) items = items.filter((t) => t.type === filters.type);
  if (filters.category) items = items.filter((t) => t.category === filters.category);
  if (filters.paymentMethod) items = items.filter((t) => t.paymentMethod === filters.paymentMethod);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter((t) => (t.description || '').toLowerCase().includes(s));
  }
  return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
};

const _commissionsCrud = createCrud(KEYS.commissions, {
  sortBy: (a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''),
});
const _draftsCrud = createCrud(KEYS.drafts, {
  sortBy: (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''),
});

export const dataStore = {
  transactions: {
    list: transactionsList,
    ...createCrud(KEYS.transactions, {
      enrichCreate: (data) => ({
        ...data,
        ledgerId: getActiveLedgerIdSafe(),
        id: genId(),
        createdAt: now(),
        updatedAt: now(),
      }),
    }),
  },
  commissions: _commissionsCrud,
  properties: createCrud(KEYS.properties, {
    sortBy: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
  }),
  units: createCrud(KEYS.units, {
    sortBy: (a, b) => (a.name || '').localeCompare(b.name || ''),
  }),
  contacts: createCrud(KEYS.contacts, {
    sortBy: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
  }),
  contracts: createCrud(KEYS.contracts, {
    sortBy: (a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''),
  }),
  contractPayments: createCrud(KEYS.contractPayments, {
    sortBy: (a, b) => (b.date || '').localeCompare(a.date || ''),
  }),
  contractReceipts: createCrud(KEYS.contractReceipts, {
    sortBy: (a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''),
  }),
  letters: {
    listDrafts: _draftsCrud.list,
    saveDraft: _draftsCrud.create,
    updateDraft: _draftsCrud.update,
    removeDraft: _draftsCrud.remove,
  },
  settings: {
    get: () => {
      const current = safeGet(KEYS.settings, SEED_SETTINGS);
      const theme =
        current &&
        (current.theme === 'light' || current.theme === 'dim' || current.theme === 'dark')
          ? current.theme
          : 'light';
      const numerals =
        current && (current.numerals === 'ar' || current.numerals === 'en')
          ? current.numerals
          : 'ar';
      return { ...SEED_SETTINGS, ...current, theme, numerals };
    },
    update: (data) => {
      const current = safeGet(KEYS.settings, SEED_SETTINGS);
      const updated = { ...current, ...data };
      const r = safeSet(KEYS.settings, updated);
      if (!r.ok) return r;
      return { ok: true, updated };
    },
  },
  seed: {
    resetDemo: () => {
      const activeLedgerId = getActiveLedgerIdSafe();
      const txs = SEED_TRANSACTIONS.map((t) => ({
        ...t,
        id: genId(),
        createdAt: now(),
        updatedAt: now(),
        ...(activeLedgerId ? { ledgerId: activeLedgerId } : {}),
      }));
      const cms = SEED_COMMISSIONS.map((c) => ({
        ...c,
        id: genId(),
        createdAt: now(),
        updatedAt: now(),
      }));
      const drs = SEED_DRAFTS.map((d) => ({
        ...d,
        id: genId(),
        createdAt: now(),
        updatedAt: now(),
      }));
      const properties = SEED_PROPERTIES.map((item) => ({
        ...item,
        createdAt: item.createdAt || now(),
        updatedAt: item.updatedAt || now(),
      }));
      const units = SEED_UNITS.map((item) => ({
        ...item,
        createdAt: item.createdAt || now(),
        updatedAt: item.updatedAt || now(),
      }));
      const contacts = SEED_CONTACTS.map((item) => ({
        ...item,
        createdAt: item.createdAt || now(),
        updatedAt: item.updatedAt || now(),
      }));
      const contracts = SEED_CONTRACTS.map((item) => ({
        ...item,
        createdAt: item.createdAt || now(),
        updatedAt: item.updatedAt || now(),
      }));
      const contractPayments = SEED_CONTRACT_PAYMENTS.map((item) => ({
        ...item,
        createdAt: item.createdAt || now(),
        updatedAt: item.updatedAt || now(),
      }));
      const contractReceipts = SEED_CONTRACT_RECEIPTS.map((item) => ({
        ...item,
        createdAt: item.createdAt || now(),
        updatedAt: item.updatedAt || now(),
      }));
      let r = safeSet(KEYS.transactions, txs);
      if (!r.ok) return r;
      r = safeSet(KEYS.commissions, cms);
      if (!r.ok) return r;
      r = safeSet(KEYS.drafts, drs);
      if (!r.ok) return r;
      r = safeSet(KEYS.properties, properties);
      if (!r.ok) return r;
      r = safeSet(KEYS.units, units);
      if (!r.ok) return r;
      r = safeSet(KEYS.contacts, contacts);
      if (!r.ok) return r;
      r = safeSet(KEYS.contracts, contracts);
      if (!r.ok) return r;
      r = safeSet(KEYS.contractPayments, contractPayments);
      if (!r.ok) return r;
      r = safeSet(KEYS.contractReceipts, contractReceipts);
      if (!r.ok) return r;
      r = safeSet(KEYS.settings, SEED_SETTINGS);
      if (!r.ok) return r;
      r = safeSet(KEYS.seeded, true);
      if (!r.ok) return r;
      return { ok: true };
    },
    clearAll: () => {
      storageFacade.removeMany(Object.values(KEYS));
    },
    ensureSeeded: () => {
      if (!safeGet(KEYS.seeded, false)) {
        dataStore.seed.resetDemo();
        return;
      }

      const properties = safeGet(KEYS.properties, []);
      const units = safeGet(KEYS.units, []);
      const contacts = safeGet(KEYS.contacts, []);
      const contracts = safeGet(KEYS.contracts, []);
      const contractPayments = safeGet(KEYS.contractPayments, []);
      const hasRealEstateData =
        (Array.isArray(properties) && properties.length > 0) ||
        (Array.isArray(units) && units.length > 0) ||
        (Array.isArray(contacts) && contacts.length > 0) ||
        (Array.isArray(contracts) && contracts.length > 0);

      if (!hasRealEstateData) {
        safeSet(KEYS.properties, SEED_PROPERTIES);
        safeSet(KEYS.units, SEED_UNITS);
        safeSet(KEYS.contacts, SEED_CONTACTS);
        safeSet(KEYS.contracts, SEED_CONTRACTS);
      }

      if (!Array.isArray(contractPayments) || contractPayments.length === 0) {
        safeSet(KEYS.contractPayments, SEED_CONTRACT_PAYMENTS);
      }

      // سندات القبض — backward compatible: لن تُمسح بيانات موجودة
      const contractReceipts = safeGet(KEYS.contractReceipts, []);
      if (!Array.isArray(contractReceipts) || contractReceipts.length === 0) {
        safeSet(KEYS.contractReceipts, SEED_CONTRACT_RECEIPTS);
      }
    },
  },
};

/** حركات دفتر معيّن — النسخة المركزية الوحيدة (SPR-002) */
export const getTransactionsForLedger = (ledgerId) => {
  const lid = String(ledgerId || '').trim();
  if (!lid) return [];
  const all = (dataStore.transactions?.list?.() || []).filter(Boolean);
  return all.filter((t) => String(t?.ledgerId || t?.meta?.ledgerId || '') === lid);
};

export const detectPrivateBrowsing = () => {
  try {
    storageFacade.setRaw('_ff_private_test', '1');
    storageFacade.removeRaw('_ff_private_test');
    return false;
  } catch (e) {
    return true;
  }
};

export default {
  getActiveLedgerIdSafe,
  safeGet,
  safeSet,
  createCrud,
  transactionsList,
  dataStore,
  detectPrivateBrowsing,
};
