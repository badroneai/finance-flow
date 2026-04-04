/* @vitest-environment jsdom */

// فحص تشخيصي مؤقت: يركّب التطبيق على مسار /ledgers لكشف أخطاء الرندر الفعلية.
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from '../../App.jsx';
import { AuthProvider } from '../../contexts/AuthContext.jsx';
import { DataProvider } from '../../contexts/DataContext.jsx';
import { DemoProvider } from '../../contexts/DemoContext.jsx';
import { ToastProvider } from '../../contexts/ToastContext.jsx';

describe('Ledgers route runtime', () => {
  beforeEach(() => {
    window.sessionStorage.removeItem('ff_ledgers_open_tab');
    document.body.innerHTML = '<div id="root"></div>';
  });

  async function renderHash(hash) {
    window.location.hash = hash;
    const rootEl = document.getElementById('root');
    const root = ReactDOM.createRoot(rootEl);

    root.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          DemoProvider,
          null,
          React.createElement(
            AuthProvider,
            null,
            React.createElement(
              HashRouter,
              null,
              React.createElement(
                ToastProvider,
                null,
                React.createElement(DataProvider, null, React.createElement(App))
              )
            )
          )
        )
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 700));

    const text = rootEl.textContent || '';
    root.unmount();
    return text;
  }

  it.each([
    '#/ledgers',
    '#/ledgers?tab=recurring',
    '#/ledgers?tab=performance',
    '#/ledgers?tab=compare',
    '#/ledgers?tab=reports',
  ])(
    'renders %s without tripping the page-load error boundary',
    async (hash) => {
      const text = await renderHash(hash);
      expect(text).not.toContain('تعذر تحميل هذه الصفحة');
    },
    10000
  );
});
