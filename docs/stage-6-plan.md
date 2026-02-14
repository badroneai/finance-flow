# Stage 6 — Refactor Plan (1:1, No Behavior Change)

> **Stage type:** Organized refactor only (Copy 1:1)
>
> **Golden rule:**
> - No UI changes
> - No output/result changes
> - No LocalStorage keys changes
> - No backup schema change (**schema=1 stays**)
> - No changes to transactions/commissions logic
> - No new libraries
>
> Refactor only: move code without altering behavior.

---

## 1) Scope

### Goal
Extract the **Ledger tabs UI blocks** from `src/App.jsx` into dedicated components under `src/tabs/*`.

### In-scope (Stage 6.1)
Create these components and move the existing JSX blocks **1:1**:
- `src/tabs/LedgerRecurringTab.jsx`
- `src/tabs/LedgerInboxTab.jsx`
- `src/tabs/LedgerForecastTab.jsx`
- `src/tabs/LedgerPerformanceTab.jsx`
- `src/tabs/LedgerReportsTab.jsx`

Then in `App.jsx`:
- Import these components
- Render them based on the current `tab`
- Pass the same state/props/handlers currently used by the JSX blocks

---

## 2) Non-goals (Strict)

The following are explicitly forbidden in Stage 6:
- Any new features
- Any UI redesign (including spacing, labels, new buttons, new sections)
- Any changes to business logic, calculations, or conditionals
- Any state renaming or state reshaping
- Any LocalStorage key additions/changes
- Any backup schema modifications (must remain `schema=1`)
- Any changes to transactions / commissions logic
- Any new dependencies

---

## 3) Target structure

```
src/
  tabs/
    LedgerRecurringTab.jsx
    LedgerInboxTab.jsx
    LedgerForecastTab.jsx
    LedgerPerformanceTab.jsx
    LedgerReportsTab.jsx
```

Notes:
- These files are **render components only**.
- No new shared utilities unless already present.

---

## 4) Rules of refactor (Copy 1:1)

1) **Move render blocks exactly 1:1**
- Copy the existing JSX from `App.jsx` into the new component.
- Do not change markup, strings, logic, or conditions.

2) **Same props/state**
- Pass the exact values currently in scope.
- Do not rename state variables or handlers.

3) **No behavioral edits**
- No changes to `if/else`, ternaries, filters, sorting, computed values.

4) **Imports only**
- The ledger tabs must be used via ES module imports.
- No `window.*` globals.

---

## 5) Gate checklist (must pass)

### Build
- `npm run build` succeeds.

### Runtime sanity
- Console: **0 errors**
- Network: **0 same-origin 404**

### Functional smoke (no regression)
- Recurring: seed + wizard + pay-now OK
- Inbox: paid/skipped persist after refresh
- CSV export: file non-empty
- Backup/Restore: schema=1 OK, restore brings data back
- Mobile sanity: no overflow; sidebar open/close OK

---

## 6) Stop conditions

Stop and do not merge if any of the following occurs:
- Any functional behavior difference is observed
- Any UI change is introduced (even minor)
- Any LocalStorage key or backup schema is touched
- Console errors or same-origin 404 appear

If a blocker is discovered: pause and report it explicitly.
