import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';

import { Sidebar, Topbar, BottomNav } from './ui/Sidebar.jsx';
import { PulseAlertsBanner } from './ui/PulseAlertsBanner.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { UnsavedContext } from './contexts/UnsavedContext.jsx';
import { TrustChecks } from './ui/TrustChecks.jsx';
import { PageLoadErrorBoundary } from './ui/ErrorBoundaries.jsx';
import { WelcomeBanner } from './ui/WelcomeBanner.jsx';
import { HelpPanel } from './ui/HelpPanel.jsx';
import { OnboardingModal } from './ui/OnboardingModal.jsx';
import { Icons } from './ui/ui-common.jsx';

import { NAV_ITEMS as NAV_ITEMS_CONFIG, pathToId, idToPath } from './config/navigation.js';

import PulsePage from './pages/PulsePage.jsx';
import InboxPage from './pages/InboxPage.jsx';

const LedgersPage = lazy(() => import('./pages/LedgersPage.jsx'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx').then((m) => ({ default: m.TransactionsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx').then((m) => ({ default: m.SettingsPage })));
const MonthlyReportPage = lazy(() => import('./pages/MonthlyReportPage.jsx'));

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
  const [letterType, setLetterType] = useState('intro');
  const [editDraft, setEditDraft] = useState(null);
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

  return (
    <ToastProvider>
      <UnsavedContext.Provider value={setDirty}>
        <TrustChecks/>
        <div className="app-shell flex min-h-screen">
          <a href="#main-content" className="skip-link absolute opacity-0 w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 focus:opacity-100 focus:w-auto focus:h-auto focus:py-2 focus:px-4 focus:m-0 focus:overflow-visible focus:z-[100] focus:bg-white focus:text-gray-900 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-blue-600 focus:outline-none focus:fixed focus:top-4 focus:start-4">
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
                <Suspense fallback={<div className="p-6 text-center text-gray-500" aria-live="polite">جاري التحميل…</div>}>
                  <Routes>
                    <Route path="/" element={<PulsePage setPage={setPage} />} />
                    <Route path="/inbox" element={<InboxPage setPage={setPage} />} />
                    <Route path="/ledgers" element={<LedgersPage setPage={setPage} />} />
                    <Route path="/transactions" element={<TransactionsPage setPage={setPage} />} />
                    <Route path="/settings" element={<SettingsPage {...settingsProps} />} />
                    <Route path="/report" element={<MonthlyReportPage setPage={setPage} />} />
                    <Route path="*" element={<PulsePage setPage={setPage} />} />
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

          <footer className="no-print border-t border-gray-100 py-3 px-4 text-center text-sm text-gray-500" role="contentinfo">
            <p>&copy; {new Date().getFullYear()} قيد العقار. جميع الحقوق محفوظة.</p>
          </footer>
          <BottomNav navItems={NAV_ITEMS} page={page} setPage={setPage} />
          </main>
        </div>
      </UnsavedContext.Provider>
    </ToastProvider>
  );
};

export default App;
