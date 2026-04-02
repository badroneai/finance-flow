import React, { useState } from 'react';
import PayNowModal from '../ui/ledger-recurring/PayNowModal.jsx';
import PricingWizardModal from '../ui/ledger-recurring/PricingWizardModal.jsx';
import SaPricingModal from '../ui/ledger-recurring/SaPricingModal.jsx';
import RecurringItemForm from '../ui/ledger-recurring/RecurringItemForm.jsx';
import RecurringItemList from '../ui/ledger-recurring/RecurringItemList.jsx';
import RecurringSummaryBar from '../ui/ledger-recurring/RecurringSummaryBar.jsx';
import RecurringAdvancedPanel from '../ui/ledger-recurring/RecurringAdvancedPanel.jsx';

// تبويب الالتزامات — orchestrator يجمع 7 مكونات فرعية
function LedgerRecurringTab({
  recurringCrud,
  payment,
  pricing,
  saPricing,
  intelligence,
  budget,
  ui,
}) {
  const {
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
  } = recurringCrud;

  const { payOpen, setPayOpen, paySource, payForm, setPayForm, submitPayNow } = payment;

  const {
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
  } = pricing;

  const {
    saPricingOpen,
    setSaPricingOpen,
    saCity,
    setSaCity,
    saSize,
    setSaSize,
    saOnlyUnpriced,
    setSaOnlyUnpriced,
    applySaudiAutoPricingForLedger,
  } = saPricing;

  const {
    brain,
    health,
    completeness,
    outlook,
    ledgerAlerts,
    unpricedList,
    budgetsHealth,
    actuals,
  } = intelligence;

  const { budgetForm, setBudgetForm, saveLedgerBudgets } = budget;
  const { Currency, toast, refresh, isPastDue, isDueWithinDays, normalizeRecurringCategory } = ui;

  // حالة محلية
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [listFilter, setListFilter] = useState('all');

  // ══════════════════════════════════════════
  // بيانات محسوبة (تُمرَّر للمكونات الفرعية)
  // ══════════════════════════════════════════
  const allItems = Array.isArray(activeRecurring) ? activeRecurring : [];

  const sortedItems = [...allItems].sort((a, b) => {
    const aOverdue = isPastDue(a) ? 0 : 1;
    const bOverdue = isPastDue(b) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    const aSoon = isDueWithinDays(a, 14) ? 0 : 1;
    const bSoon = isDueWithinDays(b, 14) ? 0 : 1;
    if (aSoon !== bSoon) return aSoon - bSoon;
    const da = new Date(String(a?.nextDueDate || '') + 'T00:00:00').getTime() || 0;
    const db = new Date(String(b?.nextDueDate || '') + 'T00:00:00').getTime() || 0;
    return da - db;
  });

  const filteredItems = (() => {
    if (listFilter === 'overdue') return sortedItems.filter((r) => isPastDue(r));
    if (listFilter === 'soon')
      return sortedItems.filter((r) => !isPastDue(r) && isDueWithinDays(r, 14));
    if (listFilter === 'paid') return sortedItems.filter((r) => r.payState === 'paid');
    return sortedItems;
  })();

  const overdueCount = allItems.filter((r) => isPastDue(r)).length;
  const soonCount = allItems.filter((r) => !isPastDue(r) && isDueWithinDays(r, 14)).length;

  const monthlyTotal = allItems
    .filter((r) => String(r.frequency || '').toLowerCase() === 'monthly' && Number(r.amount) > 0)
    .reduce((s, r) => s + Number(r.amount), 0);
  const yearlyEstimate = allItems.reduce((s, r) => {
    const amt = Number(r.amount) || 0;
    if (amt <= 0) return s;
    const f = String(r.frequency || '').toLowerCase();
    if (f === 'monthly') return s + amt * 12;
    if (f === 'quarterly') return s + amt * 4;
    if (f === 'yearly') return s + amt;
    return s + amt;
  }, 0);
  const overdueTotal = allItems
    .filter((r) => isPastDue(r) && Number(r.amount) > 0)
    .reduce((s, r) => s + Number(r.amount), 0);
  const thisMonthDue = allItems
    .filter((r) => isDueWithinDays(r, 30) && Number(r.amount) > 0)
    .reduce((s, r) => s + Number(r.amount), 0);

  const categoryDist = (() => {
    const map = {};
    let total = 0;
    allItems.forEach((r) => {
      const amt = Number(r.amount) || 0;
      if (amt <= 0) return;
      const cat = normalizeRecurringCategory(r.category) || 'uncategorized';
      map[cat] = (map[cat] || 0) + amt;
      total += amt;
    });
    return { map, total };
  })();

  const getStatusInfo = (item) => {
    if (isPastDue(item))
      return {
        label: 'متأخر',
        color:
          'bg-[var(--color-danger-bg)] border-[var(--color-danger)] text-[var(--color-danger)]',
      };
    if (isDueWithinDays(item, 7))
      return {
        label: 'مستحق قريباً',
        color:
          'bg-[var(--color-warning-bg)] border-[var(--color-warning)] text-[var(--color-warning)]',
      };
    if (item.payState === 'paid')
      return {
        label: 'مدفوع',
        color:
          'bg-[var(--color-success-bg)] border-[var(--color-success)] text-[var(--color-success)]',
      };
    return {
      label: 'نشط',
      color: 'bg-[var(--color-info-bg)] border-[var(--color-border)] text-[var(--color-primary)]',
    };
  };

  return (
    <>
      <PayNowModal
        payOpen={payOpen}
        paySource={paySource}
        payForm={payForm}
        setPayForm={setPayForm}
        submitPayNow={submitPayNow}
        setPayOpen={setPayOpen}
      />

      <PricingWizardModal
        pricingOpen={pricingOpen}
        pricingList={pricingList}
        pricingIndex={pricingIndex}
        pricingAmount={pricingAmount}
        setPricingAmount={setPricingAmount}
        pricingDate={pricingDate}
        setPricingDate={setPricingDate}
        applyQuickPricing={applyQuickPricing}
        setPricingOpen={setPricingOpen}
        Currency={Currency}
      />

      <SaPricingModal
        saPricingOpen={saPricingOpen}
        setSaPricingOpen={setSaPricingOpen}
        saCity={saCity}
        setSaCity={setSaCity}
        saSize={saSize}
        setSaSize={setSaSize}
        saOnlyUnpriced={saOnlyUnpriced}
        setSaOnlyUnpriced={setSaOnlyUnpriced}
        applySaudiAutoPricingForLedger={applySaudiAutoPricingForLedger}
        activeId={activeId}
        toast={toast}
        refresh={refresh}
      />

      <RecurringItemForm
        recForm={recForm}
        setRecForm={setRecForm}
        recEditingId={recEditingId}
        setRecEditingId={setRecEditingId}
        saveRecurring={saveRecurring}
        resetRecForm={resetRecForm}
      />

      <RecurringItemList
        filteredItems={filteredItems}
        allItems={allItems}
        overdueCount={overdueCount}
        soonCount={soonCount}
        listFilter={listFilter}
        setListFilter={setListFilter}
        unpricedList={unpricedList}
        openPricingWizard={openPricingWizard}
        setSaPricingOpen={setSaPricingOpen}
        recurring={recurring}
        startPayNow={startPayNow}
        startEditRecurring={startEditRecurring}
        deleteRecurring={deleteRecurring}
        getStatusInfo={getStatusInfo}
        normalizeRecurringCategory={normalizeRecurringCategory}
        Currency={Currency}
        isPastDue={isPastDue}
      />

      <RecurringSummaryBar
        monthlyTotal={monthlyTotal}
        overdueTotal={overdueTotal}
        thisMonthDue={thisMonthDue}
        yearlyEstimate={yearlyEstimate}
        itemCount={allItems.length}
        ledgerAlerts={ledgerAlerts}
        Currency={Currency}
      />

      <RecurringAdvancedPanel
        advancedOpen={advancedOpen}
        setAdvancedOpen={setAdvancedOpen}
        outlook={outlook}
        categoryDist={categoryDist}
        brain={brain}
        health={health}
        completeness={completeness}
        budgetForm={budgetForm}
        setBudgetForm={setBudgetForm}
        saveLedgerBudgets={saveLedgerBudgets}
        budgetsHealth={budgetsHealth}
        actuals={actuals}
        Currency={Currency}
      />
    </>
  );
}

export default React.memo(LedgerRecurringTab);
