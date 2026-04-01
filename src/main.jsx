import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { DataProvider } from './contexts/DataContext.jsx';
import { DemoProvider } from './contexts/DemoContext.jsx';

import { ensureDefaultLedger } from './core/ledger-store.js';

// عرض خطأ واضح مع زر رجوع عند أي crash (يمنع الصفحة البيضاء)
function RootErrorFallback({ error, onReload }) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: '"IBM Plex Sans Arabic", sans-serif',
        background: 'var(--color-background)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 24,
          boxShadow: 'var(--shadow)',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
          حدث خطأ في تحميل التطبيق
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          يمكنك إعادة تحميل الصفحة أو الرجوع للرابط السابق.
        </p>
        <button
          type="button"
          onClick={onReload}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-inverse)',
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          إعادة تحميل الصفحة
        </button>
        {error && (
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--color-background)',
              borderRadius: 6,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 120,
            }}
          >
            {String(error.message || error)}
          </pre>
        )}
      </div>
    </div>
  );
}

class RootErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(err) {
    return { hasError: true, error: err };
  }
  componentDidCatch(err, info) {
    console.error('RootErrorBoundary', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <RootErrorFallback error={this.state.error} onReload={() => window.location.reload()} />
      );
    }
    return this.props.children;
  }
}

function mount() {
  const el = document.getElementById('root');
  if (!el) return false;

  try {
    // PR-1 migration (idempotent): ensure default ledger exists.
    ensureDefaultLedger();
  } catch (_) {}

  try {
    ReactDOM.createRoot(el).render(
      <React.StrictMode>
        <RootErrorBoundary>
          <DemoProvider>
            <AuthProvider>
              <HashRouter>
                <DataProvider>
                  <App />
                </DataProvider>
              </HashRouter>
            </AuthProvider>
          </DemoProvider>
        </RootErrorBoundary>
      </React.StrictMode>
    );
    return true;
  } catch (err) {
    console.error('mount failed', err);
    // تنظيف المحتوى بدون innerHTML
    while (el.firstChild) el.removeChild(el.firstChild);

    const fallback = document.createElement('div');
    fallback.setAttribute('dir', 'rtl');
    fallback.style.cssText =
      'min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:"IBM Plex Sans Arabic",sans-serif;background:var(--color-background);color:var(--color-text-primary);';

    const card = document.createElement('div');
    card.style.cssText =
      'max-width:420px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:24px;box-shadow:var(--shadow)';

    const heading = document.createElement('h2');
    heading.style.cssText = 'margin:0 0 8px;font-size:20px;font-weight:700';
    heading.textContent = 'حدث خطأ في تحميل التطبيق';

    const para = document.createElement('p');
    para.style.cssText = 'margin:0 0 16px;font-size:14px;color:var(--color-text-secondary)';
    para.textContent = 'اضغط الزر أدناه لإعادة تحميل الصفحة.';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText =
      'padding:10px 20px;font-size:14px;font-weight:600;color:var(--color-text-inverse);background:var(--color-primary);border:none;border-radius:8px;cursor:pointer';
    btn.textContent = 'إعادة تحميل الصفحة';
    btn.addEventListener('click', () => window.location.reload());

    card.appendChild(heading);
    card.appendChild(para);
    card.appendChild(btn);
    fallback.appendChild(card);
    el.appendChild(fallback);
    return true;
  }
}

if (!mount()) {
  window.addEventListener(
    'DOMContentLoaded',
    () => {
      mount();
    },
    { once: true }
  );
}
