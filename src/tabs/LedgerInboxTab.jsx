import React from 'react';

function LedgerInboxTab({
  inbox,
  cashPlan,
  brain,
  Currency,
  inboxFilter,
  setInboxFilter,
  inboxView,
  recurring,
  startPayNow,
  updateRecurringOps,
  toast,
  refresh,
  lastPayNowAt,
  daysSince,
  addDaysISO,
  setHistoryModal,
}) {
  return (
    <>
{/* Ledger Inbox Pro (v7) */}
<div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 md:p-5 shadow-sm mb-4">
  <div className="flex items-start justify-between gap-3">
    <div>
      <h4 className="font-bold text-[var(--color-text)]">📥 صندوق وارد الدفتر</h4>
      <p className="text-xs text-[var(--color-muted)] mt-1">قائمة تنفيذ + خطة سيولة (اليوم / 7 أيام / 30 يوم)</p>
    </div>
    <div className="text-xs text-[var(--color-muted)]">{inbox.length ? `عدد العناصر: ${inbox.length}` : ''}</div>
  </div>

  {/* Cash Plan Panel */}
  <div className="mt-3 grid md:grid-cols-4 gap-2">
    <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="text-[11px] text-[var(--color-muted)]">مطلوب اليوم (مسعّر)</div>
      <div className="font-bold text-[var(--color-text)] mt-1"><Currency value={cashPlan?.totals?.today || 0} /></div>
    </div>
    <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="text-[11px] text-[var(--color-muted)]">مطلوب 7 أيام (مسعّر)</div>
      <div className="font-bold text-[var(--color-text)] mt-1"><Currency value={cashPlan?.totals?.d7 || 0} /></div>
    </div>
    <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="text-[11px] text-[var(--color-muted)]">مطلوب 30 يوم (مسعّر)</div>
      <div className="font-bold text-[var(--color-text)] mt-1"><Currency value={cashPlan?.totals?.d30 || 0} /></div>
    </div>
    <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="text-[11px] text-[var(--color-muted)]">غير مسعّر</div>
      <div className="font-bold text-[var(--color-text)] mt-1">{cashPlan?.counts?.unpriced || 0}</div>
      <div className="text-[11px] text-[var(--color-muted)] mt-1">(إلزامي: {cashPlan?.counts?.requiredUnpriced || 0} • خطر: {cashPlan?.counts?.highRiskUnpriced || 0})</div>
    </div>
  </div>

  {/* Quick pressure indicator (display only) */}
  {(() => {
    const weeklyRef = (Number(brain?.burn?.monthly) || 0) / 4.3;
    const due7 = Number(cashPlan?.totals?.d7) || 0;
    if (weeklyRef <= 0 || due7 <= 0) return null;
    const pressured = due7 > weeklyRef;
    return (
      <div className={`mt-2 p-3 rounded-xl border text-sm ${pressured ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-green-50 border-green-100 text-green-800'}`}>
        مؤشر سريع: {pressured ? 'ضغط سيولة محتمل' : 'الضغط طبيعي'} — 7 أيام: <strong><Currency value={due7} /></strong> مقابل مرجع أسبوعي تقديري <strong><Currency value={weeklyRef} /></strong>
      </div>
    );
  })()}

  {/* Filters */}
  <div className="mt-3 flex flex-wrap gap-2">
    {[
      { key: 'all', label: 'الكل' },
      { key: 'overdue', label: 'المتأخر' },
      { key: 'soon', label: 'القريب' },
      { key: 'unpriced', label: 'غير مسعّر' },
      { key: 'high', label: 'عالي المخاطر' },
    ].map((f) => (
      <button key={f.key} type="button" onClick={() => setInboxFilter(f.key)} className={`px-3 py-2 rounded-lg text-sm font-medium border ${inboxFilter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`} aria-label={f.label}>{f.label}</button>
    ))}
  </div>

  {inboxView.length === 0 ? (
    <div className="mt-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)]">صندوق الوارد نظيف</div>
  ) : (
    <div className="mt-3 flex flex-col gap-2">
      {inboxView.slice(0, 10).map((it) => (
        <div key={it.id} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-[var(--color-text)] truncate">{it.title || '—'}</div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] border ${it.reason.includes('خطر') ? 'border-red-100 bg-red-50 text-red-700' : it.reason.includes('متأخر') ? 'border-yellow-100 bg-yellow-50 text-yellow-800' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>{it.reason}</span>
                {it.amount > 0 ? <span className="text-xs text-[var(--color-muted)]"><Currency value={it.amount} /></span> : <span className="text-xs text-amber-700">غير مسعّر</span>}
                {it.nextDueDate ? <span className="text-xs text-[var(--color-muted)]">• {it.nextDueDate}</span> : null}
                {(() => {
                  const lastAt = lastPayNowAt(it.history);
                  const d = daysSince(lastAt);
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[11px] border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]">
                      {d == null ? 'لم يُسجل دفع بعد' : `آخر دفع: قبل ${d} يوم`}
                    </span>
                  );
                })()}

                {it.payState ? <span className={`px-2 py-0.5 rounded-full text-[11px] border ${it.payState === 'paid' ? 'border-green-100 bg-green-50 text-green-700' : it.payState === 'skipped' ? 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)]' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>{it.payState === 'paid' ? 'مدفوع' : it.payState === 'skipped' ? 'تجاوزته' : 'غير مدفوع'}</span> : null}
              </div>
              {it.note?.trim() ? <div className="text-xs text-[var(--color-muted)] mt-1 whitespace-pre-wrap">{it.note}</div> : null}
              {it.payStateNote?.trim() ? <div className="text-[11px] text-[var(--color-muted)] mt-1">ملاحظة الدفع: {it.payStateNote}</div> : null}
              {it.snoozeUntil ? <div className="text-[11px] text-[var(--color-muted)] mt-1">مؤجل حتى: {it.snoozeUntil}</div> : null}
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={() => {
                const r = (Array.isArray(recurring) ? recurring : []).find(x => x.id === it.id);
                if (r) startPayNow(r);
              }} disabled={it.amount === 0} className={`px-3 py-2 rounded-lg text-sm font-medium border ${it.amount === 0 ? 'bg-[var(--color-bg)] text-[var(--color-muted)] border-[var(--color-border)] cursor-not-allowed' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg)]'}`} aria-label="سجّل كدفعة الآن">سجّل كدفعة الآن</button>

              <button type="button" onClick={() => {
                updateRecurringOps(it.id, { status: 'resolved', snoozeUntil: '' }, { type: 'note', meta: { note: 'resolved (done)' } });
                toast.success('تم وضعه كمنجز');
                refresh();
              }} className="px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100" aria-label="تم">تم</button>

              <button type="button" onClick={() => {
                const days = prompt('أجّل كم يوم؟ (3/7/14) أو اكتب تاريخ YYYY-MM-DD', '7');
                if (!days) return;
                let until = '';
                if (/^\d{4}-\d{2}-\d{2}$/.test(days.trim())) until = days.trim();
                else until = addDaysISO(Number(days));
                updateRecurringOps(it.id, { status: 'snoozed', snoozeUntil: until }, { type: 'snooze', meta: { snoozeUntil: until } });
                toast.success('تم التأجيل');
                refresh();
              }} className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]" aria-label="أجّل">أجّل</button>

              <button type="button" onClick={() => {
                const note = prompt('ملاحظة للعنصر:', String(it.note || ''));
                if (note == null) return;
                updateRecurringOps(it.id, { note: String(note) }, { type: 'note', meta: { note: String(note) } });
                toast.success('تم حفظ الملاحظة');
                refresh();
              }} className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]" aria-label="ملاحظة">ملاحظة</button>

              <button type="button" onClick={() => {
                const full = (Array.isArray(recurring) ? recurring : []).find(x => x.id === it.id);
                setHistoryModal({ item: full || it });
              }} className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]" aria-label="سجل">🧾 سجل</button>
            </div>
          </div>

          {/* Payment State buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            <button type="button" onClick={() => {
              updateRecurringOps(it.id, { payState: 'paid', payStateAt: new Date().toISOString() }, { type: 'state_paid' });
              toast.success('تم وضعه كمدفوع');
              refresh();
            }} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700" aria-label="مدفوع">مدفوع</button>

            <button type="button" onClick={() => {
              updateRecurringOps(it.id, { payState: 'skipped', payStateAt: new Date().toISOString() }, { type: 'state_skipped' });
              toast.success('تم وضعه كتجاوز');
              refresh();
            }} className="px-3 py-1.5 rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] text-xs font-medium hover:bg-[var(--color-bg)]" aria-label="تجاوزته">⏭️ تجاوزته</button>

            <button type="button" onClick={() => {
              const n = prompt('ملاحظة لحالة الدفع (اختياري):', String(it.payStateNote || ''));
              if (n == null) return;
              updateRecurringOps(it.id, { payStateNote: String(n), payStateAt: new Date().toISOString() }, { type: 'note', meta: { note: String(n) } });
              toast.success('تم حفظ ملاحظة الدفع');
              refresh();
            }} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-medium hover:bg-[var(--color-bg)]" aria-label="ملاحظة الدفع">ملاحظة الدفع</button>
          </div>
        </div>
      ))}

      {inboxView.length > 10 ? (
        <button type="button" onClick={() => {
          const el = document.getElementById('ledger-inbox-all');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:bg-[var(--color-bg)] self-start" aria-label="عرض الكل">عرض الكل</button>
      ) : null}

      <div id="ledger-inbox-all" />
    </div>
  )}
</div>

    </>
  );
}

export default React.memo(LedgerInboxTab);
