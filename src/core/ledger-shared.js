/*
  Ledger Shared — دوال مشتركة بين ملفات core/ الخاصة بالدفاتر.

  هذا الملف يوحّد الدوال المكررة عبر:
  - ledger-health.js
  - ledger-planner.js
  - ledger-budget-authority.js
  - ledger-item-history.js

  القاعدة: لا React، لا side effects، pure functions فقط.
*/

// ==================== Date Helpers ====================

/**
 * تحويل سلسلة تاريخ (YYYY-MM-DD) إلى timestamp بالمللي ثانية.
 * يضيف T00:00:00 لتجنب مشاكل المنطقة الزمنية مع التواريخ.
 * @param {string} dateStr — تاريخ بصيغة YYYY-MM-DD
 * @returns {number|null}
 */
export const toDateOnlyMs = (dateStr) => {
  const s = String(dateStr || '').trim();
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
};

/**
 * تحويل سلسلة ISO كاملة إلى timestamp بالمللي ثانية.
 * يستخدم مع timestamps كاملة (مثل من history entries).
 * @param {string} iso — timestamp بصيغة ISO
 * @returns {number|null}
 */
export const toIsoMs = (iso) => {
  const s = String(iso || '').trim();
  if (!s) return null;
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? null : ms;
};

/**
 * بداية اليوم (منتصف الليل) بالمللي ثانية.
 * @param {Date} [d=new Date()]
 * @returns {number}
 */
export const startOfDayMs = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

// ==================== Math Helpers ====================

/**
 * تقييد قيمة بين حد أدنى وأقصى.
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * مضاعف التكرار السنوي — عدد مرات الدفع في السنة.
 * يدعم: weekly(52), monthly(12), quarterly(4), semiannual(2), yearly(1), adhoc(0).
 * @param {string} freq
 * @returns {number}
 */
export const freqMultiplier = (freq) => {
  const f = String(freq || '').toLowerCase();
  if (f === 'weekly') return 52;
  if (f === 'monthly') return 12;
  if (f === 'quarterly') return 4;
  if (f === 'semiannual' || f === 'semi-annually') return 2;
  if (f === 'yearly' || f === 'annual') return 1;
  if (f === 'adhoc') return 0;
  return 0;
};

/**
 * المكافئ الشهري لبند متكرر (amount × freqMultiplier / 12).
 * @param {object} r — بند متكرر { amount, frequency }
 * @returns {number}
 */
export const monthlyEquivalent = (r) => {
  const amt = Number(r?.amount) || 0;
  if (amt <= 0) return 0;
  const m = freqMultiplier(r?.frequency);
  if (m <= 0) return 0;
  return (amt * m) / 12;
};

// ==================== Category Normalization ====================

/**
 * توحيد التصنيف — يُرجع 'other' للقيم غير المعروفة.
 * ملاحظة: recurring-intelligence.js لها نسختها الخاصة التي تُرجع '' (وهذا مقصود).
 * @param {string} c
 * @returns {string}
 */
export const normalizeCategoryToOther = (c) => {
  const x = String(c || '').toLowerCase();
  return x === 'system' || x === 'operational' || x === 'maintenance' || x === 'marketing'
    ? x
    : 'other';
};

// ==================== Classification Helpers ====================

/**
 * هل البند يشبه الإيجار؟ (فحص شامل: saHint + title + category).
 * توحيد isRentLikeIntel + isRentLikeBrain + isRentLike من planner.
 * @param {object} r — بند متكرر
 * @returns {boolean}
 */
export const isRentLike = (r) => {
  const hint = String(r?.saHint || '').toLowerCase();
  if (hint.includes('إيجار') || hint.includes('ايجار')) return true;
  const title = String(r?.title || '').toLowerCase();
  if (title.includes('إيجار') || title.includes('ايجار')) return true;
  const cat = String(r?.category || '').toLowerCase();
  return cat === 'operational' && (hint.includes('rent') || hint.includes('lease'));
};

/**
 * هل البند يشبه المرافق (كهرباء/ماء/اتصالات)؟
 * توحيد isBillsLike + isUtilitiesLike.
 * @param {object} r — بند متكرر
 * @returns {boolean}
 */
export const isUtilitiesLike = (r) => {
  const hint = String(r?.saHint || '').toLowerCase();
  const title = String(r?.title || '').toLowerCase();
  return (
    hint.includes('كهرب') ||
    hint.includes('ماء') ||
    hint.includes('اتصال') ||
    hint.includes('إنترنت') ||
    hint.includes('انترنت') ||
    hint.includes('هاتف') ||
    title.includes('كهرب') ||
    title.includes('ماء') ||
    title.includes('اتصال') ||
    title.includes('إنترنت') ||
    title.includes('انترنت') ||
    title.includes('هاتف')
  );
};

/**
 * هل البند يشبه الصيانة؟
 * @param {object} r — بند متكرر
 * @returns {boolean}
 */
export const isMaintenanceLike = (r) => {
  const cat = String(r?.category || '').toLowerCase();
  return cat === 'maintenance';
};
