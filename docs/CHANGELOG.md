# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### UI refactor / theming
- **Phase A+B**: Extracted inline CSS from `finance-flow.html` into `assets/css/app.css` and linked CSS files from HTML.
- **B+1**: Added real design tokens in `assets/css/theme.tokens.css` (semantic CSS variables).
- **B+2**: Updated `assets/css/app.css` to use design tokens for **colors/borders/focus only**.
- **B+3**: Added theme variants (light/dim/dark) using `html[data-theme]` + persistence via LocalStorage key `ui_theme`.

### Hotfixes
- Added `favicon.png` to eliminate a 404 request.
- Ensured themes are visually applied by mapping common utility color classes to design tokens.
- Refined the navy dark palette (dark/dim) for better readability.
