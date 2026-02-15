import React from 'react';

// Extracted from App.jsx (Stage 5 Close): Sidebar + Topbar

const NAV_ITEMS = [
  { id:'home', label:'الرئيسية', icon:'home' },
  { id:'transactions', label:'الحركات المالية', icon:'list', group:'finance' },
  { id:'commissions', label:'العمولات', icon:'percent', group:'finance' },
  { id:'ledgers', label:'الدفاتر', icon:'list', group:'finance' },
  { id:'templates', label:'قوالب الخطابات', icon:'mail', group:'letters' },
  { id:'generator', label:'إنشاء خطاب', icon:'fileText', group:'letters' },
  { id:'drafts', label:'المسودات', icon:'fileText', group:'letters' },
  { id:'calendar', label:'التقويم', icon:'calendar', group:'notes' },
  { id:'notes', label:'الملاحظات', icon:'notes', group:'notes' },
  { id:'help', label:'دليل سريع', icon:'info' },
  { id:'settings', label:'الإعدادات', icon:'settings' },
];

export const Sidebar = ({ Icons, page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen, onOpenHelp }) => {
  const groups = { finance: 'التدفقات المالية', letters: 'الخطابات', notes: 'الملاحظات والتقويم' };
  const handleNav = (id) => {
    if (id === 'help') { typeof onOpenHelp === 'function' && onOpenHelp(); setMobileOpen(false); return; }
    setPage(id === 'home' ? 'dashboard' : id);
    setMobileOpen(false);
  };

  const getIcon = (key) => {
    const map = {
      home: Icons.home,
      list: Icons.list,
      percent: Icons.percent,
      mail: Icons.mail,
      fileText: Icons.fileText,
      calendar: Icons.calendar,
      notes: Icons.notes,
      info: Icons.info,
      settings: Icons.settings,
    };
    return map[key] || Icons.list;
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
        {NAV_ITEMS.filter(i => !i.group && i.id === 'home').map(item => {
          const Icon = getIcon(item.icon);
          return (
            <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                (page === item.id || (item.id === 'home' && page === 'dashboard')) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}>
              <Icon size={18}/>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {Object.entries(groups).map(([key, label]) => (
          <div key={key} className="mb-2">
            {!collapsed && <p className="px-3 py-1 text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>}
            {NAV_ITEMS.filter(i => i.group === key).map(item => {
              const Icon = getIcon(item.icon);
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
          </div>
        ))}

        {NAV_ITEMS.filter(i => !i.group && i.id !== 'home').map(item => {
          const Icon = getIcon(item.icon);
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

export const Topbar = ({ Icons, page, mobileOpen, setMobileOpen, headerDateText }) => {
  const titles = { home:'الرئيسية', dashboard:'تحليل الأداء المالي', transactions:'سجل العمليات المالية', commissions:'العمولات', ledgers:'الدفاتر', templates:'قوالب الخطابات', generator:'إنشاء خطاب', drafts:'المسودات', calendar:'التقويم', notes:'الملاحظات', settings:'الإعدادات' };
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-start justify-between gap-3 sticky top-0 z-30 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button className="md:hidden hamburger-btn p-2 rounded-lg flex-shrink-0" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة" aria-expanded={mobileOpen}><Icons.menu size={22}/></button>
        <h2 className="text-lg font-bold text-gray-900 truncate">{titles[page] || ''}</h2>
      </div>
      <div className="text-xs text-gray-500 text-start max-w-[14rem] sm:max-w-none whitespace-normal leading-snug" dir="auto" aria-label="التاريخ">
        {headerDateText || ''}
      </div>
    </header>
  );
};
