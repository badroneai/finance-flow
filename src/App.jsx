import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';

import { STORAGE_KEYS } from '../assets/js/core/keys.js';
import { storage } from '../assets/js/core/storage.js';
import { storageFacade } from './core/storage-facade.js';
import {
  getLedgers,
  setLedgers,
  getActiveLedgerId,
  setActiveLedgerId,
  getRecurringItems,
  setRecurringItems,
} from './core/ledger-store.js';

import {
  filterTransactions,
  sumTransactions,
  filterCommissions,
  computeCommissionTotals,
  listAgentNames,
  // Notes/Calendar domain
  gregorianToHijri,
  getKeyNC,
  toArabicNumNC,
  buildCalendarDays,
  getEventsForDate,
  isHoliday,
  addDailyNote as domainAddDailyNote,
  toggleDailyNote as domainToggleDailyNote,
  deleteDailyNote as domainDeleteDailyNote,
  addPinnedNote as domainAddPinnedNote,
  deletePinnedNote as domainDeletePinnedNote,
  updatePinnedNote as domainUpdatePinnedNote,

  // Letters/Templates/Drafts domain
  DEFAULT_BODIES,
  TEMPLATES,
  FIELD_LABELS,
  getTemplateByType,
  buildInitialFields,
  validateLetterFields,
  formatDraftDate,

  // Dashboard/Reports/Charts domain
  getDashboardDateRange,
  computeIncomeExpenseNet,
  splitCommissionsByStatus,
  computeCommissionOfficeTotals,
  buildLast6MonthsIncomeExpenseChart,
} from './domain/index.js';

import { checkStorageQuota } from './core/storage-quota.js';

// Stage 3 bundle: keep existing storage import, but prefer facade for any new/updated call sites


// ============================================
// TYPES
// ============================================
const TRANSACTION_TYPES = { income: 'دخل', expense: 'خرج' };
const TRANSACTION_CATEGORIES = { commission: 'عمولة', expense: 'مصروفات', deposit: 'إيداع', refund: 'استرجاع', salary: 'راتب', rent: 'إيجار', other: 'أخرى' };
const PAYMENT_METHODS = { cash: 'نقدي', bank_transfer: 'تحويل بنكي', check: 'شيك', electronic: 'بطاقة إلكترونية' };
const COMMISSION_STATUSES = { pending: 'معلقة', paid: 'مدفوعة' };
const LETTER_TYPES = { intro: 'خطاب تعريف', request: 'خطاب مخاطبة', delegation: 'خطاب تفويض' };

// ============================================
// UTILITY FUNCTIONS
// ============================================
const genId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().split('T')[0];
/* Phase 7.2: Central Formatter (depends on dataStore — defined below) */

// (month label/key moved to domain charts helpers)

/** تهريب حقل CSV (RFC 4180) لتصدير العمولات */
const csvEscape = (v) => {
  const s = v == null ? '' : String(v);
  if (/[,\r\n"]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

// ============================================
// SEED DATA
// ============================================
const SEED_TRANSACTIONS = [
  { type:'income', category:'commission', amount:15000, paymentMethod:'bank_transfer', date:'2025-01-15', description:'عمولة بيع فيلا حي الملقا' },
  { type:'expense', category:'expense', amount:3000, paymentMethod:'cash', date:'2025-01-20', description:'صيانة مكتب' },
  { type:'income', category:'deposit', amount:25000, paymentMethod:'bank_transfer', date:'2025-01-25', description:'دفعة عميل أحمد' },
  { type:'expense', category:'salary', amount:8000, paymentMethod:'bank_transfer', date:'2025-01-30', description:'راتب موظف' },
  { type:'income', category:'commission', amount:12000, paymentMethod:'check', date:'2025-02-01', description:'عمولة تأجير محل تجاري' },
  { type:'expense', category:'rent', amount:15000, paymentMethod:'bank_transfer', date:'2025-02-05', description:'إيجار مكتب شهر فبراير' },
  { type:'income', category:'refund', amount:2000, paymentMethod:'cash', date:'2025-02-07', description:'استرجاع مصروفات' },
  { type:'expense', category:'other', amount:1500, paymentMethod:'cash', date:'2025-02-10', description:'مصروفات متنوعة' },
  { type:'income', category:'commission', amount:18000, paymentMethod:'bank_transfer', date:'2025-02-12', description:'عمولة بيع أرض' },
  { type:'expense', category:'expense', amount:2500, paymentMethod:'electronic', date:'2025-02-15', description:'مصروفات تسويق' },
];

const SEED_COMMISSIONS = [
  { clientName:'صفقة بيع فيلا - عميل خالد', dealValue:500000, officePercent:3, agentName:'محمد السعيد', agentPercent:97, status:'pending', dueDate:'2025-03-01' },
  { clientName:'تأجير محل تجاري - شركة النور', dealValue:200000, officePercent:2, agentName:'فهد العتيبي', agentPercent:98, status:'paid', dueDate:'2025-01-20', paidDate:'2025-01-22' },
  { clientName:'بيع أرض سكنية', dealValue:800000, officePercent:2.5, agentName:'سارة القحطاني', agentPercent:97.5, status:'pending', dueDate:'2025-03-15' },
  { clientName:'تأجير فيلا - عائلة الأحمد', dealValue:150000, officePercent:3, agentName:'عبدالله المطيري', agentPercent:97, status:'paid', dueDate:'2025-01-15', paidDate:'2025-01-18' },
  { clientName:'بيع شقة - عميل ناصر', dealValue:350000, officePercent:2, agentName:'نورة الدوسري', agentPercent:98, status:'pending', dueDate:'2025-04-01' },
  { clientName:'استثمار عقاري - شركة الخليج', dealValue:1200000, officePercent:1.5, agentName:'أحمد الشمري', agentPercent:98.5, status:'paid', dueDate:'2025-02-01', paidDate:'2025-02-03' },
];

const SEED_DRAFTS = [
  { templateType:'intro', fields:{ officeName:'مكتب مثال العقاري', recipientName:'السيد أحمد', recipientOrg:'شركة العقار الذهبي', date:'2025-02-15', managerName:'خالد الأحمد' }},
  { templateType:'request', fields:{ officeName:'مكتب مثال العقاري', recipientOrg:'بلدية بريدة', subject:'طلب تصريح', body:'نرجو التكرم بإصدار تصريح...', date:'2025-02-10', managerName:'خالد الأحمد' }},
];

const SEED_SETTINGS = { officeName:'مكتب مثال العقاري', phone:'0501234567', email:'info@example-realestate.sa', defaultCommissionPercent:50, theme:'light', numerals:'ar' };

// ============================================
// DATASTORE (LocalStorage Abstraction)
// ============================================
// Replace LocalStorage calls with API in this layer later
const KEYS = { transactions:STORAGE_KEYS.TRANSACTIONS, commissions:STORAGE_KEYS.COMMISSIONS, drafts:STORAGE_KEYS.DRAFTS, settings:STORAGE_KEYS.SETTINGS, seeded:STORAGE_KEYS.SEEDED };

// ============================================
// UI THEME (Phase B+3)
// ============================================
// Strict rule: only UI theme key allowed outside financial/local data is: ui_theme
//
// THEME AUDIT (Issue #6 / 3A — audit + guard only)
// Source of truth:
// - localStorage.ui_theme
// - document.documentElement.dataset.theme (effective)
//
// Legacy theme-ish sources found (ignored by design):
// - ff_settings (KEYS.settings='ff_settings') contains settings.theme (SEED_SETTINGS.theme, dataStore.settings.get reads current.theme)
//   - SEED_SETTINGS includes theme (around line ~338)
//   - dataStore.settings.get reads current.theme (around lines ~632-635)
// - No document.body.dataset.theme usage found (we will still guard against it in initTheme)
// - No localStorage key named "theme" or "darkMode" found
const UI_THEME_KEY = STORAGE_KEYS.UI_THEME;
const UI_NUMERALS_KEY = STORAGE_KEYS.UI_NUMERALS;
const UI_DATE_HEADER_KEY = STORAGE_KEYS.UI_DATE_HEADER;
const UI_ONBOARDING_SEEN_KEY = STORAGE_KEYS.UI_ONBOARDING;

// In-memory source of truth for display-only numerals (ar/en)
let __uiNumeralsMode = null;
try { window.__uiNumeralsMode = __uiNumeralsMode; } catch {}

const getSavedTheme = () => {
  try {
    const t = storageFacade.getRaw(UI_THEME_KEY);
    return (t === 'system' || t === 'light' || t === 'dim' || t === 'dark') ? t : null;
  } catch {
    return null;
  }
};

let __themeSystemMql = null;
let __themeSystemListener = null;

const getEffectiveSystemTheme = () => {
  try {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const startSystemThemeListener = () => {
  try {
    if (!window.matchMedia) return;
    if (__themeSystemMql) return;

    __themeSystemMql = window.matchMedia('(prefers-color-scheme: dark)');
    __themeSystemListener = () => {
      // When in system mode, update effective theme without changing ui_theme.
      document.documentElement.dataset.theme = getEffectiveSystemTheme();
    };

    if (__themeSystemMql.addEventListener) __themeSystemMql.addEventListener('change', __themeSystemListener);
    else if (__themeSystemMql.addListener) __themeSystemMql.addListener(__themeSystemListener);
  } catch {
    // noop
  }
};

const stopSystemThemeListener = () => {
  try {
    if (!__themeSystemMql || !__themeSystemListener) return;
    if (__themeSystemMql.removeEventListener) __themeSystemMql.removeEventListener('change', __themeSystemListener);
    else if (__themeSystemMql.removeListener) __themeSystemMql.removeListener(__themeSystemListener);
  } catch {
    // noop
  } finally {
    __themeSystemMql = null;
    __themeSystemListener = null;
  }
};

const applyTheme = (theme) => {
  const t = (theme === 'system' || theme === 'light' || theme === 'dim' || theme === 'dark') ? theme : 'system';

  if (t === 'system') startSystemThemeListener();
  else stopSystemThemeListener();

  const effective = (t === 'system') ? getEffectiveSystemTheme() : t;
  document.documentElement.dataset.theme = effective;
  try { storageFacade.setRaw(UI_THEME_KEY, t); } catch {}
};

const initTheme = () => {
  // Ignore legacy theme sources by design. Do NOT read ff_settings.theme or body.dataset.theme.
  try { if (document.body && document.body.dataset && document.body.dataset.theme) delete document.body.dataset.theme; } catch {}

  const saved = getSavedTheme();
  // Default behavior: System when not set
  const t = saved || 'system';
  applyTheme(t);
  return t;
};

const getSavedNumerals = () => {
  try {
    const n = storageFacade.getRaw(UI_NUMERALS_KEY);
    return (n === 'ar' || n === 'en') ? n : null;
  } catch {
    return null;
  }
};

const getSavedDateHeader = () => {
  try {
    const v = storageFacade.getRaw(UI_DATE_HEADER_KEY);
    // Legacy migration: on/off → both/off
    if (v === 'on') return 'both';
    if (v === 'off') return 'off';
    return (v === 'off' || v === 'greg' || v === 'hijri' || v === 'both') ? v : null;
  } catch {
    return null;
  }
};

const setDateHeaderPref = (value) => {
  const v = (value === 'off' || value === 'greg' || value === 'hijri' || value === 'both') ? value : 'both';
  try { storageFacade.setRaw(UI_DATE_HEADER_KEY, v); } catch {}
  try { window.dispatchEvent(new CustomEvent('ui:dateHeader')); } catch {}
};

const getOnboardingSeen = () => {
  try {
    return storageFacade.getRaw(UI_ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const setOnboardingSeen = () => {
  try { storageFacade.setRaw(UI_ONBOARDING_SEEN_KEY, '1'); } catch {}
};

const applyNumerals = (mode) => {
  const m = (mode === 'ar' || mode === 'en') ? mode : 'ar';
  __uiNumeralsMode = m;
  try { window.__uiNumeralsMode = __uiNumeralsMode; } catch {}
  document.documentElement.dataset.numerals = m;
  try { storageFacade.setRaw(UI_NUMERALS_KEY, m); } catch {}
  // Notify UI layers that depend on numerals (e.g., date header)
  try { window.dispatchEvent(new CustomEvent('ui:numerals')); } catch {}
};

const initNumerals = () => {
  const saved = getSavedNumerals();
  if (saved) { applyNumerals(saved); return saved; }
  // Default: Arabic numerals (current product default)
  __uiNumeralsMode = 'ar';
  document.documentElement.dataset.numerals = 'ar';
  return 'ar';
};

/** Phase 7 — رسائل النجاح والخطأ (٠٦ النبرة: احترافية، هادئة، مباشرة) */
const MSG = {
  success: { saved: 'تم التسجيل بنجاح', updated: 'تم تحديث البيانات', deleted: 'تم الحذف بنجاح', transaction: 'تم تسجيل العملية المالية', commission: 'تم تسجيل العمولة بنجاح' },
  error: { required: 'هذا الحقل مطلوب', invalidAmount: 'المبلغ المدخل غير صحيح', duplicate: 'هذا العنصر موجود بالفعل', deleteFailed: 'لم يتم الحذف. يُنصح بالمحاولة مرة أخرى' },
  confirm: { deleteAction: 'هل أنت متأكد من هذا الإجراء؟' },
  buttons: { save: 'تسجيل البيانات', cancel: 'تراجع', delete: 'حذف نهائي' }
};
/** Phase 9.4: رقم إصدار تنسيق النسخة الاحتياطية (JSON) */
const BACKUP_VERSION = 1;

/** Phase 9.2: رسالة موحدة عند فشل الحفظ (٠٦ نبرة مباشرة) */
const STORAGE_ERROR_MESSAGE = 'لم يتم الحفظ. مساحة التخزين ممتلئة. يُنصح بتصدير نسخة احتياطية ثم حذف بعض البيانات.';

/** Phase 9.1: كشف التصفح الخاص */
const detectPrivateBrowsing = () => {
  try {
    storageFacade.setRaw('_ff_private_test', '1');
    storageFacade.removeRaw('_ff_private_test');
    return false;
  } catch (e) {
    return true;
  }
};

// (moved to src/core/storage-quota.js)

/** للاختبار فقط: ضع true لتمثيل فشل الكتابة ثم أعد false قبل التسليم */
const SIMULATE_STORAGE_FAILURE = false;
/** Phase 9.3 للاختبار فقط: ضع true لتمثيل خطأ في الـ render (شاشة الاستعادة) ثم أعد false */
const SIMULATE_RENDER_ERROR = false;

const safeGet = (key, fallback) => storageFacade.getJSON(key, fallback);

/** Phase 9.2: يرجع { ok: true } عند النجاح، أو { ok: false, code: 'quota'|'unknown', message } عند الفشل. يتعامل مع QuotaExceededError صراحة. */
const safeSet = (key, val) => {
  if (SIMULATE_STORAGE_FAILURE) throw new DOMException('Simulated quota exceeded', 'QuotaExceededError');
  try {
    const ok = storageFacade.setJSON(key, val);
    if (ok) return { ok: true };
    return { ok: false, code: 'unknown', message: STORAGE_ERROR_MESSAGE };
  } catch (e) {
    const isQuota = e && (e.name === 'QuotaExceededError' || e.code === 22);
    const message = isQuota ? STORAGE_ERROR_MESSAGE : (e && e.message) ? String(e.message) : STORAGE_ERROR_MESSAGE;
    return { ok: false, code: isQuota ? 'quota' : 'unknown', message };
  }
};

const dataStore = {
  transactions: {
    list: (filters) => {
      let items = safeGet(KEYS.transactions, []);
      if (!filters) return items;
      if (filters.fromDate) items = items.filter(t => t.date >= filters.fromDate);
      if (filters.toDate) items = items.filter(t => t.date <= filters.toDate);
      if (filters.type) items = items.filter(t => t.type === filters.type);
      if (filters.category) items = items.filter(t => t.category === filters.category);
      if (filters.paymentMethod) items = items.filter(t => t.paymentMethod === filters.paymentMethod);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        items = items.filter(t => (t.description || '').toLowerCase().includes(s));
      }
      return items.sort((a,b) => b.date.localeCompare(a.date));
    },
    create: (data) => {
      const items = safeGet(KEYS.transactions, []);
      const item = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
      items.push(item);
      const r = safeSet(KEYS.transactions, items);
      if (!r.ok) return r;
      return { ok: true, item };
    },
    update: (id, data) => {
      const items = safeGet(KEYS.transactions, []);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data, updatedAt: now() };
      const r = safeSet(KEYS.transactions, items);
      if (!r.ok) return r;
      return { ok: true, item: items[idx] };
    },
    remove: (id) => {
      const items = safeGet(KEYS.transactions, []).filter(i => i.id !== id);
      const r = safeSet(KEYS.transactions, items);
      if (!r.ok) return r;
      return { ok: true };
    }
  },
  commissions: {
    list: () => safeGet(KEYS.commissions, []).sort((a,b) => b.dueDate.localeCompare(a.dueDate)),
    create: (data) => {
      const items = safeGet(KEYS.commissions, []);
      const item = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
      items.push(item);
      const r = safeSet(KEYS.commissions, items);
      if (!r.ok) return r;
      return { ok: true, item };
    },
    update: (id, data) => {
      const items = safeGet(KEYS.commissions, []);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data, updatedAt: now() };
      const r = safeSet(KEYS.commissions, items);
      if (!r.ok) return r;
      return { ok: true, item: items[idx] };
    },
    remove: (id) => {
      const items = safeGet(KEYS.commissions, []).filter(i => i.id !== id);
      const r = safeSet(KEYS.commissions, items);
      if (!r.ok) return r;
      return { ok: true };
    }
  },
  letters: {
    listDrafts: () => safeGet(KEYS.drafts, []).sort((a,b) => b.updatedAt?.localeCompare(a.updatedAt)),
    saveDraft: (data) => {
      const items = safeGet(KEYS.drafts, []);
      const item = { ...data, id: genId(), createdAt: now(), updatedAt: now() };
      items.push(item);
      const r = safeSet(KEYS.drafts, items);
      if (!r.ok) return r;
      return { ok: true, item };
    },
    updateDraft: (id, data) => {
      const items = safeGet(KEYS.drafts, []);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...data, updatedAt: now() };
      const r = safeSet(KEYS.drafts, items);
      if (!r.ok) return r;
      return { ok: true, item: items[idx] };
    },
    removeDraft: (id) => {
      const items = safeGet(KEYS.drafts, []).filter(i => i.id !== id);
      const r = safeSet(KEYS.drafts, items);
      if (!r.ok) return r;
      return { ok: true };
    }
  },
  settings: {
    get: () => {
      const current = safeGet(KEYS.settings, SEED_SETTINGS);
      const theme = (current && (current.theme === 'light' || current.theme === 'dim' || current.theme === 'dark')) ? current.theme : 'light';
      const numerals = (current && (current.numerals === 'ar' || current.numerals === 'en')) ? current.numerals : 'ar';
      return { ...SEED_SETTINGS, ...current, theme, numerals };
    },
    update: (data) => {
      const current = safeGet(KEYS.settings, SEED_SETTINGS);
      const updated = { ...current, ...data };
      const r = safeSet(KEYS.settings, updated);
      if (!r.ok) return r;
      return { ok: true, updated };
    }
  },
  seed: {
    resetDemo: () => {
      const txs = SEED_TRANSACTIONS.map(t => ({ ...t, id: genId(), createdAt: now(), updatedAt: now() }));
      const cms = SEED_COMMISSIONS.map(c => ({ ...c, id: genId(), createdAt: now(), updatedAt: now() }));
      const drs = SEED_DRAFTS.map(d => ({ ...d, id: genId(), createdAt: now(), updatedAt: now() }));
      let r = safeSet(KEYS.transactions, txs); if (!r.ok) return r;
      r = safeSet(KEYS.commissions, cms); if (!r.ok) return r;
      r = safeSet(KEYS.drafts, drs); if (!r.ok) return r;
      r = safeSet(KEYS.settings, SEED_SETTINGS); if (!r.ok) return r;
      r = safeSet(KEYS.seeded, true); if (!r.ok) return r;
      return { ok: true };
    },
    clearAll: () => {
      storageFacade.removeMany(Object.values(KEYS));
    },
    ensureSeeded: () => {
      if (!safeGet(KEYS.seeded, false)) {
        dataStore.seed.resetDemo();
      }
    }
  }
};

// ============================================
// FORMATTER (Phase 7.2 — Numerals: ar / en)
// ============================================
const getNumeralLocale = () => ((__uiNumeralsMode || 'ar') === 'en' ? 'en-US' : 'ar-SA');

const formatNumber = (value, options = {}) => {
  const n = value != null ? Number(value) : 0;
  if (Number.isNaN(n)) return '0';
  const locale = getNumeralLocale();
  const opts = { minimumFractionDigits: options.minimumFractionDigits ?? 0, maximumFractionDigits: options.maximumFractionDigits ?? 2, ...options };
  return new Intl.NumberFormat(locale, opts).format(n);
};

const formatCurrency = (value) => `${formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ر.س`;

// Saudi Riyal symbol (SAMA) — use icon instead of text "ر.س"
const SarSymbol = ({ className = 'w-4 h-4', title = 'ريال سعودي' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1124.14 1256.39"
    className={className}
    role="img"
    aria-label={title}
    style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
  >
    <path
      fill="currentColor"
      d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"
    />
    <path
      fill="currentColor"
      d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"
    />
  </svg>
);

const Currency = ({ value, className = '', symbolClassName = 'w-4 h-4' }) => (
  <span className={`inline-flex items-center gap-1 ${className}`}>
    <span>{formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
    <SarSymbol className={symbolClassName} />
  </span>
);

const formatPercent = (value) => `${formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;

// Backward alias for chart/tooltip where raw number string is needed
const formatNum = (n) => formatNumber(n, { maximumFractionDigits: 2 });

// ============================================
// DATE FORMATTER (Phase 7.3 — Gregorian + Hijri, respects ui_numerals)
// ============================================
/** تطبيع لاحقة الهجري: إزالة تكرار هـ وضمان وجودها مرة واحدة في النهاية فقط */
const normalizeHijriSuffix = (str) => {
  if (!str || typeof str !== 'string') return str;
  let s = str.trim().replace(/\s*هـ+\s*$/g, '').replace(/هـ\s*هـ/g, 'هـ').trim();
  return s ? `${s} هـ` : '';
};

/** Build locale with Unicode extensions safely (avoid double -u-) */
const buildLocale = ({ base = 'ar-SA', ca = null, nu = null }) => {
  const parts = [];
  if (ca) parts.push(`ca-${ca}`);
  if (nu) parts.push(`nu-${nu}`);
  return parts.length ? `${base}-u-${parts.join('-')}` : base;
};

/** ui_numerals → locale (digits only, not language) */
const getLocaleForNumerals = () => {
  const mode = __uiNumeralsMode || getSavedNumerals() || 'ar';
  return mode === 'en' ? buildLocale({ base: 'ar-SA', nu: 'latn' }) : 'ar-SA';
};

/** Force Gregorian calendar for the "ميلادي" view (some environments default ar-SA to Hijri). */
const getGregorianLocale = (mode) => {
  const nu = mode === 'en' ? 'latn' : null;
  const candidates = [
    buildLocale({ base: 'ar-SA', ca: 'gregory', nu }),
    buildLocale({ base: 'ar-SA', ca: 'gregorian', nu })
  ];
  for (const loc of candidates) {
    try {
      // eslint-disable-next-line no-new
      new Intl.DateTimeFormat(loc, { year: 'numeric' });
      return loc;
    } catch {
      // try next
    }
  }
  return buildLocale({ base: 'ar-SA', ca: 'gregory', nu });
};

/** Prefer umalqura if supported; fallback to islamic */
const getHijriLocale = (mode) => {
  const nu = mode === 'en' ? 'latn' : null;
  const candidates = [
    buildLocale({ base: 'ar-SA', ca: 'islamic-umalqura', nu }),
    buildLocale({ base: 'ar-SA', ca: 'islamic', nu })
  ];
  for (const loc of candidates) {
    try {
      // eslint-disable-next-line no-new
      new Intl.DateTimeFormat(loc, { year: 'numeric' });
      return loc;
    } catch {
      // try next
    }
  }
  return buildLocale({ base: 'ar-SA', ca: 'islamic', nu });
};

/** يعرض التاريخ للهيدر حسب الوضع: off|greg|hijri|both (يحترم ui_numerals، لاحقة هـ مرة واحدة) */
const formatDateHeader = (date, modeOverride = null) => {
  const d = date instanceof Date ? date : (date ? new Date(date) : null);
  if (!d || Number.isNaN(d.getTime())) return '';

  const headerMode = modeOverride || getSavedDateHeader() || 'both';
  if (headerMode === 'off') return '';

  const numeralsMode = __uiNumeralsMode || getSavedNumerals() || 'ar';
  const localeGreg = getGregorianLocale(numeralsMode);

  const greg = new Intl.DateTimeFormat(localeGreg, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

  const localeHijri = getHijriLocale(numeralsMode);
  const hijriRaw = new Intl.DateTimeFormat(localeHijri, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const hijri = normalizeHijriSuffix(hijriRaw) || (hijriRaw.trim() + ' هـ');

  if (headerMode === 'greg') return greg;
  if (headerMode === 'hijri') return hijri;
  return `${greg} — ${hijri}`;
};

/** ميلادي رقمي فقط (مثال: 08/02/2026) — يتبع numerals */
const formatDateGregorianNumeric = (date) => {
  const d = date instanceof Date ? date : (date ? new Date(date) : null);
  if (!d || Number.isNaN(d.getTime())) return '';
  const numeralsMode = __uiNumeralsMode || getSavedNumerals() || 'ar';
  const localeGreg = getGregorianLocale(numeralsMode);
  return new Intl.DateTimeFormat(localeGreg, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

/** هجري رقمي فقط (مثال: 21/08/1447 هـ) — يحترم ui_numerals، لاحقة هـ مرة واحدة */
const formatDateHijriNumeric = (date) => {
  const d = date instanceof Date ? date : (date ? new Date(date) : null);
  if (!d || Number.isNaN(d.getTime())) return '';
  const mode = __uiNumeralsMode || getSavedNumerals() || 'ar';
  const localeBase = getLocaleForNumerals();
  const localeHijri = getHijriLocale(mode);
  const raw = new Intl.DateTimeFormat(localeHijri, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  return normalizeHijriSuffix(raw) || (raw.trim() + ' هـ');
};

// ============================================
// ICONS (SVG Components)
// ============================================
const Icon = ({ d, size=20, className='' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d}/></svg>
);
const Icons = {
  home: (p) => <Icon {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"/>,
  dashboard: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  list: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>,
  percent: (p) => <Icon {...p} d="M19 5L5 19 M9 7a2 2 0 11-4 0 2 2 0 014 0z M19 17a2 2 0 11-4 0 2 2 0 014 0z"/>,
  mail: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>,
  fileText: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  settings: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  info: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  plus: (p) => <Icon {...p} d="M12 5v14 M5 12h14"/>,
  edit: (p) => <Icon {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>,
  trash: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  x: (p) => <Icon {...p} d="M18 6L6 18 M6 6l12 12"/>,
  check: (p) => <Icon {...p} d="M20 6L9 17l-5-5"/>,
  download: (p) => <Icon {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3"/>,
  printer: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  menu: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  chevronDown: (p) => <Icon {...p} d="M6 9l6 6 6-6"/>,
  search: (p) => <Icon {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>,
  filter: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  arrowUp: (p) => <Icon {...p} d="M12 19V5 M5 12l7-7 7 7"/>,
  arrowDown: (p) => <Icon {...p} d="M12 5v14 M19 12l-7 7-7-7"/>,
  empty: (p) => <svg {...{width:p?.size||64,height:p?.size||64,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",className:p?.className||'text-gray-300'}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
  calendar: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  notes: (p) => <svg {...{width:p?.size||20,height:p?.size||20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",className:p?.className||''}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

// ============================================
// TOAST CONTEXT
// ============================================
const ToastContext = createContext();
const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type='success') => {
    const id = genId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 no-print" style={{maxWidth:'360px'}}>
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all animate-slideIn ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-yellow-500 text-gray-900'
          }`} role="alert">
            {t.message}
          </div>
        ))}
      </div>
      <style>{`.animate-slideIn { animation: slideIn .3s ease; } @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); }}`}</style>
    </ToastContext.Provider>
  );
};

/** Phase 9.4: تتبع وجود تغييرات غير محفوظة في النماذج لتحذير قبل المغادرة */
const UnsavedContext = createContext(() => {});

/** Phase 9.1 + 9.3: تنبيه التصفح الخاص وامتلاء التخزين عند بدء التطبيق */
const TrustChecks = () => {
  const toast = useToast();
  useEffect(() => {
    if (detectPrivateBrowsing()) {
      toast('البيانات تُحفظ على هذا الجهاز فقط. في وضع التصفح الخاص قد تُفقد عند إغلاق المتصفح. للحفاظ عليها استخدم التصفح العادي.', 'warning');
    }
    if (!checkStorageQuota(storageFacade)) {
      toast('مساحة التخزين قريبة من الامتلاء. يُنصح بتصدير نسخة احتياطية أو حذف بعض البيانات.', 'warning');
    }
  }, [toast]);
  return null;
};

// ============================================
// CONFIRM DIALOG
// ============================================
const ConfirmDialog = ({ open, title, message, messageList, dangerText, confirmLabel, onConfirm, onCancel, danger=false }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className={`confirm-modal bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full ${danger ? 'confirm-modal danger' : ''}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle" aria-describedby="confirmDialogDesc">
        <h3 id="confirmDialogTitle" className="text-lg font-bold mb-2">{title}</h3>
        <div id="confirmDialogDesc" className="text-gray-600 mb-6 text-sm">
          {message && <p className="mb-2">{message}</p>}
          {messageList && messageList.length > 0 && (
            <ul className="list-disc list-inside mb-2 space-y-0.5">
              {messageList.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}
          {dangerText && <p className="danger-text text-red-600 font-semibold mt-2">{dangerText}</p>}
        </div>
        <div className="confirm-actions flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="تراجع">{MSG.buttons.cancel}</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${danger ? 'btn-danger bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`} aria-label="تأكيد">{confirmLabel || 'تأكيد'}</button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODAL
// ============================================
const Modal = ({ open, onClose, title, children, wide=false }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-2xl mt-8 mb-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 id="modalTitle" className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100" aria-label="إغلاق"><Icons.x size={20}/></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// ============================================
// FORM FIELD (مستوى الملف — يمنع remount وفقدان التركيز عند الكتابة)
// ============================================
const FormField = ({ label, error, children }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// ============================================
// COMMON COMPONENTS
// ============================================
const SummaryCard = ({ label, value, color='blue', icon }) => (
  <div className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {icon && <span className={`text-${color}-600`}>{icon}</span>}
    </div>
    <div className={`text-xl font-bold text-${color}-600`}>{value}</div>
  </div>
);

const EmptyState = ({ message, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    {icon || <Icons.empty size={64}/>}
    <p className="mt-4 text-sm">{message}</p>
  </div>
);

const EnhancedEmptyState = ({ icon, title, description, ctaText, onCtaClick }) => (
  <div className="empty-state">
    {icon ? <div className="empty-icon">{icon}</div> : null}
    <h3>{title}</h3>
    <p>{description}</p>
    {ctaText && onCtaClick && (
      <button type="button" onClick={onCtaClick} className="empty-cta">
        {ctaText}
      </button>
    )}
  </div>
);

const Badge = ({ children, color='blue' }) => {
  const colors = { blue:'bg-blue-50 text-blue-700', green:'bg-green-50 text-green-700', red:'bg-red-50 text-red-700', yellow:'bg-yellow-50 text-yellow-700', gray:'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]||colors.blue}`}>{children}</span>;
};

// ============================================
// NAVIGATION
// ============================================
const NAV_ITEMS = [
  { id:'home', label:'الرئيسية', icon:Icons.home },
  { id:'transactions', label:'الحركات المالية', icon:Icons.list, group:'finance' },
  { id:'commissions', label:'العمولات', icon:Icons.percent, group:'finance' },
  { id:'ledgers', label:'الدفاتر', icon:Icons.list, group:'finance' },
  { id:'templates', label:'قوالب الخطابات', icon:Icons.mail, group:'letters' },
  { id:'generator', label:'إنشاء خطاب', icon:Icons.fileText, group:'letters' },
  { id:'drafts', label:'المسودات', icon:Icons.fileText, group:'letters' },
  { id:'calendar', label:'التقويم', icon:Icons.calendar, group:'notes' },
  { id:'notes', label:'الملاحظات', icon:Icons.notes, group:'notes' },
  { id:'help', label:'دليل سريع', icon:Icons.info },
  { id:'settings', label:'الإعدادات', icon:Icons.settings },
];

const Sidebar = ({ page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen, onOpenHelp }) => {
  const groups = { finance: 'التدفقات المالية', letters: 'الخطابات', notes: 'الملاحظات والتقويم' };
  const handleNav = (id) => {
    if (id === 'help') { typeof onOpenHelp === 'function' && onOpenHelp(); setMobileOpen(false); return; }
    setPage(id === 'home' ? 'dashboard' : id);
    setMobileOpen(false);
  };
  
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-white" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none" width="36" height="36" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z"/>
              <path d="M62 30V24H68V36"/>
              <path d="M20 80H80" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" strokeOpacity="0.4" strokeWidth="1.5"/>
            </svg>
          </div>
          {!collapsed && <div><h1 className="font-bold text-white text-sm leading-tight">قيد العقار</h1><p className="text-gray-400 text-xs">نظام التدفقات المالية</p></div>}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="القائمة الرئيسية">
        {NAV_ITEMS.filter(i => !i.group && i.id === 'home').map(item => (
          <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
              (page === item.id || (item.id === 'home' && page === 'dashboard')) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}>
            <item.icon size={18}/>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        {Object.entries(groups).map(([key, label]) => (
          <div key={key} className="mb-2">
            {!collapsed && <p className="px-3 py-1 text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>}
            {NAV_ITEMS.filter(i => i.group === key).map(item => (
              <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                  page === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}>
                <item.icon size={18}/>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
        {NAV_ITEMS.filter(i => !i.group && i.id !== 'home').map(item => (
          <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
              page === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}>
            <item.icon size={18}/>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside className={`hidden md:flex flex-col bg-gray-900 h-screen sticky top-0 transition-all duration-300 no-print ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
        <button onClick={() => setCollapsed(!collapsed)} className="p-3 border-t border-gray-700/50 text-gray-400 hover:text-white text-xs" aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}>
          {collapsed ? '◁' : '▷ طي'}
        </button>
      </aside>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)}/>
          <aside className="fixed right-0 top-0 bottom-0 w-64 bg-gray-900 z-50 overflow-y-auto">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};

const Topbar = ({ page, setMobileOpen, headerDateText }) => {
  const titles = { home:'الرئيسية', dashboard:'تحليل الأداء المالي', transactions:'سجل العمليات المالية', commissions:'العمولات', ledgers:'الدفاتر', templates:'قوالب الخطابات', generator:'إنشاء خطاب', drafts:'المسودات', calendar:'التقويم', notes:'الملاحظات', settings:'الإعدادات' };
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-start justify-between gap-3 sticky top-0 z-30 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button className="md:hidden hamburger-btn p-2 rounded-lg flex-shrink-0" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة"><Icons.menu size={22}/></button>
        <h2 className="text-lg font-bold text-gray-900 truncate">{titles[page] || ''}</h2>
      </div>
      <div className="text-xs text-gray-500 text-left max-w-[14rem] sm:max-w-none whitespace-normal leading-snug" dir="auto" aria-label="التاريخ">
        {headerDateText || ''}
      </div>
    </header>
  );
};

// ============================================
// HOME PAGE
// ============================================
const HomePage = ({ setPage }) => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="value-proposition">
      <h1 className="main-value">
        نظام مالي يجمع بين بساطة الإدارة وخصوصية البيانات
      </h1>
      <p className="sub-value">
        صُمم لمكاتب العقار والمستثمرين الأفراد لإدارة الدخل والمصروفات ومتابعة الأداء المالي بسهولة تامة
      </p>
    </div>
    <div className="text-center mb-12 mt-8">
      <div className="w-20 h-20 rounded-2xl bg-[#0F1C2E] mx-auto mb-6 flex items-center justify-center text-white shadow-md" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" width="48" height="48" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z"/>
          <path d="M62 30V24H68V36"/>
          <path d="M20 80H80" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" strokeOpacity="0.4" strokeWidth="1.5"/>
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">قيد العقار</h1>
      <p className="text-gray-500 text-lg">نظام متكامل لإدارة التدفقات المالية والخطابات للمكاتب العقارية</p>
    </div>
    <div className="grid sm:grid-cols-2 gap-4 mb-8">
      {[
        { id:'dashboard', title:'لوحة المعلومات', desc:'نظرة شاملة على الأرقام والمؤشرات', icon:Icons.dashboard, color:'blue' },
        { id:'transactions', title:'الحركات المالية', desc:'تتبع الدخل والمصروفات', icon:Icons.list, color:'green' },
        { id:'commissions', title:'العمولات', desc:'إدارة العمولات وحصص الوكلاء', icon:Icons.percent, color:'yellow' },
        { id:'templates', title:'الخطابات', desc:'إنشاء وطباعة خطابات رسمية', icon:Icons.mail, color:'purple' },
      ].map(item => (
        <button key={item.id} onClick={() => setPage(item.id)} className="bg-white rounded-xl border border-gray-100 p-6 text-right hover:shadow-md hover:border-blue-200 transition-all group" aria-label={item.title}>
          <div className={`w-10 h-10 rounded-lg bg-${item.color}-50 flex items-center justify-center mb-3 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
            <item.icon size={20}/>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </button>
      ))}
    </div>
  </div>
);

// ============================================
// DASHBOARD PAGE
// ============================================
const DashboardPage = () => {
  const [periodType, setPeriodType] = useState('thisMonth');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const range = getDashboardDateRange(periodType, fromDate, toDate);
  const txs = dataStore.transactions.list({ fromDate: range.from, toDate: range.to });
  const allCms = dataStore.commissions.list();

  const { income, expense, net } = computeIncomeExpenseNet(txs);
  const { pendingCms, paidCms } = splitCommissionsByStatus(allCms);
  const { pendingTotal, paidTotal } = computeCommissionOfficeTotals(pendingCms, paidCms);

  // Bar chart data: last 6 months
  const chartData = useMemo(() => {
    const allTxs = dataStore.transactions.list({});
    return buildLast6MonthsIncomeExpenseChart(allTxs);
  }, [txs]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto print-container">
      {/* Period Filter */}
      <div className="flex flex-wrap gap-2 mb-6 no-print">
        {[
          { v:'thisMonth', l:'هذا الشهر' }, { v:'last3', l:'آخر 3 أشهر' }, { v:'last6', l:'آخر 6 أشهر' }, { v:'thisYear', l:'هذا العام' }, { v:'custom', l:'مخصص' },
        ].map(opt => (
          <button key={opt.v} onClick={() => setPeriodType(opt.v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periodType === opt.v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label={opt.l}>{opt.l}</button>
        ))}
        {periodType === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm" aria-label="من تاريخ"/>
            <span className="text-gray-400 text-sm">إلى</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-sm" aria-label="إلى تاريخ"/>
          </div>
        )}
      </div>

      {/* Summary Cards — موبايل: البطاقة الأخيرة بعرض كامل (الدفعة 3) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <SummaryCard label="إجمالي الدخل" value={<Currency value={income} />} color="green" icon={<Icons.arrowUp size={16}/>}/>
        <SummaryCard label="إجمالي الخرج" value={<Currency value={expense} />} color="red" icon={<Icons.arrowDown size={16}/>}/>
        <SummaryCard label="الصافي" value={<Currency value={net} />} color={net >= 0 ? 'blue' : 'red'}/>
        <SummaryCard label="عمولات معلقة" value={<Currency value={pendingTotal} />} color="yellow"/>
        <div className="col-span-2 md:col-span-1">
          <SummaryCard label="عمولات مدفوعة" value={<Currency value={paidTotal} />} color="green"/>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-6">الدخل والخرج — آخر 6 أشهر</h3>
        <div className="flex items-end gap-3 h-48">
          {chartData.months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex gap-1 items-end w-full justify-center" style={{height:'180px'}}>
                <div className="bg-green-500 rounded-t w-5 transition-all" style={{height: `${Math.max((m.income / chartData.maxVal) * 160, 2)}px`}} title={`دخل: ${formatNum(m.income)}`}/>
                <div className="bg-red-400 rounded-t w-5 transition-all" style={{height: `${Math.max((m.expense / chartData.maxVal) * 160, 2)}px`}} title={`خرج: ${formatNum(m.expense)}`}/>
              </div>
              <span className="text-xs text-gray-500 mt-1">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center mt-4">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500"/><span className="text-xs text-gray-500">دخل</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400"/><span className="text-xs text-gray-500">خرج</span></div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TRANSACTIONS PAGE
// ============================================
const TransactionsPage = () => {
  const toast = useToast();
  const setDirty = useContext(UnsavedContext);
  const [txs, setTxs] = useState([]);
  const [filters, setFilters] = useState({ fromDate:'', toDate:'', type:'', category:'', paymentMethod:'', search:'' });
  const [showFilters, setShowFilters] = useState(false); // موبايل: فلاتر قابلة للطي (الدفعة 3)
  const [modal, setModal] = useState(null); // null | 'add' | {editing tx}
  const [confirm, setConfirm] = useState(null);

  const refresh = useCallback(() => {
    const all = dataStore.transactions.list();
    setTxs(filterTransactions(all, filters));
  }, [filters]);

  useEffect(() => { refresh(); }, [refresh]);

  const { income, expense } = sumTransactions(txs);

  const handleSave = (data, editId) => {
    const res = editId ? dataStore.transactions.update(editId, data) : dataStore.transactions.create(data);
    if (!res || !res.ok) { toast(res?.message || STORAGE_ERROR_MESSAGE, 'error'); return; }
    toast(editId ? MSG.success.updated : MSG.success.transaction);
    setDirty(false); setModal(null); refresh();
  };

  const handleDelete = (id) => {
    setConfirm({ title:'حذف الحركة', message: MSG.confirm.deleteAction + ' سيتم حذف هذه الحركة نهائياً.', onConfirm: () => {
      const res = dataStore.transactions.remove(id);
      if (!res.ok) { toast(res.message, 'error'); setConfirm(null); return; }
      toast(MSG.success.deleted); setConfirm(null); refresh();
    }});
  };

  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['النوع','التصنيف','المبلغ','طريقة الدفع','التاريخ','الوصف'];
    const rows = txs.map(t => [TRANSACTION_TYPES[t.type], TRANSACTION_CATEGORIES[t.category], String(t.amount), PAYMENT_METHODS[t.paymentMethod], t.date, t.description || '']);
    const csv = BOM + [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${today()}.csv`;
    link.click();
    toast('تم تصدير CSV');
  };

  const handlePrint = () => window.print();

  const resetFilters = () => setFilters({ fromDate:'', toDate:'', type:'', category:'', paymentMethod:'', search:'' });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto print-container">
      {/* Summary Cards — موبايل: 2+1 (الدليل implementation-guide) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <SummaryCard label="إجمالي الدخل" value={<Currency value={income} />} color="green" icon={<Icons.arrowUp size={16}/>}/>
        <SummaryCard label="إجمالي الخرج" value={<Currency value={expense} />} color="red" icon={<Icons.arrowDown size={16}/>}/>
        <div className="col-span-2">
          <SummaryCard label="الصافي" value={<Currency value={income - expense} />} color={income - expense >= 0 ? 'blue' : 'red'}/>
        </div>
      </div>

      {/* Filters + Actions — موبايل: فلاتر قابلة للطي (الدفعة 3) */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 no-print">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Icons.search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="بحث في الوصف..." value={filters.search} onChange={e => setFilters(f => ({...f, search:e.target.value}))} className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" aria-label="بحث"/>
          </div>
        </div>
        <button type="button" onClick={() => setShowFilters(s => !s)} className="flex items-center gap-2 text-sm text-gray-500 mt-2 md:hidden" aria-expanded={showFilters} aria-label="فلاتر متقدمة">
          <Icons.filter size={14}/>
          فلاتر متقدمة
          <Icons.chevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
        </button>
        <div className={`filters-panel flex flex-wrap gap-2 items-center mt-2 ${showFilters ? 'flex' : 'hidden'} md:flex`}>
          <select value={filters.type} onChange={e => setFilters(f => ({...f, type:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="نوع الحركة">
            <option value="">كل الأنواع</option>
            {Object.entries(TRANSACTION_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({...f, category:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="التصنيف">
            <option value="">كل التصنيفات</option>
            {Object.entries(TRANSACTION_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.paymentMethod} onChange={e => setFilters(f => ({...f, paymentMethod:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="طريقة الدفع">
            <option value="">كل طرق الدفع</option>
            {Object.entries(PAYMENT_METHODS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={filters.fromDate} onChange={e => setFilters(f => ({...f, fromDate:e.target.value}))} className="border border-gray-200 rounded-lg px-2 py-2 text-sm" aria-label="من تاريخ"/>
          <input type="date" value={filters.toDate} onChange={e => setFilters(f => ({...f, toDate:e.target.value}))} className="border border-gray-200 rounded-lg px-2 py-2 text-sm" aria-label="إلى تاريخ"/>
          <button onClick={resetFilters} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 border border-gray-200" aria-label="إعادة تعيين الفلاتر"><Icons.filter size={14}/></button>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={() => setModal('add')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2" aria-label="تسجيل عملية جديدة" title="سجّل عملية دخل أو مصروف جديدة"><Icons.plus size={16}/>إضافة حركة</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="تصدير CSV"><Icons.download size={14}/>CSV</button>
          <button onClick={handlePrint} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="طباعة"><Icons.printer size={14}/>طباعة</button>
        </div>
      </div>

      {/* Table */}
      {txs.length === 0 ? (
        Object.values(filters).some(Boolean) ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Icons.empty size={64}/>
            <p className="mt-4 text-sm font-medium text-gray-600">لا توجد نتائج مطابقة للفلاتر</p>
            <p className="mt-1 text-sm">جرّب تعديل الفلاتر أو إعادة تعيينها.</p>
            <button onClick={resetFilters} className="mt-4 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-200" aria-label="إعادة تعيين الفلاتر">إعادة تعيين الفلاتر</button>
          </div>
        ) : (
          <EnhancedEmptyState
            icon=""
            title="لا توجد معاملات مسجلة"
            description="سجّل أول عملية دخل أو مصروف لبدء تتبع التدفق المالي"
            ctaText="سجّل أول معاملة"
            onCtaClick={() => setModal('add')}
          />
        )
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-sm min-w-[600px]">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-right font-semibold text-gray-600">النوع</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">التصنيف</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">المبلغ</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">التاريخ</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 hidden md:table-cell">الوصف</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 no-print">إجراءات</th>
              </tr></thead>
              <tbody>
                {txs.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><Badge color={t.type==='income'?'green':'red'}>{TRANSACTION_TYPES[t.type]}</Badge></td>
                  <td className="px-4 py-3 text-gray-700">{TRANSACTION_CATEGORIES[t.category]}</td>
                  <td className={`px-4 py-3 font-semibold ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'}<Currency value={t.amount} symbolClassName="w-3.5 h-3.5" /></td>
                  <td className="px-4 py-3 text-gray-500">{t.date}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-[200px] truncate">{t.description}</td>
                  <td className="px-4 py-3 no-print">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setModal(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" aria-label="تعديل"><Icons.edit size={15}/></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" aria-label="حذف نهائي"><Icons.trash size={15}/></button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center py-2 md:hidden no-print" aria-hidden="true">← اسحب لعرض المزيد →</p>
        </div>
      )}

      {/* Transaction Form Modal */}
      <Modal open={modal !== null} onClose={() => { setDirty(false); setModal(null); }} title={modal && modal !== 'add' ? 'تعديل العملية' : 'تسجيل عملية جديدة'}>
        <TransactionForm initial={modal !== 'add' ? modal : null} onSave={handleSave} onCancel={() => { setDirty(false); setModal(null); }}/>
      </Modal>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger/>
    </div>
  );
};

const TransactionForm = ({ initial, onSave, onCancel }) => {
  const setDirty = useContext(UnsavedContext);
  const [form, setForm] = useState(initial ? { type:initial.type, category:initial.category, amount:initial.amount, paymentMethod:initial.paymentMethod, date:initial.date, description:initial.description||'' } : { type:'income', category:'commission', amount:'', paymentMethod:'cash', date:today(), description:'' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.type) errs.type = 'اختر نوع الحركة';
    if (!form.category) errs.category = 'اختر تصنيفًا صحيحًا';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    if (!form.date) errs.date = 'التاريخ مطلوب';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, amount: Number(form.amount) }, initial?.id);
  };

  return (
    <form onSubmit={handleSubmit} onInput={() => setDirty && setDirty(true)}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="نوع الحركة" error={errors.type}>
          <select value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اختر نوع العملية" aria-required="true" aria-invalid={!!errors.type}>
            <option value="">-- اختر نوع العملية --</option>
            {Object.entries(TRANSACTION_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormField>
        <FormField label="التصنيف" error={errors.category}>
          <select value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="التصنيف">
            {Object.entries(TRANSACTION_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="المبلغ (ر.س)" error={errors.amount}>
          <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({...f, amount:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="أدخل المبلغ بالريال" aria-label="المبلغ بالريال" aria-required="true" aria-invalid={!!errors.amount}/>
        </FormField>
        <FormField label="طريقة الدفع">
          <select value={form.paymentMethod} onChange={e => setForm(f => ({...f, paymentMethod:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="طريقة الدفع">
            {Object.entries(PAYMENT_METHODS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="التاريخ" error={errors.date}>
        <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="التاريخ"/>
      </FormField>
      <FormField label="الوصف (اختياري)">
        <input type="text" value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="وصف العملية (اختياري)..." aria-label="وصف العملية"/>
      </FormField>
      <div className="flex gap-3 justify-end mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="تراجع">{MSG.buttons.cancel}</button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" aria-label="تسجيل البيانات">{MSG.buttons.save}</button>
      </div>
    </form>
  );
};

// ============================================
// COMMISSIONS PAGE
// ============================================
const CommissionsPage = () => {
  const toast = useToast();
  const setDirty = useContext(UnsavedContext);
  const [filters, setFilters] = useState({ search:'', status:'', agent:'', fromDate:'', toDate:'' });
  const [showFilters, setShowFilters] = useState(false); // موبايل: فلاتر قابلة للطي (الدفعة 3)
  const [allCms, setAllCms] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const settings = dataStore.settings.get();

  const refresh = useCallback(() => setAllCms(dataStore.commissions.list()), []);

  useEffect(() => { refresh(); }, [refresh]);

  const cms = useMemo(() => filterCommissions(allCms, filters), [allCms, filters]);
  const { pendingOffice, paidOffice, totalAgent } = useMemo(() => computeCommissionTotals(cms), [cms]);

  const agentNames = useMemo(() => listAgentNames(allCms), [allCms]);

  const handleSave = (data, editId) => {
    const res = editId ? dataStore.commissions.update(editId, data) : dataStore.commissions.create(data);
    if (!res || !res.ok) { toast(res?.message || STORAGE_ERROR_MESSAGE, 'error'); return; }
    toast(editId ? MSG.success.updated : MSG.success.commission);
    setDirty(false); setModal(null); refresh();
  };

  const handleDelete = (id) => {
    setConfirm({ title:'حذف العمولة', message: MSG.confirm.deleteAction + ' سيتم حذف هذه العمولة نهائياً.', onConfirm: () => {
      const res = dataStore.commissions.remove(id);
      if (!res.ok) { toast(res.message, 'error'); setConfirm(null); return; }
      toast(MSG.success.deleted); setConfirm(null); refresh();
    }});
  };

  const handleMarkPaid = (id) => {
    setConfirm({ title:'تحديد كمدفوعة', message:'تحديد كمدفوعة؟', onConfirm: () => {
      const res = dataStore.commissions.update(id, { status:'paid', paidDate: today() });
      if (!res || !res.ok) { toast(res?.message || STORAGE_ERROR_MESSAGE, 'error'); setConfirm(null); return; }
      toast('تم تحديث حالة العمولة إلى مدفوعة'); setConfirm(null); refresh();
    }});
  };

  const resetFilters = () => setFilters({ search:'', status:'', agent:'', fromDate:'', toDate:'' });

  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['العميل/الصفقة','قيمة الصفقة','نسبة المكتب','حصة المكتب','اسم الوكيل','نسبة الوكيل','حصة الوكيل','الحالة','تاريخ الاستحقاق','تاريخ الدفع'];
    const rows = cms.map(c => {
      const officeAmt = c.dealValue * c.officePercent / 100;
      const agentAmt = c.dealValue * c.agentPercent / 100;
      // Keep CSV raw (no locale formatting / no numerals conversion)
      return [c.clientName || '', String(c.dealValue), String(c.officePercent), String(officeAmt), c.agentName || '', String(c.agentPercent), String(agentAmt), COMMISSION_STATUSES[c.status] || c.status, c.dueDate || '', c.paidDate || ''];
    });
    const csv = BOM + [headers.map(csvEscape), ...rows.map(r => r.map(csvEscape))].map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `commissions_${today()}.csv`;
    link.click();
    toast('تم تصدير CSV');
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto print-container">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="عمولات معلقة" value={<Currency value={pendingOffice} />} color="yellow"/>
        <SummaryCard label="عمولات مدفوعة" value={<Currency value={paidOffice} />} color="green"/>
        <SummaryCard label="إجمالي حصة المكتب" value={<Currency value={pendingOffice + paidOffice} />} color="blue"/>
        <SummaryCard label="إجمالي حصة الوكلاء" value={<Currency value={totalAgent} />} color="gray"/>
      </div>

      {/* Filters + Actions — موبايل: فلاتر قابلة للطي (الدفعة 3) */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 no-print">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Icons.search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="بحث في العميل/الصفقة..." value={filters.search} onChange={e => setFilters(f => ({...f, search:e.target.value}))} className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" aria-label="بحث"/>
          </div>
        </div>
        <button type="button" onClick={() => setShowFilters(s => !s)} className="flex items-center gap-2 text-sm text-gray-500 mt-2 md:hidden" aria-expanded={showFilters} aria-label="فلاتر متقدمة">
          <Icons.filter size={14}/>
          فلاتر متقدمة
          <Icons.chevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
        </button>
        <div className={`filters-panel flex flex-wrap gap-2 items-center mt-2 ${showFilters ? 'flex' : 'hidden'} md:flex`}>
          <select value={filters.status} onChange={e => setFilters(f => ({...f, status:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="الحالة">
            <option value="">كل الحالات</option>
            <option value="pending">معلقة</option>
            <option value="paid">مدفوعة</option>
          </select>
          <select value={filters.agent} onChange={e => setFilters(f => ({...f, agent:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="الوكيل">
            <option value="">كل الوكلاء</option>
            {agentNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <input type="date" value={filters.fromDate} onChange={e => setFilters(f => ({...f, fromDate:e.target.value}))} className="border border-gray-200 rounded-lg px-2 py-2 text-sm" aria-label="من تاريخ"/>
          <input type="date" value={filters.toDate} onChange={e => setFilters(f => ({...f, toDate:e.target.value}))} className="border border-gray-200 rounded-lg px-2 py-2 text-sm" aria-label="إلى تاريخ"/>
          <button onClick={resetFilters} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 border border-gray-200" aria-label="إعادة تعيين الفلاتر"><Icons.filter size={14}/></button>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={() => setModal('add')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2" aria-label="تسجيل عمولة جديدة" title="سجّل عمولة جديدة"><Icons.plus size={16}/>إضافة عمولة</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="تصدير CSV"><Icons.download size={14}/>CSV</button>
          <button onClick={handlePrint} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="طباعة"><Icons.printer size={14}/>طباعة</button>
        </div>
      </div>

      {/* Table or Empty */}
      {allCms.length === 0 ? (
        <EnhancedEmptyState
          icon=""
          title="لا توجد عمولات مسجلة"
          description="ابدأ بإضافة أول عمولة لتتبع حصص المكتب والوكلاء"
          ctaText="أضف أول عمولة"
          onCtaClick={() => setModal('add')}
        />
      ) : cms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Icons.empty size={64}/>
          <p className="mt-4 text-sm font-medium text-gray-600">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-sm">جرّب تعديل الفلاتر أو إعادة تعيينها.</p>
          <button onClick={resetFilters} className="mt-4 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-200" aria-label="إعادة تعيين الفلاتر">إعادة تعيين الفلاتر</button>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-sm min-w-[600px]">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-right font-semibold text-gray-600">العميل/الصفقة</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">قيمة الصفقة</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">النسب</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">الحصص</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 no-print">إجراءات</th>
              </tr></thead>
              <tbody>
                {cms.map(c => {
                const officeAmt = c.dealValue * c.officePercent / 100;
                const agentAmt = c.dealValue * c.agentPercent / 100;
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.clientName}</div>
                      <div className="text-xs text-gray-400">{c.agentName}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900"><Currency value={c.dealValue} symbolClassName="w-3.5 h-3.5" /></td>
                    <td className="px-4 py-3">
                      <div className="text-xs">مكتب: {formatPercent(c.officePercent)}</div>
                      <div className="text-xs">وكيل: {formatPercent(c.agentPercent)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-blue-600 font-medium"><Currency value={officeAmt} symbolClassName="w-3 h-3" /></div>
                      <div className="text-xs text-gray-500"><Currency value={agentAmt} symbolClassName="w-3 h-3" /></div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={c.status==='paid'?'green':'yellow'}>{COMMISSION_STATUSES[c.status]}</Badge>
                      {c.paidDate && <div className="text-xs text-gray-400 mt-0.5">{c.paidDate}</div>}
                    </td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {c.status === 'pending' && (
                          <button onClick={() => handleMarkPaid(c.id)} className="px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100" aria-label="تحديد كمدفوعة"><Icons.check size={12}/> دفع</button>
                        )}
                        <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" aria-label="تعديل"><Icons.edit size={15}/></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" aria-label="حذف نهائي"><Icons.trash size={15}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center py-2 md:hidden no-print" aria-hidden="true">← اسحب لعرض المزيد →</p>
        </div>
      )}

      <Modal open={modal !== null} onClose={() => { setDirty(false); setModal(null); }} title={modal && modal !== 'add' ? 'تعديل العمولة' : 'تسجيل عمولة جديدة'}>
        <CommissionForm initial={modal !== 'add' ? modal : null} onSave={handleSave} onCancel={() => { setDirty(false); setModal(null); }} defaultPercent={settings.defaultCommissionPercent}/>
      </Modal>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger={confirm?.title?.includes('حذف')}/>
    </div>
  );
};

const CommissionForm = ({ initial, onSave, onCancel, defaultPercent }) => {
  const setDirty = useContext(UnsavedContext);
  const [form, setForm] = useState(initial ? {
    clientName:initial.clientName, dealValue:initial.dealValue, officePercent:initial.officePercent,
    agentName:initial.agentName, agentPercent:initial.agentPercent, status:initial.status, dueDate:initial.dueDate
  } : {
    clientName:'', dealValue:'', officePercent:defaultPercent || 50, agentName:'', agentPercent: 100 - (defaultPercent || 50), status:'pending', dueDate:today()
  });
  const [errors, setErrors] = useState({});

  const handleOfficeChange = (val) => {
    const v = Number(val);
    setForm(f => ({ ...f, officePercent: val, agentPercent: 100 - v }));
  };

  const validate = () => {
    const errs = {};
    if (!form.clientName?.trim()) errs.clientName = 'اسم العميل/الصفقة مطلوب';
    if (!form.dealValue || Number(form.dealValue) <= 0) errs.dealValue = 'قيمة الصفقة مطلوبة ويجب أن تكون أكبر من صفر';
    if (Number(form.officePercent) < 0 || Number(form.officePercent) > 100) errs.officePercent = 'نسبة المكتب يجب أن تكون بين 0 و100';
    if (Number(form.agentPercent) < 0 || Number(form.agentPercent) > 100) errs.agentPercent = 'نسبة الوكيل يجب أن تكون بين 0 و100';
    if (Math.abs(Number(form.officePercent) + Number(form.agentPercent) - 100) > 0.01) errs.total = 'يجب أن يكون مجموع نسبة المكتب والوكيل = 100%';
    if (!form.agentName?.trim()) errs.agentName = 'اسم الوكيل مطلوب';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, dealValue: Number(form.dealValue), officePercent: Number(form.officePercent), agentPercent: Number(form.agentPercent) }, initial?.id);
  };

  const officeAmt = Number(form.dealValue) * Number(form.officePercent) / 100 || 0;
  const agentAmt = Number(form.dealValue) * Number(form.agentPercent) / 100 || 0;

  return (
    <form onSubmit={handleSubmit} onInput={() => setDirty && setDirty(true)}>
      <FormField label="العميل/الصفقة" error={errors.clientName}>
        <input type="text" value={form.clientName} onChange={e => setForm(f => ({...f, clientName:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="العميل"/>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="قيمة الصفقة (ر.س)" error={errors.dealValue}>
          <input type="number" min="0" value={form.dealValue} onChange={e => setForm(f => ({...f, dealValue:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="قيمة الصفقة"/>
        </FormField>
        <FormField label="اسم الوكيل" error={errors.agentName}>
          <input type="text" value={form.agentName} onChange={e => setForm(f => ({...f, agentName:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اسم الوكيل"/>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="نسبة المكتب (%)" error={errors.officePercent || errors.total}>
          <input type="number" step="0.1" min="0" max="100" value={form.officePercent} onChange={e => handleOfficeChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="نسبة المكتب"/>
        </FormField>
        <FormField label="نسبة الوكيل (%)" error={errors.agentPercent}>
          <input type="number" step="0.1" min="0" max="100" value={form.agentPercent} onChange={e => setForm(f => ({...f, agentPercent:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="نسبة الوكيل"/>
        </FormField>
      </div>
      {/* Calculated preview */}
      <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm">
        <div className="flex justify-between"><span>حصة المكتب:</span><span className="font-bold text-blue-700"><Currency value={officeAmt} symbolClassName="w-3.5 h-3.5" /></span></div>
        <div className="flex justify-between mt-1"><span>حصة الوكيل:</span><span className="font-bold text-gray-700"><Currency value={agentAmt} symbolClassName="w-3.5 h-3.5" /></span></div>
      </div>
      <FormField label="تاريخ الاستحقاق">
        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="تاريخ الاستحقاق"/>
      </FormField>
      <div className="flex gap-3 justify-end mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="تراجع">{MSG.buttons.cancel}</button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" aria-label="تسجيل البيانات">{MSG.buttons.save}</button>
      </div>
    </form>
  );
};

// ============================================
// LETTERS TEMPLATES PAGE
// ============================================
// (moved to src/domain/{letterTemplates.js, drafts.js})

const TemplatesPage = ({ setPage, setLetterType }) => (
  <div className="p-4 md:p-6 max-w-4xl mx-auto">
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {TEMPLATES.map(t => (
        <div key={t.type} className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 flex items-start gap-3 md:gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-blue-600"><Icons.fileText size={20}/></div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-0.5">{t.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{t.desc}</p>
            <button onClick={() => { setLetterType(t.type); setPage('generator'); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label={`استخدام ${t.title}`}>استخدام القالب</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// LETTER GENERATOR PAGE
// ============================================
const GeneratorPage = ({ letterType, setLetterType }) => {
  const toast = useToast();
  const template = getTemplateByType(letterType);
  const settings = dataStore.settings.get();
  const [fields, setFields] = useState(() => buildInitialFields(template, { officeName: settings.officeName, today: today() }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFields(buildInitialFields(template, { officeName: settings.officeName, today: today() }));
  }, [letterType]);

  const validate = () => {
    const errs = validateLetterFields(template, fields, FIELD_LABELS);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    const res = dataStore.letters.saveDraft({ templateType: template.type, fields: { ...fields } });
    if (!res.ok) { toast(res.message, 'error'); return; }
    toast(MSG.success.saved);
  };

  const renderPreview = () => {
    const f = fields;
    if (template.type === 'intro') return (
      <div className="space-y-4 text-gray-900 leading-relaxed">
        <div className="text-center mb-6"><h2 className="text-xl font-bold">{f.officeName || '___'}</h2></div>
        <p>التاريخ: {f.date ? formatDateHeader(f.date) : '___'}</p>
        <p>إلى السيد/ة: {f.recipientName || '___'}</p>
        <p>الجهة: {f.recipientOrg || '___'}</p>
        <p className="mt-4">السلام عليكم ورحمة الله وبركاته،</p>
        <p>{f.body || '___'}</p>
        <p>وتفضلوا بقبول فائق الاحترام والتقدير،</p>
        <p className="mt-4 font-bold">{f.managerName || '___'}</p>
        <p>المدير العام</p>
      </div>
    );
    if (template.type === 'request') return (
      <div className="space-y-4 text-gray-900 leading-relaxed">
        <div className="text-center mb-6"><h2 className="text-xl font-bold">{f.officeName || '___'}</h2></div>
        <p>التاريخ: {f.date ? formatDateHeader(f.date) : '___'}</p>
        <p>إلى: {f.recipientOrg || '___'}</p>
        <p className="font-bold">الموضوع: {f.subject || '___'}</p>
        <p className="mt-4">السلام عليكم ورحمة الله وبركاته،</p>
        <p>{f.body || '___'}</p>
        <p>وتفضلوا بقبول فائق الاحترام والتقدير،</p>
        <p className="mt-4 font-bold">{f.managerName || '___'}</p>
        <p>المدير العام</p>
      </div>
    );
    return (
      <div className="space-y-4 text-gray-900 leading-relaxed">
        <div className="text-center mb-6"><h2 className="text-xl font-bold">{f.officeName || '___'}</h2></div>
        <p>التاريخ: {f.date ? formatDateHeader(f.date) : '___'}</p>
        <h3 className="font-bold text-center text-lg mt-4">خطاب تفويض</h3>
        <p className="mt-4">نحن {f.officeName || '___'} نفوّض السيد/ة <strong>{f.delegateName || '___'}</strong> صاحب/ة الهوية رقم <strong>{f.delegateId || '___'}</strong> بـ {f.purpose || '___'}. وهذا التفويض ساري المفعول من تاريخه حتى إشعار آخر.</p>
        {f.body?.trim() ? <p>{f.body}</p> : null}
        <p>وتفضلوا بقبول فائق الاحترام والتقدير،</p>
        <p className="mt-4 font-bold">{f.managerName || '___'}</p>
        <p>المدير العام</p>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Template selector */}
      <div className="flex gap-2 mb-4 no-print">
        {TEMPLATES.map(t => (
          <button key={t.type} onClick={() => setLetterType(t.type)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${letterType === t.type ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label={t.title}>{t.title}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 no-print">
          <h3 className="font-bold mb-4">تعبئة البيانات</h3>
          {template.fields.map(k => (
            <div key={k} className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{FIELD_LABELS[k]}</label>
              {k === 'body' ? (
                <textarea value={fields[k]||''} onChange={e => setFields(f => ({...f, [k]:e.target.value}))} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label={FIELD_LABELS[k]}/>
              ) : k === 'date' ? (
                <input type="date" value={fields[k]||''} onChange={e => setFields(f => ({...f, [k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label={FIELD_LABELS[k]}/>
              ) : (
                <input type="text" value={fields[k]||''} onChange={e => setFields(f => ({...f, [k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label={FIELD_LABELS[k]}/>
              )}
              {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveDraft} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ كمسودة">حفظ كمسودة</button>
            <button onClick={() => { if (validate()) window.print(); }} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="طباعة"><Icons.printer size={14}/>طباعة</button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 print-container" style={{minHeight:'400px'}}>
          <div className="border border-gray-200 rounded-lg p-8" style={{fontFamily:'"Noto Sans Arabic", sans-serif'}}>
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DRAFTS PAGE
// ============================================
const DraftsPage = ({ setPage, setLetterType, setEditDraft }) => {
  const toast = useToast();
  const [drafts, setDrafts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const refresh = useCallback(() => setDrafts(dataStore.letters.listDrafts()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = (id) => {
    setConfirm({ title:'حذف المسودة', message: MSG.confirm.deleteAction + ' سيتم حذف هذه المسودة نهائياً.', onConfirm: () => {
      const res = dataStore.letters.removeDraft(id);
      if (!res.ok) { toast(res.message, 'error'); setConfirm(null); return; }
      toast(MSG.success.deleted); setConfirm(null); refresh();
    }});
  };

  const handleEdit = (draft) => {
    setLetterType(draft.templateType);
    setEditDraft(draft);
    setPage('generator');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {drafts.length === 0 ? (
        <EmptyState message="لا توجد مسودات محفوظة"/>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {drafts.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <button onClick={() => handleDelete(d.id)} className="absolute top-2 left-2 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" aria-label="حذف المسودة نهائياً"><Icons.trash size={16}/></button>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-blue-600"><Icons.fileText size={20}/></div>
              <h3 className="font-bold text-gray-900 mb-1">{LETTER_TYPES[d.templateType]}</h3>
              <p className="text-sm text-gray-500 mb-2">{d.fields?.officeName || ''} — {d.fields?.recipientOrg || d.fields?.recipientName || d.fields?.delegateName || ''}</p>
              <p className="text-sm text-gray-500 mb-4">{formatDraftDate(d.updatedAt, formatDateHeader)}</p>
              <button onClick={() => handleEdit(d)} className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="فتح المسودة">فتح المسودة</button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger/>
    </div>
  );
};

// ============================================
// LEDGERS PAGE
// ============================================
const LedgersPage = () => {
  const toast = useToast();
  const [tab, setTab] = useState('ledgers'); // ledgers | recurring

  const [ledgers, setLedgersState] = useState([]);
  const [activeId, setActiveIdState] = useState('');

  const LEDGER_TYPE_LABELS = {
    office: '🏢 مكتب',
    chalet: '🏡 شاليه',
    apartment: '🏠 شقة',
    villa: '🏘️ فيلا',
    building: '🏬 عمارة',
    personal: '👤 شخصي',
    other: '📁 أخرى',
  };

  const normalizeLedgerType = (t) => {
    const x = String(t || '').toLowerCase();
    return (x === 'office' || x === 'chalet' || x === 'apartment' || x === 'villa' || x === 'building' || x === 'personal' || x === 'other') ? x : 'office';
  };

  const normalizeNote = (s) => {
    const x = String(s ?? '').trim();
    if (!x) return '';
    return x.length > 120 ? x.slice(0, 120) : x;
  };

  // Ledgers CRUD
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('office');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState('office');
  const [editingNote, setEditingNote] = useState('');

  // Recurring items CRUD (linked by active ledger id)
  const [recurring, setRecurringState] = useState([]);
  const [recForm, setRecForm] = useState({ title: '', amount: '', frequency: 'monthly', nextDueDate: '', notes: '' });
  const [recEditingId, setRecEditingId] = useState(null);

  const refresh = useCallback(() => {
    try { setLedgersState(getLedgers()); } catch { setLedgersState([]); }
    try { setActiveIdState(getActiveLedgerId() || ''); } catch { setActiveIdState(''); }
    try { setRecurringState(getRecurringItems() || []); } catch { setRecurringState([]); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createLedger = () => {
    const t = (newName || '').trim();
    if (!t) { toast('اسم الدفتر مطلوب', 'error'); return; }

    const ts = new Date().toISOString();
    const id = (() => {
      try { if (crypto && typeof crypto.randomUUID === 'function') return `ledg_${crypto.randomUUID()}`; } catch {}
      return `ledg_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    })();

    const next = [...(Array.isArray(ledgers) ? ledgers : []), {
      id,
      name: t,
      type: normalizeLedgerType(newType),
      note: normalizeNote(newNote),
      currency: 'SAR',
      createdAt: ts,
      updatedAt: ts,
      archived: false,
    }];

    try { setLedgers(next); } catch { toast('تعذر حفظ الدفتر', 'error'); return; }
    try { if (!getActiveLedgerId()) setActiveLedgerId(id); } catch {}

    setNewName('');
    setNewType('office');
    setNewNote('');
    toast('تمت إضافة الدفتر');
    refresh();
  };

  const startEdit = (ledger) => {
    setEditingId(ledger.id);
    setEditingName(ledger.name || '');
    setEditingType(normalizeLedgerType(ledger.type));
    setEditingNote(String(ledger.note ?? ''));
  };

  const saveEdit = () => {
    const t = (editingName || '').trim();
    if (!t) { toast('اسم الدفتر مطلوب', 'error'); return; }

    const next = (Array.isArray(ledgers) ? ledgers : []).map(l => {
      if (l.id !== editingId) return l;
      return {
        ...l,
        name: t,
        type: normalizeLedgerType(editingType),
        note: normalizeNote(editingNote),
        updatedAt: new Date().toISOString(),
      };
    });

    try { setLedgers(next); } catch { toast('تعذر حفظ التعديل', 'error'); return; }
    toast('تم تحديث الدفتر');
    setEditingId(null);
    setEditingName('');
    setEditingType('office');
    setEditingNote('');
    refresh();
  };

  const setActive = (id) => {
    try { setActiveLedgerId(id); } catch { toast('تعذر تعيين الدفتر النشط', 'error'); return; }
    toast('تم تعيين الدفتر النشط');
    refresh();
  };

  const activeLedger = (Array.isArray(ledgers) ? ledgers : []).find(l => l.id === activeId) || null;
  const activeRecurring = (Array.isArray(recurring) ? recurring : []).filter(r => r.ledgerId === activeId);

  const resetRecForm = () => setRecForm({ title: '', amount: '', frequency: 'monthly', nextDueDate: '', notes: '' });

  const startEditRecurring = (item) => {
    setRecEditingId(item.id);
    setRecForm({
      title: item.title || '',
      amount: String(item.amount ?? ''),
      frequency: item.frequency || 'monthly',
      nextDueDate: item.nextDueDate || '',
      notes: item.notes || '',
    });
  };

  const saveRecurring = () => {
    if (!activeId) { toast('اختر دفترًا نشطًا أولًا', 'error'); return; }

    const title = (recForm.title || '').trim();
    if (!title) { toast('اسم الالتزام مطلوب', 'error'); return; }

    const amount = Number(recForm.amount);
    if (Number.isNaN(amount)) { toast('المبلغ غير صحيح', 'error'); return; }

    const freq = (recForm.frequency === 'monthly' || recForm.frequency === 'quarterly' || recForm.frequency === 'yearly') ? recForm.frequency : 'monthly';
    const nextDueDate = String(recForm.nextDueDate || '').trim();
    if (!nextDueDate) { toast('تاريخ الاستحقاق القادم مطلوب', 'error'); return; }

    const ts = new Date().toISOString();
    const id = recEditingId || (() => {
      try { if (crypto && typeof crypto.randomUUID === 'function') return `rec_${crypto.randomUUID()}`; } catch {}
      return `rec_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    })();

    const next = (() => {
      const list = Array.isArray(recurring) ? recurring : [];
      if (!recEditingId) {
        return [...list, { id, ledgerId: activeId, title, category: 'rent', amount, frequency: freq, nextDueDate, notes: String(recForm.notes || ''), createdAt: ts, updatedAt: ts }];
      }
      return list.map(r => (r.id === recEditingId ? { ...r, title, amount, frequency: freq, nextDueDate, notes: String(recForm.notes || ''), updatedAt: ts } : r));
    })();

    try { setRecurringItems(next); } catch { toast('تعذر حفظ الالتزام', 'error'); return; }

    toast(recEditingId ? 'تم تحديث الالتزام' : 'تمت إضافة الالتزام');
    setRecEditingId(null);
    resetRecForm();
    refresh();
  };

  const deleteRecurring = (id) => {
    const next = (Array.isArray(recurring) ? recurring : []).filter(r => r.id !== id);
    try { setRecurringItems(next); } catch { toast('تعذر حذف الالتزام', 'error'); return; }
    toast('تم حذف الالتزام');
    refresh();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
        <h3 className="font-bold text-gray-900 mb-1">الدفاتر</h3>
        <p className="text-sm text-gray-500">أنشئ عدة دفاتر لإدارة أكثر من جهة/مكتب (النسخة الحالية تبدأ بدفتر افتراضي).</p>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={() => setTab('ledgers')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'ledgers' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label="دفاتر">دفاتر</button>
          <button type="button" onClick={() => setTab('recurring')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'recurring' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label="التزامات متكررة">التزامات متكررة</button>
        </div>
      </div>

      {tab === 'ledgers' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الدفتر الجديد</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اسم الدفتر" placeholder="مثال: مكتب قيد العقار" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">اختر نوع الدفتر</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="نوع الدفتر">
                  <option value="office">🏢 مكتب</option>
                  <option value="chalet">🏡 شاليه</option>
                  <option value="apartment">🏠 شقة</option>
                  <option value="villa">🏘️ فيلا</option>
                  <option value="building">🏬 عمارة</option>
                  <option value="personal">👤 شخصي</option>
                  <option value="other">📁 أخرى</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف مختصر (اختياري)</label>
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="وصف مختصر" placeholder="وصف مختصر (اختياري)" />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button type="button" onClick={createLedger} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="إضافة دفتر">+ إضافة دفتر</button>
            </div>
          </div>

          {(!ledgers || ledgers.length === 0) ? (
            <EmptyState message="لا توجد دفاتر" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ledgers.filter(l => !l.archived).map((l) => (
                <div key={l.id} className={`bg-white rounded-xl border p-5 shadow-sm ${l.id === activeId ? 'border-blue-300' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{l.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-gray-500">{LEDGER_TYPE_LABELS[normalizeLedgerType(l.type)] || '🏢 مكتب'}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{l.currency}</span>
                      </div>
                      {String(l.note || '').trim() ? <p className="text-xs text-gray-500 mt-2">{l.note}</p> : null}
                    </div>
                    {l.id === activeId && <Badge color="blue">نشط</Badge>}
                  </div>

                  {editingId === l.id ? (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">تعديل الاسم</label>
                      <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="تعديل اسم الدفتر" />

                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">اختر نوع الدفتر</label>
                          <select value={editingType} onChange={(e) => setEditingType(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="تعديل نوع الدفتر">
                            <option value="office">🏢 مكتب</option>
                            <option value="chalet">🏡 شاليه</option>
                            <option value="apartment">🏠 شقة</option>
                            <option value="villa">🏘️ فيلا</option>
                            <option value="building">🏬 عمارة</option>
                            <option value="personal">👤 شخصي</option>
                            <option value="other">📁 أخرى</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">وصف مختصر (اختياري)</label>
                          <input value={editingNote} onChange={(e) => setEditingNote(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="تعديل الوصف" placeholder="وصف مختصر (اختياري)" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-3">
                        <button type="button" onClick={() => { setEditingId(null); setEditingName(''); }} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="إلغاء">إلغاء</button>
                        <button type="button" onClick={saveEdit} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ">حفظ</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-end mt-4">
                      <button type="button" onClick={() => startEdit(l)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50" aria-label="تعديل الاسم">تعديل الاسم</button>
                      <button type="button" onClick={() => setActive(l.id)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="تعيين كنشط">تعيين كنشط</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'recurring' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-900">التزامات متكررة</h4>
                <p className="text-sm text-gray-500 mt-1">دفتر نشط: <span className="font-medium text-gray-700">{activeLedger?.name || '—'}</span></p>
              </div>
              {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الالتزام</label>
                <input value={recForm.title} onChange={(e) => setRecForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اسم الالتزام" placeholder="مثال: إيجار المكتب" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input type="number" value={recForm.amount} onChange={(e) => setRecForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="مبلغ الالتزام" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التكرار</label>
                <select value={recForm.frequency} onChange={(e) => setRecForm(f => ({ ...f, frequency: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="تكرار الالتزام">
                  <option value="monthly">شهري</option>
                  <option value="quarterly">ربع سنوي</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق القادم</label>
                <input type="date" value={recForm.nextDueDate} onChange={(e) => setRecForm(f => ({ ...f, nextDueDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="تاريخ الاستحقاق القادم" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                <textarea value={recForm.notes} onChange={(e) => setRecForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="ملاحظات الالتزام" />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              {recEditingId && (
                <button type="button" onClick={() => { setRecEditingId(null); resetRecForm(); }} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="إلغاء تعديل الالتزام">إلغاء</button>
              )}
              <button type="button" onClick={saveRecurring} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ الالتزام">{recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}</button>
            </div>
          </div>

          {activeRecurring.length === 0 ? (
            <EmptyState message="لا توجد التزامات متكررة لهذا الدفتر" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-bold text-gray-900">القائمة</h4>
                <span className="text-xs text-gray-500">{activeRecurring.length}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {activeRecurring.map((r) => (
                  <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{r.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{r.frequency} • {r.nextDueDate} • {formatNumber(r.amount, { maximumFractionDigits: 2 })}</div>
                      {r.notes?.trim() ? <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{r.notes}</div> : null}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => startEditRecurring(r)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50" aria-label="تعديل الالتزام">تعديل</button>
                      <button type="button" onClick={() => deleteRecurring(r.id)} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100" aria-label="حذف الالتزام">حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================
// SETTINGS PAGE
// ============================================
const SettingsPage = ({ onShowOnboarding }) => {
  const toast = useToast();
  const [settings, setSettings] = useState(dataStore.settings.get());
  const [uiTheme, setUiTheme] = useState(getSavedTheme() || 'system');
  const [uiNumerals, setUiNumerals] = useState(getSavedNumerals() || document.documentElement.dataset.numerals || 'ar');
  const [confirm, setConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const importDataRef = useRef(null);

  const handleSave = () => {
    const res = dataStore.settings.update(settings);
    if (!res.ok) { toast(res.message, 'error'); return; }
    toast(MSG.success.saved);
  };

  const handleResetDemo = () => {
    setConfirm({ title:'إعادة بيانات الديمو', message:'سيتم استبدال جميع البيانات ببيانات الديمو. هل أنت متأكد؟', onConfirm: () => {
      const res = dataStore.seed.resetDemo();
      if (!res.ok) { toast(res.message, 'error'); setConfirm(null); return; }
      setSettings(dataStore.settings.get());
      initTheme();
      toast('تمت إعادة بيانات الديمو');
      setConfirm(null);
    }});
  };

  const handleClearAll = () => {
    const txCount = dataStore.transactions.list().length;
    const cmCount = dataStore.commissions.list().length;
    const draftCount = (safeGet(KEYS.drafts, [])).length;
    setConfirm({
      title: 'حذف جميع البيانات',
      message: 'سيتم حذف جميع البيانات المحفوظة:',
      messageList: [
        `جميع الحركات المالية (${formatNumber(txCount, { maximumFractionDigits: 0 })})`,
        `جميع العمولات (${formatNumber(cmCount, { maximumFractionDigits: 0 })})`,
        `جميع المسودات (${formatNumber(draftCount, { maximumFractionDigits: 0 })})`,
        'جميع الإعدادات'
      ],
      dangerText: 'لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'نعم، احذف كل شيء',
      danger: true,
      onConfirm: () => {
        dataStore.seed.clearAll();
        setSettings(SEED_SETTINGS);
        initTheme();
        toast('تم حذف جميع البيانات');
        setConfirm(null);
      }
    });
  };

  const getBackupAppKeys = () => ([
    // Financial/local data keys
    KEYS.transactions,
    KEYS.commissions,
    KEYS.drafts,
    KEYS.settings,
    KEYS.seeded,

    // Ledgers (PR-1)
    'ff_ledgers',
    'ff_recurring_items',
    'ff_active_ledger_id',

    // UI keys
    UI_THEME_KEY,
    UI_NUMERALS_KEY,
    UI_DATE_HEADER_KEY,
    UI_ONBOARDING_SEEN_KEY,
    // Optional UI state
    STORAGE_KEYS.UI_WELCOME
  ]);

  const pad2 = (n) => String(n).padStart(2, '0');
  const formatBackupFilename = (d) => {
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    return `qaydalaqar-backup-${yyyy}${mm}${dd}-${hh}${min}.json`;
  };

  const handleExportBackup = () => {
    const now = new Date();
    const keys = getBackupAppKeys();
    const data = {};
    keys.forEach((k) => {
      try {
        const v = storageFacade.getRaw(k);
        if (v != null) data[k] = v;
      } catch {
        // ignore
      }
    });

    const envelope = {
      app: 'qaydalaqar-finance-flow',
      schema: 1,
      exported_at: new Date().toISOString(),
      data
    };

    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formatBackupFilename(now);
    a.click();
    URL.revokeObjectURL(url);
    toast('تم تنزيل النسخة الاحتياطية');
  };

  const handleImportBackupClick = () => { fileInputRef.current && fileInputRef.current.click(); };

  const handleImportFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      let envelope;
      try { envelope = JSON.parse(reader.result); } catch {
        toast('ملف غير صالح (ليس JSON)', 'error');
        return;
      }

      const ok = envelope && envelope.app === 'qaydalaqar-finance-flow' && envelope.schema === 1 && envelope.data && typeof envelope.data === 'object';
      if (!ok) {
        toast('تنسيق النسخة الاحتياطية غير صحيح (app/schema)', 'error');
        return;
      }

      importDataRef.current = envelope.data;
      const keys = getBackupAppKeys();
      const current = {};
      keys.forEach((k) => {
        try { current[k] = storageFacade.getRaw(k); } catch { current[k] = null; }
      });

      let changeCount = 0;
      keys.forEach((k) => {
        const cur = current[k];
        const next = Object.prototype.hasOwnProperty.call(envelope.data, k) ? String(envelope.data[k]) : null;
        if ((cur ?? null) !== (next ?? null)) changeCount++;
      });

      setConfirm({
        title: 'استعادة نسخة احتياطية',
        message: `سيتم استبدال البيانات الحالية (${formatNumber(changeCount, { maximumFractionDigits: 0 })} مفاتيح). هل أنت متأكد؟`,
        danger: true,
        confirmLabel: 'نعم، استبدل البيانات',
        onConfirm: () => {
          const d = importDataRef.current;
          if (!d) { setConfirm(null); return; }

          // Replace app keys only
          storageFacade.removeMany(keys);
          keys.forEach((k) => {
            try {
              if (Object.prototype.hasOwnProperty.call(d, k)) storageFacade.setRaw(k, String(d[k]));
            } catch {
              // ignore individual key failures
            }
          });

          setConfirm(null);
          window.location.reload();
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const Field = ({ label, children }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Phase 9.1 — Data Warning Notice (LocalStorage) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm mb-6 no-print" role="alert" aria-labelledby="data-warning-title">
        <h3 id="data-warning-title" className="font-bold text-amber-800 mb-3">
          ملاحظة مهمة
        </h3>
        <ul className="text-sm text-amber-900 space-y-1.5 list-disc list-inside">
          <li>البيانات محفوظة على هذا الجهاز فقط (LocalStorage)</li>
          <li>مسح بيانات المتصفح/الموقع يحذف كل شيء</li>
          <li>لا تستخدم على جهاز مشترك</li>
          <li>يُنصح بتصدير نسخة احتياطية دوريًا</li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4">وضع العرض</h3>
        <Field label="المظهر">
          <select value={uiTheme} onChange={e => { const v = e.target.value; setUiTheme(v); applyTheme(v); toast('تم تحديث المظهر'); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="وضع العرض">
            <option value="system">النظام</option>
            <option value="light">نهاري</option>
            <option value="dim">خافت</option>
            <option value="dark">ليلي</option>
          </select>
        </Field>
        <Field label="عرض الأرقام">
          <select value={uiNumerals} onChange={e => { const v = e.target.value; setUiNumerals(v); applyNumerals(v); toast('تم تحديث عرض الأرقام'); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="عرض الأرقام">
            <option value="ar">عربي</option>
            <option value="en">إنجليزي</option>
          </select>
        </Field>
        <Field label="عرض التاريخ">
          <select value={(getSavedDateHeader() || 'both')} onChange={e => { const v = e.target.value; setDateHeaderPref(v); toast('تم تحديث إعداد التاريخ'); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="عرض التاريخ">
            <option value="off">بدون</option>
            <option value="greg">ميلادي</option>
            <option value="hijri">هجري</option>
            <option value="both">ميلادي + هجري</option>
          </select>
        </Field>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => {
            try { storageFacade.removeRaw(UI_THEME_KEY); } catch {}
            setUiTheme('system');
            applyTheme('system');
            toast('تمت إعادة ضبط المظهر');
          }} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="إعادة ضبط المظهر">
            إعادة ضبط المظهر
          </button>

          <button type="button" onClick={() => {
            if (typeof onShowOnboarding === 'function') onShowOnboarding();
            toast('سيتم عرض شاشة الترحيب');
          }} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="إعادة عرض شاشة الترحيب">
            إعادة عرض شاشة الترحيب
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4">معلومات المكتب</h3>
        <Field label="اسم المكتب">
          <input type="text" value={settings.officeName} onChange={e => setSettings(s => ({...s, officeName:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اسم المكتب"/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم الهاتف">
            <input type="tel" value={settings.phone||''} onChange={e => setSettings(s => ({...s, phone:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="رقم الهاتف"/>
          </Field>
          <Field label="البريد الإلكتروني">
            <input type="email" value={settings.email||''} onChange={e => setSettings(s => ({...s, email:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="البريد الإلكتروني"/>
          </Field>
        </div>
        <Field label="نسبة العمولة الافتراضية للمكتب (%)">
          <input type="number" min="0" max="100" step="0.5" value={settings.defaultCommissionPercent} onChange={e => setSettings(s => ({...s, defaultCommissionPercent:Number(e.target.value)}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="نسبة العمولة الافتراضية"/>
          <p className="text-xs text-gray-400 mt-1">تؤثر على العمولات الجديدة فقط</p>
        </Field>
        <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ الإعدادات">حفظ الإعدادات</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4">النسخ الاحتياطي</h3>
        <p className="text-sm text-gray-600 mb-4">صدّر نسخة احتياطية إلى ملف JSON أو استعد نسخة سابقة (استبدال كامل للبيانات الحالية).</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleExportBackup} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 flex items-center gap-2" aria-label="تنزيل نسخة احتياطية JSON">
            <Icons.download size={16}/> تنزيل نسخة احتياطية (JSON)
          </button>
          <button type="button" onClick={handleImportBackupClick} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center gap-2" aria-label="استعادة نسخة احتياطية">
            <Icons.fileText size={16}/> استعادة من نسخة احتياطية
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">النسخ الاحتياطي لا يرسل بيانات للسحابة.</p>

        <div className="mt-4 rounded-xl border border-gray-100 p-4" aria-label="المزامنة السحابية">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-gray-900">المزامنة السحابية (Pro) — قريبًا</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Pro</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">مزامنة بياناتك بين أكثر من جهاز مع تسجيل دخول آمن.</p>
        </div>

        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImportFileChange} className="hidden" aria-hidden="true"/>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">إدارة البيانات</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleResetDemo} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50" aria-label="إعادة بيانات الديمو">إعادة بيانات الديمو</button>
          <button onClick={handleClearAll} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50" aria-label="حذف جميع البيانات">حذف جميع البيانات</button>
        </div>
      </div>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} messageList={confirm?.messageList} dangerText={confirm?.dangerText} confirmLabel={confirm?.confirmLabel} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger={confirm?.danger}/>
    </div>
  );
};

// ============================================
// NOTES & CALENDAR (integrated from notes-calendar)
// ============================================
const HIJRI_MONTHS_NC = ["محرّم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
const GREG_MONTHS_NC = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY_NAMES_NC = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const DAY_NAMES_SHORT_NC = ["أحد","إثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
const EVENT_CATEGORIES_NC = [
  { id: "holiday", label: "إجازة رسمية", color: "#0F1C2E", bg: "rgba(15,28,46,0.08)", icon: "" },
  { id: "school", label: "تقويم دراسي", color: "#8A8F98", bg: "rgba(138,143,152,0.12)", icon: "" },
  { id: "personal", label: "شخصي", color: "#B8A76A", bg: "rgba(184,167,106,0.15)", icon: "" },
  { id: "work", label: "عمل", color: "#1a2d45", bg: "rgba(15,28,46,0.06)", icon: "" },
  { id: "rental", label: "تأجير/حجوزات", color: "#6b7a4a", bg: "rgba(184,167,106,0.12)", icon: "" },
  { id: "religious", label: "مناسبة دينية", color: "#5c6b7a", bg: "rgba(138,143,152,0.1)", icon: "" },
];
const DEFAULT_EVENTS_NC = [
  { id: "e1", title: "عيد الفطر", category: "holiday", dateType: "hijri", hMonth: 10, hDay: 1, duration: 3, recurring: true },
  { id: "e2", title: "عيد الأضحى", category: "holiday", dateType: "hijri", hMonth: 12, hDay: 10, duration: 4, recurring: true },
  { id: "e3", title: "اليوم الوطني", category: "holiday", dateType: "gregorian", gMonth: 9, gDay: 23, duration: 1, recurring: true },
  { id: "e4", title: "يوم التأسيس", category: "holiday", dateType: "gregorian", gMonth: 2, gDay: 22, duration: 1, recurring: true },
  { id: "e5", title: "بداية رمضان", category: "religious", dateType: "hijri", hMonth: 9, hDay: 1, duration: 1, recurring: true },
];
// (moved to src/domain/utils.js)

function NotesCalendarAddInput({ placeholder, onAdd, colors }) {
  const [text, setText] = useState("");
  const handleAdd = () => {
    const t = text.trim();
    if (t) { onAdd(t); setText(""); }
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
        placeholder={placeholder}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#f8fafc" }}
      />
      <button type="button" onClick={handleAdd}
        style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
        + إضافة
      </button>
    </div>
  );
}

function NotesCalendarPinnedCard({ note, colors, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  return (
    <div style={{ background: note.color || "rgba(15,28,46,0.06)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, border: "1px solid rgba(15,28,46,0.08)" }}>
      {editing ? (
        <div>
          <textarea value={text} onChange={e => setText(e.target.value)} autoFocus
            style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, fontFamily: "inherit", direction: "rtl", resize: "vertical", minHeight: 60, background: "rgba(255,255,255,0.7)" }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-start" }}>
            <button onClick={() => { onUpdate(text); setEditing(false); }}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>حفظ</button>
            <button onClick={() => { setText(note.text); setEditing(false); }}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 12 }}>إلغاء</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{note.text}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(true)}
              style={{ background: "rgba(15,28,46,0.08)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: colors.text }}>تعديل</button>
            <button onClick={onDelete}
              style={{ background: "rgba(198,40,40,0.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: colors.danger }}>حذف</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesCalendarAddPinnedInput({ onAdd, colors }) {
  const [text, setText] = useState("");
  const [color, setColor] = useState("rgba(15,28,46,0.06)");
  const [open, setOpen] = useState(false);
  const COLORS = ["rgba(15,28,46,0.06)", "rgba(184,167,106,0.2)", "rgba(138,143,152,0.12)", "rgba(15,28,46,0.1)", "rgba(184,167,106,0.12)", "rgba(138,143,152,0.08)"];
  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: "100%", padding: "10px", borderRadius: 10, border: `2px dashed ${colors.border}`, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: colors.primary, marginTop: 4 }}>
      + إضافة ملاحظة ثابتة
    </button>
  );
  return (
    <div style={{ background: color, borderRadius: 12, padding: 16, marginTop: 8, border: "1px solid rgba(15,28,46,0.08)" }}>
      <textarea value={text} onChange={e => setText(e.target.value)} autoFocus
        placeholder="اكتب ملاحظتك الثابتة هنا..."
        style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, fontFamily: "inherit", direction: "rtl", resize: "vertical", minHeight: 60, background: "rgba(255,255,255,0.7)" }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: color === c ? `3px solid ${colors.primary}` : "2px solid rgba(0,0,0,0.1)", cursor: "pointer" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button onClick={() => { onAdd(text, color); setText(""); setOpen(false); }}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>حفظ</button>
        <button onClick={() => { setText(""); setOpen(false); }}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 13 }}>إلغاء</button>
      </div>
    </div>
  );
}

function NotesCalendarAddEventModal({ colors, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("holiday");
  const [dateType, setDateType] = useState("hijri");
  const [hMonth, setHMonth] = useState(1);
  const [hDay, setHDay] = useState(1);
  const [gMonth, setGMonth] = useState(1);
  const [gDay, setGDay] = useState(1);
  const [duration, setDuration] = useState(1);
  const [recurring, setRecurring] = useState(true);
  const submit = () => {
    if (!title.trim()) return;
    const ev = { title, category, dateType, duration: Number(duration), recurring };
    if (dateType === "hijri") { ev.hMonth = Number(hMonth); ev.hDay = Number(hDay); }
    else { ev.gMonth = Number(gMonth); ev.gDay = Number(gDay); }
    onAdd(ev);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }}>
      <div dir="rtl" style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>إضافة مناسبة جديدة</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: colors.textMuted, padding: 4 }} aria-label="إغلاق">×</button>
        </div>
        <div style={{ padding: "16px 24px 24px" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>اسم المناسبة</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: بداية الإجازة الصيفية"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, fontFamily: "inherit", direction: "rtl", marginBottom: 16, boxSizing: "border-box" }}
          />
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>التصنيف</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {EVENT_CATEGORIES_NC.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                style={{
                  padding: "8px 14px", borderRadius: 10, border: category === cat.id ? `2px solid ${cat.color}` : `1px solid ${colors.border}`,
                  background: category === cat.id ? cat.bg : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  color: category === cat.id ? cat.color : colors.textLight, display: "flex", alignItems: "center", gap: 4
                }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>نوع التاريخ</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[{k:"hijri",l:"هجري"},{k:"gregorian",l:"ميلادي"}].map(t => (
              <button key={t.k} onClick={() => setDateType(t.k)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: dateType === t.k ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, background: dateType === t.k ? colors.primaryLight : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: dateType === t.k ? colors.primary : colors.textLight }}>
                {t.l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {dateType === "hijri" ? (
              <>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>الشهر الهجري</label>
                  <select value={hMonth} onChange={e => setHMonth(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", direction: "rtl", background: "#fff" }}>
                    {HIJRI_MONTHS_NC.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>اليوم</label>
                  <input type="number" min={1} max={30} value={hDay} onChange={e => setHDay(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, textAlign: "center" }} />
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>الشهر الميلادي</label>
                  <select value={gMonth} onChange={e => setGMonth(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", direction: "rtl", background: "#fff" }}>
                    {GREG_MONTHS_NC.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>اليوم</label>
                  <input type="number" min={1} max={31} value={gDay} onChange={e => setGDay(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, textAlign: "center" }} />
                </div>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>مدة المناسبة (بالأيام)</label>
              <input type="number" min={1} max={30} value={duration} onChange={e => setDuration(e.target.value)}
                style={{ width: 80, padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, textAlign: "center" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 20 }}>
              <div onClick={() => setRecurring(!recurring)}
                style={{ width: 44, height: 24, borderRadius: 12, background: recurring ? colors.primary : "#d1d5db", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.2s", ...(recurring ? { left: 3 } : { right: 3 }) }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>تتكرر سنوياً</span>
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={submit}
              style={{ flex: 1, padding: "12px 20px", borderRadius: 12, border: "none", background: "#0F1C2E", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 800, boxShadow: "0 4px 12px rgba(15,28,46,0.25)" }}>
              حفظ المناسبة
            </button>
            <button onClick={onClose}
              style={{ padding: "12px 20px", borderRadius: 12, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: colors.textLight }}>
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesCalendar({ mode = 'calendar' }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(getKeyNC(today.getFullYear(), today.getMonth() + 1, today.getDate()));
  const [pinnedNotes, setPinnedNotes] = useState([{ id: "p1", text: "أرقام الحسابات البنكية المهمة", color: "rgba(15,28,46,0.06)", createdAt: Date.now() }]);
  const [dailyNotes, setDailyNotes] = useState({});
  const [events, setEvents] = useState(DEFAULT_EVENTS_NC);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const selParts = selectedDate.split("-").map(Number);
  const selHijri = gregorianToHijri(selParts[0], selParts[1], selParts[2]);
  const selDayName = DAY_NAMES_NC[new Date(selParts[0], selParts[1] - 1, selParts[2]).getDay()];

  const calendarDays = useMemo(() => buildCalendarDays(currentYear, currentMonth), [currentMonth, currentYear]);

  const getEventsForDateLocal = useCallback((gY, gM, gD) => getEventsForDate(events, gY, gM, gD), [events]);
  const isHolidayLocal = useCallback((gY, gM, gD) => isHoliday(getEventsForDateLocal(gY, gM, gD)), [getEventsForDateLocal]);

  const currentDailyNotes = dailyNotes[selectedDate] || [];
  const setCurrentDailyNotes = (notes) => { setDailyNotes(prev => ({ ...prev, [selectedDate]: notes })); };
  const addDailyNote = (text) => { setDailyNotes(prev => domainAddDailyNote(prev, selectedDate, text)); };
  const toggleDailyNote = (id) => { setCurrentDailyNotes(domainToggleDailyNote(currentDailyNotes, id)); };
  const deleteDailyNote = (id) => { setCurrentDailyNotes(domainDeleteDailyNote(currentDailyNotes, id)); };
  const addPinnedNote = (text, color) => { setPinnedNotes(prev => domainAddPinnedNote(prev, text, color, "rgba(15,28,46,0.06)")); };
  const deletePinnedNote = (id) => { setPinnedNotes(prev => domainDeletePinnedNote(prev, id)); };
  const updatePinnedNote = (id, text) => { setPinnedNotes(prev => domainUpdatePinnedNote(prev, id, text)); };

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };
  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(getKeyNC(today.getFullYear(), today.getMonth() + 1, today.getDate()));
  };

  const todayKey = getKeyNC(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const hijriCurrent = gregorianToHijri(currentYear, currentMonth + 1, 15);
  const pendingTasks = currentDailyNotes.filter(n => !n.done).length;
  const colors = { bg: "#FAFBFC", card: "#ffffff", primary: "#0F1C2E", primaryLight: "rgba(15,28,46,0.08)", primaryDark: "#0F1C2E", accent: "#B8A76A", text: "#0F1C2E", textLight: "#8A8F98", textMuted: "#8A8F98", border: "rgba(15,28,46,0.08)", success: "#2E7D32", danger: "#C62828", warning: "#E65100", holidayBg: "rgba(198,40,40,0.06)", todayBorder: "#B8A76A" };

  const showCal = mode === 'calendar';
  const showNotes = mode === 'notes';

  return (
    <div dir="rtl" className="p-4 max-w-6xl mx-auto" style={{ fontFamily: "var(--qa-font, 'IBM Plex Sans Arabic', 'Noto Sans Arabic', Tahoma, sans-serif)", minHeight: '100%' }}>
      <div style={{ display: "flex", flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        {showCal && (
          <div style={{ flex: "1 1 520px", minWidth: 320 }}>
          <div style={{ background: colors.card, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", border: `1px solid ${colors.border}` }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(15,28,46,0.06)", borderBottom: `1px solid ${colors.border}` }}>
              <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700 }}>→</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: colors.primaryDark }}>{GREG_MONTHS_NC[currentMonth]} {toArabicNumNC(currentYear)}</div>
                <div style={{ fontSize: 13, color: colors.accent, fontWeight: 600, marginTop: 2 }}>{HIJRI_MONTHS_NC[hijriCurrent.month-1]} {toArabicNumNC(hijriCurrent.year)} هـ</div>
              </div>
              <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700 }}>←</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 12px", background: "rgba(15,28,46,0.04)" }}>
              {DAY_NAMES_SHORT_NC.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: colors.textLight, padding: 4 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 12px 12px", gap: 3 }}>
              {calendarDays.map((item, idx) => {
                const key = getKeyNC(item.year, item.month, item.day);
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const hijri = gregorianToHijri(item.year, item.month, item.day);
                const dayEvents = getEventsForDateLocal(item.year, item.month, item.day);
                const holiday = isHolidayLocal(item.year, item.month, item.day);
                const hasTasks = dailyNotes[key]?.length > 0;
                const hasPendingTasks = dailyNotes[key]?.some(n => !n.done);
                const dayOfWeek = new Date(item.year, item.month - 1, item.day).getDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                return (
                  <button key={idx} onClick={() => setSelectedDate(key)}
                    style={{
                      position: "relative", padding: "6px 2px", border: isToday ? `2px solid ${colors.todayBorder}` : isSelected ? `2px solid ${colors.primary}` : "2px solid transparent",
                      borderRadius: 10, cursor: "pointer", transition: "all 0.15s", minHeight: 56,
                      background: isToday ? "rgba(184,167,106,0.15)" : isSelected ? colors.primaryLight : holiday ? colors.holidayBg : isWeekend && item.current ? "rgba(15,28,46,0.04)" : "transparent",
                      opacity: item.current ? 1 : 0.35,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
                    }}>
                    <span style={{ fontSize: 15, fontWeight: isToday || isSelected ? 800 : 600, color: isSelected ? colors.primary : holiday ? colors.danger : isWeekend ? colors.textLight : colors.text }}>{toArabicNumNC(item.day)}</span>
                    <span style={{ fontSize: 9, color: isSelected ? colors.accent : colors.textMuted, fontWeight: 600 }}>{toArabicNumNC(hijri.day)}</span>
                    {dayEvents.length > 0 && (
                      <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 3 }}>
                        {dayEvents.slice(0, 3).map((ev, i) => {
                          const cat = EVENT_CATEGORIES_NC.find(c => c.id === ev.category);
                          return <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: cat?.color || "#999" }} />;
                        })}
                      </div>
                    )}
                    {hasTasks && (
                      <div style={{ position: "absolute", top: 3, left: 3, width: 7, height: 7, borderRadius: "50%", background: hasPendingTasks ? colors.warning : colors.success }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.border}`, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {EVENT_CATEGORIES_NC.map(cat => (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: colors.textLight }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />{cat.label}
                </div>
              ))}
            </div>
          </div>
          {(() => {
            const evs = getEventsForDateLocal(selParts[0], selParts[1], selParts[2]);
            if (evs.length === 0) return null;
            return (
              <div style={{ marginTop: 12, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark, marginBottom: 10 }}>مناسبات هذا اليوم</div>
                {evs.map(ev => {
                  const cat = EVENT_CATEGORIES_NC.find(c => c.id === ev.category);
                  return (
                    <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: cat?.bg || "#f5f5f5", marginBottom: 6, border: `1px solid ${cat?.color}22` }}>
                      {cat?.icon ? <span style={{ fontSize: 18 }}>{cat.icon}</span> : null}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: cat?.color }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: colors.textLight }}>{cat?.label}{ev.duration > 1 ? ` — ${toArabicNumNC(ev.duration)} أيام` : ""}</div>
                      </div>
                      <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: colors.textMuted, padding: 4 }} aria-label="حذف">×</button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <button onClick={() => { setShowAddEvent(true); }}
            style={{ width: "100%", marginTop: 12, padding: "12px 16px", borderRadius: 12, border: `2px dashed ${colors.border}`, background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 600, color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>+</span> إضافة مناسبة / إجازة
          </button>
          <div style={{ marginTop: 12, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15,28,46,0.06)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark }}>جميع المناسبات المسجلة</span>
              <span style={{ fontSize: 11, color: colors.textMuted, background: colors.primaryLight, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{toArabicNumNC(events.length)}</span>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {events.map(ev => {
                const cat = EVENT_CATEGORIES_NC.find(c => c.id === ev.category);
                return (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${colors.border}08` }}>
                    {cat?.icon ? <span style={{ fontSize: 16 }}>{cat.icon}</span> : null}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>
                        {ev.dateType === "hijri" ? `${toArabicNumNC(ev.hDay)} ${HIJRI_MONTHS_NC[ev.hMonth-1]} (هجري)` : `${toArabicNumNC(ev.gDay)} ${GREG_MONTHS_NC[ev.gMonth-1]} (ميلادي)`}
                        {ev.duration > 1 && ` — ${toArabicNumNC(ev.duration)} أيام`}{ev.recurring && " (متكرر)"}
                      </div>
                    </div>
                    <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 12, padding: 4 }} aria-label="حذف">حذف</button>
                  </div>
                );
              })}
              {events.length === 0 && <div style={{ padding: 30, textAlign: "center", color: colors.textMuted, fontSize: 13 }}>لا توجد مناسبات مسجلة</div>}
            </div>
          </div>
        </div>
        )}

        {showNotes && (
          <div style={{ flex: "1 1 420px", minWidth: 300 }}>
          <div style={{ background: "rgba(15,28,46,0.06)", borderRadius: 14, padding: "16px 20px", marginBottom: 12, border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>{selDayName}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: colors.primary }}>{toArabicNumNC(selParts[2])} {GREG_MONTHS_NC[selParts[1]-1]} {toArabicNumNC(selParts[0])}</div>
                <div style={{ fontSize: 14, marginTop: 4, color: colors.textMuted }}>{toArabicNumNC(selHijri.day)} {HIJRI_MONTHS_NC[selHijri.month-1]} {toArabicNumNC(selHijri.year)} هـ</div>
              </div>
              <button onClick={goToday} style={{ background: colors.primary, border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>اليوم</button>
            </div>
          </div>
          <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, background: "rgba(15,28,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0F1C2E" }}>مهام وملاحظات اليوم</span>
              </div>
              {currentDailyNotes.length > 0 && <div style={{ fontSize: 11, color: colors.textMuted }}>{toArabicNumNC(currentDailyNotes.filter(n => n.done).length)}/{toArabicNumNC(currentDailyNotes.length)} مكتملة</div>}
            </div>
            {currentDailyNotes.length > 0 && (
              <div style={{ padding: "8px 16px 4px", background: "rgba(15,28,46,0.03)" }}>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(15,28,46,0.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, transition: "width 0.4s ease", width: `${(currentDailyNotes.filter(n => n.done).length / currentDailyNotes.length) * 100}%`, background: currentDailyNotes.every(n => n.done) ? colors.success : colors.accent }} />
                </div>
              </div>
            )}
            <div style={{ padding: "8px 16px 12px" }}>
              {currentDailyNotes.map(note => (
                <div key={note.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${colors.border}33` }}>
                  <button onClick={() => toggleDailyNote(note.id)} style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${note.done ? colors.success : colors.border}`, background: note.done ? colors.success : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", marginTop: 2 }}>{note.done && "✓"}</button>
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.6, textDecoration: note.done ? "line-through" : "none", color: note.done ? colors.textMuted : colors.text }}>{note.text}</span>
                  <button onClick={() => deleteDailyNote(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 14, padding: "2px 4px", opacity: 0.5 }} aria-label="حذف">×</button>
                </div>
              ))}
              {currentDailyNotes.length === 0 && (
                <div style={{ padding: "24px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
                  لا توجد مهام لهذا اليوم
                </div>
              )}
              <div style={{ marginTop: 8 }}><NotesCalendarAddInput placeholder="أضف مهمة أو ملاحظة لهذا اليوم..." onAdd={addDailyNote} colors={colors} /></div>
            </div>
          </div>
          <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, background: "rgba(15,28,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 700, color: "#0F1C2E" }}>ملاحظات ثابتة</span></div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>(تظهر دائماً)</span>
            </div>
            <div style={{ padding: "12px 16px" }}>
              {pinnedNotes.map(note => (
                <NotesCalendarPinnedCard key={note.id} note={note} colors={colors} onDelete={() => deletePinnedNote(note.id)} onUpdate={(text) => updatePinnedNote(note.id, text)} />
              ))}
              {pinnedNotes.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>لا توجد ملاحظات ثابتة</div>}
              <NotesCalendarAddPinnedInput onAdd={addPinnedNote} colors={colors} />
            </div>
          </div>
        </div>
        )}
      </div>
      {showAddEvent && (
        <NotesCalendarAddEventModal colors={colors} onClose={() => setShowAddEvent(false)} onAdd={(ev) => { setEvents(prev => [...prev, { ...ev, id: `e${Date.now()}` }]); setShowAddEvent(false); }} />
      )}
    </div>
  );
}

// ============================================
// Phase 3 — Welcome Banner (User Onboarding)
// ============================================
const WelcomeBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeenBanner = storageFacade.getRaw(STORAGE_KEYS.UI_WELCOME);
    const tx = safeGet(KEYS.transactions, []);
    const comm = safeGet(KEYS.commissions, []);
    const hasData = tx.length > 0 || comm.length > 0;
    if (!hasSeenBanner && !hasData) setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    storageFacade.setRaw(STORAGE_KEYS.UI_WELCOME, 'true');
  };

  if (!show) return null;
  return (
    <div className="welcome-banner no-print" role="region" aria-label="ترحيب">
      <div className="banner-content">
        <div className="banner-text">
          <strong>مرحبًا بك في قيد العقار!</strong>
          <p>ابدأ بإضافة عقار، ثم سجّل الدخل والمصروفات، وسيتم احتساب التحليل المالي تلقائيًا.</p>
        </div>
        <button type="button" onClick={dismiss} className="banner-close" aria-label="إغلاق">×</button>
      </div>
    </div>
  );
};

// ============================================
// APP (Main Router)
// ============================================
const App = () => {
  const [page, setPage] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [letterType, setLetterType] = useState('intro');
  const [editDraft, setEditDraft] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Ensure seed data on first load
  useEffect(() => { dataStore.seed.ensureSeeded(); }, []);
  const [headerDateMode, setHeaderDateMode] = useState(getSavedDateHeader() || 'both');
  const [headerDateText, setHeaderDateText] = useState('');

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && showHelp) setShowHelp(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showHelp]);

  const updateHeaderDate = useCallback(() => {
    setHeaderDateText(formatDateHeader(new Date()));
  }, []);

  const scheduleHeaderDateMidnightRefresh = useCallback(() => {
    // Update once shortly after local midnight to reflect the new day.
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0); // 00:00:05 next day
    const ms = Math.max(5000, next.getTime() - now.getTime());
    const id = setTimeout(() => {
      updateHeaderDate();
      scheduleHeaderDateMidnightRefresh();
    }, ms);
    return () => clearTimeout(id);
  }, [updateHeaderDate]);

  // Phase 7.1: apply saved theme/numerals on load + initialize header date
  // Onboarding (first-run): show once if ui_onboarding_seen is not set
  useEffect(() => {
    initTheme();
    initNumerals();

    setShowOnboarding(!getOnboardingSeen());

    const datePref = (getSavedDateHeader() || 'both');
    setHeaderDateMode(datePref);

    if (datePref !== 'off') {
      updateHeaderDate();
    }

    const cancelMidnight = scheduleHeaderDateMidnightRefresh();
    const onNumerals = () => { if ((getSavedDateHeader() || 'both') !== 'off') updateHeaderDate(); };
    const onDateHeader = () => {
      const pref = (getSavedDateHeader() || 'both');
      setHeaderDateMode(pref);
      if (pref !== 'off') updateHeaderDate();
    };

    window.addEventListener('ui:numerals', onNumerals);
    window.addEventListener('ui:dateHeader', onDateHeader);

    return () => {
      window.removeEventListener('ui:numerals', onNumerals);
      window.removeEventListener('ui:dateHeader', onDateHeader);
      cancelMidnight && cancelMidnight();
    };
  }, [updateHeaderDate, scheduleHeaderDateMidnightRefresh]);
  // Phase 9.4: تحذير قبل المغادرة عند وجود تغييرات غير محفوظة
  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = 'لديك تغييرات غير محفوظة. هل تريد المغادرة؟'; return e.returnValue; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  if (SIMULATE_RENDER_ERROR) throw new Error('Phase 9.3 test error');

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage setPage={setPage}/>;
      case 'dashboard': return <DashboardPage/>;
      case 'transactions': return <TransactionsPage/>;
      case 'commissions': return <CommissionsPage/>;
      case 'ledgers': return <LedgersPage/>;
      case 'templates': return <TemplatesPage setPage={setPage} setLetterType={setLetterType}/>;
      case 'generator': return <GeneratorPage letterType={letterType} setLetterType={setLetterType}/>;
      case 'drafts': return <DraftsPage setPage={setPage} setLetterType={setLetterType} setEditDraft={setEditDraft}/>;
      case 'calendar': return <NotesCalendar mode="calendar"/>;
      case 'notes': return <NotesCalendar mode="notes"/>;
      case 'settings': return <SettingsPage onShowOnboarding={() => { try { storageFacade.removeRaw(UI_ONBOARDING_SEEN_KEY); } catch {} setShowOnboarding(true); }} />;
      default: return <HomePage setPage={setPage}/>;
    }
  };

  return (
    <ToastProvider>
      <UnsavedContext.Provider value={setDirty}>
        <TrustChecks/>
        <div className="app-shell flex min-h-screen">
          <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onOpenHelp={() => setShowHelp(true)}/>
          <main className="flex-1 min-w-0" id="main-content" role="main" aria-label="المحتوى الرئيسي">
            <Topbar page={page} setMobileOpen={setMobileOpen} headerDateText={headerDateMode !== 'off' ? headerDateText : ''}/>
            <div className="px-4 md:px-6 max-w-4xl mx-auto">
              {!showOnboarding && <WelcomeBanner/>}
            </div>

            {showOnboarding && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="مرحبًا بك">
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => { setOnboardingSeen(); setShowOnboarding(false); }} />
                <div className="relative w-full max-w-md rounded-2xl border p-5 shadow-lg" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold" style={{ margin: 0 }}>مرحبًا بك في قيد العقار</h3>
                      <p className="text-sm" style={{ margin: '0.5rem 0 0', color: 'var(--color-muted)' }}>ابدأ خلال دقيقة:</p>
                    </div>
                    <button type="button" className="text-sm" style={{ color: 'var(--color-muted)' }} aria-label="إغلاق" onClick={() => { setOnboardingSeen(); setShowOnboarding(false); }}>×</button>
                  </div>

                  <ul className="mt-4 text-sm space-y-2" style={{ paddingInlineStart: '1.2rem', margin: '1rem 0 0', color: 'var(--color-text)' }}>
                    <li>بياناتك تُحفظ محليًا داخل المتصفح.</li>
                    <li>ابدأ بإضافة أول حركة مالية من زر (إضافة).</li>
                    <li>يمكنك التصدير CSV في أي وقت.</li>
                  </ul>

                  <button type="button" className="mt-4 text-sm" style={{ color: 'var(--color-primary)', textAlign: 'start' }} onClick={() => {
                    setOnboardingSeen();
                    setShowOnboarding(false);
                    setPage('settings');
                    setTimeout(() => {
                      const el = document.querySelector('[aria-label="وضع العرض"]');
                      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}>
                    افتح الإعدادات
                  </button>

                  <div className="mt-4 flex flex-col gap-2">
                    <button type="button" className="btn-primary w-full" style={{ padding: '0.9rem 1rem', borderRadius: 'var(--radius)', background: 'var(--color-primary)', color: '#fff' }} onClick={() => { setOnboardingSeen(); setShowOnboarding(false); }}>
                      ابدأ الآن
                    </button>
                    <button type="button" className="w-full" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)' }} onClick={() => { setOnboardingSeen(); setShowOnboarding(false); }}>
                      لا تُظهر مرة أخرى
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="print-container">{renderPage()}</div>

            {showHelp && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="دليل سريع">
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setShowHelp(false)} />
                <div className="relative w-full max-w-lg rounded-2xl border p-5 shadow-lg" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)', maxHeight: '80vh', overflow: 'auto' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold" style={{ margin: 0 }}>دليل قيد العقار — سريعًا</h3>
                    </div>
                    <button type="button" className="text-sm" style={{ color: 'var(--color-muted)' }} aria-label="إغلاق" onClick={() => setShowHelp(false)}>×</button>
                  </div>

                  <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--color-text)' }}>
                    <div>
                      <div className="font-semibold">1) أين تُحفظ بياناتي؟</div>
                      <div style={{ color: 'var(--color-muted)' }}>تُحفظ محليًا داخل المتصفح على جهازك. لا نرفع بيانات للسحابة.</div>
                    </div>
                    <div>
                      <div className="font-semibold">2) كيف أبدأ؟</div>
                      <div style={{ color: 'var(--color-muted)' }}>أضف أول حركة مالية، ثم راجع الملخص بالأعلى.</div>
                    </div>
                    <div>
                      <div className="font-semibold">3) كيف أنسخ احتياطيًا؟</div>
                      <div style={{ color: 'var(--color-muted)' }}>من الإعدادات → "تنزيل نسخة احتياطية (JSON)".</div>
                    </div>
                    <div>
                      <div className="font-semibold">4) كيف أستعيد نسخة احتياطية؟</div>
                      <div style={{ color: 'var(--color-muted)' }}>من الإعدادات → "استعادة من نسخة احتياطية" ثم اختر الملف.</div>
                    </div>
                    <div>
                      <div className="font-semibold">5) هل التصدير CSV يغيّر الأرقام/التنسيق؟</div>
                      <div style={{ color: 'var(--color-muted)' }}>CSV يخرج “قيم خام” بدون تنسيق لغة، مناسب للإكسل.</div>
                    </div>
                    <div>
                      <div className="font-semibold">6) ماذا لو مسحت بيانات المتصفح؟</div>
                      <div style={{ color: 'var(--color-muted)' }}>قد تفقد بياناتك. استخدم النسخ الاحتياطي دوريًا.</div>
                    </div>
                    <div>
                      <div className="font-semibold">7) كيف أغيّر المظهر/الأرقام/التاريخ؟</div>
                      <div style={{ color: 'var(--color-muted)' }}>من الإعدادات: الثيم (نهاري/خافت/ليلي/حسب النظام) + عرض الأرقام + عرض التاريخ.</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} onClick={() => { setShowHelp(false); setPage('settings'); }}>
                      افتح الإعدادات
                    </button>
                    <button type="button" className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} onClick={() => {
                      setShowHelp(false);
                      setPage('settings');
                      setTimeout(() => {
                        const headings = Array.from(document.querySelectorAll('h3'));
                        const el = headings.find(h => (h.textContent || '').includes('النسخ الاحتياطي'));
                        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}>
                      فتح ملف النسخ الاحتياطي
                    </button>

                    <div className="mt-4 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
                      <div className="font-semibold text-sm">تحتاج مساعدة؟</div>
                      <a className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--color-primary)', color: '#fff', textDecoration: 'none' }} href="https://wa.me/966XXXXXXXXX" target="_blank" rel="noopener" aria-label="تواصل واتساب">
                        تواصل واتساب
                      </a>
                      <div className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                        TODO: ضع رقم واتساب بصيغة 966XXXXXXXXX
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          <footer className="no-print border-t border-gray-100 py-3 px-4 text-center text-sm text-gray-500" role="contentinfo">
            <p>&copy; {new Date().getFullYear()} قيد العقار. جميع الحقوق محفوظة.</p>
          </footer>
          </main>
        </div>
      </UnsavedContext.Provider>
    </ToastProvider>
  );
};

// ============================================
// ERROR BOUNDARY (Phase 9.3 — Global catch + recovery UI)
// ============================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState(prev => ({ ...prev, errorInfo }));
  }
  handleReload = () => { window.location.reload(); };
  handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    const text = [error && error.toString(), errorInfo && errorInfo.componentStack].filter(Boolean).join('\n\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => alert('تم نسخ التفاصيل'));
    } else {
      prompt('انسخ التفاصيل:', text);
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6" dir="rtl">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-gray-600 text-sm mb-6">يمكنك إعادة تحميل التطبيق أو نسخ تفاصيل الخطأ للمساعدة الفنية.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button type="button" onClick={this.handleReload} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700" aria-label="إعادة تحميل التطبيق">إعادة تحميل التطبيق</button>
              <button type="button" onClick={this.handleCopyDetails} className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50" aria-label="نسخ تفاصيل الخطأ">نسخ تفاصيل الخطأ</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default App;
