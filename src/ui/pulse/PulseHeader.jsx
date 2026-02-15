/*
  هيدر صفحة النبض — برومبت 1.5
  اسم الدفتر النشط + زر تبديل الدفتر (dropdown) + شارة "قيد"
*/
import React, { useState, useRef, useEffect } from 'react';
import { getLedgers, getActiveLedgerId, setActiveLedgerId } from '../../core/ledger-store.js';

export default function PulseHeader({ onOpenLedgers }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(() => getActiveLedgerId() || '');
  const [ledgers, setLedgers] = useState(() => getLedgers());
  const dropdownRef = useRef(null);

  useEffect(() => {
    const sync = () => {
      setActiveId(getActiveLedgerId() || '');
      setLedgers(getLedgers());
    };
    sync();
    window.addEventListener('ledger:activeChanged', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ledger:activeChanged', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const list = Array.isArray(ledgers) ? ledgers : [];
  const active = list.find((l) => l.id === activeId);
  const name = active?.name || (activeId ? 'دفتر' : '');
  const hasLedgers = list.length > 0;

  const handleSelect = (id) => {
    if (id && id !== activeId) {
      setActiveLedgerId(id);
      setOpen(false);
    }
  };

  return (
    <header className="flex items-center justify-between gap-3 flex-wrap mb-4" dir="rtl" aria-label="هيدر النبض المالي">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <h1 className="text-xl font-bold text-gray-900 truncate">النبض المالي</h1>
        {hasLedgers && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600" aria-hidden="true">
            قيد
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 no-print">
        {hasLedgers ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 min-w-0 max-w-[180px]"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={`الدفتر النشط: ${name || 'غير محدد'}. اختر دفتراً آخر`}
            >
              <span className="truncate">{name || 'اختر دفتراً'}</span>
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400" aria-hidden="true">
                {open ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {open && (
              <ul
                role="listbox"
                className="absolute top-full right-0 mt-1 min-w-[160px] max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-10"
                aria-label="قائمة الدفاتر"
              >
                {list.map((l) => (
                  <li key={l.id} role="option" aria-selected={l.id === activeId}>
                    <button
                      type="button"
                      onClick={() => handleSelect(l.id)}
                      className={`w-full text-right px-3 py-2 text-sm ${l.id === activeId ? 'bg-blue-50 text-blue-800 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {l.name || 'بدون اسم'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
        {onOpenLedgers && (
          <button
            type="button"
            onClick={onOpenLedgers}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {hasLedgers ? 'إدارة الدفتر' : 'فتح الدفاتر'}
          </button>
        )}
      </div>
    </header>
  );
}
