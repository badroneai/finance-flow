/*
  المستحقات — صندوق الوارد (برومبت 2.2)
  يستخدم calculateInbox من inbox-engine، أقسام مطوية، فلتر، تسجيل دفعة، ذكّرني غداً، pull-to-refresh.
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { calculateInbox } from '../core/inbox-engine.js';
import {
  getActiveLedgerId,
  setActiveLedgerId as setActiveLedgerIdStore,
  getLedgers,
} from '../core/ledger-store.js';
import { formatCurrency } from '../utils/format.jsx';
import QuickPaymentModal from '../ui/inbox/QuickPaymentModal.jsx';

const SNOOZE_KEY = 'ff_inbox_snooze';
const PULL_THRESHOLD = 70;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSnoozeMap() {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return typeof data === 'object' && data !== null ? data : {};
  } catch {
    return {};
  }
}

function setSnoozeDue(dueId, untilDateStr) {
  try {
    const map = getSnoozeMap();
    map[dueId] = untilDateStr;
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
  } catch {}
}

function daysLabel(due) {
  if (due.daysOverdue > 0) return `متأخر ${due.daysOverdue} يوم`;
  const dueMs = new Date(due.dueDate + 'T00:00:00').getTime();
  const todayMs = new Date(todayISO() + 'T00:00:00').getTime();
  const days = Math.ceil((dueMs - todayMs) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'اليوم';
  if (days === 1) return 'بعد يوم';
  return `بعد ${days} يوم`;
}

function priorityDot(priority) {
  const p = String(priority || '').toLowerCase();
  if (p === 'critical') return 'bg-rose-500';
  if (p === 'high') return 'bg-amber-500';
  return 'bg-gray-400';
}

function InboxSection({ title, count, total, amountLabel, open, onToggle, children }) {
  const isOpen = open !== false;
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right border-b border-gray-100 hover:bg-gray-50"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-900">{title} ({count})</span>
        <span className="text-sm text-gray-600">{amountLabel}</span>
        <span className="text-gray-400">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && <div className="divide-y divide-gray-100">{children}</div>}
    </div>
  );
}

function DueRow({ due, onRecordPayment, onSnoozeTomorrow, formatCurrency }) {
  const dotClass = priorityDot(due.priority);
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${dotClass}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-gray-900">{due.name}</span>
            <span className={due.type === 'income' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
              {formatCurrency(due.amount)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{daysLabel(due)}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => onRecordPayment(due)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              سجّل دفعة
            </button>
            {due.daysOverdue > 0 && (
              <button
                type="button"
                onClick={() => onSnoozeTomorrow(due)}
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                ذكّرني غدًا
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRecordPayment(due)}
          className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500"
          aria-label="تسجيل دفعة"
        />
      </div>
    </div>
  );
}

export default function InboxPage({ setPage }) {
  const [inbox, setInbox] = useState(null);
  const [activeLedgerId, setActiveLedgerId] = useState(() => getActiveLedgerId() || '');
  const [filter, setFilter] = useState('all');
  const [openOverdue, setOpenOverdue] = useState(true);
  const [openThisWeek, setOpenThisWeek] = useState(true);
  const [openThisMonth, setOpenThisMonth] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [snoozeMap, setSnoozeMap] = useState(getSnoozeMap);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);

  const refresh = useCallback(() => {
    const id = getActiveLedgerId() || '';
    setActiveLedgerId(id);
    setSnoozeMap(getSnoozeMap());
    if (!id) {
      setInbox(null);
      return;
    }
    setInbox(calculateInbox(id));
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener('ledger:activeChanged', onChanged);
    return () => window.removeEventListener('ledger:activeChanged', onChanged);
  }, [refresh]);

  const filterDues = useCallback(
    (list) => {
      if (!Array.isArray(list)) return [];
      const today = todayISO();
      const filtered = list.filter((d) => {
        const until = snoozeMap[d.id];
        if (until && until > today) return false;
        if (filter === 'income') return d.type === 'income';
        if (filter === 'expense') return d.type === 'expense';
        return true;
      });
      return filtered;
    },
    [filter, snoozeMap]
  );

  const handleSnoozeTomorrow = useCallback((due) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSnoozeDue(due.id, tomorrow);
    setSnoozeMap(getSnoozeMap());
    refresh();
  }, [refresh]);

  const handleTouchStart = (e) => {
    if (typeof window !== 'undefined' && window.scrollY <= 0) touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (touchStartY.current === 0) return;
    const y = e.touches[0].clientY;
    const delta = y - touchStartY.current;
    if (delta > 0 && typeof window !== 'undefined' && window.scrollY <= 0) setPullY(Math.min(delta, 100));
    else setPullY(0);
  };
  const handleTouchEnd = () => {
    if (pullY >= PULL_THRESHOLD) refresh();
    touchStartY.current = 0;
    setPullY(0);
  };

  const noLedger = !activeLedgerId;
  const ledgers = getLedgers() || [];
  const overdue = filterDues(inbox?.overdue || []);
  const thisWeek = filterDues(inbox?.thisWeek || []);
  const thisMonth = filterDues(inbox?.thisMonth || []);
  const totalCount = overdue.length + thisWeek.length + thisMonth.length;
  const summary = inbox?.summary || {};
  const totalIncomeMonth =
    (inbox?.overdue || []).filter((d) => d.type === 'income').reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisWeek || []).filter((d) => d.type === 'income').reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisMonth || []).filter((d) => d.type === 'income').reduce((s, d) => s + (d.amount || 0), 0);
  const totalExpenseMonth =
    (inbox?.overdue || []).filter((d) => d.type === 'expense').reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisWeek || []).filter((d) => d.type === 'expense').reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisMonth || []).filter((d) => d.type === 'expense').reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div
      className="inbox-page min-h-screen bg-gray-50 p-4 md:p-6 max-w-2xl mx-auto"
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {pullY > 0 && (
        <div
          className="fixed top-0 left-0 right-0 h-12 flex items-center justify-center bg-gray-100/90 text-gray-600 text-sm z-10"
          aria-live="polite"
        >
          {pullY >= PULL_THRESHOLD ? 'أفلت للتحديث' : 'اسحب للتحديث'}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <h1 className="text-xl font-bold text-gray-900">المستحقات</h1>
        <div className="flex items-center gap-2">
          {ledgers.length > 0 && (
            <select
              value={activeLedgerId}
              onChange={(e) => {
                const id = e.target.value;
                if (id) setActiveLedgerIdStore(id);
                refresh();
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 min-w-[140px]"
              aria-label="الدفتر"
            >
              {ledgers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name || l.id}
                </option>
              ))}
            </select>
          )}
          {setPage && (
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('ff_ledgers_open_tab', 'recurring');
                } catch {}
                setPage('ledgers');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              إدارة الدفاتر
            </button>
          )}
        </div>
      </div>

      {noLedger ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800">
          <p className="font-medium">لا يوجد دفتر نشط</p>
          <p className="text-sm mt-1">اختر دفتراً من قائمة الدفاتر لرؤية المستحقات.</p>
          {setPage && (
            <button
              type="button"
              onClick={() => setPage('ledgers')}
              className="mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
            >
              فتح الدفاتر
            </button>
          )}
        </div>
      ) : totalCount === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-600">
          <p className="font-medium">لا توجد مستحقات — استمتع بيومك!</p>
          <p className="text-sm mt-2">لا توجد بنود متأخرة أو مستحقة هذا الأسبوع أو الشهر.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'income', label: 'دخل فقط' },
              { key: 'expense', label: 'مصروف فقط' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                  filter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {overdue.length > 0 && (
            <InboxSection
              title="متأخرة"
              count={overdue.length}
              total={summary.totalOverdueAmount}
              amountLabel={`${formatCurrency(summary.totalOverdueAmount || 0)} ر.س`}
              open={openOverdue}
              onToggle={() => setOpenOverdue((v) => !v)}
            >
              {overdue.map((due) => (
                <DueRow
                  key={due.id}
                  due={due}
                  onRecordPayment={setSelectedDue}
                  onSnoozeTomorrow={handleSnoozeTomorrow}
                  formatCurrency={formatCurrency}
                />
              ))}
            </InboxSection>
          )}

          {thisWeek.length > 0 && (
            <InboxSection
              title="هذا الأسبوع"
              count={thisWeek.length}
              total={summary.totalThisWeekAmount}
              amountLabel={`${formatCurrency(summary.totalThisWeekAmount || 0)} ر.س`}
              open={openThisWeek}
              onToggle={() => setOpenThisWeek((v) => !v)}
            >
              {thisWeek.map((due) => (
                <DueRow
                  key={due.id}
                  due={due}
                  onRecordPayment={setSelectedDue}
                  onSnoozeTomorrow={handleSnoozeTomorrow}
                  formatCurrency={formatCurrency}
                />
              ))}
            </InboxSection>
          )}

          {thisMonth.length > 0 && (
            <InboxSection
              title="هذا الشهر"
              count={thisMonth.length}
              total={summary.totalThisMonthAmount}
              amountLabel={`${formatCurrency(summary.totalThisMonthAmount || 0)} ر.س`}
              open={openThisMonth}
              onToggle={() => setOpenThisMonth((v) => !v)}
            >
              {thisMonth.map((due) => (
                <DueRow
                  key={due.id}
                  due={due}
                  onRecordPayment={setSelectedDue}
                  onSnoozeTomorrow={handleSnoozeTomorrow}
                  formatCurrency={formatCurrency}
                />
              ))}
            </InboxSection>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
            <p className="font-medium text-gray-800">الإجمالي المتوقع هذا الشهر</p>
            <p className="mt-1">
              دخل: {formatCurrency(totalIncomeMonth)} ر.س | مصروف: {formatCurrency(totalExpenseMonth)} ر.س
            </p>
          </div>
        </>
      )}

      {selectedDue && (
        <QuickPaymentModal
          dueItem={selectedDue}
          onClose={() => setSelectedDue(null)}
          onPostpone={() => setSelectedDue(null)}
        />
      )}
    </div>
  );
}
