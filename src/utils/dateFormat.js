/*
  قيد العقار — دوال تنسيق التاريخ (ميلادي + هجري، مع احترام ui_numerals) مستخرجة من App.jsx
*/

import { getNumeralsMode, getSavedDateHeader } from '../core/theme-ui.js';

/** تطبيع لاحقة الهجري: إزالة تكرار هـ وضمان وجودها مرة واحدة في النهاية فقط */
export const normalizeHijriSuffix = (str) => {
  if (!str || typeof str !== 'string') return str;
  let s = str.trim().replace(/\s*هـ+\s*$/g, '').replace(/هـ\s*هـ/g, 'هـ').trim();
  return s ? `${s} هـ` : '';
};

/** Build locale with Unicode extensions safely */
export const buildLocale = ({ base = 'ar-SA', ca = null, nu = null }) => {
  const parts = [];
  if (ca) parts.push(`ca-${ca}`);
  if (nu) parts.push(`nu-${nu}`);
  return parts.length ? `${base}-u-${parts.join('-')}` : base;
};

export const getLocaleForNumerals = () => {
  const mode = getNumeralsMode();
  return mode === 'en' ? buildLocale({ base: 'ar-SA', nu: 'latn' }) : 'ar-SA';
};

export const getGregorianLocale = (mode) => {
  const nu = mode === 'en' ? 'latn' : null;
  const candidates = [
    buildLocale({ base: 'ar-SA', ca: 'gregory', nu }),
    buildLocale({ base: 'ar-SA', ca: 'gregorian', nu }),
  ];
  for (const loc of candidates) {
    try {
      new Intl.DateTimeFormat(loc, { year: 'numeric' });
      return loc;
    } catch {}
  }
  return buildLocale({ base: 'ar-SA', ca: 'gregory', nu });
};

export const getHijriLocale = (mode) => {
  const nu = mode === 'en' ? 'latn' : null;
  const candidates = [
    buildLocale({ base: 'ar-SA', ca: 'islamic-umalqura', nu }),
    buildLocale({ base: 'ar-SA', ca: 'islamic', nu }),
  ];
  for (const loc of candidates) {
    try {
      new Intl.DateTimeFormat(loc, { year: 'numeric' });
      return loc;
    } catch {}
  }
  return buildLocale({ base: 'ar-SA', ca: 'islamic', nu });
};

/** يعرض التاريخ للهيدر حسب الوضع: off|greg|hijri|both */
export const formatDateHeader = (date, modeOverride = null) => {
  const d = date instanceof Date ? date : (date ? new Date(date) : null);
  if (!d || Number.isNaN(d.getTime())) return '';
  const headerMode = modeOverride || getSavedDateHeader() || 'both';
  if (headerMode === 'off') return '';
  const numeralsMode = getNumeralsMode();
  const localeGreg = getGregorianLocale(numeralsMode);
  const greg = new Intl.DateTimeFormat(localeGreg, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const localeHijri = getHijriLocale(numeralsMode);
  const hijriRaw = new Intl.DateTimeFormat(localeHijri, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const hijri = normalizeHijriSuffix(hijriRaw) || (hijriRaw.trim() + ' هـ');
  if (headerMode === 'greg') return greg;
  if (headerMode === 'hijri') return hijri;
  return `${greg} — ${hijri}`;
};

export const formatDateGregorianNumeric = (date) => {
  const d = date instanceof Date ? date : (date ? new Date(date) : null);
  if (!d || Number.isNaN(d.getTime())) return '';
  const numeralsMode = getNumeralsMode();
  const localeGreg = getGregorianLocale(numeralsMode);
  return new Intl.DateTimeFormat(localeGreg, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};

export const formatDateHijriNumeric = (date) => {
  const d = date instanceof Date ? date : (date ? new Date(date) : null);
  if (!d || Number.isNaN(d.getTime())) return '';
  const mode = getNumeralsMode();
  const localeHijri = getHijriLocale(mode);
  const raw = new Intl.DateTimeFormat(localeHijri, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  return normalizeHijriSuffix(raw) || (raw.trim() + ' هـ');
};

export default {
  normalizeHijriSuffix,
  buildLocale,
  getLocaleForNumerals,
  getGregorianLocale,
  getHijriLocale,
  formatDateHeader,
  formatDateGregorianNumeric,
  formatDateHijriNumeric,
};
