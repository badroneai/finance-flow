/*
  قيد العقار (Finance Flow)
  Stage 1/4 — Bootstrap entrypoint

  الهدف:
  - نقطة تحميل Modules بشكل تدريجي بدون تغيير سلوك.
  - في هذه المرحلة نُحمّل formatters ونكشفها على window.QA.
*/

import * as formatters from './core/formatters.js';

window.QA = window.QA || {};
window.QA.formatters = window.QA.formatters || formatters;
