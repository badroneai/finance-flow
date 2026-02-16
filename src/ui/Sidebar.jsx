import React from 'react';

// Sidebar — برومبت 0.3: يستخدم navItems من config/navigation (يُمرَّر من App مع الأيقونات)
export const Sidebar = ({ Icons, navItems, page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen, onOpenHelp }) => {
  const items = Array.isArray(navItems) ? navItems : [];

  const handleNav = (id) => {
    setPage(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 text-white" aria-hidden="true">
            <svg viewBox="0 0 100 100" fill="none" width="36" height="36" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z"/>
              <path d="M62 30V24H68V36"/>
              <path d="M20 80H80" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" strokeOpacity="0.4" strokeWidth="1.5"/>
            </svg>
          </div>
          {!collapsed && <div><h1 className="font-bold text-white text-sm leading-tight">قيد العقار</h1><p className="text-gray-400 text-xs">نظام التدفقات المالية</p></div>}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="القائمة الرئيسية">
        {items.map((item) => {
          const Icon = item.icon || Icons?.list;
          return (
            <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                page === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}>
              <Icon size={18}/>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside className={`hidden md:flex flex-col bg-gray-900 h-screen sticky top-0 transition-all duration-300 no-print ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
        <button onClick={() => setCollapsed(!collapsed)} className="p-3 border-t border-gray-700/50 text-gray-400 hover:text-white text-xs" aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}>
          {collapsed ? '◁' : '▷ طي'}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)}/>
          <aside className="fixed right-0 top-0 bottom-0 w-64 bg-gray-900 z-50 overflow-y-auto">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};

import { useAlerts, CriticalAlertBanner } from './alerts/AlertCenter.jsx';
import AlertCenter from './alerts/AlertCenter.jsx';

export const Topbar = ({ Icons, page, mobileOpen, setMobileOpen, headerDateText, setPage }) => {
  const { alerts, fetchTime, criticalFirst, refresh, handleAction, handleDismiss, handleSnooze, handleDismissAll } = useAlerts();
  const titles = {
    pulse: 'النبض المالي',
    inbox: 'المستحقات',
    ledgers: 'الدفاتر',
    transactions: 'الحركات',
    settings: 'الإعدادات',
  };
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 no-print flex flex-col">
      {criticalFirst && (
        <CriticalAlertBanner
          criticalFirst={criticalFirst}
          onAction={handleAction}
          onDismiss={(alert) => { handleDismiss(alert); refresh(); }}
          setPage={setPage}
        />
      )}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button className="md:hidden hamburger-btn p-2 rounded-lg flex-shrink-0" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة" aria-expanded={mobileOpen}><Icons.menu size={22}/></button>
          <h2 className="text-lg font-bold text-gray-900 truncate">{titles[page] || ''}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {setPage && (
            <AlertCenter
              setPage={setPage}
              alerts={alerts}
              fetchTime={fetchTime}
              criticalFirst={criticalFirst}
              refresh={refresh}
              handleAction={handleAction}
              handleDismiss={handleDismiss}
              handleSnooze={handleSnooze}
              handleDismissAll={handleDismissAll}
            />
          )}
          <div className="text-xs text-gray-500 text-start max-w-[14rem] sm:max-w-none whitespace-normal leading-snug" dir="auto" aria-label="التاريخ">
            {headerDateText || ''}
          </div>
        </div>
      </div>
    </header>
  );
};

/** شريط تنقل سفلي — موبايل فقط (برومبت 0.3 Mobile-first) */
export const BottomNav = ({ navItems, page, setPage }) => {
  const items = Array.isArray(navItems) ? navItems : [];
  return (
    <nav
      className="md:hidden no-print fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb"
      aria-label="التنقل الرئيسي"
      dir="rtl"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs transition-colors ${
                isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon size={22} />}
              <span className="leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
