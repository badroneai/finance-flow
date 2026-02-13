/*
  قيد العقار (Finance Flow)
  Stage 2.2 — core/qa.js (ESM)

  الهدف:
  - توفير واجهة QA عبر ESM (بدون تغيير سلوك).
  - للتوافق المؤقت: يتم ربطها على window.QA من finance-flow.html (بـ ||).

  ملاحظة:
  - Stage 2 حالياً: ESM لغير JSX فقط.
*/

import * as formatters from './formatters.js';

export const QA = {
  formatters,
};

export { formatters };
