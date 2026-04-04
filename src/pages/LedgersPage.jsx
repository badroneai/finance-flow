// صفحة الدفاتر — shell رقيقة تربط useLedgerState بالمكونات الفرعية
import { ConfirmDialog } from '../ui/Modals.jsx';
import { EmptyState, Badge } from '../ui/ui-common.jsx';
import { Currency } from '../utils/format.jsx';
import { LedgerTabErrorBoundary } from '../ui/ErrorBoundaries.jsx';
import { LedgerHeader } from '../ui/ledger/LedgerHeader.jsx';
import { LedgerTabsShell } from '../ui/ledger/LedgerTabsShell.jsx';
import LedgerListTab from '../ui/ledger/LedgerListTab.jsx';
import LedgerRecurringTab from '../tabs/LedgerRecurringTab.jsx';
import LedgerPerformanceTab from '../tabs/LedgerPerformanceTab.jsx';
import LedgerReportsTab from '../tabs/LedgerReportsTab.jsx';
import LedgerCompare from '../ui/ledger/LedgerCompare.jsx';
import { assertFn } from '../core/contracts.js';
import { MSG } from '../constants/index.js';
import useLedgerState from './hooks/useLedgerState.js';

// ============================================
// LEDGERS PAGE — shell
// ============================================
const LedgersPage = ({ setPage }) => {
  const state = useLedgerState();

  const {
    // أساسي — مستخدم مباشرة في هذا الملف
    toast,
    tab,
    setTab,
    confirm,
    setConfirm,
    refresh,

    // الدفاتر — LedgerListTab
    ledgers,
    activeId,
    activeLedger,
    activeRecurringRaw,
    activeRecurring,
    recurring,
    handleLedgerTabSelect,
    LEDGER_TYPE_LABELS,
    normalizeLedgerType,

    // CRUD الدفاتر — LedgerListTab
    newName,
    setNewName,
    newType,
    setNewType,
    newNote,
    setNewNote,
    editingId,
    setEditingId,
    editingName,
    setEditingName,
    editingType,
    setEditingType,
    editingNote,
    setEditingNote,
    createLedger,
    startEdit,
    saveEdit,
    setActive,

    // الالتزامات — LedgerRecurringTab
    recForm,
    setRecForm,
    recEditingId,
    setRecEditingId,
    resetRecForm,
    startEditRecurring,
    saveRecurring,
    deleteRecurring,

    // الميزانيات — مشترك بين recurring + reports
    budgetForm,
    setBudgetForm,
    saveLedgerBudgets,
    budgetsHealth,

    // التسعير — LedgerRecurringTab
    pricingOpen,
    setPricingOpen,
    pricingIndex,
    pricingAmount,
    setPricingAmount,
    pricingDate,
    setPricingDate,
    pricingList,
    unpricedList,
    openPricingWizard,
    applyQuickPricing,

    // التسعير السعودي — LedgerRecurringTab + LedgerListTab
    saPricingOpen,
    setSaPricingOpen,
    saCity,
    setSaCity,
    saSize,
    setSaSize,
    saOnlyUnpriced,
    setSaOnlyUnpriced,
    applySaudiAutoPricingForLedger,

    // الدفع — LedgerRecurringTab
    payOpen,
    setPayOpen,
    paySource,
    payForm,
    setPayForm,
    startPayNow,
    submitPayNow,

    // الذكاء والصحة — LedgerRecurringTab
    health,
    brain,
    completeness,
    outlook,
    actuals,
    ledgerAlerts,

    // التوقعات — LedgerPerformanceTab
    forecast,

    // الأداء — LedgerPerformanceTab
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

    // القيم المحسوبة — LedgerListTab
    recurringDashboard,
    allTxsForLedgerCards,
    allTransactionsRef,

    // التقارير — LedgerReportsTab
    ledgerReports,
    filterTransactionsForLedgerByMeta,
    dataStore,

    // المساعدات — مشتركة بين التبويبات
    parseRecurringAmount,
    normalizeRecurringCategory,
    isPastDue,
    isDueWithinDays,
    setLedgers,
    createRecurringItem,
    createDataTransaction,
    getLast4MonthsTable,
    targetsEvaluation,
  } = state;

  return (
    <LedgerTabsShell>
      <LedgerHeader tab={tab} onTabSelect={handleLedgerTabSelect} />
      {setPage && (
        <div className="ledger-quick-nav no-print" dir="rtl">
          <button type="button" onClick={() => setPage('pulse')} className="ledger-quick-nav__link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>النبض المالي</span>
          </button>
          <button type="button" onClick={() => setPage('inbox')} className="ledger-quick-nav__link">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <span>المستحقات</span>
          </button>
          <button
            type="button"
            onClick={() => setPage('transactions')}
            className="ledger-quick-nav__link"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>الحركات</span>
          </button>
        </div>
      )}

      {tab === 'ledgers' && (
        <LedgerListTab
          ledgers={ledgers}
          activeId={activeId}
          activeLedger={activeLedger}
          activeRecurringRaw={activeRecurringRaw}
          recurring={recurring}
          recurringDashboard={recurringDashboard}
          completeness={completeness}
          LEDGER_TYPE_LABELS={LEDGER_TYPE_LABELS}
          normalizeLedgerType={normalizeLedgerType}
          newName={newName}
          setNewName={setNewName}
          newType={newType}
          setNewType={setNewType}
          newNote={newNote}
          setNewNote={setNewNote}
          editingId={editingId}
          setEditingId={setEditingId}
          editingName={editingName}
          setEditingName={setEditingName}
          editingType={editingType}
          setEditingType={setEditingType}
          editingNote={editingNote}
          setEditingNote={setEditingNote}
          createLedger={createLedger}
          startEdit={startEdit}
          saveEdit={saveEdit}
          setActive={setActive}
          setConfirm={setConfirm}
          createRecurringItem={createRecurringItem}
          applySaudiAutoPricingForLedger={applySaudiAutoPricingForLedger}
          createDataTransaction={createDataTransaction}
          allTransactionsRef={allTransactionsRef}
          allTxsForLedgerCards={allTxsForLedgerCards}
          toast={toast}
          refresh={refresh}
        />
      )}

      {tab === 'recurring' &&
        (() => {
          if (!activeId) {
            return (
              <EmptyState
                title="اختر دفتراً نشطاً أولاً"
                description="يجب تحديد دفتر نشط قبل عرض الالتزامات والتقارير المرتبطة به."
                actionLabel="عرض الدفاتر"
                onAction={() => setTab('ledgers')}
              />
            );
          }
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
                recurringCrud={{
                  activeId,
                  recurring,
                  activeRecurring,
                  recForm,
                  setRecForm,
                  recEditingId,
                  setRecEditingId,
                  saveRecurring,
                  resetRecForm,
                  deleteRecurring,
                  startEditRecurring,
                  startPayNow,
                }}
                payment={{
                  payOpen,
                  setPayOpen,
                  paySource,
                  payForm,
                  setPayForm,
                  submitPayNow,
                }}
                pricing={{
                  pricingOpen,
                  setPricingOpen,
                  pricingIndex,
                  pricingAmount,
                  setPricingAmount,
                  pricingDate,
                  setPricingDate,
                  pricingList,
                  applyQuickPricing,
                  openPricingWizard,
                }}
                saPricing={{
                  saPricingOpen,
                  setSaPricingOpen,
                  saCity,
                  setSaCity,
                  saSize,
                  setSaSize,
                  saOnlyUnpriced,
                  setSaOnlyUnpriced,
                  applySaudiAutoPricingForLedger,
                }}
                intelligence={{
                  brain,
                  health,
                  completeness,
                  outlook,
                  ledgerAlerts,
                  unpricedList,
                  budgetsHealth,
                  actuals,
                }}
                budget={{
                  budgetForm,
                  setBudgetForm,
                  saveLedgerBudgets,
                }}
                ui={{
                  Currency,
                  toast,
                  refresh,
                  isPastDue,
                  isDueWithinDays,
                  normalizeRecurringCategory,
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
            income={{
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
            }}
            targets={{
              tOperational,
              setTOperational,
              tMaintenance,
              setTMaintenance,
              tMarketing,
              setTMarketing,
            }}
            analytics={{
              forecast,
              dataStore,
              getLast4MonthsTable,
              targetsEvaluation,
              parseRecurringAmount,
            }}
            ledgerData={{
              activeId,
              activeLedger,
              ledgers,
              setLedgers,
            }}
            ui={{
              Badge,
              EmptyState,
              Currency,
              toast,
              refresh,
            }}
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
              data={{
                activeId,
                activeLedger,
                dataStore,
                filterTransactionsForLedgerByMeta,
                ledgerReports,
                budgetsHealth,
              }}
              ui={{
                Badge,
                EmptyState,
                Currency,
                toast,
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
