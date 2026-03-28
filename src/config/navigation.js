/**
 * التنقل الرئيسي — قيد العقار (SPR-018: المرحلة 2)
 * الشريط الجانبي (ديسكتوب) + الشريط السفلي (موبايل)
 *
 * الهيكل الجديد: لوحة التحكم → عقارات → عملاء → عقود → مالية → إعدادات
 * النبض المالي انتقل لمكان ثانوي (لم يُحذف).
 */

/** جميع عناصر التنقل (للشريط الجانبي — ديسكتوب) */
export const NAV_ITEMS = [
  // ─── الرئيسية ──────────────────────────
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: 'LayoutDashboard',
    iconKey: 'dashboard',
    path: '/',
    component: 'DashboardPage',
  },
  // ─── إدارة عقارية ──────────────────────
  {
    id: 'properties',
    label: 'العقارات',
    icon: 'Building',
    iconKey: 'properties',
    path: '/properties',
    component: 'PropertiesPage',
  },
  {
    id: 'contacts',
    label: 'العملاء',
    icon: 'Users',
    iconKey: 'contacts',
    path: '/contacts',
    component: 'ContactsPage',
  },
  {
    id: 'contracts',
    label: 'العقود',
    icon: 'FileText',
    iconKey: 'contracts',
    path: '/contracts',
    component: 'ContractsPage',
  },
  // ─── مالية ─────────────────────────────
  {
    id: 'inbox',
    label: 'المستحقات',
    icon: 'Inbox',
    iconKey: 'inbox',
    path: '/inbox',
    component: 'InboxPage',
  },
  {
    id: 'ledgers',
    label: 'الدفاتر',
    icon: 'BookOpen',
    iconKey: 'ledgers',
    path: '/ledgers',
    component: 'LedgersPage',
  },
  {
    id: 'transactions',
    label: 'الحركات',
    icon: 'ArrowLeftRight',
    iconKey: 'transactions',
    path: '/transactions',
    component: 'TransactionsPage',
  },
  {
    id: 'commissions',
    label: 'العمولات',
    icon: 'Percent',
    iconKey: 'commissions',
    path: '/commissions',
    component: 'CommissionsPage',
  },
  {
    id: 'report',
    label: 'التقارير',
    icon: 'BarChart',
    iconKey: 'report',
    path: '/report',
    component: 'MonthlyReportPage',
  },
  // ─── أدوات ─────────────────────────────
  {
    id: 'pulse',
    label: 'النبض المالي',
    icon: 'HeartPulse',
    iconKey: 'pulse',
    path: '/pulse',
    component: 'PulsePage',
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: 'Settings',
    iconKey: 'settings',
    path: '/settings',
    component: 'SettingsPage',
  },
];

/**
 * عناصر الشريط السفلي — موبايل (5 عناصر كحد أقصى).
 * العناصر الأربعة الأولى مباشرة + "المزيد" يحتوي البقية.
 */
export const BOTTOM_NAV_MAIN = ['dashboard', 'properties', 'contracts', 'transactions'];
export const BOTTOM_NAV_MORE = [
  'contacts',
  'inbox',
  'ledgers',
  'commissions',
  'report',
  'pulse',
  'settings',
];

/** path إلى id للاستخدام مع useLocation (HashRouter) */
export function pathToId(pathname) {
  const path = (pathname || '/').replace(/^#/, '').trim() || '/';
  const item = NAV_ITEMS.find((it) => it.path === path);
  return item ? item.id : 'dashboard';
}

/** id إلى path للتنقل */
export function idToPath(id) {
  const item = NAV_ITEMS.find((it) => it.id === id);
  return item ? item.path : '/';
}
