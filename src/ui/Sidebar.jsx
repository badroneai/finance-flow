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
}) => {
  const items = Array.isArray(navItems) ? navItems : [];

  const handleNav = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="sidebar-brand p-5">
        <div className="flex items-center gap-3">
          <div className="sidebar-brand-mark flex-shrink-0" aria-hidden="true">
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
              <h1 className="sidebar-brand-title leading-tight">قيد العقار</h1>
              <p className="sidebar-brand-subtitle">نظام التدفقات المالية</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="القائمة الرئيسية">
        {items.map((item) => {
          const Icon = item.icon || Icons?.list;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              aria-label={item.label}
              data-tour-id={`nav-${item.id}`}
              className={`sidebar-nav-button text-sm mb-1 ${page === item.id ? 'is-active' : ''} ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
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
        className={`sidebar-shell hidden md:flex flex-col transition-all duration-300 no-print ${collapsed ? 'w-16' : 'w-60'}`}
      >
        {sidebarContent}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle p-4 text-xs font-medium"
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
        >
          {collapsed ? '◁' : '▷ طي'}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="sidebar-mobile-overlay fixed inset-0"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="sidebar-mobile-drawer z-50 overflow-y-auto">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
