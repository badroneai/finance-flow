import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { EmptyState, Badge, Icons } from '../ui/ui-common.jsx';
import { Currency } from '../utils/format.jsx';
import { LedgerTabErrorBoundary } from '../ui/ErrorBoundaries.jsx';
import { LedgerHeader } from '../ui/ledger/LedgerHeader.jsx';
import { LedgerTabsShell } from '../ui/ledger/LedgerTabsShell.jsx';
import LedgerRecurringTab from '../tabs/LedgerRecurringTab.jsx';
import LedgerPerformanceTab from '../tabs/LedgerPerformanceTab.jsx';
import LedgerReportsTab from '../tabs/LedgerReportsTab.jsx';
import LedgerCompare from '../ui/ledger/LedgerCompare.jsx';
import { invariant, assertFn } from '../core/contracts.js';
import {
  getLedgers,
  setLedgers,
  getActiveLedgerId,
  setActiveLedgerId,
  getRecurringItems,
  setRecurringItems,
} from '../core/ledger-store.js';
import { seedRecurringForLedger } from '../domain/ledgerTemplates.js';
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
} from '../core/recurring-intelligence.js';
import {
  normalizeBudgets,
  computeBudgetHealth,
  buildTxMetaFromRecurring,
  computeComplianceScore,
  computePL,
  computeTopBuckets,
  filterTransactionsForLedgerByMeta,
  getBucketForRecurring,
  getLast4MonthsTable,
  targetsEvaluation,
} from '../core/ledger-analytics.js';
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
  getBurnBreakdown,
  getPressureBreakdown,
  getRiskBreakdown90d,
  getDailyPlaybook,
  getBenchmarkComparison,
} from '../core/ledger-health.js';
import {
  buildLedgerInbox,
  addDaysISO,
  computeCashPlan,
  normalizeMonthlyRunRate,
  forecast6m,
  cashGapModel,
  insightsFromForecast,
} from '../core/ledger-planner.js';

import {
  pushHistoryEntry,
  summarizePayNow,
  lastPayNowAt,
  daysSince,
} from '../core/ledger-item-history.js';

import {
  monthKeyFromDate,
  computeSpendByBucketFromHistory,
  computeBudgetUtilization,
  wouldBreachHardLock,
  normalizeBudgets as normalizeAuthorityBudgets,
} from '../core/ledger-budget-authority.js';

import { dataStore } from '../core/dataStore.js';
import { KEYS, MSG } from '../constants/index.js';
import { today, isValidDateStr, safeNum } from '../utils/helpers.js';

// ============================================
// LEDGERS PAGE
// ============================================
const LedgersPage = ({ setPage }) => {
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
    deleteLedger: deleteDataLedger,
    createRecurringItem,
    updateRecurringItem,
    deleteRecurringItem,
    fetchLedgers: fetchDataLedgers,
    fetchRecurringItems: fetchDataRecurringItems,
    fetchTransactions: fetchDataTransactions,
    createTransaction: createDataTransaction,
    isCloudMode,
  } = useData();

  // SPR-009: قراءة تبويب من URL parameter (مثلاً #/ledgers?tab=recurring)
  const urlTab = new URLSearchParams(location.search).get('tab');
  const [tab, setTab] = useState(urlTab || 'ledgers'); // ledgers | recurring | reports | performance
  const [confirm, setConfirm] = useState(null);

  const [ledgers, setLedgersState] = useState([]);
  const [activeId, setActiveIdState] = useState('');

  // Performance tab (income model + targets) — UI state (optionally saved inside ledger object)
  const [incomeMode, setIncomeMode] = useState('fixed'); // fixed | seasonal | manual
  const [incomeFixed, setIncomeFixed] = useState('0');
  const [incomePeak, setIncomePeak] = useState('0');
  const [incomeBase, setIncomeBase] = useState('0');
  const [incomeSave, setIncomeSave] = useState(false);
  const [incomeManual, setIncomeManual] = useState({}); // {monthKey: value}

  const [tOperational, setTOperational] = useState('');
  const [tMaintenance, setTMaintenance] = useState('');
  const [tMarketing, setTMarketing] = useState('');

  const LEDGER_TYPE_LABELS = {
    office: 'مكتب',
    chalet: 'شاليه',
    apartment: 'شقة',
    villa: 'فيلا',
    building: 'عمارة',
    personal: 'شخصي',
    other: 'أخرى',
  };

  const normalizeLedgerType = (t) => {
    const x = String(t || '').toLowerCase();
    return x === 'office' ||
      x === 'chalet' ||
      x === 'apartment' ||
      x === 'villa' ||
      x === 'building' ||
      x === 'personal' ||
      x === 'other'
      ? x
      : 'office';
  };

  const normalizeNote = (s) => {
    const x = String(s ?? '').trim();
    if (!x) return '';
    return x.length > 120 ? x.slice(0, 120) : x;
  };

  // Ledgers CRUD
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('office');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState('office');
  const [editingNote, setEditingNote] = useState('');

  // Recurring items CRUD (linked by active ledger id)
  const [recurring, setRecurringState] = useState([]);
  const [recForm, setRecForm] = useState({
    title: '',
    amount: '',
    frequency: 'monthly',
    nextDueDate: '',
    notes: '',
  });
  const [recEditingId, setRecEditingId] = useState(null);

  // Budget targets (stored inside active ledger object)
  const [budgetForm, setBudgetForm] = useState({ monthlyTarget: '', yearlyTarget: '' });

  // Quick pricing wizard
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingIndex, setPricingIndex] = useState(0);
  const [pricingAmount, setPricingAmount] = useState('');
  const [pricingDate, setPricingDate] = useState('');

  // Saudi auto-pricing wizard v2
  const [saPricingOpen, setSaPricingOpen] = useState(false);
  const [saCity, setSaCity] = useState('riyadh');
  const [saSize, setSaSize] = useState('medium');
  const [saOnlyUnpriced, setSaOnlyUnpriced] = useState(true);

  // Convert-to-transaction modal
  const [payOpen, setPayOpen] = useState(false);
  const [paySource, setPaySource] = useState(null); // recurring item
  const [payForm, setPayForm] = useState({
    type: 'expense',
    category: 'other',
    paymentMethod: 'cash',
    amount: '',
    date: '',
    description: '',
  });

  // Intelligence UI (display-only; no storage)
  const [healthHelpOpen, setHealthHelpOpen] = useState(false);
  const [simRentPct, setSimRentPct] = useState(0);
  const [simBillsPct, setSimBillsPct] = useState(0);
  const [simMaintPct, setSimMaintPct] = useState(0);

  // Ledger Brain Pro UI (breakdowns + playbook)
  const [brainDetails, setBrainDetails] = useState(null); // null | 'burn' | 'pressure' | 'risk90' | 'trend'

  // Predictive Ledger v4 (runtime-only; no storage)
  const [forecastPreset, setForecastPreset] = useState('realistic'); // optimistic | realistic | stressed | custom
  const [assumedInflow, setAssumedInflow] = useState('0');
  const [scRent, setScRent] = useState(1.0);
  const [scUtilities, setScUtilities] = useState(1.0);
  const [scMaintenance, setScMaintenance] = useState(1.0);
  const [scMarketing, setScMarketing] = useState(1.0);
  const [scOther, setScOther] = useState(1.0);

  // Supports Arabic/Indic numerals and common separators for amount parsing.
  const normalizeNumeralsToAscii = (input) => {
    const s = String(input ?? '');
    const map = {
      // Arabic-Indic
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9',
      // Eastern Arabic-Indic (Persian)
      '۰': '0',
      '۱': '1',
      '۲': '2',
      '۳': '3',
      '۴': '4',
      '۵': '5',
      '۶': '6',
      '۷': '7',
      '۸': '8',
      '۹': '9',
    };
    return (
      s
        .split('')
        .map((ch) => map[ch] ?? ch)
        // remove thousands separators + spaces
        .join('')
        .replace(/[\s\u00A0]/g, '')
        .replace(/[٬,]/g, '')
        // normalize decimal separators
        .replace(/[٫]/g, '.')
    );
  };

  const parseRecurringAmount = (raw) => {
    const normalized = normalizeNumeralsToAscii(raw);
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  };

  // SPR-008: فصل الجلب عن مزامنة الحالة المحلية لمنع حلقة لا نهائية.
  // سابقاً: refresh كانت تجلب + تقرأ حالة DataContext في نفس useCallback
  // مما جعل البيانات المُحدّثة تُعيد إنشاء refresh → تُشغّل الـ effect → جلب مرة أخرى → حلقة.

  // (1) جلب البيانات فقط — بدون قراءة حالة DataContext
  const refresh = useCallback(async () => {
    try {
      await fetchDataLedgers();
      await fetchDataRecurringItems();
      await fetchDataTransactions();
    } catch {}
  }, [fetchDataLedgers, fetchDataRecurringItems, fetchDataTransactions]);

  // جلب أولي عند التحميل
  useEffect(() => {
    refresh();
  }, [refresh]);

  // (2) مزامنة الحالة المحلية عند تغيّر بيانات DataContext
  useEffect(() => {
    try {
      const ledgersData =
        Array.isArray(dataLedgers) && dataLedgers.length > 0 ? dataLedgers : getLedgers();
      setLedgersState(ledgersData || []);
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
      const recData =
        Array.isArray(dataRecurringItems) && dataRecurringItems.length > 0
          ? dataRecurringItems
          : getRecurringItems() || [];
      setRecurringState(recData);
    } catch {
      setRecurringState([]);
    }
  }, [dataLedgers, dataActiveLedgerId, dataRecurringItems, toast]);

  // فتح تبويب محدد من خارج الصفحة (مثلاً من المستحقات: إدارة الالتزامات)
  // SPR-009: يدعم أيضاً URL parameter مثل #/ledgers?tab=recurring
  useEffect(() => {
    const validTabs = ['recurring', 'reports', 'performance', 'compare'];
    // أولوية 1: URL query param
    const qTab = new URLSearchParams(location.search).get('tab');
    if (qTab && validTabs.includes(qTab)) {
      setTab(qTab);
      return;
    }
    // أولوية 2: sessionStorage (التوافق مع الكود القديم)
    try {
      const openTab = sessionStorage.getItem('ff_ledgers_open_tab');
      if (openTab && validTabs.includes(openTab)) {
        setTab(openTab);
        sessionStorage.removeItem('ff_ledgers_open_tab');
      }
    } catch (_) {}
  }, [location.search]);

  // Keep budget form in sync with active ledger
  useEffect(() => {
    const b = normalizeBudgets(activeLedger?.budgets);
    setBudgetForm({
      monthlyTarget: b.monthlyTarget ? String(b.monthlyTarget) : '',
      yearlyTarget: b.yearlyTarget ? String(b.yearlyTarget) : '',
    });

    // Load saved incomeModel (if any) from ledger object
    const im =
      activeLedger?.incomeModel && typeof activeLedger.incomeModel === 'object'
        ? activeLedger.incomeModel
        : null;
    if (im) {
      const m = String(im.mode || 'fixed');
      setIncomeMode(m);
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

    // Initialize manual inputs for next 6 months (runtime-only)
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
  }, [activeId]);

  const createLedger = async () => {
    const t = (newName || '').trim();
    if (!t) {
      toast.error('اسم الدفتر مطلوب');
      return;
    }

    const ts = new Date().toISOString();
    const id = (() => {
      try {
        if (crypto && typeof crypto.randomUUID === 'function') return `ledg_${crypto.randomUUID()}`;
      } catch {}
      return `ledg_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    })();

    const newLedger = {
      id,
      name: t,
      type: normalizeLedgerType(newType),
      note: normalizeNote(newNote),
      currency: 'SAR',
      createdAt: ts,
      updatedAt: ts,
      archived: false,
    };

    try {
      await createDataLedger(newLedger);
    } catch {
      toast.error('تعذر حفظ الدفتر');
      return;
    }

    try {
      if (!getActiveLedgerId()) setDataActiveLedgerId(id);
    } catch {}

    setNewName('');
    setNewType('office');
    setNewNote('');
    toast.success('تمت إضافة الدفتر');
    refresh();
  };

  const startEdit = (ledger) => {
    setEditingId(ledger.id);
    setEditingName(ledger.name || '');
    setEditingType(normalizeLedgerType(ledger.type));
    setEditingNote(String(ledger.note ?? ''));
  };

  const saveEdit = async () => {
    const t = (editingName || '').trim();
    if (!t) {
      toast.error('اسم الدفتر مطلوب');
      return;
    }

    const ledgerToUpdate = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === editingId);
    if (!ledgerToUpdate) {
      toast.error('لم يتم العثور على الدفتر');
      return;
    }

    try {
      await updateDataLedger(editingId, {
        name: t,
        type: normalizeLedgerType(editingType),
        note: normalizeNote(editingNote),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast.error('تعذر حفظ التعديل');
      return;
    }

    toast.success('تم تحديث الدفتر');
    setEditingId(null);
    setEditingName('');
    setEditingType('office');
    setEditingNote('');
    refresh();
  };

  const setActive = (id) => {
    try {
      setActiveLedgerId(id);
      setDataActiveLedgerId(id);
    } catch {
      toast.error('تعذر تعيين الدفتر النشط');
      return;
    }
    toast.success('تم تعيين الدفتر النشط');
    refresh();
  };

  const activeLedger =
    (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === activeId) || null;
  const activeRecurringRaw = (Array.isArray(recurring) ? recurring : []).filter(
    (r) => r.ledgerId === activeId
  );

  const CATEGORY_LABEL = {
    system: 'إيجار ورسوم',
    operational: 'تشغيل ومرافق',
    maintenance: 'صيانة',
    marketing: 'تسويق وإعلان',
    adhoc: 'عند الحاجة',
  };

  const activeRecurring = [...activeRecurringRaw];
  const recurringDashboard = computeRecurringDashboard(activeRecurring);
  const completeness = computeLedgerCompleteness(activeRecurring);
  const recurringSections = groupRecurringBySections(activeRecurring);

  // Stage 6 extraction: keep section metadata 1:1 for LedgerRecurringTab
  const sections = [
    { key: 'system', title: 'نظامي' },
    { key: 'operational', title: 'تشغيلي' },
    { key: 'maintenance', title: 'صيانة' },
    { key: 'marketing', title: 'تسويق' },
    { key: 'adhoc', title: 'عند الحاجة' },
    { key: 'uncategorized', title: 'أخرى' },
  ];
  const grouped = recurringSections;

  const seededOnlyList = activeRecurring.filter(isSeededOnly);

  // P0 #4 و P0 #8 — useMemo لتقليل إعادة الحساب (ledgerTxs + brain)
  // SPR-006: prefer DataContext transactions, fallback to localStorage
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

  const brainCtx = useMemo(() => {
    const ledgerType = String(activeLedger?.type || 'office');
    return {
      ledgerType,
      recurringItems: Array.isArray(recurring) ? recurring : [],
      transactions: ledgerTxs,
    };
  }, [activeLedger, recurring, ledgerTxs]);

  const brain = useMemo(() => {
    if (!activeId) return null;
    const burn = calculateBurnRateBundle(activeId, brainCtx);
    const pressure = calculateCashPressureScore(activeId, brainCtx);
    const risk90 = calculateNext90DayRisk(activeId, brainCtx);
    const trend = calculateDisciplineTrend(activeId, brainCtx);
    const cluster = detectHighRiskCluster(activeId, brainCtx);
    const playbook = getDailyPlaybook(activeId, brainCtx);
    const benchmarks = getBenchmarkComparison(activeId, brainCtx);
    return { burn, pressure, risk90, trend, cluster, playbook, benchmarks };
  }, [activeId, brainCtx]);

  const projection = computeLedgerProjection({ recurringItems: seededOnlyList });

  const forecastScenario = (() => {
    if (forecastPreset === 'optimistic')
      return {
        rent: 0.95,
        utilities: 0.9,
        maintenance: 0.85,
        marketing: 0.9,
        system: 1.0,
        other: 1.0,
      };
    if (forecastPreset === 'stressed')
      return {
        rent: 1.05,
        utilities: 1.15,
        maintenance: 1.25,
        marketing: 1.1,
        system: 1.0,
        other: 1.0,
      };
    if (forecastPreset === 'custom')
      return {
        rent: scRent,
        utilities: scUtilities,
        maintenance: scMaintenance,
        marketing: scMarketing,
        system: 1.0,
        other: scOther,
      };
    return { rent: 1.0, utilities: 1.0, maintenance: 1.0, marketing: 1.0, system: 1.0, other: 1.0 };
  })();

  const forecastRunRate = normalizeMonthlyRunRate(
    seededOnlyList.filter((r) => Number(r?.amount) > 0)
  );
  const forecast = forecast6m(seededOnlyList, forecastScenario);
  const cashGap = cashGapModel(forecast, parseRecurringAmount(assumedInflow));
  const forecastInsights = insightsFromForecast(forecast, cashGap);

  const unpricedList = activeRecurring.filter((x) => Number(x?.amount) === 0);

  // Pricing wizard list (Stage 6 extraction: keep 1:1 behavior)
  const pricingList = unpricedList;

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

  const compliance = computeComplianceShield({
    ledgerId: activeId,
    recurringItems: Array.isArray(recurring) ? recurring : [],
    now: new Date(),
  });

  const [inboxFilter, setInboxFilter] = useState('all'); // all|overdue|soon|unpriced|high
  const [historyModal, setHistoryModal] = useState(null); // null | { item }
  const [authorityOpen, setAuthorityOpen] = useState(true);

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

    const priorityNow = [...overdue.sort(byDueAsc), ...upcoming14.sort(byDueAsc)].slice(0, 10);

    const pricedCount = list.filter((x) => Number(x?.amount) > 0).length;
    const unpricedCount = list.filter((x) => Number(x?.amount) === 0).length;
    const monthlyTotal = list
      .filter((x) => String(x.frequency || '').toLowerCase() === 'monthly' && Number(x.amount) > 0)
      .reduce((a, x) => a + Number(x.amount), 0);

    return {
      priorityNow,
      overdueCount: overdue.length,
      upcoming14Count: upcoming14.length,
      pricedCount,
      unpricedCount,
      monthlyTotal,
    };
  })();

  const outlook = (() => {
    const list = activeRecurring;
    const within = (days) => {
      const due = list.filter((x) => isDueWithinDays(x, days));
      const pricedTotal = due
        .filter((x) => Number(x?.amount) > 0)
        .reduce((a, x) => a + Number(x.amount), 0);
      const unpricedCount = due.filter((x) => Number(x?.amount) === 0).length;
      return { pricedTotal, count: due.length, unpricedCount };
    };
    return {
      d30: within(30),
      d60: within(60),
      d90: within(90),
    };
  })();

  const actuals = (() => {
    const priced = activeRecurring.filter((x) => Number(x?.amount) > 0);
    const actualMonthly = priced
      .filter((x) => String(x.frequency || '').toLowerCase() === 'monthly')
      .reduce((a, x) => a + Number(x.amount), 0);
    const actualYearly = priced
      .filter((x) => String(x.frequency || '').toLowerCase() === 'yearly')
      .reduce((a, x) => a + Number(x.amount), 0);
    return { actualMonthly, actualYearly };
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
    const completeness = computeLedgerCompleteness(activeRecurring);
    if (completeness && completeness.pct < 60)
      alerts.push({
        id: 'completion',
        title: 'اكتمال منخفض',
        reason: `اكتمال التسعير ${completeness.pct}% فقط.`,
        action: 'open-pricing',
      });
    return alerts;
  })();

  const ledgerReports = (() => {
    if (!activeId) return null;
    // SPR-006: use DataContext transactions via allTransactionsRef
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
    const last30 = txs.filter((t) => {
      const dt = new Date(String(t.date || '') + 'T00:00:00');
      if (Number.isNaN(dt.getTime())) return false;
      return dt.getTime() >= daysAgo(30).getTime();
    });
    const last365 = txs.filter((t) => {
      const dt = new Date(String(t.date || '') + 'T00:00:00');
      if (Number.isNaN(dt.getTime())) return false;
      return dt.getTime() >= daysAgo(365).getTime();
    });

    const pl30 = computePL({ transactions: last30 });
    const pl365 = computePL({ transactions: last365 });

    const topBuckets = computeTopBuckets({ transactions: txs, limit: 5 });
    const compliance = computeComplianceScore({ recurringItems: activeRecurring, budgetsHealth });

    return { txCount: txs.length, pl30, pl365, topBuckets, compliance };
  })();

  // P0 #5 — قائمة الحركات مرة واحدة لكل render بدل استدعاء list() داخل map البطاقات
  // SPR-006: use DataContext transactions via allTransactionsRef
  const allTxsForLedgerCards = allTransactionsRef;

  const ensureDateValue = (d) => {
    const x = String(d || '').trim();
    if (x) return x;
    // default: 30 days from today
    const t = new Date();
    t.setDate(t.getDate() + 30);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  };

  const openPricingWizard = () => {
    if (unpricedList.length === 0) return;
    setPricingIndex(0);
    const item = unpricedList[0];
    setPricingAmount('');
    setPricingDate(ensureDateValue(item?.nextDueDate));
    setPricingOpen(true);
  };

  const applyQuickPricing = () => {
    try {
      if (!activeId) {
        toast.error('اختر دفترًا نشطًا');
        return;
      }
      if (!pricingList || pricingList.length === 0) {
        setPricingOpen(false);
        return;
      }

      const item = pricingList[pricingIndex];
      if (!item) {
        setPricingOpen(false);
        return;
      }

      const amount = parseRecurringAmount(pricingAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('حدد المبلغ أولاً');
        return;
      }

      const nextDueDate = ensureDateValue(pricingDate || item?.nextDueDate);
      applyPricingToItem(item.id, { amount, nextDueDate });

      const nextIndex = pricingIndex + 1;
      if (nextIndex >= pricingList.length) {
        setPricingOpen(false);
        toast.success('تم تطبيق التسعير');
      } else {
        setPricingIndex(nextIndex);
        const nextItem = pricingList[nextIndex];
        setPricingAmount('');
        setPricingDate(ensureDateValue(nextItem?.nextDueDate));
        toast.success('تم حفظ البند');
      }

      refresh();
    } catch {
      toast.error('تعذر تطبيق التسعير');
    }
  };

  const SA_CITY_FACTOR = {
    riyadh: 1.15,
    jeddah: 1.1,
    dammam: 1.05,
    qassim: 0.95,
    other: 1.0,
  };

  const SA_SIZE_FACTOR = {
    small: 0.85,
    medium: 1.0,
    large: 1.25,
  };

  const applySaudiAutoPricing = ({ city, size, onlyUnpriced }) => {
    if (!activeId) return { ok: false, message: 'اختر دفترًا نشطًا أولًا' };
    return applySaudiAutoPricingForLedger({ ledgerId: activeId, city, size, onlyUnpriced });
  };

  const applySaudiAutoPricingForLedger = ({ ledgerId, city, size, onlyUnpriced }) => {
    const lid = String(ledgerId || '').trim();
    if (!lid) return { ok: false, message: 'دفتر غير صالح' };

    const cityFactor = SA_CITY_FACTOR[String(city || 'other')] ?? 1.0;
    const sizeFactor = SA_SIZE_FACTOR[String(size || 'medium')] ?? 1.0;

    const list = Array.isArray(recurring) ? recurring : [];
    const ts = new Date().toISOString();

    const next = list.map((r) => {
      if (r.ledgerId !== lid) return r;

      const seeded = isSeededRecurring(r);
      const band = r.priceBand && typeof r.priceBand === 'object' ? r.priceBand : null;
      const typical = band && Number.isFinite(Number(band.typical)) ? Number(band.typical) : 0;
      if (!seeded || typical <= 0) return r;

      if (onlyUnpriced && Number(r.amount) > 0) return r;

      const eligible = !!r.cityFactorEligible;
      const amount = Math.round(typical * (eligible ? cityFactor : 1.0) * sizeFactor);

      const due = String(r.nextDueDate || '').trim();
      const nextDueDate = due ? due : ensureDateValue(due);

      const desiredFreq = String(r.defaultFreq || r.frequency || 'monthly').toLowerCase();
      const freq =
        desiredFreq === 'monthly' ||
        desiredFreq === 'quarterly' ||
        desiredFreq === 'yearly' ||
        desiredFreq === 'adhoc'
          ? desiredFreq
          : String(r.frequency || 'monthly');

      return {
        ...r,
        amount: amount > 0 ? amount : r.amount,
        frequency: freq,
        nextDueDate,
        updatedAt: ts,
      };
    });

    try {
      setRecurringItems(next);
    } catch {
      return { ok: false, message: 'تعذر تطبيق التسعير' };
    }
    setRecurringState(next);
    return { ok: true };
  };

  const applyPricingToItem = (itemId, { amount, nextDueDate }) => {
    const list = Array.isArray(recurring) ? recurring : [];
    const ts = new Date().toISOString();
    const next = list.map((r) => {
      if (r.id !== itemId) return r;
      return {
        ...r,
        amount,
        nextDueDate,
        updatedAt: ts,
      };
    });
    setRecurringItems(next);
    setRecurringState(next);
  };

  const updateRecurringOps = async (itemId, patch = {}, historyEntry = null) => {
    const list = Array.isArray(recurring) ? recurring : [];
    const ts = new Date().toISOString();
    let updated = { ...patch, updatedAt: ts };
    if (historyEntry) {
      const item = list.find((r) => r.id === itemId);
      if (item) {
        updated = pushHistoryEntry(
          { ...item, ...updated },
          { ...historyEntry, at: historyEntry.at || ts }
        );
      }
    }
    try {
      await updateRecurringItem(itemId, updated);
    } catch {
      toast.error('تعذر حفظ حالة العنصر');
      return false;
    }
    setRecurringState(list.map((r) => (r.id === itemId ? { ...r, ...updated } : r)));
    return true;
  };

  const startPayNow = (r) => {
    if (!r) return;
    setPaySource(r);
    setPayForm({
      type: 'expense',
      category: 'other',
      paymentMethod: 'cash',
      amount: String(Number(r.amount) || ''),
      date: today(),
      description: String(r.title || '').trim(),
    });
    setPayOpen(true);
  };

  const submitPayNow = async () => {
    try {
      if (!activeId) {
        toast.error('اختر دفترًا نشطًا');
        return;
      }
      if (!paySource?.id) {
        toast.error('اختر بندًا أولاً');
        return;
      }

      const amount = parseRecurringAmount(payForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('المبلغ غير صالح');
        return;
      }

      const date = String(payForm.date || '').trim() || today();
      if (!isValidDateStr(date)) {
        toast.error('تاريخ غير صالح');
        return;
      }
      const description = String(payForm.description || paySource.title || '').trim();
      const paymentMethod = String(payForm.paymentMethod || 'cash');

      const meta = buildTxMetaFromRecurring({ activeLedgerId: activeId, recurring: paySource });
      // SPR-006: use DataContext createTransaction (works with Supabase + localStorage)
      const { data: txData, error: txError } = await createDataTransaction({
        type: 'expense',
        category: 'other',
        amount: safeNum(amount),
        paymentMethod,
        date,
        description,
        ledgerId: activeId,
        meta,
      });

      if (txError) {
        toast.error(txError?.message || 'تعذر تسجيل الدفعة');
        return;
      }

      // Update recurring item ops + history (no schema change)
      try {
        await updateRecurringOps(
          paySource.id,
          {
            status: 'resolved',
            lastPaidAt: new Date().toISOString(),
            payState: 'paid',
            payStateAt: new Date().toISOString(),
          },
          {
            type: 'pay_now',
            amount,
            txId: txData?.id || undefined,
            meta: { dueDate: paySource?.nextDueDate, method: paymentMethod },
          }
        );
      } catch (err) {}

      setPayOpen(false);
      toast.success('تم تسجيل الدفعة');
      refresh();
    } catch {
      toast.error('تعذر تسجيل الدفعة');
    }
  };

  const saveLedgerBudgets = async (patch = {}) => {
    if (!activeId) return false;
    if (patch.monthlyTarget !== undefined) {
      const s = String(patch.monthlyTarget).trim();
      if (s !== '' && !Number.isFinite(Number(s))) {
        toast.error('قيمة الهدف الشهري غير صالحة. أدخل رقماً.');
        return false;
      }
    }
    if (patch.yearlyTarget !== undefined) {
      const s = String(patch.yearlyTarget).trim();
      if (s !== '' && !Number.isFinite(Number(s))) {
        toast.error('قيمة الهدف السنوي غير صالحة. أدخل رقماً.');
        return false;
      }
    }
    const currentLedger = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === activeId);
    if (!currentLedger) return false;
    const ts = new Date().toISOString();
    try {
      await updateDataLedger(activeId, {
        budgets: { ...(currentLedger.budgets || {}), ...patch },
        updatedAt: ts,
      });
    } catch {
      toast.error('تعذر حفظ الميزانيات');
      return false;
    }
    toast.success('تم حفظ الميزانيات');
    refresh();
    return true;
  };

  const resetRecForm = () =>
    setRecForm({ title: '', amount: '', frequency: 'monthly', nextDueDate: '', notes: '' });

  const startEditRecurring = (item) => {
    setRecEditingId(item.id);
    setRecForm({
      title: item.title || '',
      amount: String(item.amount ?? ''),
      frequency: item.frequency || 'monthly',
      nextDueDate: item.nextDueDate || '',
      notes: item.notes || '',
    });
  };

  const saveRecurring = () => {
    if (!activeId) {
      toast.error('اختر دفترًا نشطًا أولًا');
      return;
    }

    const title = (recForm.title || '').trim();
    if (!title) {
      toast.error('اسم الالتزام مطلوب');
      return;
    }

    const amount = parseRecurringAmount(recForm.amount);
    if (!Number.isFinite(amount)) {
      toast.error('المبلغ غير صالح');
      return;
    }

    const freq =
      recForm.frequency === 'monthly' ||
      recForm.frequency === 'quarterly' ||
      recForm.frequency === 'yearly' ||
      recForm.frequency === 'adhoc'
        ? recForm.frequency
        : 'monthly';
    const nextDueDate = String(recForm.nextDueDate || '').trim();
    if (!nextDueDate) {
      toast.error('تاريخ الاستحقاق القادم مطلوب');
      return;
    }
    if (!isValidDateStr(nextDueDate)) {
      toast.error('تاريخ الاستحقاق القادم غير صالح');
      return;
    }

    const ts = new Date().toISOString();
    const id =
      recEditingId ||
      (() => {
        try {
          if (crypto && typeof crypto.randomUUID === 'function')
            return `rec_${crypto.randomUUID()}`;
        } catch {}
        return `rec_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      })();

    const next = (() => {
      const list = Array.isArray(recurring) ? recurring : [];
      if (!recEditingId) {
        return [
          ...list,
          {
            id,
            ledgerId: activeId,
            title,
            category: '',
            amount,
            frequency: freq,
            nextDueDate,
            notes: String(recForm.notes || ''),
            createdAt: ts,
            updatedAt: ts,
          },
        ];
      }
      return list.map((r) =>
        r.id === recEditingId
          ? {
              ...r,
              title,
              amount,
              frequency: freq,
              nextDueDate,
              notes: String(recForm.notes || ''),
              updatedAt: ts,
            }
          : r
      );
    })();

    try {
      setRecurringItems(next);
    } catch {
      toast.error('تعذر حفظ الالتزام');
      return;
    }

    toast.success(recEditingId ? 'تم تحديث الالتزام' : 'تمت إضافة الالتزام');
    setRecEditingId(null);
    resetRecForm();
    refresh();
  };

  const deleteRecurring = (id) => {
    const item = (Array.isArray(recurring) ? recurring : []).find((r) => r.id === id);
    const itemName = item?.title || 'الالتزام';
    setConfirm({
      title: 'حذف الالتزام',
      message: `هل أنت متأكد من حذف "${itemName}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmLabel: 'نعم، احذف',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteRecurringItem(id);
        } catch {
          toast.error('تعذر حذف الالتزام');
          setConfirm(null);
          return;
        }
        toast.success('تم حذف الالتزام');
        setConfirm(null);
        refresh();
      },
    });
  };

  const handleLedgerTabSelect = useCallback((tabId) => setTab(tabId), []);

  return (
    <LedgerTabsShell>
      <LedgerHeader tab={tab} onTabSelect={handleLedgerTabSelect} />
      {setPage && (
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 no-print"
          dir="rtl"
        >
          <span className="text-[var(--color-muted)] text-sm">سريع:</span>
          <button
            type="button"
            onClick={() => setPage('pulse')}
            className="text-sm font-medium transition-opacity duration-200 hover:opacity-80"
            style={{ color: 'var(--color-info)' }}
          >
            النبض المالي
          </button>
          <span className="text-[var(--color-muted)]">|</span>
          <button
            type="button"
            onClick={() => setPage('inbox')}
            className="text-sm font-medium transition-opacity duration-200 hover:opacity-80"
            style={{ color: 'var(--color-info)' }}
          >
            المستحقات
          </button>
          <span className="text-[var(--color-muted)]">|</span>
          <button
            type="button"
            onClick={() => setPage('transactions')}
            className="text-sm font-medium transition-opacity duration-200 hover:opacity-80"
            style={{ color: 'var(--color-info)' }}
          >
            الحركات
          </button>
        </div>
      )}

      {tab === 'ledgers' && (
        <div id="tabpanel-ledgers" role="tabpanel" aria-labelledby="tab-ledgers" tabIndex={0}>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  اسم الدفتر الجديد
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={120}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="اسم الدفتر"
                  placeholder="مثال: مكتب قيد العقار"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  اختر نوع الدفتر
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
                  aria-label="نوع الدفتر"
                >
                  <option value="office">مكتب</option>
                  <option value="chalet">شاليه</option>
                  <option value="apartment">شقة</option>
                  <option value="villa">فيلا</option>
                  <option value="building">عمارة</option>
                  <option value="personal">شخصي</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                  وصف مختصر (اختياري)
                </label>
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  maxLength={200}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="وصف مختصر"
                  placeholder="وصف مختصر (اختياري)"
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => createLedger()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                aria-label="إضافة دفتر"
              >
                + إضافة دفتر
              </button>
            </div>
          </div>

          {!ledgers || ledgers.length === 0 ? (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
              <EmptyState message="لا توجد دفاتر" />
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('ui:help', { detail: { section: 'ledgers' } })
                    )
                  }
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                  aria-label="افتح المساعدة"
                >
                  افتح المساعدة
                </button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ledgers
                .filter((l) => !l.archived)
                .map((l) => (
                  <div
                    key={l.id}
                    className={`bg-[var(--color-surface)] rounded-xl border p-5 shadow-sm ${l.id === activeId ? 'border-blue-300' : 'border-[var(--color-border)]'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-[var(--color-text)] truncate">{l.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs text-[var(--color-muted)]">
                            {LEDGER_TYPE_LABELS[normalizeLedgerType(l.type)] || 'مكتب'}
                          </span>
                          <span className="text-xs text-[var(--color-muted)]">•</span>
                          <span className="text-xs text-[var(--color-muted)]">{l.currency}</span>
                        </div>
                        {String(l.note || '').trim() ? (
                          <p className="text-xs text-[var(--color-muted)] mt-2">{l.note}</p>
                        ) : null}
                      </div>
                      {l.id === activeId && <Badge color="blue">نشط</Badge>}
                    </div>

                    {editingId === l.id ? (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                          تعديل الاسم
                        </label>
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          maxLength={120}
                          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                          aria-label="تعديل اسم الدفتر"
                        />

                        <div className="grid md:grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                              اختر نوع الدفتر
                            </label>
                            <select
                              value={editingType}
                              onChange={(e) => setEditingType(e.target.value)}
                              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
                              aria-label="تعديل نوع الدفتر"
                            >
                              <option value="office">مكتب</option>
                              <option value="chalet">شاليه</option>
                              <option value="apartment">شقة</option>
                              <option value="villa">فيلا</option>
                              <option value="building">عمارة</option>
                              <option value="personal">شخصي</option>
                              <option value="other">أخرى</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                              وصف مختصر (اختياري)
                            </label>
                            <input
                              value={editingNote}
                              onChange={(e) => setEditingNote(e.target.value)}
                              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                              aria-label="تعديل الوصف"
                              placeholder="وصف مختصر (اختياري)"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            className="px-4 py-2 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium"
                            aria-label="إلغاء"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit()}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            aria-label="حفظ"
                          >
                            حفظ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 justify-end mt-4">
                        {(() => {
                          const hasRecurring = (Array.isArray(recurring) ? recurring : []).some(
                            (r) => r.ledgerId === l.id
                          );
                          const disabled = hasRecurring;
                          const title = disabled
                            ? 'تمت إضافة النموذج مسبقًا'
                            : 'إضافة التزامات افتراضية لهذا الدفتر';
                          return (
                            <button
                              type="button"
                              disabled={disabled}
                              title={title}
                              onClick={() => {
                                if (disabled) return;
                                setConfirm({
                                  title: 'إضافة نموذج الالتزامات',
                                  message:
                                    'سيتم إضافة التزامات افتراضية لهذا الدفتر. هل تريد المتابعة؟',
                                  confirmLabel: 'نعم، أضف النموذج',
                                  onConfirm: async () => {
                                    try {
                                      const list = Array.isArray(recurring) ? recurring : [];
                                      const already = list.some((r) => r.ledgerId === l.id);
                                      if (already) {
                                        toast.success('تمت إضافة النموذج مسبقًا');
                                        setConfirm(null);
                                        return;
                                      }

                                      const seeded = seedRecurringForLedger({
                                        ledgerId: l.id,
                                        ledgerType: l.type,
                                      });
                                      // Create each seeded item using the hook
                                      for (const item of seeded) {
                                        const ts = new Date().toISOString();
                                        const id = `rec_${crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
                                        await createRecurringItem({
                                          id,
                                          ledgerId: l.id,
                                          title: item.title || '',
                                          amount: item.amount || 0,
                                          frequency: item.frequency || 'monthly',
                                          nextDueDate: item.nextDueDate || today(),
                                          notes: item.notes || '',
                                          category: item.category || '',
                                          createdAt: ts,
                                          updatedAt: ts,
                                          // Include template metadata
                                          ...item,
                                        });
                                      }
                                      toast.success('تمت إضافة الالتزامات الافتراضية.');
                                      setConfirm(null);
                                      refresh();
                                    } catch (err) {
                                      console.error('[قيد العقار] Seed error:', err);
                                      toast.error('تعذر إضافة النموذج');
                                      setConfirm(null);
                                    }
                                  },
                                });
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border ${disabled ? 'bg-[var(--color-bg)] text-[var(--color-muted)] border-[var(--color-border)] cursor-not-allowed' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
                              aria-label="إضافة نموذج الالتزامات"
                            >
                              إضافة نموذج الالتزامات
                            </button>
                          );
                        })()}

                        {(() => {
                          const isOffice = normalizeLedgerType(l.type) === 'office';
                          const hasRecurring = (Array.isArray(recurring) ? recurring : []).some(
                            (r) => r.ledgerId === l.id
                          );
                          const hasTx =
                            filterTransactionsForLedgerByMeta({
                              transactions: allTxsForLedgerCards,
                              ledgerId: l.id,
                            }).length > 0;
                          const disabled = !isOffice || hasRecurring || hasTx;
                          const title = !isOffice
                            ? 'متاح فقط لمكتب'
                            : hasRecurring || hasTx
                              ? 'تم إعداد الديمو مسبقًا'
                              : 'زرع نموذج مكتب كامل مع تسعير تلقائي';

                          return (
                            <button
                              type="button"
                              disabled={disabled}
                              title={title}
                              onClick={() => {
                                if (disabled) return;
                                setConfirm({
                                  title: 'تفعيل نموذج مكتب كامل (Demo)',
                                  message:
                                    'سيتم زرع التزامات المكتب وتطبيق تسعير مقترح. هل تريد المتابعة؟',
                                  confirmLabel: 'نعم، فعّل الديمو',
                                  onConfirm: async () => {
                                    try {
                                      const list = Array.isArray(recurring) ? recurring : [];
                                      const already = list.some((r) => r.ledgerId === l.id);
                                      // SPR-006: use DataContext transactions
                                      const hasTxNow =
                                        filterTransactionsForLedgerByMeta({
                                          transactions: allTransactionsRef,
                                          ledgerId: l.id,
                                        }).length > 0;
                                      if (already || hasTxNow) {
                                        toast.success('تم إعداد الديمو مسبقًا');
                                        setConfirm(null);
                                        return;
                                      }

                                      const seeded = seedRecurringForLedger({
                                        ledgerId: l.id,
                                        ledgerType: l.type,
                                      });
                                      // Create each seeded item using the hook
                                      const createdItems = [];
                                      for (const item of seeded) {
                                        const ts = new Date().toISOString();
                                        const id = `rec_${crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
                                        const fullItem = {
                                          id,
                                          ledgerId: l.id,
                                          title: item.title || '',
                                          amount: item.amount || 0,
                                          frequency: item.frequency || 'monthly',
                                          nextDueDate: item.nextDueDate || today(),
                                          notes: item.notes || '',
                                          category: item.category || '',
                                          createdAt: ts,
                                          updatedAt: ts,
                                          // Include template metadata
                                          ...item,
                                        };
                                        await createRecurringItem(fullItem);
                                        createdItems.push(fullItem);
                                      }

                                      // Apply Saudi pricing preset (Riyadh + Medium)
                                      const r = applySaudiAutoPricingForLedger({
                                        ledgerId: l.id,
                                        city: 'riyadh',
                                        size: 'medium',
                                        onlyUnpriced: false,
                                      });
                                      if (!r.ok) {
                                        toast.error(r.message || 'تعذر تطبيق التسعير');
                                        setConfirm(null);
                                        refresh();
                                        return;
                                      }

                                      // Optional: create 3 demo payments to populate reports
                                      const pick = (title) =>
                                        createdItems.find((x) =>
                                          String(x.title || '').includes(title)
                                        );
                                      const itemsToPay = [
                                        pick('إيجار'),
                                        pick('كهرباء'),
                                        pick('ماء'),
                                        pick('ترخيص'),
                                        pick('فال'),
                                      ]
                                        .filter(Boolean)
                                        .slice(0, 3);
                                      for (const it of itemsToPay) {
                                        const amt = safeNum(it.amount);
                                        if (amt <= 0) continue;
                                        const meta = buildTxMetaFromRecurring({
                                          activeLedgerId: l.id,
                                          recurring: it,
                                        });
                                        // SPR-006: use DataContext createTransaction
                                        await createDataTransaction({
                                          type: 'expense',
                                          category: 'other',
                                          amount: amt,
                                          paymentMethod: 'cash',
                                          date: today(),
                                          description: it.title,
                                          ledgerId: l.id,
                                          meta,
                                        });
                                      }

                                      toast.success('تم تفعيل الديمو بنجاح');
                                      setConfirm(null);
                                      refresh();
                                    } catch {
                                      toast.error('تعذر تفعيل الديمو');
                                      setConfirm(null);
                                    }
                                  },
                                });
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium border ${disabled ? 'bg-[var(--color-bg)] text-[var(--color-muted)] border-[var(--color-border)] cursor-not-allowed' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
                              aria-label="تفعيل نموذج مكتب كامل (Demo)"
                            >
                              تفعيل نموذج مكتب كامل (Demo)
                            </button>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => startEdit(l)}
                          className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:bg-[var(--color-bg)]"
                          aria-label="تعديل الاسم"
                        >
                          تعديل الاسم
                        </button>
                        <button
                          type="button"
                          onClick={() => setActive(l.id)}
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                          aria-label="تعيين كنشط"
                        >
                          تعيين كنشط
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === 'recurring' &&
        (() => {
          // Guard: if activeId isn't loaded yet, show a friendly message instead of crashing
          if (!activeId) {
            return (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
                <p className="text-[var(--color-text)] font-medium">اختر دفتراً نشطاً أولاً</p>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  يجب تحديد دفتر نشط لعرض الالتزامات.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('ledgers')}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  عرض الدفاتر
                </button>
              </div>
            );
          }
          // Stage 7B: runtime contract guards (dev-only throw, prod warn)
          assertFn(startPayNow, 'startPayNow');
          assertFn(submitPayNow, 'submitPayNow');
          assertFn(applyQuickPricing, 'applyQuickPricing');

          return (
            <div
              id="tabpanel-recurring"
              role="tabpanel"
              aria-labelledby="tab-recurring"
              tabIndex={0}
            >
              <LedgerRecurringTab
                {...{
                  Currency,
                  Badge,
                  EmptyState,

                  activeId,
                  activeLedger,
                  recurring,
                  startPayNow,
                  startEditRecurring,
                  deleteRecurring,
                  resetRecForm,
                  saveRecurring,
                  recForm,
                  setRecForm,
                  recEditingId,
                  setRecEditingId,

                  authorityOpen,
                  setAuthorityOpen,
                  budgets,
                  saveLedgerBudgets,
                  budgetAuth,
                  compliance,
                  brain,
                  spendByBucket,

                  inbox,
                  cashPlan,
                  inboxFilter,
                  setInboxFilter,
                  inboxView,
                  lastPayNowAt,
                  daysSince,
                  addDaysISO,
                  setHistoryModal,

                  forecastRunRate,
                  cashGap,
                  assumedInflow,
                  setAssumedInflow,
                  forecastPreset,
                  setForecastPreset,
                  scRent,
                  setScRent,
                  scUtilities,
                  setScUtilities,
                  scMaintenance,
                  setScMaintenance,
                  scMarketing,
                  setScMarketing,
                  scOther,
                  setScOther,
                  forecastInsights,

                  brainDetails,
                  setBrainDetails,
                  seededOnlyList,
                  isPastDue,
                  operatorMode,
                  openPricingWizard,

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
                  computeScenario,

                  pricingOpen,
                  setPricingOpen,
                  pricingIndex,
                  setPricingIndex,
                  pricingAmount,
                  setPricingAmount,
                  pricingDate,
                  setPricingDate,
                  pricingList,
                  applyQuickPricing,

                  saPricingOpen,
                  setSaPricingOpen,
                  saCity,
                  setSaCity,
                  saSize,
                  setSaSize,
                  saOnlyUnpriced,
                  setSaOnlyUnpriced,
                  applySaudiAutoPricingForLedger,

                  payOpen,
                  setPayOpen,
                  paySource,
                  setPaySource,
                  payForm,
                  setPayForm,
                  submitPayNow,

                  toast,
                  refresh,
                  setConfirm,
                  seedRecurringForLedger,
                  filterTransactionsForLedgerByMeta,
                  dataStore,
                  normalizeLedgerType,
                  parseRecurringAmount,
                  normalizeRecurringCategory,
                  normalizeRecurringRisk,
                  sections,
                  sectionStats,
                  grouped,
                  sortRecurringInSection,
                  isSeededRecurring,
                  isSeededOnly,
                  isDueWithinDays,
                  completeness,
                  recurringDashboard,
                  updateRecurringOps,

                  // Stage 6 extraction fix: variables used inside LedgerRecurringTab must be passed 1:1
                  unpricedList,
                  outlook,
                  actuals,
                  budgetsHealth,
                  ledgerAlerts,
                  budgetForm,
                  setBudgetForm,
                  normalizeBudgets,
                  ledgers,
                  setLedgers,
                  activeRecurring,
                  recurringSections,
                  CATEGORY_LABEL,
                }}
              />
            </div>
          );
        })()}
      {tab === 'performance' && (
        <div
          id="tabpanel-performance"
          role="tabpanel"
          aria-labelledby="tab-performance"
          tabIndex={0}
        >
          <LedgerPerformanceTab
            activeId={activeId}
            activeLedger={activeLedger}
            Badge={Badge}
            EmptyState={EmptyState}
            Currency={Currency}
            incomeMode={incomeMode}
            setIncomeMode={setIncomeMode}
            incomeFixed={incomeFixed}
            setIncomeFixed={setIncomeFixed}
            incomePeak={incomePeak}
            setIncomePeak={setIncomePeak}
            incomeBase={incomeBase}
            setIncomeBase={setIncomeBase}
            incomeManual={incomeManual}
            setIncomeManual={setIncomeManual}
            incomeSave={incomeSave}
            setIncomeSave={setIncomeSave}
            tOperational={tOperational}
            setTOperational={setTOperational}
            tMaintenance={tMaintenance}
            setTMaintenance={setTMaintenance}
            tMarketing={tMarketing}
            setTMarketing={setTMarketing}
            parseRecurringAmount={parseRecurringAmount}
            forecast={forecast}
            dataStore={dataStore}
            getLast4MonthsTable={getLast4MonthsTable}
            targetsEvaluation={targetsEvaluation}
            ledgers={ledgers}
            setLedgers={setLedgers}
            toast={toast}
            refresh={refresh}
          />
        </div>
      )}

      {tab === 'compare' && (
        <div id="tabpanel-compare" role="tabpanel" aria-labelledby="tab-compare" tabIndex={0}>
          <LedgerCompare />
        </div>
      )}

      {tab === 'reports' && (
        <div id="tabpanel-reports" role="tabpanel" aria-labelledby="tab-reports" tabIndex={0}>
          <LedgerTabErrorBoundary onBack={() => setTab('ledgers')}>
            <LedgerReportsTab
              {...{
                toast,
                activeId,
                activeLedger,
                Badge,
                EmptyState,
                Currency,
                Icons,

                dataStore,
                recurring,
                parseRecurringAmount,
                forecast,
                getLast4MonthsTable,
                targetsEvaluation,
                normalizeRecurringCategory,
                normalizeRecurringRisk,
                seededOnlyList,
                isPastDue,
                normalizeLedgerType,
                filterTransactionsForLedgerByMeta,
                ledgerReports,
                budgetsHealth,
                setTab,

                confirm,
                setConfirm,
              }}
            />
          </LedgerTabErrorBoundary>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        messageList={confirm?.messageList}
        dangerText={confirm?.dangerText}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel={confirm?.cancelLabel}
        onConfirm={confirm?.onConfirm}
        onCancel={confirm?.onCancel || (() => setConfirm(null))}
        danger={!!confirm?.danger}
        MSG={MSG}
      />
    </LedgerTabsShell>
  );
};

export default LedgersPage;
