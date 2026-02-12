# Acceptance tests (Manual)

Use this checklist after each small change/commit.

## 1) Load & basic health
- Open: `finance-flow.html`
- ✅ Console: **0 errors**
- ✅ Network: **0 404** (CSS, images, scripts)

## 2) Core flow (LocalStorage)
- Go to **الحركات المالية**
- Add a new transaction (any amount + description)
- Edit it (change amount/description)
- Delete it
- Refresh the page
- ✅ Data persists correctly (except deleted items)

## 3) Mobile / RTL
- Test on a phone viewport
- ✅ RTL looks correct (alignment, sidebar/menu, tables)
- ✅ No broken overlays

## 4) Theme persistence
- Go to Settings → Theme
- Switch between **light / dim / dark**
- Refresh
- ✅ Selected theme remains after refresh

## Notes
- This app is static; there is no server state.
- Avoid testing via `file://`; use an HTTP server.
