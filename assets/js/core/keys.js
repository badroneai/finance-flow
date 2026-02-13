/*
  قيد العقار (Finance Flow)
  Stage 2 — core/keys.js

  الهدف:
  - توحيد مفاتيح التخزين (LocalStorage) في مكان واحد.
  - لا تغيير في القيم أو الأسماء.
*/

export const STORAGE_KEYS = {
  // Financial
  TRANSACTIONS: 'ff_transactions',
  COMMISSIONS: 'ff_commissions',
  DRAFTS: 'ff_drafts',
  SETTINGS: 'ff_settings',
  SEEDED: 'ff_seeded',

  // UI
  UI_THEME: 'ui_theme',
  UI_NUMERALS: 'ui_numerals',
  UI_DATE_HEADER: 'ui_date_header',
  UI_ONBOARDING: 'ui_onboarding_seen',
  UI_WELCOME: 'hasSeenWelcomeBanner',
};
