/*
  قيد العقار — سياق Toast (مستخرج من App.jsx — الخطوة 2)
*/

import React, { createContext, useContext, useState, useCallback } from 'react';
import { genId } from '../utils/helpers.js';

export const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

function toastTypeClass(type) {
  if (type === 'success') return 'toast--item--success';
  if (type === 'error') return 'toast--item--error';
  if (type === 'info') return 'toast--item--info';
  return 'toast--item--warning';
}

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
        className="toast--container no-print"
        role="region"
        aria-label="إشعارات"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast--item ${toastTypeClass(t.type)}`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
