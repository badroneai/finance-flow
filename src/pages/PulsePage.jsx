/*
  النبض المالي — الصفحة الرئيسية (برومبت 1.5)
  هيكل: PulseHeader → PulseHeroCard → PulseAlerts → WeekForecast → UpcomingDues → PulseFooter
  مع إدارة حالة، كاش، حدث ledger:activeChanged، تحديث كل 5 دقائق، pull-to-refresh.
*/
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculatePulse } from '../core/pulse-engine.js';
import { getActiveLedgerId } from '../core/ledger-store.js';
import { useData } from '../contexts/DataContext.jsx';
import { formatCurrency } from '../utils/format.jsx';
import { Icons } from '../ui/ui-common.jsx';
import PulseHeader from '../ui/pulse/PulseHeader.jsx';
import PulseHeroCard from '../ui/pulse/PulseHeroCard.jsx';
import PulseAlerts from '../ui/pulse/PulseAlerts.jsx';
import WeekForecast from '../ui/pulse/WeekForecast.jsx';
import UpcomingDues from '../ui/pulse/UpcomingDues.jsx';
import PulseFooter from '../ui/pulse/PulseFooter.jsx';

/**
 * SPR-009: اختصارات سريعة — تظهر في صفحة النبض لتوفير وصول مباشر
 * للميزات المدفونة (التقارير، الالتزامات، إضافة حركة).
 */
function QuickActions({ navigate }) {
  const actions = [
    {
      label: 'إضافة حركة',
      icon: Icons.plus,
      onClick: () => navigate('/transactions'),
      bg: 'var(--color-primary)',
      color: 'var(--color-text-inverse)',
    },
    {
      label: 'التقرير الشهري',
      icon: Icons.report,
      onClick: () => navigate('/report'),
      bg: 'var(--color-surface)',
      color: 'var(--color-text)',
    },
    {
      label: 'العمولات',
      icon: Icons.commissions,
      onClick: () => navigate('/commissions'),
      bg: 'var(--color-surface)',
      color: 'var(--color-text)',
    },
    {
      label: 'الالتزامات',
      icon: Icons.ledgers,
      onClick: () => navigate('/ledgers?tab=recurring'),
      bg: 'var(--color-surface)',
      color: 'var(--color-text)',
    },
  ];

  return (
    <section aria-label="اختصارات سريعة" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((a) => {
        const ActionIcon = a.icon;
        return (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--color-border)] p-3 text-xs font-medium transition-colors hover:shadow-sm"
            style={{ background: a.bg, color: a.color }}
          >
            {ActionIcon && <ActionIcon size={20} />}
            <span className="leading-tight">{a.label}</span>
          </button>
        );
      })}
    </section>
  );
}

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
  const navigate = useNavigate();
  const { transactions, recurringItems, ledgers, activeLedgerId: dataActiveLedgerId } = useData();

  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLedgerId, setActiveLedgerId] = useState(
    () => dataActiveLedgerId || getActiveLedgerId() || ''
  );
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const autoRefreshTimer = useRef(null);

  // مزامنة الدفتر النشط من DataContext
  useEffect(() => {
    if (dataActiveLedgerId) setActiveLedgerId(dataActiveLedgerId);
  }, [dataActiveLedgerId]);

  // بناء options من DataContext لتمريرها إلى المحرك
  const dataOptions = useCallback(
    () => ({
      transactions,
      recurringItems,
      ledgers,
    }),
    [transactions, recurringItems, ledgers]
  );

  const runCalculate = useCallback(
    (ledgerId, skipCache = false) => {
      const id = (ledgerId != null ? String(ledgerId) : getActiveLedgerId() || '').trim();
      if (!skipCache) {
        const cached = readCache(id);
        if (cached) {
          setPulse(cached);
          setLoading(false);
          setError(null);
        }
      }
      const schedule =
        typeof requestIdleCallback !== 'undefined'
          ? requestIdleCallback
          : (fn) => setTimeout(fn, 0);
      schedule(
        () => {
          try {
            const result = calculatePulse(id || undefined, dataOptions());
            setPulse(result);
            setError(null);
            if (id) writeCache(id, result);
          } catch (e) {
            setError(e?.message || 'حدث خطأ أثناء حساب النبض');
          } finally {
            setLoading(false);
            setRefreshing(false);
          }
        },
        { timeout: 500 }
      );
    },
    [dataOptions]
  );

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
  }, [runCalculate]);

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
  const noTransactions =
    !noLedger && summary.totalTransactions === 0 && summary.activeRecurringItems === 0;

  // Loading: skeleton
  if (loading && pulse == null && !error) {
    return (
      <div className="pulse-page min-h-screen bg-[var(--color-bg)] overflow-y-auto" dir="rtl">
        <div className="p-4 md:p-6 max-w-[640px] mx-auto">
          <PulseHeader onOpenLedgers={setPage ? () => setPage('ledgers') : undefined} />
          <div className="animate-pulse rounded-xl bg-[var(--color-bg)] h-10 w-48 mb-4" />
          <div className="animate-pulse rounded-xl bg-[var(--color-bg)] h-32 w-full mb-6" />
          <div className="animate-pulse rounded-xl bg-[var(--color-bg)] h-24 w-full mb-4" />
          <div className="animate-pulse rounded-xl bg-[var(--color-bg)] h-20 w-full" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="pulse-page min-h-screen bg-[var(--color-bg)] overflow-y-auto" dir="rtl">
        <div className="p-4 md:p-6 max-w-[640px] mx-auto">
          <PulseHeader onOpenLedgers={setPage ? () => setPage('ledgers') : undefined} />
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
            <p className="text-[var(--color-text)] font-medium">حدث خطأ أثناء تحميل النبض</p>
            <p className="text-sm text-[var(--color-muted)] mt-1">{error}</p>
            <button type="button" onClick={() => refresh(true)} className="btn-primary mt-4">
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
      <div className="pulse-page min-h-screen bg-[var(--color-bg)] overflow-y-auto" dir="rtl">
        <div className="p-4 md:p-6 max-w-[640px] mx-auto flex flex-col gap-6">
          <PulseHeader onOpenLedgers={setPage ? () => setPage('ledgers') : undefined} />
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
            <p className="text-[var(--color-text)] font-medium">أنشئ أول دفتر</p>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              اختر دفتراً نشطاً من الدفاتر لرؤية النبض المالي
            </p>
            {setPage && (
              <button type="button" onClick={() => setPage('ledgers')} className="btn-primary mt-4">
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
      className="pulse-page min-h-screen bg-[var(--color-bg)] overflow-y-auto"
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {pullY > 0 && (
        <div
          className="fixed top-0 left-0 right-0 h-12 flex items-center justify-center bg-[var(--color-bg)]/90 text-[var(--color-muted)] text-sm z-10"
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

        {/* SPR-009: اختصارات سريعة */}
        <QuickActions navigate={navigate} />

        {noTransactions && (
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning)',
            }}
          >
            <p className="font-medium" style={{ color: 'var(--color-warning)' }}>
              أضف أول حركة
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-warning)' }}>
              سجّل دخل أو مصروف لرؤية النبض والتوقعات
            </p>
            {setPage && (
              <button
                type="button"
                onClick={() => setPage('transactions')}
                className="btn-primary mt-3"
                style={{ background: 'var(--color-warning)' }}
              >
                سجّل حركة
              </button>
            )}
          </div>
        )}

        {!noLedger && (
          <section
            aria-live="polite"
            aria-label="ملخص النبض المالي"
            className="flex flex-col gap-6"
          >
            <PulseAlerts
              alerts={pulse?.alerts || []}
              onAlertAction={(alert) => {
                if (
                  alert?.actionType === 'record_payment' ||
                  alert?.actionType === 'prepare_payment'
                )
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
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--color-muted)] border-t border-[var(--color-border)] pt-4">
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
                    className="font-medium no-print hover:opacity-80"
                    style={{ color: 'var(--color-info)' }}
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
