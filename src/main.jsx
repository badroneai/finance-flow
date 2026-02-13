import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

// Stage 2.3: expose UI components via ESM + keep legacy window.FF_UI contract (no behavior change)
import { Sidebar } from './ui/sidebar.jsx';
import { Modal, ConfirmDialog, NotesCalendarAddEventModal } from './ui/modals.jsx';

if (typeof window !== 'undefined') {
  window.FF_UI = window.FF_UI || {};
  window.FF_UI.Sidebar = window.FF_UI.Sidebar || Sidebar;
  window.FF_UI.Modal = window.FF_UI.Modal || Modal;
  window.FF_UI.ConfirmDialog = window.FF_UI.ConfirmDialog || ConfirmDialog;
  window.FF_UI.NotesCalendarAddEventModal = window.FF_UI.NotesCalendarAddEventModal || NotesCalendarAddEventModal;
}

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
