import React from 'react';

/**
 * القائمة الجانبية — سطح المكتب + درج موبايل (برومبت 0.3)
 * SPR-010: فُصلت Topbar و BottomNav إلى ملفات مستقلة.
 */
export const Sidebar = ({
  Icons,
  navItems,
  page,
  setPage,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenHelp,
}) => {
  const items = Array.isArray(navItems) ? navItems : [];

  const handleNav = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-white"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 100 100"
              fill="none"
              width="36"
              height="36"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            >
              <path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" />
              <path d="M62 30V24H68V36" />
              <path d="M20 80H80" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M24 84L20 80L24 76H76L80 80L76 84H24Z"
                strokeOpacity="0.4"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">قيد العقار</h1>
              <p className="text-[var(--color-muted)] text-xs">نظام التدفقات المالية</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="القائمة الرئيسية">
        {items.map((item) => {
          const Icon = item.icon || Icons?.list;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              aria-label={item.label}
              data-tour-id={`nav-${item.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${collapsed ? 'justify-center' : ''}`}
              style={{
                background: page === item.id ? 'var(--color-info)' : 'transparent',
                color: page === item.id ? 'white' : 'var(--color-muted)',
              }}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside
        data-tour-id="sidebar"
        className={`hidden md:flex flex-col bg-[var(--color-surface)] h-screen sticky top-0 transition-all duration-300 no-print ${collapsed ? 'w-16' : 'w-60'}`}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-[var(--color-border)] text-[var(--color-muted)] hover:text-white text-xs"
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          {collapsed ? '◁' : '▷ طي'}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed right-0 top-0 bottom-0 w-64 bg-[var(--color-surface)] z-50 overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
