/*
  قيد العقار (Finance Flow)
  Stage 5 (Fix) — ui/sidebar.jsx

  الهدف:
  - تمكين استخراج JSX إلى ملفات خارجية بدون Build step.
  - بدون import/export: نعتمد على window.FF_UI كـ global registry.
  - لا تغيير سلوكي.

  مهم (load-order):
  - هذا الملف قد يُحمّل قبل تعريف Icons داخل finance-flow.html.
  - لذلك لا نلمس Icons أثناء التحميل؛ نستخدم getter لتوليد NAV_ITEMS عند وقت الاستخدام.
*/

window.FF_UI = window.FF_UI || {};

window.FF_UI.getNavItems = function getNavItems() {
  return [
    { id:'home', label:'الرئيسية', icon:Icons.home },
    { id:'transactions', label:'الحركات المالية', icon:Icons.list, group:'finance' },
    { id:'commissions', label:'العمولات', icon:Icons.percent, group:'finance' },
    { id:'templates', label:'قوالب الخطابات', icon:Icons.mail, group:'letters' },
    { id:'generator', label:'إنشاء خطاب', icon:Icons.fileText, group:'letters' },
    { id:'drafts', label:'المسودات', icon:Icons.fileText, group:'letters' },
    { id:'calendar', label:'التقويم', icon:Icons.calendar, group:'notes' },
    { id:'notes', label:'الملاحظات', icon:Icons.notes, group:'notes' },
    { id:'help', label:'دليل سريع', icon:Icons.info },
    { id:'settings', label:'الإعدادات', icon:Icons.settings },
  ];
};

window.FF_UI.Sidebar = function Sidebar({ page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen, onOpenHelp }) {
  const NAV_ITEMS = window.FF_UI.getNavItems();
  const groups = { finance: 'التدفقات المالية', letters: 'الخطابات', notes: 'الملاحظات والتقويم' };
  const handleNav = (id) => {
    if (id === 'help') { typeof onOpenHelp === 'function' && onOpenHelp(); setMobileOpen(false); return; }
    setPage(id === 'home' ? 'dashboard' : id);
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
        {NAV_ITEMS.filter(i => !i.group && i.id === 'home').map(item => (
          <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
              (page === item.id || (item.id === 'home' && page === 'dashboard')) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}>
            <item.icon size={18}/>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        {Object.entries(groups).map(([key, label]) => (
          <div key={key} className="mb-2">
            {!collapsed && <p className="px-3 py-1 text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>}
            {NAV_ITEMS.filter(i => i.group === key).map(item => (
              <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
                  page === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}>
                <item.icon size={18}/>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
        {NAV_ITEMS.filter(i => !i.group && i.id !== 'home').map(item => (
          <button key={item.id} type="button" onClick={() => handleNav(item.id)} aria-label={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${
              page === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}>
            <item.icon size={18}/>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <aside className={`hidden md:flex flex-col bg-gray-900 h-screen sticky top-0 transition-all duration-300 no-print ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
        <button onClick={() => setCollapsed(!collapsed)} className="p-3 border-t border-gray-700/50 text-gray-400 hover:text-white text-xs" aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}>
          {collapsed ? '◁' : '▷ طي'}
        </button>
      </aside>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)}/>
          <aside className="fixed right-0 top-0 bottom-0 w-64 bg-gray-900 z-50 overflow-y-auto">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
