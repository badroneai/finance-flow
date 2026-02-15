import React, { useState, useEffect, useCallback } from 'react';

import { Sidebar, Topbar } from './ui/Sidebar.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { UnsavedContext } from './contexts/UnsavedContext.jsx';
import { TrustChecks } from './ui/TrustChecks.jsx';
import { WelcomeBanner } from './ui/WelcomeBanner.jsx';
import { HelpPanel } from './ui/HelpPanel.jsx';
import { OnboardingModal } from './ui/OnboardingModal.jsx';
import { Icons } from './ui/ui-common.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { TemplatesPage } from './pages/TemplatesPage.jsx';
import { TransactionsPage } from './pages/TransactionsPage.jsx';
import { CommissionsPage } from './pages/CommissionsPage.jsx';
import { GeneratorPage } from './pages/GeneratorPage.jsx';
import { DraftsPage } from './pages/DraftsPage.jsx';
import NotesCalendar from './pages/NotesCalendar.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import LedgersPage from './pages/LedgersPage.jsx';

import { storageFacade } from './core/storage-facade.js';
import {
  NAV_ITEMS as NAV_ITEMS_BASE,
} from './constants/index.js';
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

// ============================================
// NAVIGATION (ربط الثوابت بأيقونات الملف)
// ============================================
const NAV_ITEMS = NAV_ITEMS_BASE.map((it) => ({ ...it, icon: Icons[it.iconKey] }));

// (extracted)


// ============================================
// APP (Main Router)
// ============================================
const App = () => {
  const [page, setPage] = useState('home');
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

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage setPage={setPage}/>;
      case 'dashboard': return <DashboardPage/>;
      case 'transactions': return <TransactionsPage/>;
      case 'commissions': return <CommissionsPage/>;
      case 'ledgers': return <LedgersPage/>;
      case 'templates': return <TemplatesPage setPage={setPage} setLetterType={setLetterType}/>;
      case 'generator': return <GeneratorPage letterType={letterType} setLetterType={setLetterType}/>;
      case 'drafts': return <DraftsPage setPage={setPage} setLetterType={setLetterType} setEditDraft={setEditDraft}/>;
      case 'calendar': return <NotesCalendar mode="calendar"/>;
      case 'notes': return <NotesCalendar mode="notes"/>;
      case 'settings': return <SettingsPage onShowOnboarding={() => { try { storageFacade.removeRaw(UI_ONBOARDING_SEEN_KEY); } catch {} setShowOnboarding(true); }} />;
      default: return <HomePage setPage={setPage}/>;
    }
  };

  return (
    <ToastProvider>
      <UnsavedContext.Provider value={setDirty}>
        <TrustChecks/>
        <div className="app-shell flex min-h-screen">
          <a href="#main-content" className="skip-link absolute opacity-0 w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 focus:opacity-100 focus:w-auto focus:h-auto focus:py-2 focus:px-4 focus:m-0 focus:overflow-visible focus:z-[100] focus:bg-white focus:text-gray-900 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-blue-600 focus:outline-none focus:fixed focus:top-4 focus:start-4">
            تخطي إلى المحتوى الرئيسي
          </a>
          <Sidebar Icons={Icons} page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onOpenHelp={() => { setHelpSection('start'); setShowHelp(true); }}/>
          <main className="flex-1 min-w-0" id="main-content" role="main" aria-label="المحتوى الرئيسي">
            <Topbar Icons={Icons} page={page} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} headerDateText={headerDateMode !== 'off' ? headerDateText : ''}/>
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
            <div className="print-container">{renderPage()}</div>

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
          </main>
        </div>
      </UnsavedContext.Provider>
    </ToastProvider>
  );
};

export default App;
