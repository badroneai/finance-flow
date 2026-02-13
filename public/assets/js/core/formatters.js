/*
  قيد العقار (Finance Flow)
  Stage 4 — core/formatters.js

  الهدف:
  - تجميع دوال التنسيق (أرقام/عملة/نسب/تاريخ) في Module مستقل.
  - بدون تغيير سلوك أو مخرجات.

  ملاحظة:
  - نستخدم getter لحالة الأرقام (ar/en) عبر window.__uiNumeralsMode (إن وجد)
    أو localStorage (ui_numerals) كـ fallback.
*/

import { STORAGE_KEYS } from './keys.js';

export function getSavedNumerals() {
  try {
    return localStorage.getItem(STORAGE_KEYS.UI_NUMERALS);
  } catch {
    return null;
  }
}

export function getNumeralsMode() {
  // Prefer runtime override when available (keeps behavior consistent)
  if (typeof window !== 'undefined' && window.__uiNumeralsMode) return window.__uiNumeralsMode;
  return getSavedNumerals() || 'ar';
}

export function getNumeralLocale(mode = getNumeralsMode()) {
  return (mode === 'en') ? 'en-US' : 'ar-SA';
}

export function formatNumber(value, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const locale = getNumeralLocale();
  const opts = { ...options };
  return new Intl.NumberFormat(locale, opts).format(n);
}

export function formatCurrency(value) {
  return `${formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ر.س`;
}

export function formatPercent(value) {
  return `${formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
}

// ---------- Date helpers (pure-ish, no UI/state mutations) ----------

export function getGregorianLocale(mode = getNumeralsMode()) {
  // Force Gregorian calendar for "greg" mode on iOS/Safari
  return mode === 'en' ? 'en-US-u-ca-gregory' : 'ar-SA-u-ca-gregory';
}

export function getHijriLocale(mode = getNumeralsMode()) {
  return mode === 'en' ? 'en-US-u-ca-islamic' : 'ar-SA-u-ca-islamic';
}

export function normalizeHijriSuffix(s) {
  if (!s) return '';
  // Prevent duplicated suffix
  return s.replace(/\s*هـ\s*$/g, '').trim();
}

export function formatHeaderDateText(d, mode = 'both') {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const numeralsMode = getNumeralsMode();
  const localeGreg = getGregorianLocale(numeralsMode);
  const localeHijri = getHijriLocale(numeralsMode);

  const greg = new Intl.DateTimeFormat(localeGreg, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const hijriRaw = new Intl.DateTimeFormat(localeHijri, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const hijri = normalizeHijriSuffix(hijriRaw) + ' هـ';

  if (mode === 'greg') return greg;
  if (mode === 'hijri') return hijri;
  if (mode === 'off') return '';
  return `${greg} — ${hijri}`;
}
