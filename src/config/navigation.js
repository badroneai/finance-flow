/**
 * التنقل الرئيسي — النبض المالي (برومبت 0.3)
 * الشريط الجانبي (ديسكتوب) + الشريط السفلي (موبايل)
 *
 * SPR-009: أُضيف عنصر "التقارير" (#/report) بين الحركات والإعدادات.
 * الشريط السفلي يعرض 5 عناصر: النبض، المستحقات، الدفاتر، الحركات، المزيد.
 * "المزيد" يحتوي: التقارير + الإعدادات.
 */

/** جميع عناصر التنقل (للشريط الجانبي — ديسكتوب) */
export const NAV_ITEMS = [
  { id: 'pulse', label: 'النبض', icon: 'HeartPulse', iconKey: 'pulse', path: '/', component: 'PulsePage' },
  { id: 'inbox', label: 'المستحقات', icon: 'Inbox', iconKey: 'inbox', path: '/inbox', component: 'InboxPage' },
  { id: 'ledgers', label: 'الدفاتر', icon: 'BookOpen', iconKey: 'ledgers', path: '/ledgers', component: 'LedgersPage' },
  { id: 'transactions', label: 'الحركات', icon: 'ArrowLeftRight', iconKey: 'transactions', path: '/transactions', component: 'TransactionsPage' },
  { id: 'commissions', label: 'العمولات', icon: 'Percent', iconKey: 'commissions', path: '/commissions', component: 'CommissionsPage' },
  { id: 'report', label: 'التقارير', icon: 'BarChart', iconKey: 'report', path: '/report', component: 'MonthlyReportPage' },
  { id: 'settings', label: 'الإعدادات', icon: 'Settings', iconKey: 'settings', path: '/settings', component: 'SettingsPage' },
];

/**
 * عناصر الشريط السفلي — موبايل (5 عناصر كحد أقصى).
 * العناصر الأربعة الأولى مباشرة + "المزيد" يحتوي البقية.
 */
export const BOTTOM_NAV_MAIN = ['pulse', 'inbox', 'ledgers', 'transactions'];
export const BOTTOM_NAV_MORE = ['commissions', 'report', 'settings'];

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
