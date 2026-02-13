import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

import { ensureDefaultLedger } from './core/ledger-store.js';

function mount() {
  const el = document.getElementById('root');
  if (!el) return false;

  // PR-1 migration (idempotent): ensure default ledger exists.
  try { ensureDefaultLedger(); } catch {}

  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  return true;
}

if (!mount()) {
  window.addEventListener('DOMContentLoaded', () => {
    mount();
  }, { once: true });
}
