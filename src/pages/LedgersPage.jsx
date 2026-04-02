// صفحة الدفاتر — shell رقيقة تربط useLedgerState بالمكونات الفرعية
import { ConfirmDialog } from '../ui/Modals.jsx';
import { EmptyState, Badge, Icons } from '../ui/ui-common.jsx';
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

    // CRUD الدفاتر
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

    // الالتزامات
    recForm,
    setRecForm,
    recEditingId,
    setRecEditingId,
    resetRecForm,
    startEditRecurring,
    saveRecurring,
    deleteRecurring,
    updateRecurringOps,

    // الميزانيات
    budgetForm,
    setBudgetForm,
    saveLedgerBudgets,
    budgets,
    budgetAuth,
    budgetsHealth,
    spendByBucket,

    // التسعير
    pricingOpen,
    setPricingOpen,
    pricingIndex,
    setPricingIndex,
    pricingAmount,
    setPricingAmount,
    pricingDate,
    setPricingDate,
    pricingList,
    unpricedList,
    openPricingWizard,
    applyQuickPricing,

    // التسعير السعودي
    saPricingOpen,
    setSaPricingOpen,
    saCity,
    setSaCity,
    saSize,
    setSaSize,
    saOnlyUnpriced,
    setSaOnlyUnpriced,
    applySaudiAutoPricingForLedger,

    // الدفع
    payOpen,
    setPayOpen,
    paySource,
    setPaySource,
    payForm,
    setPayForm,
    startPayNow,
    submitPayNow,

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

    // التوقعات
    forecastPreset,
    setForecastPreset,
    assumedInflow,
    setAssumedInflow,
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
    forecastRunRate,
    forecast,
    cashGap,
    forecastInsights,

    // الوارد والسلطة
    inbox,
    cashPlan,
    inboxFilter,
    setInboxFilter,
    inboxView,
    setHistoryModal,
    authorityOpen,
    setAuthorityOpen,
    compliance,

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
    seedRecurringForLedger,
    createRecurringItem,
    createDataTransaction,
    getLast4MonthsTable,
    targetsEvaluation,
  } = state;

  return (
    <LedgerTabsShell>
      <LedgerHeader tab={tab} onTabSelect={handleLedgerTabSelect} />
      {setPage && (
        <div className="ledgers-quick-links no-print" dir="rtl">
          <span className="ledgers-quick-links-label">سريع:</span>
          <button
            type="button"
            onClick={() => setPage('pulse')}
            className="btn-ghost !min-h-0 !px-0 !py-0 text-sm"
          >
            النبض المالي
          </button>
          <span className="ledgers-quick-links-sep">|</span>
          <button
            type="button"
            onClick={() => setPage('inbox')}
            className="btn-ghost !min-h-0 !px-0 !py-0 text-sm"
          >
            المستحقات
          </button>
          <span className="ledgers-quick-links-sep">|</span>
          <button
            type="button"
            onClick={() => setPage('transactions')}
            className="btn-ghost !min-h-0 !px-0 !py-0 text-sm"
          >
            الحركات
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
