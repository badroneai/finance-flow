import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

function mount() {
  const el = document.getElementById('root');
  if (!el) return false;
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
