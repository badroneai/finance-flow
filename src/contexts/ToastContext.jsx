/*
  قيد العقار — سياق Toast (مستخرج من App.jsx — الخطوة 2)
*/

import React, { createContext, useContext, useState, useCallback } from 'react';
import { genId } from '../utils/helpers.js';

export const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = genId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 no-print" style={{ maxWidth: '360px' }} role="region" aria-label="إشعارات" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all animate-slideIn ${
              t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-yellow-500 text-gray-900'
            }`}
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
