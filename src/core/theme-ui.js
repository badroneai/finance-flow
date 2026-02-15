/*
  قيد العقار — ثيم الواجهة، الأرقام، رأس التاريخ، الترحيب (مستخرج من App.jsx)
*/

import { storageFacade } from './storage-facade.js';
import { STORAGE_KEYS } from '../../assets/js/core/keys.js';

export const UI_THEME_KEY = STORAGE_KEYS.UI_THEME;
export const UI_NUMERALS_KEY = STORAGE_KEYS.UI_NUMERALS;
export const UI_DATE_HEADER_KEY = STORAGE_KEYS.UI_DATE_HEADER;
export const UI_ONBOARDING_SEEN_KEY = STORAGE_KEYS.UI_ONBOARDING;

// مصدر الحقيقة في الذاكرة لوضع الأرقام (عرض فقط)
let __uiNumeralsMode = null;
try {
  window.__uiNumeralsMode = __uiNumeralsMode;
} catch {}

let __themeSystemMql = null;
let __themeSystemListener = null;

export const getSavedTheme = () => {
  try {
    const t = storageFacade.getRaw(UI_THEME_KEY);
    return (t === 'system' || t === 'light' || t === 'dim' || t === 'dark') ? t : null;
  } catch {
    return null;
  }
};

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
      document.documentElement.dataset.theme = getEffectiveSystemTheme();
    };
    if (__themeSystemMql.addEventListener) __themeSystemMql.addEventListener('change', __themeSystemListener);
    else if (__themeSystemMql.addListener) __themeSystemMql.addListener(__themeSystemListener);
  } catch {}
};

const stopSystemThemeListener = () => {
  try {
    if (!__themeSystemMql || !__themeSystemListener) return;
    if (__themeSystemMql.removeEventListener) __themeSystemMql.removeEventListener('change', __themeSystemListener);
    else if (__themeSystemMql.removeListener) __themeSystemMql.removeListener(__themeSystemListener);
  } catch {} finally {
    __themeSystemMql = null;
    __themeSystemListener = null;
  }
};

export const applyTheme = (theme) => {
  const t = (theme === 'system' || theme === 'light' || theme === 'dim' || theme === 'dark') ? theme : 'system';
  if (t === 'system') startSystemThemeListener();
  else stopSystemThemeListener();
  const effective = (t === 'system') ? getEffectiveSystemTheme() : t;
  document.documentElement.dataset.theme = effective;
  try {
    storageFacade.setRaw(UI_THEME_KEY, t);
  } catch {}
};

export const initTheme = () => {
  try {
    if (document.body && document.body.dataset && document.body.dataset.theme) delete document.body.dataset.theme;
  } catch {}
  const saved = getSavedTheme();
  const t = saved || 'system';
  applyTheme(t);
  return t;
};

export const getSavedNumerals = () => {
  try {
    const n = storageFacade.getRaw(UI_NUMERALS_KEY);
    return (n === 'ar' || n === 'en') ? n : null;
  } catch {
    return null;
  }
};

export const getSavedDateHeader = () => {
  try {
    const v = storageFacade.getRaw(UI_DATE_HEADER_KEY);
    if (v === 'on') return 'both';
    if (v === 'off') return 'off';
    return (v === 'off' || v === 'greg' || v === 'hijri' || v === 'both') ? v : null;
  } catch {
    return null;
  }
};

export const setDateHeaderPref = (value) => {
  const v = (value === 'off' || value === 'greg' || value === 'hijri' || value === 'both') ? value : 'both';
  try {
    storageFacade.setRaw(UI_DATE_HEADER_KEY, v);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('ui:dateHeader'));
  } catch {}
};

export const getOnboardingSeen = () => {
  try {
    return storageFacade.getRaw(UI_ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

export const setOnboardingSeen = () => {
  try {
    storageFacade.setRaw(UI_ONBOARDING_SEEN_KEY, '1');
  } catch {}
};

export const applyNumerals = (mode) => {
  const m = (mode === 'ar' || mode === 'en') ? mode : 'ar';
  __uiNumeralsMode = m;
  try {
    window.__uiNumeralsMode = __uiNumeralsMode;
  } catch {}
  document.documentElement.dataset.numerals = m;
  try {
    storageFacade.setRaw(UI_NUMERALS_KEY, m);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('ui:numerals'));
  } catch {}
};

export const initNumerals = () => {
  const saved = getSavedNumerals();
  if (saved) {
    applyNumerals(saved);
    return saved;
  }
  __uiNumeralsMode = 'ar';
  document.documentElement.dataset.numerals = 'ar';
  return 'ar';
};

/** يُستخدم من format.js و dateFormat.js لمعرفة الوضع الحالي للأرقام */
export const getNumeralsMode = () => __uiNumeralsMode || getSavedNumerals() || 'ar';

export default {
  getSavedTheme,
  applyTheme,
  initTheme,
  getSavedNumerals,
  applyNumerals,
  initNumerals,
  getSavedDateHeader,
  setDateHeaderPref,
  getOnboardingSeen,
  setOnboardingSeen,
  getNumeralsMode,
};
