import React, { useState, useRef, useEffect } from 'react';

/**
 * شريط تنقل سفلي — موبايل فقط (برومبت 0.3 Mobile-first)
 * SPR-009: يعرض 4 عناصر رئيسية + زر "المزيد" يحتوي التقارير والإعدادات.
 * SPR-010: فُصل من Sidebar.jsx لتسهيل الصيانة.
 */
export const BottomNav = ({ navItems, page, setPage, mainIds, moreIds, MoreIcon }) => {
  const items = Array.isArray(navItems) ? navItems : [];
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [moreOpen]);

  // تحديد العناصر الرئيسية والثانوية
  const mainItems = mainIds ? items.filter((it) => mainIds.includes(it.id)) : items;
  const moreItems = moreIds ? items.filter((it) => moreIds.includes(it.id)) : [];
  const isMoreActive = moreItems.some((it) => it.id === page);

  return (
    <nav
      className="md:hidden no-print fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] safe-area-pb"
      aria-label="التنقل الرئيسي"
      dir="rtl"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPage(item.id);
                setMoreOpen(false);
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs transition-colors"
              style={{ color: isActive ? 'var(--color-info)' : 'var(--color-muted)' }}
            >
              {Icon && <Icon size={22} />}
              <span className="leading-tight">{item.label}</span>
            </button>
          );
        })}

        {moreItems.length > 0 && (
          <div className="relative flex-1 h-full" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="المزيد"
              aria-expanded={moreOpen}
              className="flex flex-col items-center justify-center w-full h-full gap-0.5 text-xs transition-colors"
              style={{ color: isMoreActive ? 'var(--color-info)' : 'var(--color-muted)' }}
            >
              {MoreIcon ? <MoreIcon size={22} /> : <span style={{ fontSize: 18 }}>⋮</span>}
              <span className="leading-tight">المزيد</span>
            </button>

            {moreOpen && (
              <div
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[140px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden z-50"
                role="menu"
                aria-label="قائمة المزيد"
              >
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = page === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setPage(item.id);
                        setMoreOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                      style={{
                        background: isActive ? 'var(--color-info-bg)' : 'transparent',
                        color: isActive ? 'var(--color-info)' : 'var(--color-text)',
                      }}
                    >
                      {Icon && <Icon size={18} />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
