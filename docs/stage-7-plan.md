# Stage 7 — Institutional Hardening (Regression Hardening)

> **Stage type:** Institutional quality / Stability hardening (no user-visible change)
>
> **Golden rule (strict):**
> - ❌ No UI/UX/Flow changes (unless confirmed bug fix)
> - ❌ No changes to transactions/commissions business logic
> - ❌ No new LocalStorage keys
> - ❌ No backup schema change (**schema=1 ثابت**)
> - ❌ No new libraries / dependencies
> - ✅ Backwards-compatible only

---

## 1) Scope (الهدف)
رفع “مؤسسية” المشروع عبر تقليل احتمالات regressions بعد أي refactor، خصوصًا مشاكل runtime مثل:
- متغيرات/Handlers غير معرّفة (undefined / missing bindings)
- Drift في prop-contract بين App ↔ Tabs
- أخطاء import/export أو مسارات غير ثابتة
- كسر مسارات حرجة (CSV / pay-now / inbox persist / backup-restore)
- مشاكل الكاش بعد النشر (stale bundles)

**Deliverables (Stage 7):**
- Contract guards خفيفة (dev-friendly، production-safe)
- Ledger Tabs contract assertions في نقطة التجميع
- Stable exports map لتقليل فوضى الاستيرادات
- Smoke gate runbook واضح وسريع + release runbook (cache + verification)
- Regression shields للـempty states + pay-now pipeline guards (بدون تغيير UI الأساسي)

---

## 2) Non-goals (ممنوع)
- أي redesign أو تحسينات شكل/تجربة مستخدم.
- إضافة Features جديدة.
- تغيير سلوك الحسابات المالية أو تصنيفاتها.
- تغيير/إضافة مفاتيح LocalStorage.
- تغيير backup schema (يبقى `schema=1`).

---

## 3) Risks we are explicitly addressing
1) **Runtime undefined / missing bindings**
   - مثال: `pricingList/applyQuickPricing/submitPayNow/sections` بعد Stage 6 extraction.
2) **Stale exports / import path drift**
   - استيراد من مسارات مختلفة يسبب صعوبة صيانة وكسر مفاجئ.
3) **Prop-contract drift**
   - Tab يعتمد على قيم لم تعد تُمرر من App.
4) **CSV break**
   - زر/وظيفة تصدير تعود فارغة أو تتعطل.
5) **Pay-now break**
   - زر موجود لكن المودال/التسجيل لا يعمل أو لا يربط meta.ledgerId.
6) **Inbox persist break**
   - paid/skipped لا يثبت بعد refresh.
7) **Cache / deployment mismatch**
   - المستخدم يعلق على bundle قديم بعد النشر ويظن أن الإصلاح لم يصل.

---

## 4) Stability Contracts (Invariants)
هذه invariants يجب أن تبقى صحيحة دائمًا (Stage 7 يضيف “حماية” لها):

### Runtime invariants
- App لا ينهار بسبب `ReferenceError` أو `TypeError` عند التنقل بين الصفحات.
- Console: **0 errors** (warnings مقبولة إذا ليست breaking).
- Network: **0 same-origin 404**.

### Data invariants
- LocalStorage keys: **لا جديد**.
- Backup envelope: `schema=1` ثابت.
- Transactions/commissions logic: unchanged.

### Ledger invariants
- تفعيل دفتر نشط + refresh لا يفقده.
- Recurring seed/wizard/pay-now تعمل ولا تغيّر منطق transactions.
- أي حركة created عبر pay-now تحمل `tx.meta.ledgerId`.
- Inbox paid/skipped persist بعد refresh.
- CSV export ينتج ملف **غير فارغ**.

---

## 5) PR breakdown (Stage 7)

### PR-7A — Docs-only (إجباري أولًا)
- Add: `docs/stage-7-plan.md` (هذا الملف)
- Gate: Console 0 errors + Network 0 same-origin 404 (smoke سريع على الإنتاج)

### PR-7B — Runtime Contracts Pack (Institutional Pack v1)
**PR واحد (≤6 commits)** — لا UI.
1) `src/core/contracts.js`
   - `invariant(condition, message, context?)`
   - `assertFn(fn, name)`
   - `assertObj(obj, name)`
   - `assertArr(arr, name)`
   - Production-safe: لا تسبب crashes غير ضرورية.
   - Dev: رسائل واضحة لتشخيص regression.
2) Ledger Tabs Contract assertions
   - في نقطة التجميع (App/Ledger shell): asserts على props اللي تسببت سابقًا في undefined.
3) `src/core/exports-map.js`
   - Single source of truth لتصدير core modules المهمة.
   - تحويل imports تدريجيًا (بدون كسر).
4) Docs:
   - `docs/gate-smoke.md` (12 خطوة قصيرة copy/paste)
   - `docs/runbook-release.md` (release آمن + cache busting)

### PR-7C — Regression Shields (Institutional Pack v2)
**PR واحد (≤6 commits)** — لا UI redesign.
- Harden empty states في كل Tab: عند نقص البيانات → رسالة داخل tab بدل crash.
- Harden pay-now pipeline:
  - إذا غير مسعّر → يمنع الإنشاء مع سبب واضح.
  - إذا ledgerId مفقود → يمنع مع error friendly.
- Cache busting safety: توثيق خطوات hard refresh في runbook.

---

## 6) Gate checklist (Stage 7)

### Gate (Docs-only PR-7A)
- Console: **0 errors**
- Network: **0 same-origin 404**

### Gate (PR-7B / PR-7C)
- Console: **0 errors**
- Network: **0 same-origin 404**
- Ledgers: add/edit/set-active + refresh
- Recurring: seed + wizard + pay-now
- Inbox: paid/skipped persist + refresh
- CSV export: file non-empty (**2 exports**) 
- Backup/Restore schema=1: export → clear → restore → sanity
- Mobile sanity: sidebar + tabs scroll بدون overflow
- Pages run: success

---

## 7) Stop conditions
- أي تغيير سلوكي للمستخدم غير مبرر.
- أي تغيير على schema أو LocalStorage keys.
- أي console error جديد.
- أي same-origin 404.
- أي كسر في pay-now / inbox persist / CSV / backup-restore.

---

## 8) Output format بعد كل PR
- PR link
- Commits list (≤6)
- Gate status (مختصر)
- Merge commit + Pages run
- **10 سطور فقط**: “ما تغيّر للمستخدم؟” (يجب أن تكون: لا شيء)
