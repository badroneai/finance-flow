import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

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
        background: '#f8fafc',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>حدث خطأ في تحميل التطبيق</h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
          يمكنك إعادة تحميل الصفحة أو الرجوع للرابط السابق.
        </p>
        <button
          type="button"
          onClick={onReload}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: '#0F1C2E',
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
              background: '#f1f5f9',
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
        <RootErrorFallback
          error={this.state.error}
          onReload={() => window.location.reload()}
        />
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
          <App />
        </RootErrorBoundary>
      </React.StrictMode>
    );
    return true;
  } catch (err) {
    console.error('mount failed', err);
    el.innerHTML = '';
    const fallback = document.createElement('div');
    fallback.setAttribute('dir', 'rtl');
    fallback.style.cssText = 'min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24;font-family:"IBM Plex Sans Arabic",sans-serif;background:#f8fafc;color:#0f172a;';
    fallback.innerHTML = [
      '<div style="max-width:420px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">',
      '<h2 style="margin:0 0 8px;font-size:20px;font-weight:700">حدث خطأ في تحميل التطبيق</h2>',
      '<p style="margin:0 0 16px;font-size:14px;color:#64748b">اضغط الزر أدناه لإعادة تحميل الصفحة.</p>',
      '<button type="button" onclick="window.location.reload()" style="padding:10px 20px;font-size:14px;font-weight:600;color:#fff;background:#0F1C2E;border:none;border-radius:8px;cursor:pointer">إعادة تحميل الصفحة</button>',
      '</div>',
    ].join('');
    el.appendChild(fallback);
    return true;
  }
}

if (!mount()) {
  window.addEventListener('DOMContentLoaded', () => {
    mount();
  }, { once: true });
}
