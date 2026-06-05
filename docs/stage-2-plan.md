# Stage 2 Plan — ESM Modules (قيد العقار / Finance Flow)

> **Scope of this PR:** خطة فقط (docs-only). **لا يوجد أي تغيير كود**.

## 0) Goal (What Stage 2 must achieve)
- الانتقال **تدريجيًا** من globals (مثل `window.QA`, `window.STORAGE_KEYS`, `window.storage`, `window.FF_UI`) إلى **ES Modules (ESM)** عبر imports/exports.
- المحافظة على سلوك التطبيق 100% بدون تغيير UI/Routes أو أي منطق مالي أو Schema LocalStorage.
- كل تغيير في Stage 2 سيكون عبر PR صغير جدًا: **هدف واحد + commit واحد**.

## 1) Target Architecture (ESM)
### 1.1 Modules boundaries (المستهدف)
- `assets/js/core/keys.js`  → **ESM** يصدّر `STORAGE_KEYS` (named export).
- `assets/js/core/storage.js` → **ESM** يصدّر `storage` (named export) ويستورد `STORAGE_KEYS`.
- `assets/js/core/formatters.js` → **ESM** يصدّر `formatters` (named export).
- UI modules (مثل sidebar/modals) → **ESM exports** بدل `window.FF_UI`.
- `src/main.jsx` (Vite entry) هو نقطة التحميل الوحيدة للـReact app، ويستورد ما يلزم من modules.

### 1.2 What remains (temporarily)
- **لا نستخدم Babel-in-browser** في `finance-flow.html` بعد Stage 1.
- **لن نرجع** لاستخدام `<script type="text/babel">`.
- يمكن الإبقاء مؤقتًا على بعض الـglobals كـcompat layer خلال التحويل (واحد فقط لكل PR حسب المنهج).

## 2) Final Load Order (after Stage 2)
### 2.1 finance-flow.html
- يبقى:
  - CSS links
  - `<div id="root"></div>`
  - `<script type="module" src="/src/main.jsx"></script>`
- **لا توجد** scripts إضافية للـcore داخل HTML (keys/storage/formatters/bootstrap تُستورد من `src/main.jsx`).

### 2.2 src/main.jsx (final target)
Order:
1) Import core modules (keys → storage → formatters → bootstrap/init).
2) Render React app (`createRoot(...).render(<App />)`).

## 3) Globals → Modules migration list (strict order)
> **قاعدة Stage 2:** كل PR يحوّل **global واحد فقط**.

PR sequence (proposed):
1) **Global #1:** `window.STORAGE_KEYS` → `export const STORAGE_KEYS` + (temporary) keep window assignment behind a small compat line (until all call sites moved).
2) **Global #2:** `window.storage` → `export const storage` + (temporary) window alias.
3) **Global #3:** `window.QA.formatters` → `export const formatters` + (temporary) window alias.
4) **Global #4:** `window.FF_UI` → ESM exports from `assets/js/ui/*` + update imports at call sites.
5) **Global #5 (cleanup PRs):** remove each temporary window alias **one per PR** (still counts as that global’s PR).

Notes:
- إذا احتجنا تحويل call sites، يتم ذلك فقط بما يلزم لتحقيق نفس السلوك.
- ممنوع تغيير أي منطق مالي/حسابات/Parsing.

## 4) Stop conditions (strict)
أي واحد من التالي = **STOP** داخل نفس PR (بدون فتح Stage جديد) حتى الإصلاح أو رفع تقرير:
- Console: أي error جديد (0 errors شرط).
- Network: أي 404 على نفس الأصل (0 404 شرط).
- Regression في Gate الأساسي (CRUD/Backup/Settings persistence).

## 5) Gate for every Stage 2 PR
- Console: **0 errors**
- Network: **0 404 (same-origin)**
- Minimal regression spot-check (حسب التغيير):
  - فتح التطبيق + تنقل صفحة/صفحتين + persistence للـsettings ذات الصلة.

## 6) Deliverables format after each Stage 2 PR
بعد كل PR (غير هذا الـPlan PR):
- رابط PR
- رابط commit
- نتيجة Gate (PASS/FAIL + ماذا اختُبر)
- "ماذا تغير بالضبط" في **5 سطور**
- ثم **توقف** لحين موافقتك.
