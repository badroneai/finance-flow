import React from 'react';
import ReactDOM from 'react-dom/client';

// Stage 1: keep legacy single-file behavior by loading side-effect modules
// (keys/storage/bootstrap expose the same globals the app currently expects)
import '../assets/js/core/keys.js';
import '../assets/js/core/storage.js';
import '../assets/js/bootstrap.js';

import App from './App.jsx';

window.__QA_STAGE1_MAIN_LOADED__ = true;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.__QA_STAGE1_RENDER_CALLED__ = true;
