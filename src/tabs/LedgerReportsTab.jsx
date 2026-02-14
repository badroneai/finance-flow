import React from 'react';

export default function LedgerReportsTab(props) {
  const {
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
    ledgerTxSummary,
    setTab,

    confirm,
    setConfirm,
  } = props;

  return (
<>
  <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm mb-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="font-bold text-gray-900">تقارير الدفتر</h4>
        <p className="text-sm text-gray-500 mt-1">دفتر نشط: <span className="font-medium text-gray-700">{activeLedger?.name || '—'}</span></p>
        <p className="text-xs text-gray-500 mt-1">ملاحظة: هذه التقارير تُحسب فقط من الحركات التي تم إنشاؤها عبر "سجّل كدفعة الآن" (لأنها تحمل meta للدفتر).</p>
      </div>
      {!activeId && <Badge color="yellow">اختر دفترًا نشطًا</Badge>}
    </div>
  </div>

  {(!activeId) ? (
    <EmptyState message="اختر دفترًا نشطًا لعرض التقارير" />
  ) : (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-gray-900">Mini P&L</h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">عدد الحركات المصنفة: {ledgerReports?.txCount || 0}</span>
            <button type="button" onClick={() => {
              if (!activeId) return;
              const all = dataStore.transactions.list();
              const txs = filterTransactionsForLedgerByMeta({ transactions: all, ledgerId: activeId });

              const now = new Date();
              const daysAgo = (n) => {
                const d = new Date(now.getTime());
                d.setDate(d.getDate() - n);
                return d;
              };
              const last30 = txs.filter(t => {
                const dt = new Date(String(t.date || '') + 'T00:00:00');
                if (Number.isNaN(dt.getTime())) return false;
                return dt.getTime() >= daysAgo(30).getTime();
              });
              const last365 = txs.filter(t => {
                const dt = new Date(String(t.date || '') + 'T00:00:00');
                if (Number.isNaN(dt.getTime())) return false;
                return dt.getTime() >= daysAgo(365).getTime();
              });

              const pl30 = computePL({ transactions: last30 });
              const pl365 = computePL({ transactions: last365 });

              const bucketName = (b) => CATEGORY_LABEL[b] || b || 'other';
              const breakdown = computeTopBuckets({ transactions: txs, limit: 50 });
              const breakdownStr = breakdown.map(x => `${bucketName(x.bucket)}:${Number(x.total) || 0}`).join(' | ');
              const generatedAt = new Date().toISOString();

              const headers = ['period','income_total','expense_total','net_total','breakdown_by_bucket','generated_at'];
              const rows = [
                ['30d', pl30.income, pl30.expense, pl30.net, breakdownStr, generatedAt],
                ['12m', pl365.income, pl365.expense, pl365.net, breakdownStr, generatedAt],
              ];

              downloadCSV({ filename: `ledger_report_${today()}.csv`, headers, rows });
              toast('تم تصدير تقرير الدفتر CSV');
            }} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50" aria-label="تصدير تقرير الدفتر CSV">تصدير تقرير الدفتر CSV</button>

            <button type="button" onClick={() => {
              const list = activeRecurring;
              const headers = ['ledgerId','name','bucket','required','riskLevel','frequency','nextDueDate','amount','saHint'];
              const bucketRaw = (r) => getBucketForRecurring(r) || 'other';
              const rows = list.map(r => ([
                r.ledgerId || '',
                r.title || '',
                bucketRaw(r),
                r.required ? 'true' : 'false',
                r.riskLevel || '',
                r.frequency || '',
                r.nextDueDate || '',
                Number(r.amount) || 0,
                r.saHint || '',
              ]));
              downloadCSV({ filename: `ledger_obligations_${today()}.csv`, headers, rows });
              toast('تم تصدير الالتزامات CSV');
            }} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50" aria-label="تصدير الالتزامات CSV">تصدير الالتزامات CSV</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500">آخر 30 يوم</div>
            <div className="mt-1 text-sm">دخل: <strong><Currency value={ledgerReports?.pl30?.income || 0} /></strong></div>
            <div className="text-sm">مصروف: <strong><Currency value={ledgerReports?.pl30?.expense || 0} /></strong></div>
            <div className="text-sm">صافي: <strong><Currency value={ledgerReports?.pl30?.net || 0} /></strong></div>
          </div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500">آخر 12 شهر (تقريبي)</div>
            <div className="mt-1 text-sm">دخل: <strong><Currency value={ledgerReports?.pl365?.income || 0} /></strong></div>
            <div className="text-sm">مصروف: <strong><Currency value={ledgerReports?.pl365?.expense || 0} /></strong></div>
            <div className="text-sm">صافي: <strong><Currency value={ledgerReports?.pl365?.net || 0} /></strong></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
        <h4 className="font-bold text-gray-900">Top 5 مصروفات حسب Bucket</h4>
        {(!ledgerReports?.topBuckets || ledgerReports.topBuckets.length === 0) ? (
          <p className="text-sm text-gray-500 mt-2">لا توجد بيانات كافية بعد. استخدم "سجّل كدفعة الآن" لتغذية التقرير.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {ledgerReports.topBuckets.map((b) => (
              <div key={b.bucket} className="flex items-center justify-between gap-2">
                <span className="text-gray-700">{CATEGORY_LABEL[b.bucket] || b.bucket || 'غير مصنف'}</span>
                <strong className="text-gray-900"><Currency value={b.total} /></strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm">
        <h4 className="font-bold text-gray-900">Compliance Score</h4>
        {ledgerReports?.compliance ? (
          <div className="mt-2">
            <div className="text-sm">النتيجة: <strong>{ledgerReports.compliance.pct}%</strong></div>
            <div className="text-xs text-gray-500 mt-1">{ledgerReports.compliance.note}</div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-2">لا توجد عناصر seeded كافية لحساب الانضباط.</p>
        )}
      </div>
    </div>
  )}
</>
      )}

      {/* Ledger Brain Pro: Details Modal */}
      <Modal
open={!!brainDetails}
onClose={() => setBrainDetails(null)}
title={brainDetails === 'burn' ? 'تفاصيل Burn Rate' : brainDetails === 'pressure' ? 'تفاصيل ضغط السيولة' : brainDetails === 'risk90' ? 'تفاصيل مخاطر 90 يوم' : brainDetails === 'trend' ? 'تفاصيل الاتجاه التشغيلي' : 'تفاصيل'}
wide
      >
{(() => {
  if (!activeId || !brainDetails) return null;
  const ctx = brainCtx;

  if (brainDetails === 'burn') {
    const b = getBurnBreakdown(activeId, ctx);
    const label = (c) => (c === 'system' ? 'نظامي' : c === 'operational' ? 'تشغيلي' : c === 'maintenance' ? 'صيانة' : c === 'marketing' ? 'تسويق' : 'أخرى');
    return (
      <div className="p-1">
        <div className="text-sm text-gray-700">الإجمالي الشهري (مكافئ): <strong className="text-gray-900"><Currency value={b.totalMonthly} /></strong></div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="text-start py-2">التصنيف</th>
                <th className="text-start py-2">شهري</th>
                <th className="text-start py-2">% من الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {b.buckets.map((x) => (
                <tr key={x.category} className="border-t border-gray-100">
                  <td className="py-2">{label(x.category)}</td>
                  <td className="py-2"><Currency value={x.monthlySum} /></td>
                  <td className="py-2">{x.percentOfTotal}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (brainDetails === 'pressure') {
    const p = getPressureBreakdown(activeId, ctx);
    const parts = p.weightedScoreParts || {};
    return (
      <div className="p-1 text-sm">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">غير مسعّر: <strong>{p.missingPricingCount}</strong></div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">متأخر: <strong>{p.overdueCount}</strong></div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">High-risk غير مسعّر: <strong>{p.highRiskUnpriced}</strong></div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">الانضباط (30 يوم): <strong>{Math.round((p.disciplineRatio || 0) * 100)}%</strong></div>
        </div>

        <div className="mt-4">
          <div className="font-semibold text-gray-900 mb-2">مكونات الوزن (تقريبية)</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-start py-2">البند</th>
                  <th className="text-start py-2">نقاط</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(parts).map(k => (
                  <tr key={k} className="border-t border-gray-100">
                    <td className="py-2">{k}</td>
                    <td className="py-2">{Math.round(Number(parts[k]) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-500">ملاحظة: هذه التفاصيل لشرح الرقم، بينما الدرجة النهائية تُحسب في calculateCashPressureScore().</p>
        </div>
      </div>
    );
  }

  if (brainDetails === 'risk90') {
    const r = getRiskBreakdown90d(activeId, ctx);
    return (
      <div className="p-1 text-sm">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">مجموع المستحق 90 يوم: <strong><Currency value={r.totalDueAmount} /></strong></div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">High-risk (عدد): <strong>{r.highRiskCount}</strong></div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">مبلغ متأخر: <strong><Currency value={r.overdueAmount} /></strong></div>
          <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">Burn ratio: <strong>{(r.burnRatio || 0).toFixed(2)}</strong></div>
        </div>
        <p className="mt-3 text-xs text-gray-500">computedLevel: {r.computedLevel}</p>
      </div>
    );
  }

  if (brainDetails === 'trend') {
    return (
      <div className="p-1 text-sm">
        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
          الاتجاه الحالي يُستنتج من عدد الدفعات المسجلة خلال 60 يوم مقابل عدد البنود المستحقة خلال نفس الفترة.
        </div>
      </div>
    );
  }

  return null;
})()}
      </Modal>

      {/* Saudi Auto-Pricing Wizard v2 */}
      {saPricingOpen ? (
<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
  <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full" onClick={e => e.stopPropagation()}>
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="text-lg font-bold text-gray-900">معالج تسعير سعودي</h3>
        <p className="text-sm text-gray-500 mt-1">يملأ مبالغ مقترحة للعناصر seeded حسب المدينة والحجم.</p>
      </div>
      <button type="button" onClick={() => setSaPricingOpen(false)} className="text-gray-500 hover:text-gray-800" aria-label="إغلاق">×</button>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
        <select value={saCity} onChange={(e) => setSaCity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="مدينة التسعير">
          <option value="riyadh">الرياض</option>
          <option value="jeddah">جدة</option>
          <option value="dammam">الدمام</option>
          <option value="qassim">القصيم</option>
          <option value="other">أخرى</option>
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">حجم الكيان</label>
        <select value={saSize} onChange={(e) => setSaSize(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="حجم الكيان">
          <option value="small">صغير</option>
          <option value="medium">متوسط</option>
          <option value="large">كبير</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={saOnlyUnpriced} onChange={(e) => setSaOnlyUnpriced(e.target.checked)} />
          تطبيق على العناصر غير المُسعّرة فقط
        </label>
      </div>
    </div>

    <div className="flex gap-2 justify-end mt-4">
      <button type="button" onClick={() => setSaPricingOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="إلغاء">إلغاء</button>
      <button type="button" onClick={() => {
        const r = applySaudiAutoPricing({ city: saCity, size: saSize, onlyUnpriced: saOnlyUnpriced });
        if (!r.ok) { toast(r.message || 'تعذر تطبيق التسعير', 'error'); return; }
        toast('تم تطبيق التسعير المقترح');
        setSaPricingOpen(false);
        refresh();
      }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" aria-label="تطبيق">تطبيق</button>
    </div>
  </div>
</div>
      ) : null}

      {/* Quick Pricing Wizard */}
      {pricingOpen && unpricedList.length > 0 ? (
<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
  <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full" onClick={e => e.stopPropagation()}>
    {(() => {
      const item = unpricedList[Math.min(pricingIndex, unpricedList.length - 1)];
      if (!item) return null;

      return (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900">إكمال التسعير</h3>
              <p className="text-sm text-gray-500 mt-1">{pricingIndex + 1} / {unpricedList.length} — {item.title}</p>
            </div>
            <button type="button" onClick={() => setPricingOpen(false)} className="text-gray-500 hover:text-gray-800" aria-label="إغلاق">×</button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
              <input
                type="text"
                inputMode="decimal"
                value={pricingAmount}
                onChange={(e) => setPricingAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="0"
                aria-label="مبلغ التسعير"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={pricingDate}
                onChange={(e) => setPricingDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                aria-label="تاريخ التسعير"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end mt-4">
            <button type="button" onClick={() => {
              // Skip
              const next = pricingIndex + 1;
              if (next >= unpricedList.length) { setPricingOpen(false); refresh(); return; }
              setPricingIndex(next);
              const nxt = unpricedList[next];
              setPricingAmount('');
              setPricingDate(ensureDateValue(nxt?.nextDueDate));
            }} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="تخطي">تخطي</button>

            <button type="button" onClick={() => {
              // Save & next
              const amount = parseRecurringAmount(pricingAmount);
              if (!Number.isFinite(amount) || amount <= 0) { toast('المبلغ غير صالح', 'error'); return; }
              const due = String(pricingDate || '').trim();
              if (!due) { toast('تاريخ الاستحقاق مطلوب', 'error'); return; }
              try {
                applyPricingToItem(item.id, { amount, nextDueDate: due });
              } catch { toast('تعذر حفظ التسعير', 'error'); return; }

              const next = pricingIndex + 1;
              if (next >= unpricedList.length) {
                toast('تم تحديث التسعير');
                setPricingOpen(false);
                refresh();
                return;
              }
              setPricingIndex(next);
              const nxt = unpricedList[next];
              setPricingAmount('');
              setPricingDate(ensureDateValue(nxt?.nextDueDate));
            }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" aria-label="التالي">التالي</button>

            <button type="button" onClick={() => {
              // Save & finish
              const amount = parseRecurringAmount(pricingAmount);
              if (!Number.isFinite(amount) || amount <= 0) { toast('المبلغ غير صالح', 'error'); return; }
              const due = String(pricingDate || '').trim();
              if (!due) { toast('تاريخ الاستحقاق مطلوب', 'error'); return; }
              try {
                applyPricingToItem(item.id, { amount, nextDueDate: due });
                toast('تم تحديث التسعير');
                setPricingOpen(false);
                refresh();
              } catch { toast('تعذر حفظ التسعير', 'error'); }
            }} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium" aria-label="حفظ وإنهاء">حفظ وإنهاء</button>
          </div>
        </>
      );
    })()}
  </div>
</div>
      ) : null}

      {/* Convert to Transaction */}
      {payOpen && paySource ? (
<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
  <div className="bg-white rounded-xl shadow-2xl p-5 max-w-md w-full" onClick={e => e.stopPropagation()}>
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="text-lg font-bold text-gray-900">سجّل كدفعة الآن</h3>
        <p className="text-sm text-gray-500 mt-1">{paySource.title}</p>
      </div>
      <button type="button" onClick={() => setPayOpen(false)} className="text-gray-500 hover:text-gray-800" aria-label="إغلاق">×</button>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
        <input value={payForm.description} onChange={(e) => setPayForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="وصف الدفعة" />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
        <input type="text" inputMode="decimal" value={payForm.amount} onChange={(e) => setPayForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="مبلغ الدفعة" />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
        <input type="date" value={payForm.date} onChange={(e) => setPayForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="تاريخ الدفعة" />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
        <select value={payForm.type} onChange={(e) => setPayForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="نوع الحركة">
          <option value="expense">خرج</option>
          <option value="income">دخل</option>
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
        <select value={payForm.paymentMethod} onChange={(e) => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="طريقة الدفع">
          <option value="cash">كاش</option>
          <option value="bank">تحويل</option>
          <option value="card">بطاقة</option>
          <option value="other">أخرى</option>
        </select>
      </div>
    </div>

    <div className="flex gap-2 justify-end mt-4">
      <button type="button" onClick={() => setPayOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="إلغاء">إلغاء</button>
      <button type="button" onClick={() => {
        const amount = parseRecurringAmount(payForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) { toast('المبلغ غير صالح', 'error'); return; }
        const date = String(payForm.date || '').trim();
        if (!date) { toast('التاريخ مطلوب', 'error'); return; }

        const type = (payForm.type === 'income' || payForm.type === 'expense') ? payForm.type : 'expense';
        const paymentMethod = String(payForm.paymentMethod || 'cash');
        const description = String(payForm.description || '').trim();

        const proceed = () => {
          // Minimal safe defaults (do not change transactions logic):
          const category = 'other';

          const meta = buildTxMetaFromRecurring({ activeLedgerId: activeId, recurring: paySource });
          const dueDateBefore = String(paySource?.nextDueDate || '');

          const res = dataStore.transactions.create({
            type,
            category,
            amount,
            paymentMethod,
            date,
            description,
            meta,
          });
          if (!res || !res.ok) { toast(res?.message || STORAGE_ERROR_MESSAGE, 'error'); return; }

          toast('تم تسجيل الدفعة');

          try {
            if (paySource?.id) {
              updateRecurringOps(
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
                  txId: res?.item?.id || res?.data?.id || res?.tx?.id || undefined,
                  meta: { dueDate: dueDateBefore, method: paymentMethod },
                }
              );
            }
          } catch {}

          setPayOpen(false);
          refresh();
        };

        // HardLock warning (display-only; user can continue)
        try {
          const breach = wouldBreachHardLock({
            budgets: budgets,
            utilization: budgetAuth,
            bucket: paySource?.category,
            additionalAmount: amount,
          });
          if (breach.blocked) {
            setConfirm({
              title: '⚠️ تجاوز ميزانية التصنيف',
              message: breach.reason + '. هل تريد المتابعة رغم ذلك؟',
              confirmLabel: 'متابعة رغم ذلك',
              onConfirm: () => { setConfirm(null); proceed(); },
              onCancel: () => setConfirm(null),
              danger: false,
            });
            return;
          }
        } catch {}

        proceed();
      }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" aria-label="تسجيل">تسجيل</button>
    </div>
  </div>
</div>
      ) : null}

      <Modal
Icons={Icons}
open={!!historyModal}
onClose={() => setHistoryModal(null)}
title={`🧾 سجل البند${historyModal?.item?.title ? ` — ${historyModal.item.title}` : ''}`}
wide={false}
      >
{(() => {
  const item = historyModal?.item;
  const h = Array.isArray(item?.history) ? item.history : [];
  const summary = summarizePayNow(h, { now: new Date() });
  const latest = h.slice().reverse().slice(0, 10);

  const label = (t) => {
    if (t === 'pay_now') return 'سجّل كدفعة الآن';
    if (t === 'state_paid') return 'تم وضعه كمدفوع';
    if (t === 'state_skipped') return 'تم وضعه كتجاوز';
    if (t === 'snooze') return 'تأجيل';
    if (t === 'note') return 'ملاحظة';
    return String(t || 'حدث');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
          <div className="text-[11px] text-gray-500">Paid last 90d</div>
          <div className="font-bold text-gray-900 mt-1"><Currency value={summary.paid90} /></div>
        </div>
        <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
          <div className="text-[11px] text-gray-500">Paid last 12m</div>
          <div className="font-bold text-gray-900 mt-1"><Currency value={summary.paid12m} /></div>
        </div>
        <div className="p-3 rounded-xl border border-gray-100 bg-white">
          <div className="text-[11px] text-gray-500">Count pay_now (12m)</div>
          <div className="font-bold text-gray-900 mt-1">{summary.count12m}</div>
        </div>
      </div>

      {latest.length === 0 ? (
        <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-700">لا يوجد سجل بعد.</div>
      ) : (
        <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-xl">
          {latest.map((e, idx) => (
            <div key={idx} className={`p-3 ${idx ? 'border-t border-gray-100' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-gray-900">{label(e.type)}</div>
                <div className="text-[11px] text-gray-500">{String(e.at || '')}</div>
              </div>
              {Number(e.amount) ? <div className="text-sm text-gray-700 mt-1">المبلغ: <Currency value={Number(e.amount)} /></div> : null}
              {e?.meta?.dueDate ? <div className="text-[11px] text-gray-500 mt-1">dueDate: {e.meta.dueDate}</div> : null}
              {e?.meta?.snoozeUntil ? <div className="text-[11px] text-gray-500 mt-1">snoozeUntil: {e.meta.snoozeUntil}</div> : null}
              {e?.meta?.method ? <div className="text-[11px] text-gray-500 mt-1">method: {e.meta.method}</div> : null}
              {e?.meta?.note ? <div className="text-[11px] text-gray-500 mt-1 whitespace-pre-wrap">note: {e.meta.note}</div> : null}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={() => setHistoryModal(null)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="إغلاق">إغلاق</button>
      </div>
    </div>
  );
})()}
      </Modal>

      
</>
  );
}
