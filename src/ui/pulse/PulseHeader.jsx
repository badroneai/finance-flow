/*
  هيدر صفحة النبض — برومبت 1.5
  اسم الدفتر النشط + زر تبديل الدفتر (dropdown) + شارة "قيد"
*/
import { useState, useRef, useEffect } from 'react';
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
    <header className="pulse-header" dir="rtl" aria-label="هيدر النبض المالي">
      <div className="pulse-header__title-row">
        <h1 className="pulse-header__title">النبض المالي</h1>
        {hasLedgers && (
          <span className="pulse-header__badge" aria-hidden="true">قيد</span>
        )}
      </div>

      <div className="pulse-header__controls no-print">
        {hasLedgers ? (
          <div className="pulse-header__dropdown-anchor" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="pulse-header__dropdown-btn"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={`الدفتر النشط: ${name || 'غير محدد'}. اختر دفتراً آخر`}
            >
              <span className="pulse-header__dropdown-name">{name || 'اختر دفتراً'}</span>
              <span className="pulse-header__dropdown-arrow" aria-hidden="true">
                {open ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {open && (
              <ul
                role="listbox"
                className="pulse-header__dropdown-list"
                aria-label="قائمة الدفاتر"
              >
                {list.map((l) => (
                  <li key={l.id} role="option" aria-selected={l.id === activeId}>
                    <button
                      type="button"
                      onClick={() => handleSelect(l.id)}
                      className="pulse-header__dropdown-item"
                      style={{
                        background: l.id === activeId ? 'var(--color-info-bg)' : 'transparent',
                        color: l.id === activeId ? 'var(--color-info)' : 'var(--color-text)',
                      }}
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
          <button type="button" onClick={onOpenLedgers} className="pulse-header__link">
            {hasLedgers ? 'إدارة الدفتر' : 'فتح الدفاتر'}
          </button>
        )}
      </div>
    </header>
  );
}
