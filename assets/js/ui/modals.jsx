/*
  قيد العقار (Finance Flow)
  Stage 5 (Fix) — ui/modals.jsx

  الهدف:
  - تمكين استخراج JSX لمودالات UI إلى ملفات خارجية بدون Build step.
  - بدون import/export: نعتمد على window.FF_UI كـ global registry.
  - في هذا الـcommit: نجهّز registry فقط (بدون تغيير سلوكي).

  التحميل:
  <script type="text/babel" src="assets/js/ui/modals.jsx"></script>
*/

window.FF_UI = window.FF_UI || {};

// سيتم نقل المودالات (Help/Onboarding) هنا في Commit لاحق ضمن Stage 5.
// نترك تعريفات جاهزة حتى لا نعطل أي wiring.
window.FF_UI.HelpModal = window.FF_UI.HelpModal || null;
window.FF_UI.OnboardingModal = window.FF_UI.OnboardingModal || null;
