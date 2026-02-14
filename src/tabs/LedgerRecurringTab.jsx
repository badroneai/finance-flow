import React from 'react';

import LedgerInboxTab from './LedgerInboxTab.jsx';
import LedgerForecastTab from './LedgerForecastTab.jsx';

export default function LedgerRecurringTab(props) {
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

    // Authority layer
    authorityOpen,
    setAuthorityOpen,
    budgets,
    saveLedgerBudgets,
    budgetAuth,
    compliance,
    brain,
    spendByBucket,

    // Inbox + forecast (computed outside)
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

    // Brain dashboard / intel / operator mode
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

    // Vars referenced in extracted JSX (must be passed from LedgersPage)
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

  return (
<>
  {/* Authority Layer (v8) */}
  <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="font-bold text-gray-900">Authority Layer</h4>
        <p className="text-xs text-gray-500 mt-1">Budget Control • Compliance • Month Awareness (عرض فقط)</p>
      </div>
      <button type="button" onClick={() => setAuthorityOpen(v => !v)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50" aria-label="طي/فتح">{authorityOpen ? 'طي' : 'فتح'}</button>
    </div>

    {authorityOpen ? (
      <div className="mt-3 grid md:grid-cols-3 gap-3">
        {/* Budget Authority */}
        <div className="p-3 rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-900">🛑 سلطة الميزانية</div>
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input type="checkbox" checked={!!budgets.hardLock} onChange={(e) => saveLedgerBudgets({ hardLock: e.target.checked })} />
              قفل صارم
            </label>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { k: 'system', label: 'System' },
              { k: 'operational', label: 'Operational' },
              { k: 'maintenance', label: 'Maintenance' },
              { k: 'marketing', label: 'Marketing' },
            ].map(x => (
              <div key={x.k}>
                <label className="block text-[11px] text-gray-600 mb-1">{x.label}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={budgets[x.k] == null ? '' : String(budgets[x.k])}
                  onChange={(e) => {
                    const v = e.target.value;
                    const n = v === '' ? null : (Number(parseRecurringAmount(v)) || 0);
                    saveLedgerBudgets({ [x.k]: n });
                  }}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  placeholder="—"
                  aria-label={`Budget ${x.label}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {['system','operational','maintenance','marketing'].map(k => {
              const row = budgetAuth?.perBucket?.[k];
              if (!row || !row.target) return (
                <div key={k} className="text-[11px] text-gray-400">{k}: —</div>
              );
              const badge = row.breach ? 'bg-red-50 border-red-100 text-red-700' : row.warn ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-green-50 border-green-100 text-green-700';
              return (
                <div key={k} className={`p-2 rounded-lg border ${badge}`}>
                  <div className="text-[11px] font-semibold">{k}: {row.utilizationPct}%</div>
                  <div className="text-[11px]">{row.spent} / {row.target}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Shield */}
        <div className="p-3 rounded-xl border border-gray-100 bg-white">
          <div className="font-bold text-gray-900">🛡️ درع الامتثال</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">{compliance?.score ?? '—'}</div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] border ${String(compliance?.status).includes('خطر') ? 'border-red-100 bg-red-50 text-red-700' : String(compliance?.status).includes('انتباه') ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-green-100 bg-green-50 text-green-700'}`}>{compliance?.status || '—'}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">أبرز 3 أسباب:</div>
          {(!compliance?.drivers || compliance.drivers.length === 0) ? (
            <div className="text-sm text-gray-600 mt-1">لا يوجد مخالفات واضحة.</div>
          ) : (
            <div className="mt-1 text-sm text-gray-700 flex flex-col gap-1">
              {compliance.drivers.map((d, idx) => (
                <div key={`${d.id}-${idx}`}>• {d.reason}: {d.title}</div>
              ))}
            </div>
          )}
        </div>

        {/* Month Awareness (display only) */}
        <div className="p-3 rounded-xl border border-gray-100 bg-white">
          <div className="font-bold text-gray-900">📅 وعي الشهر (عرض فقط)</div>
          {(() => {
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
            const day = now.getDate();
            const left = Math.max(0, daysInMonth - day);

            const monthlyBurn = Number(brain?.burn?.monthly) || 0;
            const spentThisMonth = Object.values(spendByBucket || {}).reduce((a, x) => a + (Number(x)||0), 0);
            const expectedRemaining = monthlyBurn > 0 ? (monthlyBurn * (left / daysInMonth)) : 0;
            const projected = spentThisMonth + expectedRemaining;

            const risk = (monthlyBurn > 0 && projected > monthlyBurn * 1.05);
            return (
              <>
                <div className="mt-2 text-sm text-gray-700">أيام متبقية: <strong>{left}</strong></div>
                <div className="text-sm text-gray-700 mt-1">Burn متوقع حتى نهاية الشهر: <strong><Currency value={expectedRemaining} /></strong></div>
                <div className={`mt-2 p-2 rounded-lg border text-sm ${risk ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-green-50 border-green-100 text-green-800'}`}>{risk ? 'احتمال تجاوز' : 'الشهر في منطقة آمنة'}</div>
              </>
            );
          })()}
        </div>
      </div>
    ) : null}
  </div>

            <LedgerInboxTab
    inbox={inbox}
    cashPlan={cashPlan}
    brain={brain}
    Currency={Currency}
    inboxFilter={inboxFilter}
    setInboxFilter={setInboxFilter}
    inboxView={inboxView}
    recurring={recurring}
    startPayNow={startPayNow}
    updateRecurringOps={updateRecurringOps}
    toast={toast}
    refresh={refresh}
    lastPayNowAt={lastPayNowAt}
    daysSince={daysSince}
    addDaysISO={addDaysISO}
    setHistoryModal={setHistoryModal}
  />

{/* Ledger Brain Dashboard */}
  <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h4 className="font-bold text-gray-900">🧠 لوحة الذكاء المالي</h4>
        <p className="text-xs text-gray-500 mt-1">عرض فقط • بدون أي تغيير على البيانات</p>
      </div>
    </div>

    {/* Pro: Daily Playbook */}
    <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <h5 className="font-bold text-gray-900">🎯 خطة اليوم</h5>
        <span className="text-xs text-gray-500">Top 5</span>
      </div>
      {(!brain?.playbook || brain.playbook.length === 0) ? (
        <p className="text-sm text-gray-500 mt-2">دفترك منضبط اليوم.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {brain.playbook.map((t) => (
            <div key={t.recurringId} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{t.title}</div>
                <div className="text-xs text-gray-500 mt-1">{t.reason}</div>
              </div>
              <button type="button" onClick={() => {
                const el = document.getElementById(`rec-${t.recurringId}`);
                if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="اذهب للبند">اذهب للبند</button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Pro: Saudi Benchmarks */}
    <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h5 className="font-bold text-gray-900">📊 مقارنة بالسوق (تقديري)</h5>
          <p className="text-xs text-gray-500 mt-1">نِسَب من Burn الشهري (عناصر مسعّرة فقط)</p>
        </div>
      </div>

      {brain?.benchmarks ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            {brain.benchmarks.flags.map((f) => (
              <div key={f.type} className="p-2 rounded-lg border border-gray-100 bg-gray-50">
                <div className="text-gray-500">{f.type === 'rent' ? 'إيجار' : f.type === 'utilities' ? 'مرافق' : 'تسويق'}</div>
                <div className="mt-1 font-semibold text-gray-900">{Math.round((f.ratio || 0) * 100)}%</div>
                <div className={`mt-1 inline-flex px-2 py-0.5 rounded-full border text-[11px] ${f.status === 'high' ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'}`}>{f.status === 'high' ? 'أعلى من الشائع' : 'ضمن الشائع'}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-600">{brain.benchmarks.commentary}</p>
        </>
      ) : (
        <p className="text-sm text-gray-500 mt-2">—</p>
      )}
    </div>

    <div className="mt-3 grid gap-3 md:grid-cols-4">
      <div className={`p-3 rounded-xl border bg-gray-50 ${brain?.benchmarks?.flags?.some(f => f.type==='rent' && f.status==='high') ? 'border-amber-200' : 'border-gray-100'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs text-gray-500">Burn Rate</div>
          <button type="button" onClick={() => setBrainDetails('burn')} className="text-xs text-blue-700 hover:underline" aria-label="تفاصيل الحساب">تفاصيل الحساب</button>
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-900"><Currency value={brain?.burn?.monthly || 0} /> / شهر</div>
        <div className="mt-1 text-xs text-gray-600">90 يوم: <span className="font-semibold text-gray-900"><Currency value={brain?.burn?.d90 || 0} /></span></div>
        <div className="text-xs text-gray-600">سنة: <span className="font-semibold text-gray-900"><Currency value={brain?.burn?.yearly || 0} /></span></div>
      </div>

      <div className={`p-3 rounded-xl border bg-gray-50 ${Number(brain?.pressure?.score||0) > 75 ? 'border-red-200' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500">ضغط السيولة</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setBrainDetails('pressure')} className="text-xs text-blue-700 hover:underline" aria-label="تفاصيل الحساب">تفاصيل الحساب</button>
            <span className="text-xs font-semibold text-gray-900">{brain?.pressure?.score ?? 0}/100</span>
          </div>
        </div>
        <div className="mt-2 h-2 rounded bg-gray-200 overflow-hidden" aria-label="شريط ضغط السيولة">
          <div className={`h-full ${Number(brain?.pressure?.score||0) >= 70 ? 'bg-red-600' : Number(brain?.pressure?.score||0) >= 40 ? 'bg-amber-500' : 'bg-green-600'}`} style={{ width: `${Math.min(100, Number(brain?.pressure?.score||0))}%` }} />
        </div>
        <div className="mt-2 text-xs text-gray-700">{brain?.pressure?.band || '—'}</div>
      </div>

      <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500">مخاطر 90 يوم</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setBrainDetails('risk90')} className="text-xs text-blue-700 hover:underline" aria-label="تفاصيل الحساب">تفاصيل الحساب</button>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${brain?.risk90?.level === 'critical' ? 'border-red-100 bg-red-50 text-red-700' : brain?.risk90?.level === 'high' ? 'border-amber-100 bg-amber-50 text-amber-800' : brain?.risk90?.level === 'medium' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>{brain?.risk90?.label || '—'}</span>
          </div>
        </div>
        <div className="mt-1 text-sm font-semibold text-gray-900"><Currency value={brain?.risk90?.due90Total || 0} /></div>
        <div className="mt-1 text-xs text-gray-600">عدد البنود: <span className="font-semibold text-gray-900">{brain?.risk90?.due90Count ?? 0}</span></div>
      </div>

      <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500">الاتجاه التشغيلي</div>
          <button type="button" onClick={() => setBrainDetails('trend')} className="text-xs text-blue-700 hover:underline" aria-label="تفاصيل الحساب">تفاصيل الحساب</button>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{brain?.trend?.trend || '—'}</span>
          <span className="text-sm text-gray-500">{brain?.trend?.trend === 'يتحسن' ? '↑' : brain?.trend?.trend === 'يتراجع' ? '↓' : '→'}</span>
        </div>
        <div className="mt-1 text-xs text-gray-600">60 يوم: دفعات <span className="font-semibold text-gray-900">{brain?.trend?.paid60 ?? 0}</span> / مستحق <span className="font-semibold text-gray-900">{brain?.trend?.due60 ?? 0}</span></div>
      </div>
    </div>

    {(() => {
      const pressure = Number(brain?.pressure?.score || 0);
      const unpricedRatio = Number(brain?.pressure?.unpricedRatio || 0);
      const criticalNow = seededOnlyList.some(r => String(r?.riskLevel || '').toLowerCase() === 'high' && (isPastDue(r) || Number(r.amount) === 0));
      const show = (brain?.cluster === true) || criticalNow || pressure > 70 || unpricedRatio > 0.40;
      if (!show) return null;
      return (
        <div className="mt-3 p-3 rounded-xl border border-amber-100 bg-amber-50">
          <div className="font-semibold text-amber-900 text-sm">⚠️ تنبيه تشغيلي</div>
          <div className="text-xs text-amber-900 mt-1">دفتر معرض لمخاطر تشغيلية خلال 90 يوم. (ضغط السيولة/تأخر/High-risk/عدم تسعير)</div>
          <div className="mt-2">
            <button type="button" onClick={() => {
              const el = document.querySelector('[data-critical="1"], [data-overdue="1"]');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }} className="px-3 py-2 rounded-lg bg-white border border-amber-200 text-amber-900 text-sm font-medium hover:bg-amber-100" aria-label="انتقل للبنود الحرجة">انتقل للبنود الحرجة</button>
          </div>
        </div>
      );
    })()}
  </div>

            <LedgerForecastTab
    forecastRunRate={forecastRunRate}
    cashGap={cashGap}
    assumedInflow={assumedInflow}
    setAssumedInflow={setAssumedInflow}
    Currency={Currency}
    forecastPreset={forecastPreset}
    setForecastPreset={setForecastPreset}
    scRent={scRent}
    setScRent={setScRent}
    scUtilities={scUtilities}
    setScUtilities={setScUtilities}
    scMaintenance={scMaintenance}
    setScMaintenance={setScMaintenance}
    scMarketing={scMarketing}
    setScMarketing={setScMarketing}
    scOther={scOther}
    setScOther={setScOther}
    forecastInsights={forecastInsights}
    toast={toast}
  />

{/* Ledger Intelligence v1 */}
  <div className="grid gap-3 md:grid-cols-3 mb-4">
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-gray-900">صحة الدفتر</h4>
          <p className="text-xs text-gray-500 mt-1">عرض فقط • تعتمد على البنود seeded وحركات الدفتر (meta)</p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs border border-gray-200 bg-gray-50 text-gray-700">{health?.score ?? 0}/100</span>
      </div>

      <div className="mt-3 text-xs text-gray-700 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2"><span className="text-gray-600">نسبة التسعير</span><span className="font-semibold text-gray-900">{health ? `${health.pricedCount}/${health.totalSeeded}` : '—'}</span></div>
        <div className="flex items-center justify-between gap-2"><span className="text-gray-600">نسبة الانضباط (30 يوم)</span><span className="font-semibold text-gray-900">{health ? `${Math.round((health.disciplineRatio || 0) * 100)}%` : '—'}</span></div>
        <div className="flex items-center justify-between gap-2"><span className="text-gray-600">مخاطر</span><span className="font-semibold text-gray-900">{health ? `High ${health.highRiskCount} • متأخر ${health.overdueCount} • قادم ${health.dueSoon14Count}` : '—'}</span></div>
      </div>

      <button type="button" onClick={() => setHealthHelpOpen(v => !v)} className="mt-3 text-xs text-blue-700 hover:underline" aria-label="كيف نحسبها؟">كيف نحسبها؟</button>
      {healthHelpOpen ? (
        <div className="mt-2 text-xs text-gray-600 p-3 rounded-lg bg-gray-50 border border-gray-100">
          score = (التسعير×50) + (١-نسبة التأخر)×30 + (١-نسبة High-risk غير المسعّر)×20. ويتم قصّه بين 0 و100.
        </div>
      ) : null}
    </div>

    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-gray-900">توقعات السنة</h4>
          <p className="text-xs text-gray-500 mt-1">التوقعات تُحسب من البنود المسعّرة فقط</p>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-700 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2"><span className="text-gray-600">Annual Run-rate</span><span className="font-semibold text-gray-900"><Currency value={projection.annualRunRate} /></span></div>
        <div className="flex items-center justify-between gap-2"><span className="text-gray-600">الحد الأدنى</span><span className="font-semibold text-gray-900"><Currency value={projection.annualMin} /></span></div>
        <div className="flex items-center justify-between gap-2"><span className="text-gray-600">الحد الأعلى</span><span className="font-semibold text-gray-900"><Currency value={projection.annualMax} /></span></div>
      </div>
      <p className="mt-2 text-xs text-gray-500">(min/max تظهر فقط إذا كان للبند priceBand)</p>
    </div>

    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-gray-900">محاكاة سريعة</h4>
          <p className="text-xs text-gray-500 mt-1">لا تغيّر البيانات • حساب لحظي</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 text-xs">
        <div>
          <div className="flex items-center justify-between"><span>زيادة الإيجارات %</span><strong>{simRentPct}%</strong></div>
          <input type="range" min="0" max="30" value={simRentPct} onChange={(e) => setSimRentPct(Number(e.target.value))} className="w-full" aria-label="زيادة الإيجارات" />
        </div>
        <div>
          <div className="flex items-center justify-between"><span>زيادة الفواتير %</span><strong>{simBillsPct}%</strong></div>
          <input type="range" min="0" max="30" value={simBillsPct} onChange={(e) => setSimBillsPct(Number(e.target.value))} className="w-full" aria-label="زيادة الفواتير" />
        </div>
        <div>
          <div className="flex items-center justify-between"><span>ضغط الصيانة %</span><strong>{simMaintPct}%</strong></div>
          <input type="range" min="0" max="30" value={simMaintPct} onChange={(e) => setSimMaintPct(Number(e.target.value))} className="w-full" aria-label="ضغط الصيانة" />
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          <button type="button" onClick={() => { setSimRentPct(0); setSimBillsPct(0); setSimMaintPct(0); }} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" aria-label="متفائل">متفائل</button>
          <button type="button" onClick={() => { setSimRentPct(8); setSimBillsPct(6); setSimMaintPct(5); }} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" aria-label="واقعي">واقعي</button>
          <button type="button" onClick={() => { setSimRentPct(20); setSimBillsPct(18); setSimMaintPct(15); }} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" aria-label="ضاغط">ضاغط</button>
        </div>

        {(() => {
          const scenario = computeScenario({ recurringItems: seededOnlyList, rentPct: simRentPct, billsPct: simBillsPct, maintPct: simMaintPct });
          return (
            <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between gap-2"><span className="text-gray-600">New Annual Forecast</span><span className="font-semibold text-gray-900"><Currency value={scenario.newAnnual} /></span></div>
              <div className="flex items-center justify-between gap-2 mt-1"><span className="text-gray-600">الفرق</span><span className={`font-semibold ${scenario.delta >= 0 ? 'text-red-700' : 'text-green-700'}`}>{scenario.delta >= 0 ? '+' : ''}<Currency value={scenario.delta} /></span></div>
            </div>
          );
        })()}
      </div>
    </div>
  </div>

  {/* Ledger Operator Mode */}
  <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h4 className="font-bold text-gray-900">لوحة تشغيل الدفتر</h4>
        <p className="text-sm text-gray-500 mt-1">الأولوية الآن (متأخر ثم أقرب 14 يوم) • دفتر: <span className="font-medium text-gray-700">{activeLedger?.name || '—'}</span></p>

        <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-stretch text-xs text-gray-700">
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">إجمالي شهري (مسعّر): <strong className="text-gray-900"><Currency value={operatorMode.monthlyTotal} /></strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">مسعّر: <strong className="text-gray-900">{operatorMode.pricedCount}</strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">غير مسعّر: <strong className="text-gray-900">{operatorMode.unpricedCount}</strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">متأخر: <strong className="text-gray-900">{operatorMode.overdueCount}</strong></span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {operatorMode.priorityNow.length === 0 ? (
            <div className="text-sm text-gray-500">لا توجد مهام تشغيلية قريبة.</div>
          ) : (
            operatorMode.priorityNow.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-gray-100 bg-white">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{r.title || '—'}</div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                    <span>{r.nextDueDate || '—'}</span>
                    <span className="text-gray-300">•</span>
                    <span><Currency value={Number(r.amount) || 0} /></span>
                    {isPastDue(r) ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] border border-yellow-100 bg-yellow-50 text-yellow-800">متأخر</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] border border-blue-100 bg-blue-50 text-blue-700">قادم</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    disabled={Number(r.amount) === 0}
                    title={Number(r.amount) === 0 ? 'حدد المبلغ أولاً' : 'سجّل كدفعة الآن'}
                    onClick={() => startPayNow(r)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${Number(r.amount) === 0 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    aria-label="سجّل كدفعة الآن"
                  >
                    سجّل كدفعة الآن
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3">الأرقام المقترحة تقديرية لمساعدتك على الانضباط، ويمكن تعديلها.</p>
      </div>

      <div className="flex flex-col items-end gap-2">
        {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
        <button
          type="button"
          onClick={openPricingWizard}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
          aria-label="مرّرني على غير المسعّر"
        >
          مرّرني على غير المسعّر
        </button>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="font-bold text-gray-900">التزامات متكررة</h4>
        <p className="text-sm text-gray-500 mt-1">دفتر نشط: <span className="font-medium text-gray-700">{activeLedger?.name || '—'}</span></p>

        {/* Summary (display-only) */}
        <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 items-stretch text-xs text-gray-700" id="ledger-summary">
          {/* Aggregations */}
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">إجمالي شهري: <strong className="text-gray-900"><Currency value={recurringDashboard.monthlyTotal} /></strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">إجمالي سنوي: <strong className="text-gray-900"><Currency value={recurringDashboard.yearlyTotal} /></strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">إجمالي 30 يوم: <strong className="text-gray-900"><Currency value={recurringDashboard.within30Total} /></strong></span>

          {/* Compliance */}
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">الكل: <strong className="text-gray-900">{recurringDashboard.totalCount}</strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">إلزامي: <strong className="text-gray-900">{recurringDashboard.requiredCount}</strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">غير مُسعّر: <strong className="text-gray-900">{recurringDashboard.unpricedCount}</strong></span>
          <span className="px-2 py-1 rounded-md bg-gray-50 border border-gray-100">خطر مرتفع: <strong className="text-gray-900">{recurringDashboard.highRiskCount}</strong></span>

          {/* Completeness */}
          {completeness ? (
            <span className="col-span-2 sm:col-span-1 px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
              اكتمال الدفتر: <strong className="text-gray-900">{completeness.pct}%</strong>
              <span className="block mt-1 h-2 rounded bg-gray-200 overflow-hidden" aria-label="شريط اكتمال">
                <span className="block h-full bg-blue-600" style={{ width: `${completeness.pct}%` }} />
              </span>
            </span>
          ) : null}
        </div>

        {/* Next 3 dues */}
        <div className="mt-3 text-xs text-gray-600">
          <div className="font-medium text-gray-800 mb-1">القادم (أقرب 3):</div>
          {recurringDashboard.next3.length === 0 ? (
            <div>—</div>
          ) : (
            <div className="flex flex-col gap-1">
              {recurringDashboard.next3.map((x) => (
                <div key={x.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-900">{x.title}</span>
                  <span className="text-gray-400">•</span>
                  <span>{x.nextDueDate || '—'}</span>
                  <span className="text-gray-400">•</span>
                  <span><Currency value={Number(x.amount) || 0} /></span>
                  {isPastDue(x) ? <span className="px-2 py-0.5 rounded-full text-[11px] border border-yellow-100 bg-yellow-50 text-yellow-800">متأخر</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
    </div>

    <div className="flex flex-wrap gap-2 justify-end">
      {unpricedList.length > 0 ? (
        <button
          type="button"
          onClick={openPricingWizard}
          className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium hover:bg-amber-100"
          aria-label="إكمال التسعير"
        >
          إكمال التسعير
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setSaPricingOpen(true)}
        className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
        aria-label="معالج تسعير سعودي"
      >
        معالج تسعير سعودي
      </button>
    </div>

    {/* Outlook 30/60/90 */}
    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
      <div className="p-2 rounded-lg bg-white border border-gray-100">
        <div className="text-gray-500">30 يوم</div>
        <div className="font-semibold text-gray-900"><Currency value={outlook.d30.pricedTotal} /></div>
        <div className="text-gray-500">{outlook.d30.count} • غير مُسعّر {outlook.d30.unpricedCount}</div>
      </div>
      <div className="p-2 rounded-lg bg-white border border-gray-100">
        <div className="text-gray-500">60 يوم</div>
        <div className="font-semibold text-gray-900"><Currency value={outlook.d60.pricedTotal} /></div>
        <div className="text-gray-500">{outlook.d60.count} • غير مُسعّر {outlook.d60.unpricedCount}</div>
      </div>
      <div className="p-2 rounded-lg bg-white border border-gray-100">
        <div className="text-gray-500">90 يوم</div>
        <div className="font-semibold text-gray-900"><Currency value={outlook.d90.pricedTotal} /></div>
        <div className="text-gray-500">{outlook.d90.count} • غير مُسعّر {outlook.d90.unpricedCount}</div>
      </div>
    </div>

    {/* Budget targets */}
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">هدف شهري (اختياري)</label>
        <input type="text" inputMode="decimal" value={budgetForm.monthlyTarget} onChange={(e) => setBudgetForm(f => ({ ...f, monthlyTarget: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="هدف شهري" placeholder="0" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">هدف سنوي (اختياري)</label>
        <input type="text" inputMode="decimal" value={budgetForm.yearlyTarget} onChange={(e) => setBudgetForm(f => ({ ...f, yearlyTarget: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="هدف سنوي" placeholder="0" />
      </div>
    </div>

    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="text-gray-600">
        الفعلي (شهري/سنوي): <span className="font-semibold text-gray-900"><Currency value={actuals.actualMonthly} /></span> / <span className="font-semibold text-gray-900"><Currency value={actuals.actualYearly} /></span>
      </div>
      <div className={`px-2 py-1 rounded-full border ${budgetsHealth.status === 'danger' ? 'bg-red-50 border-red-100 text-red-800' : budgetsHealth.status === 'warn' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' : budgetsHealth.status === 'good' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
        {budgetsHealth.status === 'danger' ? 'خطر' : budgetsHealth.status === 'warn' ? 'تحذير' : budgetsHealth.status === 'good' ? 'ممتاز' : 'بدون هدف'}
      </div>
      <button type="button" onClick={() => {
        if (!activeId) return;
        const m = parseRecurringAmount(budgetForm.monthlyTarget);
        const y = parseRecurringAmount(budgetForm.yearlyTarget);
        const budgets = normalizeBudgets({ monthlyTarget: Number.isFinite(m) ? m : 0, yearlyTarget: Number.isFinite(y) ? y : 0 });
        const next = (Array.isArray(ledgers) ? ledgers : []).map(l => l.id === activeId ? { ...l, budgets, updatedAt: new Date().toISOString() } : l);
        try { setLedgers(next); } catch { toast('تعذر حفظ الميزانية', 'error'); return; }
        toast('تم حفظ الميزانية');
        refresh();
      }} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="حفظ الميزانية">حفظ الميزانية</button>
    </div>

    {/* Alerts */}
    {ledgerAlerts.length ? (
      <div className="mt-3 p-3 rounded-lg border border-gray-100 bg-white">
        <div className="font-semibold text-gray-900 text-sm mb-2">تنبيهات الدفتر</div>
        <div className="flex flex-col gap-2">
          {ledgerAlerts.map(a => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-medium text-gray-900">{a.title}</div>
                <div className="text-gray-500">{a.reason}</div>
              </div>
              <button type="button" onClick={() => {
                if (a.action === 'open-pricing') { openPricingWizard(); return; }
                if (a.action === 'scroll-summary') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
                if (a.action === 'scroll-overdue') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
              }} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="اذهب">اذهب</button>
            </div>
          ))}
        </div>
      </div>
    ) : null}
  </div>

  <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الالتزام</label>
        <input value={recForm.title} onChange={(e) => setRecForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اسم الالتزام" placeholder="مثال: إيجار المكتب" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
        <input type="text" inputMode="decimal" value={recForm.amount} onChange={(e) => setRecForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="مبلغ الالتزام" placeholder="0" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">التكرار</label>
        <select value={recForm.frequency} onChange={(e) => setRecForm(f => ({ ...f, frequency: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="تكرار الالتزام">
          <option value="monthly">شهري</option>
          <option value="quarterly">ربع سنوي</option>
          <option value="yearly">سنوي</option>
          <option value="adhoc">عند الحاجة</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق القادم</label>
        <input type="date" value={recForm.nextDueDate} onChange={(e) => setRecForm(f => ({ ...f, nextDueDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="تاريخ الاستحقاق القادم" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
        <textarea value={recForm.notes} onChange={(e) => setRecForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="ملاحظات الالتزام" />
      </div>
    </div>

    <div className="flex gap-2 justify-end mt-4">
      {recEditingId && (
        <button type="button" onClick={() => { setRecEditingId(null); resetRecForm(); }} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="إلغاء تعديل الالتزام">إلغاء</button>
      )}
      <button type="button" onClick={saveRecurring} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ الالتزام">{recEditingId ? 'حفظ التعديل' : 'إضافة التزام'}</button>
    </div>
  </div>

  {activeRecurring.length === 0 ? (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <EmptyState message="لا توجد التزامات متكررة لهذا الدفتر" />
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('ui:help', { detail: { section: 'recurring' } }))} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50" aria-label="افتح المساعدة">افتح المساعدة</button>
      </div>
    </div>
  ) : (
    (() => {
      const sections = [
        { key: 'system', title: 'نظامي' },
        { key: 'operational', title: 'تشغيلي' },
        { key: 'maintenance', title: 'صيانة' },
        { key: 'marketing', title: 'تسويق' },
        { key: 'adhoc', title: 'عند الحاجة' },
        { key: 'uncategorized', title: 'أخرى' },
      ];

      return (
        <div className="flex flex-col gap-4">
          {sections.map((s) => {
            const listRaw = recurringSections[s.key] || [];
            if (listRaw.length === 0) return null;
            const list = sortRecurringInSection(listRaw);
            const stats = sectionStats(list);

            return (
              <div key={s.key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{s.title}</h4>
                    <span className="text-xs text-gray-500">({stats.count})</span>
                    {stats.unpricedCount ? <span className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">غير مُسعّر: {stats.unpricedCount}</span> : null}
                  </div>
                  <div className="text-xs text-gray-600">المجموع: <strong className="text-gray-900"><Currency value={stats.subtotal} /></strong></div>
                </div>

                <div className="divide-y divide-gray-100">
                  {list.map((r) => (
                    <div
                      key={r.id}
                      id={`rec-${r.id}`}
                      data-overdue={isPastDue(r) ? '1' : '0'}
                      data-highrisk={normalizeRecurringRisk(r.riskLevel) === 'high' ? '1' : '0'}
                      data-critical={(normalizeRecurringRisk(r.riskLevel) === 'high' && (isPastDue(r) || Number(r.amount) === 0)) ? '1' : '0'}
                      className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate flex flex-wrap gap-2 items-center">
                          <span className="truncate">{r.title}</span>

                          {normalizeRecurringCategory(r.category) ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] border border-gray-200 bg-white text-gray-600">{CATEGORY_LABEL[normalizeRecurringCategory(r.category)]}</span>
                          ) : null}

                          {r.required ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] border border-blue-100 bg-blue-50 text-blue-700">إلزامي</span>
                          ) : null}

                          {Number(r.amount) === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] border border-amber-100 bg-amber-50 text-amber-800">بحاجة لتسعير</span>
                          ) : null}

                          {normalizeRecurringRisk(r.riskLevel) === 'high' ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] border border-red-100 bg-red-50 text-red-700">خطر مرتفع</span>
                          ) : null}
                        </div>

                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1 items-center">
                          <span>{r.frequency}</span>
                          <span>•</span>
                          <span>{r.nextDueDate}</span>
                          <span>•</span>
                          <span><Currency value={r.amount} /></span>
                          {isPastDue(r) ? <span className="px-2 py-0.5 rounded-full text-[11px] border border-yellow-100 bg-yellow-50 text-yellow-800">متأخر</span> : null}
                        </div>
                        {r.notes?.trim() ? <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{r.notes}</div> : null}
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          disabled={Number(r.amount) === 0}
                          title={Number(r.amount) === 0 ? 'حدد المبلغ أولاً' : 'سجّل كدفعة الآن'}
                          onClick={() => startPayNow(r)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border ${Number(r.amount) === 0 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                          aria-label="سجّل كدفعة الآن"
                        >
                          سجّل كدفعة الآن
                        </button>
                        <button type="button" onClick={() => {
                          setHistoryModal({ item: r });
                        }} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50" aria-label="سجل">🧾 سجل</button>
                        <button type="button" onClick={() => startEditRecurring(r)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50" aria-label="تعديل الالتزام">تعديل</button>
                        <button type="button" onClick={() => deleteRecurring(r.id)} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100" aria-label="حذف الالتزام">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    })()
  )}
</>  );
}
