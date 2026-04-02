// useLedgerState — orchestrator خفيف يربط الـ hooks الفرعية + القيم المحسوبة
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useData } from '../../contexts/DataContext.jsx';
import {
  getLedgers,
  setLedgers,
  getActiveLedgerId,
  getRecurringItems,
  setRecurringItems,
} from '../../core/ledger-store.js';
import {
  computeLedgerCompleteness,
  computeRecurringDashboard,
  groupRecurringBySections,
  isPastDue,
  isSeededRecurring,
  normalizeCategory as normalizeRecurringCategory,
  normalizeRisk as normalizeRecurringRisk,
  sectionStats,
  sortRecurringInSection,
  isDueWithinDays,
} from '../../core/recurring-intelligence.js';
import {
  normalizeBudgets,
  computeBudgetHealth,
  computeComplianceScore,
  computePL,
  computeTopBuckets,
  filterTransactionsForLedgerByMeta,
  getLast4MonthsTable,
  targetsEvaluation,
} from '../../core/ledger-analytics.js';
import {
  computeLedgerHealth,
  computeLedgerProjection,
  computeScenario,
  isSeededOnly,
  computeComplianceShield,
  calculateBurnRateBundle,
  calculateCashPressureScore,
  calculateNext90DayRisk,
  calculateDisciplineTrend,
  detectHighRiskCluster,
  getDailyPlaybook,
  getBenchmarkComparison,
} from '../../core/ledger-health.js';
import { buildLedgerInbox, addDaysISO, computeCashPlan } from '../../core/ledger-planner.js';
import { lastPayNowAt, daysSince } from '../../core/ledger-item-history.js';
import {
  monthKeyFromDate,
  computeSpendByBucketFromHistory,
  computeBudgetUtilization,
  normalizeBudgets as normalizeAuthorityBudgets,
} from '../../core/ledger-budget-authority.js';
import { dataStore } from '../../core/dataStore.js';
import { seedRecurringForLedger } from '../../domain/ledgerTemplates.js';

// Sub-hooks
import useLedgerCRUD, { normalizeLedgerType } from './useLedgerCRUD.js';
import useRecurringCRUD from './useRecurringCRUD.js';
import usePricing from './usePricing.js';
import usePayment from './usePayment.js';
import useForecast from './useForecast.js';
import {
  LEDGER_TYPE_LABELS,
  CATEGORY_LABEL,
  sections,
  parseRecurringAmount,
} from './ledger-helpers.js';

// ============================================
// الـ Hook الرئيسي (orchestrator)
// ============================================
export default function useLedgerState() {
  const toast = useToast();
  const location = useLocation();
  const {
    ledgers: dataLedgers,
    activeLedgerId: dataActiveLedgerId,
    setActiveLedgerId: setDataActiveLedgerId,
    transactions: dataTransactions,
    recurringItems: dataRecurringItems,
    createLedger: createDataLedger,
    updateLedger: updateDataLedger,
    createRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
    fetchLedgers: fetchDataLedgers,
    fetchRecurringItems: fetchDataRecurringItems,
    fetchTransactions: fetchDataTransactions,
    createTransaction: createDataTransaction,
  } = useData();

  // ============================================
  // الحالة الأساسية (shell-level)
  // ============================================
  const urlTab = new URLSearchParams(location.search).get('tab');
  const [tab, setTab] = useState(urlTab || 'ledgers');
  const [confirm, setConfirm] = useState(null);
  const [ledgers, setLedgersState] = useState([]);
  const [activeId, setActiveIdState] = useState('');
  const [recurring, setRecurringState] = useState([]);

  // Performance tab (income model)
  const [incomeMode, setIncomeMode] = useState('fixed');
  const [incomeFixed, setIncomeFixed] = useState('0');
  const [incomePeak, setIncomePeak] = useState('0');
  const [incomeBase, setIncomeBase] = useState('0');
  const [incomeSave, setIncomeSave] = useState(false);
  const [incomeManual, setIncomeManual] = useState({});
  const [tOperational, setTOperational] = useState('');
  const [tMaintenance, setTMaintenance] = useState('');
  const [tMarketing, setTMarketing] = useState('');

  // Intelligence UI (display-only)
  const [healthHelpOpen, setHealthHelpOpen] = useState(false);
  const [simRentPct, setSimRentPct] = useState(0);
  const [simBillsPct, setSimBillsPct] = useState(0);
  const [simMaintPct, setSimMaintPct] = useState(0);
  const [brainDetails, setBrainDetails] = useState(null);

  // Inbox + authority
  const [inboxFilter, setInboxFilter] = useState('all');
  const [, setHistoryModal] = useState(null);
  const [authorityOpen, setAuthorityOpen] = useState(true);

  // ============================================
  // Effects
  // ============================================
  const refresh = useCallback(async () => {
    try {
      await fetchDataLedgers();
      await fetchDataRecurringItems();
      await fetchDataTransactions();
    } catch {}
  }, [fetchDataLedgers, fetchDataRecurringItems, fetchDataTransactions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // مزامنة الحالة المحلية مع DataContext
  useEffect(() => {
    try {
      const ld = Array.isArray(dataLedgers) && dataLedgers.length > 0 ? dataLedgers : getLedgers();
      setLedgersState(ld || []);
    } catch {
      setLedgersState([]);
      toast.error('تعذر تحميل قائمة الدفاتر. تحقق من التخزين أو أعد تحميل الصفحة.');
    }
    try {
      setActiveIdState(dataActiveLedgerId || getActiveLedgerId() || '');
    } catch {
      setActiveIdState('');
    }
    try {
      const rd =
        Array.isArray(dataRecurringItems) && dataRecurringItems.length > 0
          ? dataRecurringItems
          : getRecurringItems() || [];
      setRecurringState(rd);
    } catch {
      setRecurringState([]);
    }
  }, [dataLedgers, dataActiveLedgerId, dataRecurringItems, toast]);

  // URL/sessionStorage tab routing
  useEffect(() => {
    const validTabs = ['recurring', 'reports', 'performance', 'compare'];
    const qTab = new URLSearchParams(location.search).get('tab');
    if (qTab && validTabs.includes(qTab)) {
      setTab(qTab);
      return;
    }
    try {
      const openTab = sessionStorage.getItem('ff_ledgers_open_tab');
      if (openTab && validTabs.includes(openTab)) {
        setTab(openTab);
        sessionStorage.removeItem('ff_ledgers_open_tab');
      }
    } catch {}
  }, [location.search]);

  // مزامنة الميزانية ونموذج الدخل
  useEffect(() => {
    const cur = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === activeId) || null;
    // budgetForm يُدار بواسطة useRecurringCRUD — لكن income model هنا
    const im = cur?.incomeModel && typeof cur.incomeModel === 'object' ? cur.incomeModel : null;
    if (im) {
      setIncomeMode(String(im.mode || 'fixed'));
      setIncomeFixed(String(im.fixedMonthly ?? '0'));
      setIncomePeak(String(im.peakMonthly ?? '0'));
      setIncomeBase(String(im.baseMonthly ?? '0'));
      setIncomeManual(
        im.manualByMonth && typeof im.manualByMonth === 'object' ? im.manualByMonth : {}
      );
      setIncomeSave(true);
    } else {
      setIncomeSave(false);
    }
    const months = (() => {
      const list = [];
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      for (let i = 0; i < 6; i++) {
        const x = new Date(d.getTime());
        x.setMonth(d.getMonth() + i);
        list.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
      }
      return list;
    })();
    setIncomeManual((prev) => {
      const next = { ...(prev || {}) };
      for (const k of months) if (next[k] == null) next[k] = '0';
      return next;
    });
  }, [activeId, ledgers]);

  // ============================================
  // القيم المحسوبة الأساسية
  // ============================================
  const activeLedger =
    (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === activeId) || null;
  const activeRecurringRaw = (Array.isArray(recurring) ? recurring : []).filter(
    (r) => r.ledgerId === activeId
  );
  const activeRecurring = [...activeRecurringRaw];
  const recurringDashboard = computeRecurringDashboard(activeRecurring);
  const completeness = computeLedgerCompleteness(activeRecurring);
  const recurringSections = groupRecurringBySections(activeRecurring);
  const grouped = recurringSections;
  const seededOnlyList = activeRecurring.filter(isSeededOnly);
  const unpricedList = activeRecurring.filter((x) => Number(x?.amount) === 0);

  const allTransactionsRef = useMemo(() => {
    return Array.isArray(dataTransactions) && dataTransactions.length > 0
      ? dataTransactions
      : dataStore.transactions.list() || [];
  }, [dataTransactions]);

  const ledgerTxs = useMemo(() => {
    if (!activeId) return [];
    return filterTransactionsForLedgerByMeta({
      transactions: allTransactionsRef,
      ledgerId: activeId,
    });
  }, [activeId, allTransactionsRef]);

  const health = useMemo(() => {
    if (!activeId) return null;
    return computeLedgerHealth({ recurringItems: seededOnlyList, transactions: ledgerTxs });
  }, [activeId, seededOnlyList, ledgerTxs]);

  const brainCtx = useMemo(
    () => ({
      ledgerType: String(activeLedger?.type || 'office'),
      recurringItems: Array.isArray(recurring) ? recurring : [],
      transactions: ledgerTxs,
    }),
    [activeLedger, recurring, ledgerTxs]
  );

  const brain = useMemo(() => {
    if (!activeId) return null;
    return {
      burn: calculateBurnRateBundle(activeId, brainCtx),
      pressure: calculateCashPressureScore(activeId, brainCtx),
      risk90: calculateNext90DayRisk(activeId, brainCtx),
      trend: calculateDisciplineTrend(activeId, brainCtx),
      cluster: detectHighRiskCluster(activeId, brainCtx),
      playbook: getDailyPlaybook(activeId, brainCtx),
      benchmarks: getBenchmarkComparison(activeId, brainCtx),
    };
  }, [activeId, brainCtx]);

  const projection = computeLedgerProjection({ recurringItems: seededOnlyList });

  const inbox = buildLedgerInbox({
    ledgerId: activeId,
    recurringItems: recurring,
    now: new Date(),
  });
  const cashPlan = computeCashPlan({
    ledgerId: activeId,
    recurringItems: recurring,
    now: new Date(),
  });

  const budgets = normalizeAuthorityBudgets(activeLedger?.budgets);
  const spendByBucket = computeSpendByBucketFromHistory({
    ledgerId: activeId,
    recurringItems: Array.isArray(recurring) ? recurring : [],
    monthKey: monthKeyFromDate(new Date()),
  });
  const budgetAuth = computeBudgetUtilization({ budgets, spendByBucket, softThreshold: 0.8 });
  const complianceShield = computeComplianceShield({
    ledgerId: activeId,
    recurringItems: Array.isArray(recurring) ? recurring : [],
    now: new Date(),
  });

  const inboxView = (() => {
    const list = Array.isArray(inbox) ? inbox : [];
    if (inboxFilter === 'overdue')
      return list.filter((x) => String(x.reason || '').includes('متأخر'));
    if (inboxFilter === 'soon')
      return list.filter(
        (x) => String(x.reason || '').includes('7') || String(x.reason || '').includes('14')
      );
    if (inboxFilter === 'unpriced') return list.filter((x) => Number(x.amount) === 0);
    if (inboxFilter === 'high') return list.filter((x) => String(x.reason || '').includes('خطر'));
    return list;
  })();

  const operatorMode = (() => {
    const list = activeRecurring;
    const overdue = list.filter((x) => isPastDue(x));
    const upcoming14 = list.filter((x) => !isPastDue(x) && isDueWithinDays(x, 14));
    const byDueAsc = (a, b) => {
      const da = new Date(String(a?.nextDueDate || '') + 'T00:00:00').getTime();
      const db = new Date(String(b?.nextDueDate || '') + 'T00:00:00').getTime();
      return (da || 0) - (db || 0);
    };
    return {
      priorityNow: [...overdue.sort(byDueAsc), ...upcoming14.sort(byDueAsc)].slice(0, 10),
      overdueCount: overdue.length,
      upcoming14Count: upcoming14.length,
      pricedCount: list.filter((x) => Number(x?.amount) > 0).length,
      unpricedCount: list.filter((x) => Number(x?.amount) === 0).length,
      monthlyTotal: list
        .filter(
          (x) => String(x.frequency || '').toLowerCase() === 'monthly' && Number(x.amount) > 0
        )
        .reduce((a, x) => a + Number(x.amount), 0),
    };
  })();

  const outlook = (() => {
    const list = activeRecurring;
    const within = (days) => {
      const due = list.filter((x) => isDueWithinDays(x, days));
      return {
        pricedTotal: due
          .filter((x) => Number(x?.amount) > 0)
          .reduce((a, x) => a + Number(x.amount), 0),
        count: due.length,
        unpricedCount: due.filter((x) => Number(x?.amount) === 0).length,
      };
    };
    return { d30: within(30), d60: within(60), d90: within(90) };
  })();

  const actuals = (() => {
    const priced = activeRecurring.filter((x) => Number(x?.amount) > 0);
    return {
      actualMonthly: priced
        .filter((x) => String(x.frequency || '').toLowerCase() === 'monthly')
        .reduce((a, x) => a + Number(x.amount), 0),
      actualYearly: priced
        .filter((x) => String(x.frequency || '').toLowerCase() === 'yearly')
        .reduce((a, x) => a + Number(x.amount), 0),
    };
  })();

  const budgetsHealth = computeBudgetHealth({
    actualMonthly: actuals.actualMonthly,
    actualYearly: actuals.actualYearly,
    budgets: activeLedger?.budgets,
  });

  const ledgerAlerts = (() => {
    const alerts = [];
    const seeded = activeRecurring.filter(isSeededRecurring);
    const overdue = seeded.filter((x) => isPastDue(x));
    const highRiskUnpriced = seeded.filter(
      (x) => String(x.riskLevel || '').toLowerCase() === 'high' && Number(x.amount) === 0
    );
    if (overdue.length)
      alerts.push({
        id: 'overdue',
        title: 'استحقاقات متأخرة',
        reason: `لديك ${overdue.length} التزام(ات) متأخر(ة).`,
        action: 'scroll-overdue',
      });
    if (highRiskUnpriced.length)
      alerts.push({
        id: 'highrisk-unpriced',
        title: 'بنود عالية الخطورة غير مُسعّرة',
        reason: `لديك ${highRiskUnpriced.length} بند عالي الخطورة بدون مبلغ.`,
        action: 'open-pricing',
      });
    if (
      (budgetsHealth.monthlyTarget || budgetsHealth.yearlyTarget) &&
      budgetsHealth.status === 'danger'
    )
      alerts.push({
        id: 'budget',
        title: 'تجاوز للميزانية',
        reason: 'إجماليات الالتزامات أعلى من الهدف.',
        action: 'scroll-summary',
      });
    const comp = computeLedgerCompleteness(activeRecurring);
    if (comp && comp.pct < 60)
      alerts.push({
        id: 'completion',
        title: 'اكتمال منخفض',
        reason: `اكتمال التسعير ${comp.pct}% فقط.`,
        action: 'open-pricing',
      });
    return alerts;
  })();

  const ledgerReports = (() => {
    if (!activeId) return null;
    const txs = filterTransactionsForLedgerByMeta({
      transactions: allTransactionsRef,
      ledgerId: activeId,
    });
    const now = new Date();
    const daysAgo = (n) => {
      const d = new Date(now.getTime());
      d.setDate(d.getDate() - n);
      return d;
    };
    const filterByDays = (n) =>
      txs.filter((t) => {
        const dt = new Date(String(t.date || '') + 'T00:00:00');
        return !Number.isNaN(dt.getTime()) && dt.getTime() >= daysAgo(n).getTime();
      });
    return {
      txCount: txs.length,
      pl30: computePL({ transactions: filterByDays(30) }),
      pl365: computePL({ transactions: filterByDays(365) }),
      topBuckets: computeTopBuckets({ transactions: txs, limit: 5 }),
      compliance: computeComplianceScore({ recurringItems: activeRecurring, budgetsHealth }),
    };
  })();

  const allTxsForLedgerCards = allTransactionsRef;

  // ============================================
  // Sub-hooks
  // ============================================
  const ledgerCRUD = useLedgerCRUD({
    toast,
    createDataLedger,
    updateDataLedger,
    setDataActiveLedgerId,
    refresh,
    ledgers,
  });

  const recurringCRUD = useRecurringCRUD({
    toast,
    activeId,
    ledgers,
    recurring,
    setRecurringState,
    updateDataLedger,
    updateRecurringItem,
    deleteRecurringItem,
    refresh,
    setConfirm,
  });

  const pricing = usePricing({
    toast,
    activeId,
    recurring,
    setRecurringState,
    refresh,
    unpricedList,
  });

  const payment = usePayment({
    toast,
    activeId,
    createDataTransaction,
    updateRecurringOps: recurringCRUD.updateRecurringOps,
    refresh,
  });

  const forecastHook = useForecast({ seededOnlyList });

  // مزامنة budgetForm مع الدفتر النشط
  const { setBudgetForm } = recurringCRUD;
  useEffect(() => {
    const cur = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === activeId) || null;
    const b = normalizeBudgets(cur?.budgets);
    setBudgetForm({
      monthlyTarget: b.monthlyTarget ? String(b.monthlyTarget) : '',
      yearlyTarget: b.yearlyTarget ? String(b.yearlyTarget) : '',
    });
  }, [activeId, ledgers, setBudgetForm]);

  const handleLedgerTabSelect = useCallback((tabId) => setTab(tabId), []);

  // ============================================
  // القيمة المُرجَعة — تجميع كل شيء
  // ============================================
  return {
    // أساسي
    toast,
    tab,
    setTab,
    confirm,
    setConfirm,
    refresh,

    // الدفاتر
    ledgers,
    activeId,
    activeLedger,
    activeRecurringRaw,
    activeRecurring,
    recurring,
    handleLedgerTabSelect,
    LEDGER_TYPE_LABELS,
    normalizeLedgerType,

    // CRUD الدفاتر (من useLedgerCRUD)
    ...ledgerCRUD,

    // الالتزامات (من useRecurringCRUD)
    ...recurringCRUD,

    // الميزانيات (محسوبة)
    budgets,
    budgetAuth,
    budgetsHealth,
    spendByBucket,

    // التسعير (من usePricing)
    ...pricing,
    unpricedList,

    // الدفع (من usePayment)
    ...payment,

    // الذكاء والصحة
    health,
    healthHelpOpen,
    setHealthHelpOpen,
    projection,
    simRentPct,
    setSimRentPct,
    simBillsPct,
    setSimBillsPct,
    simMaintPct,
    setSimMaintPct,
    brain,
    brainDetails,
    setBrainDetails,

    // التوقعات (من useForecast)
    ...forecastHook,

    // الوارد والسلطة
    inbox,
    cashPlan,
    inboxFilter,
    setInboxFilter,
    inboxView,
    setHistoryModal,
    authorityOpen,
    setAuthorityOpen,
    compliance: complianceShield,

    // الأداء
    incomeMode,
    setIncomeMode,
    incomeFixed,
    setIncomeFixed,
    incomePeak,
    setIncomePeak,
    incomeBase,
    setIncomeBase,
    incomeManual,
    setIncomeManual,
    incomeSave,
    setIncomeSave,
    tOperational,
    setTOperational,
    tMaintenance,
    setTMaintenance,
    tMarketing,
    setTMarketing,

    // القيم المحسوبة
    recurringDashboard,
    completeness,
    recurringSections,
    grouped,
    sections,
    seededOnlyList,
    operatorMode,
    outlook,
    actuals,
    ledgerAlerts,
    ledgerReports,
    allTxsForLedgerCards,
    allTransactionsRef,
    CATEGORY_LABEL,

    // المساعدات
    parseRecurringAmount,
    normalizeRecurringCategory,
    normalizeRecurringRisk,
    sectionStats,
    sortRecurringInSection,
    isSeededRecurring,
    isSeededOnly,
    isPastDue,
    isDueWithinDays,
    normalizeBudgets,
    computeScenario,
    lastPayNowAt,
    daysSince,
    addDaysISO,
    filterTransactionsForLedgerByMeta,
    dataStore,
    setLedgers,
    setRecurringItems,
    seedRecurringForLedger,
    createRecurringItem,
    createDataTransaction,
    getLast4MonthsTable,
    targetsEvaluation,
  };
}
