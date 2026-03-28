import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';

import { Sidebar } from './ui/Sidebar.jsx';
import { Topbar } from './ui/Topbar.jsx';
import { BottomNav } from './ui/BottomNav.jsx';
import { PulseAlertsBanner } from './ui/PulseAlertsBanner.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { UnsavedContext } from './contexts/UnsavedContext.jsx';
import { TrustChecks } from './ui/TrustChecks.jsx';
import { PageLoadErrorBoundary } from './ui/ErrorBoundaries.jsx';
import { WelcomeBanner } from './ui/WelcomeBanner.jsx';
import { HelpPanel } from './ui/HelpPanel.jsx';
import { OnboardingModal } from './ui/OnboardingModal.jsx';
import { Icons } from './ui/ui-common.jsx';
import { ProtectedRoute } from './ui/ProtectedRoute.jsx';
import { DemoBanner } from './ui/DemoBanner.jsx';

import { NAV_ITEMS as NAV_ITEMS_CONFIG, BOTTOM_NAV_MAIN, BOTTOM_NAV_MORE, pathToId, idToPath } from './config/navigation.js';

import PulsePage from './pages/PulsePage.jsx';
import InboxPage from './pages/InboxPage.jsx';

const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const LedgersPage = lazy(() => import('./pages/LedgersPage.jsx'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx').then((m) => ({ default: m.TransactionsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx').then((m) => ({ default: m.SettingsPage })));
const MonthlyReportPage = lazy(() => import('./pages/MonthlyReportPage.jsx'));
const CommissionsPage = lazy(() => import('./pages/CommissionsPage.jsx').then((m) => ({ default: m.CommissionsPage })));

import { storageFacade } from './core/storage-facade.js';
import {
  getSavedDateHeader,
  getOnboardingSeen,
  setOnboardingSeen,
  initTheme,
  initNumerals,
  UI_ONBOARDING_SEEN_KEY,
} from './core/theme-ui.js';
import { dataStore } from './core/dataStore.js';
import { formatDateHeader } from './utils/dateFormat.js';

/** للتطوير فقط: ضع true لاختبار شاشة استعادة الأخطاء (Error Boundary) ثم أعد false قبل النشر. */
const SIMULATE_RENDER_ERROR = false;

// ربط عناصر التنقل بأيقونات الواجهة (برومبت 0.3)
const NAV_ITEMS = NAV_ITEMS_CONFIG.map((it) => ({ ...it, icon: Icons[it.iconKey] }));


// ============================================
// APP (Main Router — برومبت 0.3: مسارات URL)
// ============================================
const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const page = pathToId(location.pathname);
  const setPage = useCallback((id) => { navigate(idToPath(id)); }, [navigate]);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Ensure seed data on first load
  useEffect(() => { dataStore.seed.ensureSeeded(); }, []);
  const [headerDateMode, setHeaderDateMode] = useState(getSavedDateHeader() || 'both');
  const [headerDateText, setHeaderDateText] = useState('');

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpSection, setHelpSection] = useState('start'); // start|ledgers|recurring|reports|backup|privacy

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && showHelp) setShowHelp(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showHelp]);

  // Stage 4: Help/FAQ open event (for internal links from empty-states)
  useEffect(() => {
    const onHelp = (e) => {
      const sec = String(e?.detail?.section || '').trim();
      if (sec) setHelpSection(sec);
      setShowHelp(true);
      setTimeout(() => {
        const el = document.querySelector(`[data-help-section="${sec || helpSection}"]`);
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    };
    window.addEventListener('ui:help', onHelp);
    return () => window.removeEventListener('ui:help', onHelp);
  }, [helpSection]);

  const updateHeaderDate = useCallback(() => {
    setHeaderDateText(formatDateHeader(new Date()));
  }, []);

  const scheduleHeaderDateMidnightRefresh = useCallback(() => {
    // Update once shortly after local midnight to reflect the new day.
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 5, 0); // 00:00:05 next day
    const ms = Math.max(5000, next.getTime() - now.getTime());
    const id = setTimeout(() => {
      updateHeaderDate();
      scheduleHeaderDateMidnightRefresh();
    }, ms);
    return () => clearTimeout(id);
  }, [updateHeaderDate]);

  // Phase 7.1: apply saved theme/numerals on load + initialize header date
  // Onboarding (first-run): show once if ui_onboarding_seen is not set
  useEffect(() => {
    initTheme();
    initNumerals();

    setShowOnboarding(!getOnboardingSeen());

    const datePref = (getSavedDateHeader() || 'both');
    setHeaderDateMode(datePref);

    if (datePref !== 'off') {
      updateHeaderDate();
    }

    const cancelMidnight = scheduleHeaderDateMidnightRefresh();
    const onNumerals = () => { if ((getSavedDateHeader() || 'both') !== 'off') updateHeaderDate(); };
    const onDateHeader = () => {
      const pref = (getSavedDateHeader() || 'both');
      setHeaderDateMode(pref);
      if (pref !== 'off') updateHeaderDate();
    };

    window.addEventListener('ui:numerals', onNumerals);
    window.addEventListener('ui:dateHeader', onDateHeader);

    return () => {
      window.removeEventListener('ui:numerals', onNumerals);
      window.removeEventListener('ui:dateHeader', onDateHeader);
      cancelMidnight && cancelMidnight();
    };
  }, [updateHeaderDate, scheduleHeaderDateMidnightRefresh]);
  // Phase 9.4: تحذير قبل المغادرة عند وجود تغييرات غير محفوظة
  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = 'لديك تغييرات غير محفوظة. هل تريد المغادرة؟'; return e.returnValue; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  if (SIMULATE_RENDER_ERROR) throw new Error('Phase 9.3 test error');

  const settingsProps = { setPage, onShowOnboarding: () => { try { storageFacade.removeRaw(UI_ONBOARDING_SEEN_KEY); } catch {} setShowOnboarding(true); } };

  // صفحة المصادقة تُعرض بدون layout (بدون Sidebar/Topbar/BottomNav)
  const isAuthPage = location.pathname === '/auth';

  if (isAuthPage) {
    return (
      <Suspense fallback={<div className="p-6 text-center text-[var(--color-muted)]" dir="rtl">جاري التحميل…</div>}>
        <AuthPage />
      </Suspense>
    );
  }

  // مسار /demo → يفعّل وضع Demo ويحوّل إلى الصفحة الرئيسية
  if (location.pathname === '/demo') {
    // تفعيل Demo عبر sessionStorage ثم redirect
    try { sessionStorage.setItem('ff_demo_mode', 'true'); } catch {}
    window.location.hash = '#/';
    window.location.reload();
    return null;
  }

  return (
    <ToastProvider>
      <UnsavedContext.Provider value={setDirty}>
        <TrustChecks/>
        <DemoBanner />
        <div className="app-shell flex min-h-screen">
          <a href="#main-content" className="skip-link absolute opacity-0 w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 focus:opacity-100 focus:w-auto focus:h-auto focus:py-2 focus:px-4 focus:m-0 focus:overflow-visible focus:z-[100] focus:bg-[var(--color-surface)] focus:text-[var(--color-text)] focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-blue-600 focus:outline-none focus:fixed focus:top-4 focus:start-4">
            تخطي إلى المحتوى الرئيسي
          </a>
          <Sidebar Icons={Icons} navItems={NAV_ITEMS} page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onOpenHelp={() => { setHelpSection('start'); setShowHelp(true); }}/>
          <main className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0" id="main-content" role="main" aria-label="المحتوى الرئيسي">
            <Topbar Icons={Icons} page={page} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} headerDateText={headerDateMode !== 'off' ? headerDateText : ''} setPage={setPage}/>
            <PulseAlertsBanner page={page} onGoToInbox={() => setPage('inbox')} />
            <div className="px-4 md:px-6 max-w-4xl mx-auto">
              {!showOnboarding && <WelcomeBanner/>}
            </div>

            {showOnboarding && (
              <OnboardingModal
                onClose={() => { setOnboardingSeen(); setShowOnboarding(false); }}
                onOpenSettings={() => {
                  setOnboardingSeen();
                  setShowOnboarding(false);
                  setPage('settings');
                  setTimeout(() => {
                    const el = document.querySelector('[aria-label="وضع العرض"]');
                    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }}
              />
            )}
            <div className="print-container flex-1">
              <PageLoadErrorBoundary key={page} onGoHome={() => setPage('pulse')}>
                <Suspense fallback={<div className="p-6 text-center text-[var(--color-muted)]" aria-live="polite">جاري التحميل…</div>}>
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><PulsePage setPage={setPage} /></ProtectedRoute>} />
                    <Route path="/inbox" element={<ProtectedRoute><InboxPage setPage={setPage} /></ProtectedRoute>} />
                    <Route path="/ledgers" element={<ProtectedRoute><LedgersPage setPage={setPage} /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute><TransactionsPage setPage={setPage} /></ProtectedRoute>} />
                    <Route path="/commissions" element={<ProtectedRoute><CommissionsPage setPage={setPage} /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage {...settingsProps} /></ProtectedRoute>} />
                    <Route path="/report" element={<ProtectedRoute><MonthlyReportPage setPage={setPage} /></ProtectedRoute>} />
                    <Route path="*" element={<ProtectedRoute><PulsePage setPage={setPage} /></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </PageLoadErrorBoundary>
            </div>

            {showHelp && (
              <HelpPanel
                helpSection={helpSection}
                setHelpSection={setHelpSection}
                onClose={() => setShowHelp(false)}
                onOpenSettings={() => setPage('settings')}
              />
            )}

          <footer className="no-print border-t border-[var(--color-border)] py-3 px-4 text-center text-sm text-[var(--color-muted)]" role="contentinfo">
            <p>&copy; {new Date().getFullYear()} قيد العقار. جميع الحقوق محفوظة.</p>
          </footer>
          <BottomNav navItems={NAV_ITEMS} page={page} setPage={setPage} mainIds={BOTTOM_NAV_MAIN} moreIds={BOTTOM_NAV_MORE} MoreIcon={Icons.moreMenu} />
          </main>
        </div>
      </UnsavedContext.Provider>
    </ToastProvider>
  );
};

export default App;
