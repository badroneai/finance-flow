# Theme system (Design Tokens + Themes)

This project is shipped as static HTML on GitHub Pages.

## Files
- **Tokens + themes:** `assets/css/theme.tokens.css`
  - Defines semantic tokens (e.g., `--color-bg`, `--color-surface`, `--color-text`, ...)
  - Defines theme variants using:
    - `:root[data-theme="light"] { ... }`
    - `:root[data-theme="dim"] { ... }`
    - `:root[data-theme="dark"] { ... }`
- **App styles:** `assets/css/app.css`
  - Contains UI CSS extracted from `finance-flow.html`.
  - Includes a small mapping layer that maps common Tailwind utility color classes (e.g. `bg-white`, `bg-gray-50`, `text-gray-900`, `border-gray-200`) to tokens when `html[data-theme]` is present.

## How themes are applied
Themes are applied on the `<html>` element only:

```js
document.documentElement.dataset.theme = "light" | "dim" | "dark";
```

### Persistence
User choice is stored in LocalStorage under a single key:
- `ui_theme` (values: `light | dim | dark`)

On load:
- If `ui_theme` exists → it is applied.
- Otherwise, the app uses `prefers-color-scheme` to choose `dark` or `light` as a default.

## Where UI control lives
The theme selector is shown in the existing **Settings** page in `finance-flow.html`.

## Constraints / rules
- **No financial logic changes**: theme system must not touch transactions/commissions/drafts logic.
- **One key only** for UI theme persistence: `ui_theme`.
- Keep all paths **relative** for GitHub Pages + custom domain compatibility.

## Manual testing checklist (quick)
1) Open: `finance-flow.html`
2) Go to Settings → Theme → switch between Light/Dim/Dark
3) Refresh and verify the theme persists
4) Check DevTools:
   - Console: no errors
   - Network: no 404
