/*
  قيد العقار — سياق Toast (مستخرج من App.jsx — الخطوة 2)
*/

import React, { createContext, useContext, useState, useCallback } from 'react';
import { genId } from '../utils/helpers.js';

export const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = genId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  // كائن موحّد يدعم toast.success() و toast.error() و toast.warn() و toast.info()
  const toast = React.useMemo(
    () => ({
      success: (msg) => showToast(msg, 'success'),
      error: (msg) => showToast(msg, 'error'),
      warn: (msg) => showToast(msg, 'warning'),
      info: (msg) => showToast(msg, 'info'),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed top-4 left-4 z-50 flex flex-col gap-2 no-print"
        style={{ maxWidth: '360px' }}
        role="region"
        aria-label="إشعارات"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-3 rounded-2xl text-sm font-medium transition-all animate-slideIn"
            style={{
              color:
                t.type === 'warning' ? 'var(--color-text-primary)' : 'var(--color-text-inverse)',
              background:
                t.type === 'success'
                  ? 'var(--color-success)'
                  : t.type === 'error'
                    ? 'var(--color-danger)'
                    : t.type === 'info'
                      ? 'var(--color-secondary)'
                      : 'var(--color-warning)',
              boxShadow: 'var(--shadow)',
              border:
                t.type === 'warning'
                  ? '1px solid color-mix(in srgb, var(--color-warning) 55%, transparent)'
                  : '1px solid transparent',
            }}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`.animate-slideIn { animation: slideIn .3s ease; } @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); }}`}</style>
    </ToastContext.Provider>
  );
};
