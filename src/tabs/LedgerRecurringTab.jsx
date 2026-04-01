import React, { useState } from 'react';

/**
 * تبويب الالتزامات — إعادة تصميم جذرية
 * ════════════════════════════════════════
 * الهيكل الجديد (4 أقسام واضحة):
 *   1. نموذج إضافة/تعديل التزام (أول شيء يراه المستخدم)
 *   2. قائمة الالتزامات الحالية (مرتّبة: متأخر → قريب → باقي)
 *   3. ملخص شهري بسيط (بطاقة واحدة)
 *   4. تفاصيل متقدمة (مطوية افتراضياً)
 *
 * المبدأ: المستخدم صاحب مكتب عقاري — لا يعرف Burn Rate أو Compliance.
 * يريد: "كم لازم أدفع؟" + "أضيف التزام" + "تقرير بسيط".
 */

const CATEGORY_LABELS_AR = {
  system: 'إيجار ورسوم',
  operational: 'تشغيل ومرافق',
  maintenance: 'صيانة',
  marketing: 'تسويق وإعلان',
  adhoc: 'عند الحاجة',
  uncategorized: 'أخرى',
  other: 'أخرى',
};

const FREQUENCY_LABELS = {
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  yearly: 'سنوي',
  adhoc: 'عند الحاجة',
};

const CATEGORY_OPTIONS = [
  { value: 'system', label: 'إيجار ورسوم' },
  { value: 'operational', label: 'تشغيل ومرافق' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'marketing', label: 'تسويق وإعلان' },
  { value: 'adhoc', label: 'أخرى' },
];

function LedgerRecurringTab(props) {
  const {
    // Common UI
    Currency,
    Badge,
    EmptyState,

    // Recurring/ledger context + actions
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

    // Authority layer (moved to advanced)
    authorityOpen,
    setAuthorityOpen,
    budgets,
    saveLedgerBudgets,
    budgetAuth,
    compliance,
    brain,
    spendByBucket,

    // Inbox + forecast (moved to advanced)
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

    // Brain dashboard
    brainDetails,
    setBrainDetails,
    seededOnlyList,
    isPastDue,
    operatorMode,
    openPricingWizard,

    // Intelligence v1
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

    // Pricing wizards
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

    // Pay modal
    payOpen,
    setPayOpen,
    paySource,
    setPaySource,
    payForm,
    setPayForm,
    submitPayNow,

    // Misc
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
  } = props;

  // State: advanced section collapsed by default
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // State: list filter
  const [listFilter, setListFilter] = useState('all'); // all | overdue | soon | paid

  // ══════════════════════════════════════════
  // Computed data
  // ══════════════════════════════════════════
  const allItems = Array.isArray(activeRecurring) ? activeRecurring : [];

  // Sort: overdue first → due within 14 days → rest
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

  // Filter
  const filteredItems = (() => {
    if (listFilter === 'overdue') return sortedItems.filter((r) => isPastDue(r));
    if (listFilter === 'soon')
      return sortedItems.filter((r) => !isPastDue(r) && isDueWithinDays(r, 14));
    if (listFilter === 'paid') return sortedItems.filter((r) => r.payState === 'paid');
    return sortedItems;
  })();

  const overdueCount = allItems.filter((r) => isPastDue(r)).length;
  const soonCount = allItems.filter((r) => !isPastDue(r) && isDueWithinDays(r, 14)).length;

  // Monthly summary
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

  // Category distribution for advanced section
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

  // Status helper
  const getStatusInfo = (item) => {
    if (isPastDue(item)) return { label: 'متأخر', color: 'bg-[var(--color-danger-bg)] border-[var(--color-danger)] text-[var(--color-danger)]' };
    if (isDueWithinDays(item, 7))
      return { label: 'مستحق قريباً', color: 'bg-[var(--color-warning-bg)] border-[var(--color-warning)] text-[var(--color-warning)]' };
    if (item.payState === 'paid')
      return { label: 'مدفوع', color: 'bg-[var(--color-success-bg)] border-[var(--color-success)] text-[var(--color-success)]' };
    return { label: 'نشط', color: 'bg-[var(--color-info-bg)] border-[var(--color-border)] text-[var(--color-primary)]' };
  };

  return (
    <>
      {/* ════════════════════════════════════════ */}
      {/* مودال تسجيل الدفعة */}
      {/* ════════════════════════════════════════ */}
      {payOpen && paySource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPayOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-lg p-5 w-full max-w-md"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-[var(--color-text)] mb-3">
              تسجيل دفعة — {paySource.title}
            </h4>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  المبلغ
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="المبلغ"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={payForm.date}
                  onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="التاريخ"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  طريقة الدفع
                </label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
                  aria-label="طريقة الدفع"
                >
                  <option value="cash">نقدي</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="check">شيك</option>
                  <option value="card">بطاقة</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  الوصف
                </label>
                <input
                  type="text"
                  value={payForm.description}
                  onChange={(e) => setPayForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="الوصف"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={submitPayNow}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
              >
                تسجيل الدفعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* معالج التسعير السريع */}
      {/* ════════════════════════════════════════ */}
      {pricingOpen && pricingList && pricingList.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPricingOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-lg p-5 w-full max-w-md"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-[var(--color-text)] mb-1">معالج التسعير</h4>
            <p className="text-xs text-[var(--color-muted)] mb-3">
              بند {pricingIndex + 1} من {pricingList.length}
            </p>
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] mb-3">
              <div className="font-semibold text-[var(--color-text)]">
                {pricingList[pricingIndex]?.title || '—'}
              </div>
              {pricingList[pricingIndex]?.priceBand && (
                <div className="text-xs text-[var(--color-muted)] mt-1">
                  نطاق السعر: <Currency value={pricingList[pricingIndex].priceBand.min || 0} /> —{' '}
                  <Currency value={pricingList[pricingIndex].priceBand.max || 0} />
                  {pricingList[pricingIndex].priceBand.typical > 0 && (
                    <>
                      {' '}
                      (المتوسط: <Currency value={pricingList[pricingIndex].priceBand.typical} />)
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  المبلغ (ر.س)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={pricingAmount}
                  onChange={(e) => setPricingAmount(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="المبلغ"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  تاريخ الاستحقاق القادم
                </label>
                <input
                  type="date"
                  value={pricingDate}
                  onChange={(e) => setPricingDate(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                  aria-label="تاريخ الاستحقاق"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setPricingOpen(false)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={applyQuickPricing}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
              >
                حفظ وانتقل للتالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* معالج التسعير السعودي */}
      {/* ════════════════════════════════════════ */}
      {saPricingOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSaPricingOpen(false)}
        >
          <div
            className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-lg p-5 w-full max-w-md"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-[var(--color-text)] mb-1">
              تسعير تلقائي (أسعار السوق السعودي)
            </h4>
            <p className="text-xs text-[var(--color-muted)] mb-3">
              يطبّق أسعاراً مقترحة بناءً على المدينة وحجم المكتب.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  المدينة
                </label>
                <select
                  value={saCity}
                  onChange={(e) => setSaCity(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
                  aria-label="المدينة"
                >
                  <option value="riyadh">الرياض</option>
                  <option value="jeddah">جدة</option>
                  <option value="dammam">الدمام</option>
                  <option value="qassim">القصيم</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                  حجم المكتب
                </label>
                <select
                  value={saSize}
                  onChange={(e) => setSaSize(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
                  aria-label="حجم المكتب"
                >
                  <option value="small">صغير</option>
                  <option value="medium">متوسط</option>
                  <option value="large">كبير</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={saOnlyUnpriced}
                  onChange={(e) => setSaOnlyUnpriced(e.target.checked)}
                />
                فقط البنود غير المسعّرة
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setSaPricingOpen(false)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const result = applySaudiAutoPricingForLedger({
                    ledgerId: activeId,
                    city: saCity,
                    size: saSize,
                    onlyUnpriced: saOnlyUnpriced,
                  });
                  if (result.ok) {
                    toast.success('تم تطبيق التسعير');
                    setSaPricingOpen(false);
                    refresh();
                  } else toast.error(result.message || 'تعذر التطبيق');
                }}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
              >
                تطبيق التسعير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* القسم 1: نموذج إضافة / تعديل التزام (أول شيء يراه المستخدم) */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
        <h4 className="font-bold text-[var(--color-text)] mb-3">
          {recEditingId ? 'تعديل الالتزام' : 'إضافة التزام جديد'}
        </h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              اسم الالتزام
            </label>
            <input
              type="text"
              value={recForm.title}
              onChange={(e) => setRecForm((p) => ({ ...p, title: e.target.value }))}
              maxLength={200}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="اسم الالتزام"
              placeholder="مثال: إيجار المكتب"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              المبلغ (ر.س)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={recForm.amount}
              onChange={(e) => setRecForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="المبلغ"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              التكرار
            </label>
            <select
              value={recForm.frequency}
              onChange={(e) => setRecForm((p) => ({ ...p, frequency: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
              aria-label="التكرار"
            >
              <option value="monthly">شهري</option>
              <option value="quarterly">ربع سنوي</option>
              <option value="yearly">سنوي</option>
              <option value="adhoc">عند الحاجة</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              تاريخ الاستحقاق القادم
            </label>
            <input
              type="date"
              value={recForm.nextDueDate}
              onChange={(e) => setRecForm((p) => ({ ...p, nextDueDate: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="تاريخ الاستحقاق القادم"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
              ملاحظات (اختياري)
            </label>
            <input
              type="text"
              value={recForm.notes || ''}
              onChange={(e) => setRecForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="ملاحظات"
              placeholder="ملاحظة اختيارية"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-3">
          {recEditingId && (
            <button
              type="button"
              onClick={() => {
                setRecEditingId(null);
                resetRecForm();
              }}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
            >
              إلغاء
            </button>
          )}
          <button
            type="button"
            onClick={saveRecurring}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
            aria-label={recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}
          >
            {recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* القسم 2: قائمة الالتزامات الحالية                           */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h4 className="font-bold text-[var(--color-text)]">الالتزامات الحالية</h4>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: 'الكل', count: allItems.length },
              { key: 'overdue', label: 'متأخر', count: overdueCount },
              { key: 'soon', label: 'قريب', count: soonCount },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setListFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${listFilter === f.key ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`}
              >
                {f.label} {f.count > 0 && <span className="opacity-75">({f.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* أزرار التسعير السريع */}
        {unpricedList && unpricedList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)]">
            <span className="text-sm text-[var(--color-warning)]">{unpricedList.length} التزام بدون مبلغ</span>
            <button
              type="button"
              onClick={openPricingWizard}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-warning)] text-[var(--color-text-inverse)] text-xs font-medium hover:bg-[var(--color-warning-light)]"
            >
              معالج التسعير
            </button>
            <button
              type="button"
              onClick={() => setSaPricingOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-warning)] text-[var(--color-warning)] text-xs font-medium hover:bg-[var(--color-warning-bg)]"
            >
              تسعير تلقائي (سعودي)
            </button>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[var(--color-text)] font-medium">
              لا توجد التزامات
              {listFilter !== 'all' ? ` (${listFilter === 'overdue' ? 'متأخرة' : 'قريبة'})` : ''}
            </p>
            {allItems.length === 0 && (
              <p className="text-sm text-[var(--color-muted)] mt-2">
                أضف أول التزام (مثل: إيجار المكتب، فاتورة الكهرباء، رسوم البلدية)
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredItems.map((item) => {
              const status = getStatusInfo(item);
              const catLabel =
                CATEGORY_LABELS_AR[normalizeRecurringCategory(item.category)] ||
                CATEGORY_LABELS_AR.other;
              const freqLabel =
                FREQUENCY_LABELS[String(item.frequency || '').toLowerCase()] || 'شهري';
              return (
                <div
                  key={item.id}
                  id={`rec-${item.id}`}
                  className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:shadow-sm transition-shadow"
                  data-overdue={isPastDue(item) ? '1' : '0'}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--color-text)] truncate">
                          {item.title || '—'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] border ${status.color}`}
                        >
                          {status.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]">
                          {catLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--color-muted)]">
                        <span>{freqLabel}</span>
                        {item.nextDueDate && <span>الاستحقاق: {item.nextDueDate}</span>}
                        <span className="font-semibold text-[var(--color-text)]">
                          {Number(item.amount) > 0 ? (
                            <Currency value={item.amount} />
                          ) : (
                            <span className="text-[var(--color-warning)]">غير مسعّر</span>
                          )}
                        </span>
                      </div>
                      {item.notes?.trim() && (
                        <div className="text-xs text-[var(--color-muted)] mt-1">{item.notes}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const r = (Array.isArray(recurring) ? recurring : []).find(
                            (x) => x.id === item.id
                          );
                          if (r) startPayNow(r);
                        }}
                        disabled={Number(item.amount) === 0}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${Number(item.amount) === 0 ? 'bg-[var(--color-bg)] text-[var(--color-muted)] border-[var(--color-border)] cursor-not-allowed' : 'bg-[var(--color-success)] text-[var(--color-text-inverse)] border-[var(--color-success)] hover:bg-[var(--color-success-light)]'}`}
                        aria-label="سجّل دفعة"
                      >
                        سجّل دفعة
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditRecurring(item)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-xs font-medium hover:bg-[var(--color-bg)]"
                        aria-label="تعديل"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRecurring(item.id)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--color-danger)] text-[var(--color-danger)] text-xs font-medium hover:bg-[var(--color-danger-bg)]"
                        aria-label="حذف"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* القسم 3: ملخص شهري بسيط (بطاقة واحدة)                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
        <h4 className="font-bold text-[var(--color-text)] mb-3">الملخص المالي</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="text-xs text-[var(--color-muted)]">إجمالي شهري</div>
            <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
              <Currency value={monthlyTotal} />
            </div>
          </div>
          {overdueTotal > 0 && (
            <div className="p-3 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-bg)]">
              <div className="text-xs text-[var(--color-danger)]">متأخر</div>
              <div className="mt-1 text-lg font-bold text-[var(--color-danger)]">
                <Currency value={overdueTotal} />
              </div>
            </div>
          )}
          <div className="p-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)]">
            <div className="text-xs text-[var(--color-warning)]">مستحق هذا الشهر</div>
            <div className="mt-1 text-lg font-bold text-[var(--color-warning)]">
              <Currency value={thisMonthDue} />
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="text-xs text-[var(--color-muted)]">تقدير سنوي</div>
            <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
              <Currency value={yearlyEstimate} />
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="text-xs text-[var(--color-muted)]">عدد الالتزامات</div>
            <div className="mt-1 text-lg font-bold text-[var(--color-text)]">{allItems.length}</div>
          </div>
        </div>

        {/* تنبيهات بسيطة */}
        {ledgerAlerts && ledgerAlerts.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {ledgerAlerts.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl border border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-sm text-[var(--color-warning)]"
              >
                <span className="font-semibold">{a.title}</span>: {a.reason}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* القسم 4: تفاصيل متقدمة (مطوية افتراضياً)                   */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm mb-4">
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="w-full flex items-center justify-between p-4 md:p-5 text-[var(--color-text)] font-bold hover:bg-[var(--color-bg)] rounded-xl transition-colors"
          aria-expanded={advancedOpen}
        >
          <span>عرض التحليلات المتقدمة</span>
          <span className="text-lg">{advancedOpen ? '▲' : '▼'}</span>
        </button>

        {advancedOpen && (
          <div className="p-4 md:p-5 pt-0 flex flex-col gap-4">
            {/* توقعات 30/60/90 يوم */}
            <div>
              <h5 className="font-semibold text-[var(--color-text)] mb-2">توقعات الاستحقاق</h5>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '30 يوم', data: outlook?.d30 },
                  { label: '60 يوم', data: outlook?.d60 },
                  { label: '90 يوم', data: outlook?.d90 },
                ].map(({ label, data }) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center"
                  >
                    <div className="text-xs text-[var(--color-muted)]">{label}</div>
                    <div className="mt-1 font-bold text-[var(--color-text)]">
                      <Currency value={data?.pricedTotal || 0} />
                    </div>
                    {(data?.unpricedCount || 0) > 0 && (
                      <div className="text-[11px] text-[var(--color-warning)] mt-1">
                        {data.unpricedCount} غير مسعّر
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* توزيع حسب التصنيف */}
            {categoryDist.total > 0 && (
              <div>
                <h5 className="font-semibold text-[var(--color-text)] mb-2">
                  توزيع الالتزامات حسب التصنيف
                </h5>
                <div className="flex flex-col gap-2">
                  {Object.entries(categoryDist.map)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amt]) => {
                      const pct =
                        categoryDist.total > 0 ? Math.round((amt / categoryDist.total) * 100) : 0;
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-sm text-[var(--color-text)] w-28 shrink-0">
                            {CATEGORY_LABELS_AR[cat] || 'أخرى'}
                          </span>
                          <div className="flex-1 h-4 bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--color-border)]">
                            <div
                              className="h-full bg-[var(--color-primary)] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-muted)] w-16 text-end">
                            {pct}%
                          </span>
                          <span className="text-xs font-semibold text-[var(--color-text)] w-24 text-end">
                            <Currency value={amt} />
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* الميزانية */}
            <div>
              <h5 className="font-semibold text-[var(--color-text)] mb-2">أهداف الميزانية</h5>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                    هدف شهري (ر.س)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={budgetForm.monthlyTarget}
                    onChange={(e) =>
                      setBudgetForm((p) => ({ ...p, monthlyTarget: e.target.value }))
                    }
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                    aria-label="هدف شهري"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text)] mb-1">
                    هدف سنوي (ر.س)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={budgetForm.yearlyTarget}
                    onChange={(e) => setBudgetForm((p) => ({ ...p, yearlyTarget: e.target.value }))}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                    aria-label="هدف سنوي"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() =>
                    saveLedgerBudgets({
                      monthlyTarget: budgetForm.monthlyTarget,
                      yearlyTarget: budgetForm.yearlyTarget,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-sm font-medium hover:bg-[var(--color-primary-strong)]"
                >
                  حفظ الميزانية
                </button>
              </div>
              {budgetsHealth &&
                (budgetsHealth.monthlyTarget > 0 || budgetsHealth.yearlyTarget > 0) && (
                  <div
                    className={`mt-2 p-3 rounded-xl border text-sm ${budgetsHealth.status === 'danger' ? 'border-[var(--color-danger)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : budgetsHealth.status === 'warn' ? 'border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]' : 'border-[var(--color-success)] bg-[var(--color-success-bg)] text-[var(--color-success)]'}`}
                  >
                    {budgetsHealth.status === 'danger'
                      ? 'تجاوز الميزانية'
                      : budgetsHealth.status === 'warn'
                        ? 'قريب من حد الميزانية'
                        : 'ضمن الميزانية'}
                    {budgetsHealth.monthlyTarget > 0 && (
                      <>
                        {' '}
                        — الشهري: <Currency value={actuals.actualMonthly} /> من{' '}
                        <Currency value={budgetsHealth.monthlyTarget} />
                      </>
                    )}
                  </div>
                )}
            </div>

            {/* صحة الدفتر (مبسّطة) */}
            {health && (
              <div>
                <h5 className="font-semibold text-[var(--color-text)] mb-2">صحة الدفتر</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                    <div className="text-xs text-[var(--color-muted)]">الدرجة</div>
                    <div
                      className={`mt-1 text-2xl font-bold ${health.score >= 70 ? 'text-[var(--color-success)]' : health.score >= 40 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}
                    >
                      {health.score || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                    <div className="text-xs text-[var(--color-muted)]">التسعير</div>
                    <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
                      {health.pricingRatio != null
                        ? `${Math.round(health.pricingRatio * 100)}%`
                        : '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                    <div className="text-xs text-[var(--color-muted)]">الانضباط</div>
                    <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
                      {health.disciplineRatio != null
                        ? `${Math.round(health.disciplineRatio * 100)}%`
                        : '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                    <div className="text-xs text-[var(--color-muted)]">اكتمال الدفتر</div>
                    <div className="mt-1 text-lg font-bold text-[var(--color-text)]">
                      {completeness?.pct ?? 0}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* معدل الإنفاق — مبسّط */}
            {brain?.burn && (
              <div>
                <h5 className="font-semibold text-[var(--color-text)] mb-2">معدل الإنفاق</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                    <div className="text-xs text-[var(--color-muted)]">شهري</div>
                    <div className="mt-1 font-bold text-[var(--color-text)]">
                      <Currency value={brain.burn.monthly || 0} />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                    <div className="text-xs text-[var(--color-muted)]">90 يوم</div>
                    <div className="mt-1 font-bold text-[var(--color-text)]">
                      <Currency value={brain.burn.d90 || 0} />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                    <div className="text-xs text-[var(--color-muted)]">سنوي</div>
                    <div className="mt-1 font-bold text-[var(--color-text)]">
                      <Currency value={brain.burn.yearly || 0} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default React.memo(LedgerRecurringTab);
