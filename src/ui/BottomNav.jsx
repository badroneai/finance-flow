import { useState, useRef, useEffect } from 'react';

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
      className="bottom-nav-shell md:hidden no-print safe-area-pb"
      aria-label="التنقل الرئيسي"
      dir="rtl"
    >
      <div className="bottom-nav-inner">
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
              className={`bottom-nav-item flex-1 text-xs ${isActive ? 'is-active' : ''}`}
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
              className={`bottom-nav-item w-full h-full text-xs ${isMoreActive ? 'is-active' : ''}`}
            >
              {MoreIcon ? <MoreIcon size={22} /> : <span style={{ fontSize: 18 }}>⋮</span>}
              <span className="leading-tight">المزيد</span>
            </button>

            {moreOpen && (
              <div className="bottom-nav-more-menu" role="menu" aria-label="قائمة المزيد">
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
