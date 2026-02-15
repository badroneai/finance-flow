/**
 * التنقل الرئيسي — النبض المالي (برومبت 0.3)
 * الشريط الجانبي (ديسكتوب) + الشريط السفلي (موبايل)
 */
export const NAV_ITEMS = [
  { id: 'pulse', label: 'النبض', icon: 'HeartPulse', iconKey: 'pulse', path: '/', component: 'PulsePage' },
  { id: 'inbox', label: 'المستحقات', icon: 'Inbox', iconKey: 'inbox', path: '/inbox', component: 'InboxPage' },
  { id: 'ledgers', label: 'الدفاتر', icon: 'BookOpen', iconKey: 'ledgers', path: '/ledgers', component: 'LedgersPage' },
  { id: 'transactions', label: 'الحركات', icon: 'ArrowLeftRight', iconKey: 'transactions', path: '/transactions', component: 'TransactionsPage' },
  { id: 'settings', label: 'الإعدادات', icon: 'Settings', iconKey: 'settings', path: '/settings', component: 'SettingsPage' },
];

/** path إلى id للاستخدام مع useLocation (HashRouter) */
export function pathToId(pathname) {
  const path = (pathname || '/').replace(/^#/, '').trim() || '/';
  const item = NAV_ITEMS.find((it) => it.path === path);
  return item ? item.id : 'pulse';
}

/** id إلى path للتنقل */
export function idToPath(id) {
  const item = NAV_ITEMS.find((it) => it.id === id);
  return item ? item.path : '/';
}
