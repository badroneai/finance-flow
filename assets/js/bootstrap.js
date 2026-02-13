/*
  قيد العقار (Finance Flow)
  Stage 1 — Bootstrap entrypoint

  الهدف:
  - نقطة تشغيل JS بسيطة (بدون تغيير سلوك) تمهيدًا لفصل الكود إلى Modules لاحقًا.
  - في هذه المرحلة لا يتم نقل أي منطق مالي أو UI.
*/

// Minimal, non-behavioral bootstrap marker
window.QA = window.QA || {};
console.debug('[QA] bootstrap loaded');
