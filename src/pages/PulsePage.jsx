/*
  النبض المالي — الصفحة الرئيسية (برومبت 1.5)
  هيكل: PulseHeader → PulseHeroCard → PulseAlerts → WeekForecast → UpcomingDues → PulseFooter
  مع إدارة حالة، كاش، حدث ledger:activeChanged، تحديث كل 5 دقائق، pull-to-refresh.
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { calculatePulse } from '../core/pulse-engine.js';
import { getActiveLedgerId } from '../core/ledger-store.js';
import { formatCurrency } from '../utils/format.jsx';
import PulseHeader from '../ui/pulse/PulseHeader.jsx';
import PulseHeroCard from '../ui/pulse/PulseHeroCard.jsx';
import PulseAlerts from '../ui/pulse/PulseAlerts.jsx';
import WeekForecast from '../ui/pulse/WeekForecast.jsx';
import UpcomingDues from '../ui/pulse/UpcomingDues.jsx';
import PulseFooter from '../ui/pulse/PulseFooter.jsx';

const CACHE_KEY = 'ff_pulse_cache';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PULL_THRESHOLD = 70;

function readCache(activeId) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.ledgerId !== activeId || !data.calculatedAt) return null;
    const age = Date.now() - new Date(data.calculatedAt).getTime();
    if (age >= CACHE_MAX_AGE_MS) return null;
    return data.pulse;
  } catch {
    return null;
  }
}

function writeCache(activeId, pulse) {
  try {
    if (!pulse?.calculatedAt) return;
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ledgerId: activeId, pulse, calculatedAt: pulse.calculatedAt })
    );
  } catch {}
}

export default function PulsePage({ setPage }) {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLedgerId, setActiveLedgerId] = useState(() => getActiveLedgerId() || '');
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const autoRefreshTimer = useRef(null);

  const runCalculate = useCallback((ledgerId, skipCache = false) => {
    const id = (ledgerId != null ? String(ledgerId) : getActiveLedgerId() || '').trim();
    if (!skipCache) {
      const cached = readCache(id);
      if (cached) {
        setPulse(cached);
        setLoading(false);
        setError(null);
      }
    }
    const schedule = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : (fn) => setTimeout(fn, 0);
    schedule(() => {
      try {
        const result = calculatePulse(id || undefined);
        setPulse(result);
        setError(null);
        if (id) writeCache(id, result);
      } catch (e) {
        setError(e?.message || 'حدث خطأ أثناء حساب النبض');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, { timeout: 500 });
  }, []);

  const refresh = useCallback(
    (skipCache = true) => {
      setRefreshing(true);
      setError(null);
      runCalculate(activeLedgerId, skipCache);
    },
    [activeLedgerId, runCalculate]
  );

  // التحميل الأول وتغيير الدفتر
  useEffect(() => {
    setLoading(true);
    const id = getActiveLedgerId() || '';
    setActiveLedgerId(id);
    runCalculate(id, false);
  }, []);

  // استماع حدث تغيير الدفتر النشط
  useEffect(() => {
    const onActiveChanged = () => {
      const id = getActiveLedgerId() || '';
      setActiveLedgerId(id);
      setLoading(true);
      runCalculate(id, false);
    };
    window.addEventListener('ledger:activeChanged', onActiveChanged);
    return () => window.removeEventListener('ledger:activeChanged', onActiveChanged);
  }, [runCalculate]);

  // تحديث تلقائي كل 5 دقائق
  useEffect(() => {
    autoRefreshTimer.current = setInterval(() => {
      const id = getActiveLedgerId() || '';
      if (id) runCalculate(id, true);
    }, AUTO_REFRESH_MS);
    return () => {
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
    };
  }, [runCalculate]);

  // Pull-to-refresh
  const handleTouchStart = (e) => {
    if (window.scrollY <= 0) touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (touchStartY.current === 0) return;
    const y = e.touches[0].clientY;
    const delta = y - touchStartY.current;
    if (delta > 0 && window.scrollY <= 0) setPullY(Math.min(delta, 100));
    else setPullY(0);
  };
  const handleTouchEnd = () => {
    if (pullY >= PULL_THRESHOLD && !refreshing && pulse?.healthStatus !== 'unknown') refresh(true);
    touchStartY.current = 0;
    setPullY(0);
  };

  const noLedger = !activeLedgerId || pulse?.healthStatus === 'unknown';
  const summary = pulse?.ledgerSummary || {};
  const noTransactions = !noLedger && summary.totalTransactions === 0 && summary.activeRecurringItems === 0;

  // Loading: skeleton
  if (loading && pulse == null && !error) {
    return (
      <div
        className="pulse-page min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-y-auto"
        dir="rtl"
      >
        <div className="p-4 md:p-6 max-w-[640px] mx-auto">
          <PulseHeader onOpenLedgers={setPage ? () => setPage('ledgers') : undefined} />
          <div className="animate-pulse rounded-xl bg-gray-100 h-10 w-48 mb-4" />
          <div className="animate-pulse rounded-xl bg-gray-100 h-32 w-full mb-6" />
          <div className="animate-pulse rounded-xl bg-gray-100 h-24 w-full mb-4" />
          <div className="animate-pulse rounded-xl bg-gray-100 h-20 w-full" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div
        className="pulse-page min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-y-auto"
        dir="rtl"
      >
        <div className="p-4 md:p-6 max-w-[640px] mx-auto">
          <PulseHeader onOpenLedgers={setPage ? () => setPage('ledgers') : undefined} />
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <p className="text-gray-700 font-medium">حدث خطأ أثناء تحميل النبض</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button
              type="button"
              onClick={() => refresh(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty: لا يوجد دفتر
  if (noLedger && (pulse == null || pulse.healthStatus === 'unknown')) {
    return (
      <div
        className="pulse-page min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-y-auto"
        dir="rtl"
      >
        <div className="p-4 md:p-6 max-w-[640px] mx-auto flex flex-col gap-6">
          <PulseHeader onOpenLedgers={setPage ? () => setPage('ledgers') : undefined} />
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p className="text-gray-800 font-medium">أنشئ أول دفتر</p>
            <p className="text-sm text-gray-500 mt-1">اختر دفتراً نشطاً من الدفاتر لرؤية النبض المالي</p>
            {setPage && (
              <button
                type="button"
                onClick={() => setPage('ledgers')}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                فتح الدفاتر
              </button>
            )}
          </div>
          <PulseFooter calculatedAt={pulse?.calculatedAt} onRefresh={undefined} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="pulse-page min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-y-auto"
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {pullY > 0 && (
        <div
          className="fixed top-0 left-0 right-0 h-12 flex items-center justify-center bg-gray-100/90 text-gray-600 text-sm z-10"
          style={{ transform: pullY >= PULL_THRESHOLD ? 'scale(1)' : 'scale(0.95)' }}
          aria-live="polite"
        >
          {pullY >= PULL_THRESHOLD ? 'أفلت للتحديث' : 'اسحب للتحديث'}
        </div>
      )}

      <div className="p-4 md:p-6 max-w-[640px] mx-auto flex flex-col gap-6">
        <PulseHeader onOpenLedgers={setPage ? () => setPage('ledgers') : undefined} />

        <PulseHeroCard
          pulse={pulse}
          onRefresh={noLedger ? undefined : refresh}
          onAddTransaction={setPage ? () => setPage('transactions') : undefined}
        />

        {noTransactions && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-center">
            <p className="text-amber-800 font-medium">أضف أول حركة</p>
            <p className="text-sm text-amber-700 mt-1">سجّل دخل أو مصروف لرؤية النبض والتوقعات</p>
            {setPage && (
              <button
                type="button"
                onClick={() => setPage('transactions')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
              >
                سجّل حركة
              </button>
            )}
          </div>
        )}

        {!noLedger && (
          <section aria-live="polite" aria-label="ملخص النبض المالي" className="flex flex-col gap-6">
            <PulseAlerts
              alerts={pulse?.alerts || []}
              onAlertAction={(alert) => {
                if (alert?.actionType === 'record_payment' || alert?.actionType === 'prepare_payment')
                  setPage?.('inbox');
                else if (alert?.actionType === 'review_transaction') setPage?.('transactions');
                else if (alert?.actionType === 'review_forecast') setPage?.('ledgers');
                else setPage?.('inbox');
              }}
              onShowAll={setPage ? () => setPage('inbox') : undefined}
            />

            {pulse?.weekForecast && (
              <WeekForecast
                weekForecast={pulse.weekForecast}
                upcomingDues={pulse.upcomingDues || []}
              />
            )}

            <UpcomingDues
              upcomingDues={pulse?.upcomingDues || []}
              onShowAll={setPage ? () => setPage('inbox') : undefined}
            />

            {summary && (summary.totalTransactions > 0 || summary.activeRecurringItems > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                <div className="flex flex-wrap gap-4">
                  <span>{summary.totalTransactions} حركة</span>
                  <span>{summary.activeRecurringItems} التزام نشط</span>
                  {(summary.monthlyAvgIncome > 0 || summary.monthlyAvgExpense > 0) && (
                    <span>
                      متوسط شهري: دخل {formatCurrency(summary.monthlyAvgIncome)} — مصروف{' '}
                      {formatCurrency(summary.monthlyAvgExpense)}
                    </span>
                  )}
                </div>
                {setPage && (
                  <button
                    type="button"
                    onClick={() => setPage('transactions')}
                    className="text-blue-600 hover:text-blue-700 font-medium no-print"
                  >
                    عرض الحركات
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        <PulseFooter
          calculatedAt={pulse?.calculatedAt}
          onRefresh={noLedger ? undefined : refresh}
          refreshing={refreshing}
        />
      </div>
    </div>
  );
}
