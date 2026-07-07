/*
  المستحقات — صندوق الوارد (برومبت 2.2)
  يستخدم calculateInbox من inbox-engine، أقسام مطوية، فلتر، تسجيل دفعة، ذكّرني غداً، pull-to-refresh.
*/
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateInbox } from '../core/inbox-engine.js';
import {
  getActiveLedgerId,
  setActiveLedgerId as setActiveLedgerIdStore,
  getLedgers,
} from '../core/ledger-store.js';
import { useData } from '../contexts/DataContext.jsx';
import { formatCurrency } from '../utils/format.jsx';
import { buildOperationalDues } from '../domain/dues.js';
import QuickPaymentModal from '../ui/inbox/QuickPaymentModal.jsx';
import ContractQuickPaymentModal from '../ui/ContractQuickPaymentModal.jsx';

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

function priorityDotClass(priority) {
  const p = String(priority || '').toLowerCase();
  if (p === 'critical') return 'inbox__due-dot inbox__due-dot--critical';
  if (p === 'high') return 'inbox__due-dot inbox__due-dot--high';
  return 'inbox__due-dot inbox__due-dot--default';
}

// قسم مطوي — يلف مجموعة بنود مستحقة
function InboxSection({ title, count, amountLabel, open, onToggle, children }) {
  const isOpen = open !== false;
  return (
    <div className="inbox__section">
      <button
        type="button"
        onClick={onToggle}
        className="inbox__section-toggle"
        aria-expanded={isOpen}
      >
        <span className="inbox__section-title">
          {title} ({count})
        </span>
        <span className="inbox__section-amount">{amountLabel}</span>
        <span className="inbox__section-chevron">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && <div className="inbox__section-body">{children}</div>}
    </div>
  );
}

// صف بند مستحق — دفتر (recurring)
function DueRow({ due, onRecordPayment, onSnoozeTomorrow, formatCurrency }) {
  const amountClass =
    due.type === 'income' ? 'inbox__due-amount inbox__due-amount--income' : 'inbox__due-amount inbox__due-amount--expense';

  return (
    <div className="inbox__due-row">
      <div className="inbox__due-layout">
        <span
          className={priorityDotClass(due.priority)}
          aria-hidden="true"
        />
        <div className="inbox__due-content">
          <div className="inbox__due-head">
            <span className="inbox__due-name">{due.name}</span>
            <span className={amountClass}>
              {formatCurrency(due.amount)}
            </span>
          </div>
          <p className="inbox__due-meta">{daysLabel(due)}</p>
          <div className="inbox__due-actions">
            <button
              type="button"
              onClick={() => onRecordPayment(due)}
              className="inbox__action-btn"
            >
              سجّل دفعة
            </button>
            {due.daysOverdue > 0 && (
              <button
                type="button"
                onClick={() => onSnoozeTomorrow(due)}
                className="inbox__action-btn inbox__action-btn--muted"
              >
                ذكّرني غدًا
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRecordPayment(due)}
          className="inbox__due-checkbox"
          aria-label="تسجيل دفعة"
        />
      </div>
    </div>
  );
}

export default function InboxPage({ setPage }) {
  const {
    transactions,
    recurringItems,
    ledgers: dataLedgers,
    activeLedgerId: dataActiveLedgerId,
    contracts,
    contractPayments,
    contacts,
    properties,
    units,
  } = useData();
  const navigate = useNavigate();

  const [inbox, setInbox] = useState(null);
  const [activeLedgerId, setActiveLedgerId] = useState(
    () => dataActiveLedgerId || getActiveLedgerId() || ''
  );
  const [filter, setFilter] = useState('all');
  const [openOverdue, setOpenOverdue] = useState(true);
  const [openThisWeek, setOpenThisWeek] = useState(true);
  const [openThisMonth, setOpenThisMonth] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [snoozeMap, setSnoozeMap] = useState(getSnoozeMap);
  const [openContractDues, setOpenContractDues] = useState(true);
  const [contractQuickPayDue, setContractQuickPayDue] = useState(null);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);

  // مستحقات العقود — من طبقة dues.js الموحدة
  const contractDues = useMemo(
    () =>
      buildOperationalDues({
        contracts,
        contractPayments,
        contacts,
        properties,
        units,
      }),
    [contracts, contractPayments, contacts, properties, units]
  );

  // مزامنة الدفتر النشط من DataContext
  useEffect(() => {
    if (dataActiveLedgerId) setActiveLedgerId(dataActiveLedgerId);
  }, [dataActiveLedgerId]);

  const refresh = useCallback(() => {
    const id = dataActiveLedgerId || getActiveLedgerId() || '';
    setActiveLedgerId(id);
    setSnoozeMap(getSnoozeMap());
    if (!id) {
      setInbox(null);
      return;
    }
    setInbox(calculateInbox(id, { transactions, recurringItems }));
  }, [dataActiveLedgerId, transactions, recurringItems]);

  // SPR-008: أصلح stale closure — كان [] يمنع إعادة الحساب عند تحديث البيانات.
  // الآن refresh تُعاد الحساب تلقائياً عند تغيّر transactions/recurringItems/activeLedgerId.
  useEffect(() => {
    refresh();
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

  const handleSnoozeTomorrow = useCallback(
    (due) => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setSnoozeDue(due.id, tomorrow);
      setSnoozeMap(getSnoozeMap());
      refresh();
    },
    [refresh]
  );

  const handleTouchStart = (e) => {
    if (typeof window !== 'undefined' && window.scrollY <= 0)
      touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (touchStartY.current === 0) return;
    const y = e.touches[0].clientY;
    const delta = y - touchStartY.current;
    if (delta > 0 && typeof window !== 'undefined' && window.scrollY <= 0)
      setPullY(Math.min(delta, 100));
    else setPullY(0);
  };
  const handleTouchEnd = () => {
    if (pullY >= PULL_THRESHOLD) refresh();
    touchStartY.current = 0;
    setPullY(0);
  };

  const noLedger = !activeLedgerId;
  const ledgers = dataLedgers && dataLedgers.length > 0 ? dataLedgers : getLedgers() || [];
  const overdue = filterDues(inbox?.overdue || []);
  const thisWeek = filterDues(inbox?.thisWeek || []);
  const thisMonth = filterDues(inbox?.thisMonth || []);
  const totalCount = overdue.length + thisWeek.length + thisMonth.length;
  const summary = inbox?.summary || {};
  const totalIncomeMonth =
    (inbox?.overdue || [])
      .filter((d) => d.type === 'income')
      .reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisWeek || [])
      .filter((d) => d.type === 'income')
      .reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisMonth || [])
      .filter((d) => d.type === 'income')
      .reduce((s, d) => s + (d.amount || 0), 0);
  const totalExpenseMonth =
    (inbox?.overdue || [])
      .filter((d) => d.type === 'expense')
      .reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisWeek || [])
      .filter((d) => d.type === 'expense')
      .reduce((s, d) => s + (d.amount || 0), 0) +
    (inbox?.thisMonth || [])
      .filter((d) => d.type === 'expense')
      .reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div
      className="page-shell page-shell--regular inbox-page"
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {pullY > 0 && (
        <div className="inbox__pull-indicator" aria-live="polite">
          {pullY >= PULL_THRESHOLD ? 'أفلت للتحديث' : 'اسحب للتحديث'}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-copy">
          <span className="page-kicker">المتابعة اليومية</span>
          <h1 className="page-title">المستحقات</h1>
          <p className="page-subtitle">
            راقب البنود المتأخرة وما يستحق خلال الأسبوع والشهر مع إجراءات مباشرة وسريعة.
          </p>
        </div>
        <div className="page-actions">
          {ledgers.length > 0 && (
            <select
              value={activeLedgerId}
              onChange={(e) => {
                const id = e.target.value;
                if (id) setActiveLedgerIdStore(id);
                refresh();
              }}
              className="inbox__ledger-select"
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
              className="inbox__nav-link"
            >
              إدارة الدفاتر
            </button>
          )}
        </div>
      </div>

      {noLedger ? (
        <div className="inbox__warning-box">
          <p className="inbox__due-name">لا يوجد دفتر نشط</p>
          <p className="inbox__due-meta">اختر دفتراً من قائمة الدفاتر لرؤية المستحقات.</p>
          {setPage && (
            <button
              type="button"
              onClick={() => setPage('ledgers')}
              className="inbox__warning-btn"
            >
              فتح الدفاتر
            </button>
          )}
        </div>
      ) : totalCount === 0 ? (
        <div className="inbox__empty-state">
          <p className="inbox__due-name">لا توجد مستحقات — استمتع بيومك!</p>
          <p className="inbox__due-meta">لا توجد بنود متأخرة أو مستحقة هذا الأسبوع أو الشهر.</p>
        </div>
      ) : (
        <>
          <div className="inbox__filter-bar">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'income', label: 'دخل فقط' },
              { key: 'expense', label: 'مصروف فقط' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`inbox__filter-btn${filter === f.key ? ' inbox__filter-btn--active' : ''}`}
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
              amountLabel={formatCurrency(summary.totalOverdueAmount || 0)}
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
              amountLabel={formatCurrency(summary.totalThisWeekAmount || 0)}
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
              amountLabel={formatCurrency(summary.totalThisMonthAmount || 0)}
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

          <div className="inbox__monthly-summary">
            <p className="inbox__monthly-summary-title">الإجمالي المتوقع هذا الشهر</p>
            <p className="inbox__monthly-summary-values">
              دخل: {formatCurrency(totalIncomeMonth)} | مصروف: {formatCurrency(totalExpenseMonth)}
            </p>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          مستحقات العقود — قسم مستقل من طبقة dues.js
          ══════════════════════════════════════════════════════ */}
      {contractDues.summary.totalCount > 0 && (
        <div className="inbox__contracts-zone">
          <div className="inbox__contracts-header">
            <h2 className="inbox__contracts-title">مستحقات العقود</h2>
            <span
              className={`inbox__contracts-badge ${
                contractDues.summary.overdueCount > 0
                  ? 'inbox__contracts-badge--overdue'
                  : 'inbox__contracts-badge--normal'
              }`}
            >
              {contractDues.summary.totalCount} مستحق
            </span>
          </div>

          {/* المتأخرات */}
          {contractDues.overdue.length > 0 && (
            <InboxSection
              title="متأخرات العقود"
              count={contractDues.overdue.length}
              amountLabel={`${formatCurrency(contractDues.summary.overdueTotal)}`}
              open={openContractDues}
              onToggle={() => setOpenContractDues((v) => !v)}
            >
              {contractDues.overdue.map((due) => (
                <div key={due.dueId} className="inbox__due-row inbox__due-row--hoverable">
                  <div className="inbox__due-layout">
                    <span className="inbox__due-dot inbox__due-dot--critical" />
                    <div className="inbox__due-content">
                      <button
                        type="button"
                        onClick={() => navigate(due.actionTarget)}
                        className="inbox__contract-link"
                      >
                        <div className="inbox__due-head">
                          <span className="inbox__due-name">
                            {due.tenantName || 'بدون اسم'}
                            {due.propertyName ? ` — ${due.propertyName}` : ''}
                          </span>
                          <span className="inbox__due-amount inbox__due-amount--expense">
                            {formatCurrency(due.remainingAmount)}
                          </span>
                        </div>
                        <p className="inbox__due-meta">
                          {due.contractNumber ? `عقد ${due.contractNumber} · ` : ''}
                          متأخر {due.daysOverdue} يوم
                          {due.unitName ? ` · ${due.unitName}` : ''}
                        </p>
                      </button>
                      <div className="inbox__due-actions">
                        <button
                          type="button"
                          onClick={() => setContractQuickPayDue(due)}
                          className="inbox__action-btn"
                        >
                          سجّل دفعة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </InboxSection>
          )}

          {/* مستحق اليوم + هذا الأسبوع */}
          {(contractDues.dueToday.length > 0 || contractDues.dueThisWeek.length > 0) && (
            <InboxSection
              title="مستحقات هذا الأسبوع"
              count={contractDues.dueToday.length + contractDues.dueThisWeek.length}
              amountLabel={`${formatCurrency(contractDues.summary.dueTodayTotal + contractDues.summary.dueThisWeekTotal)}`}
              open={true}
            >
              {[...contractDues.dueToday, ...contractDues.dueThisWeek].map((due) => (
                <div key={due.dueId} className="inbox__due-row inbox__due-row--hoverable">
                  <div className="inbox__due-layout">
                    <span
                      className={`inbox__due-dot ${due.daysUntil === 0 ? 'inbox__due-dot--high' : 'inbox__due-dot--info'}`}
                    />
                    <div className="inbox__due-content">
                      <button
                        type="button"
                        onClick={() => navigate(due.actionTarget)}
                        className="inbox__contract-link"
                      >
                        <div className="inbox__due-head">
                          <span className="inbox__due-name">
                            {due.tenantName || 'بدون اسم'}
                            {due.propertyName ? ` — ${due.propertyName}` : ''}
                          </span>
                          <span className="inbox__due-amount inbox__due-amount--neutral">
                            {formatCurrency(due.remainingAmount)}
                          </span>
                        </div>
                        <p className="inbox__due-meta">
                          {due.daysUntil === 0 ? 'مستحق اليوم' : `بعد ${due.daysUntil} يوم`}
                          {due.unitName ? ` · ${due.unitName}` : ''}
                        </p>
                      </button>
                      <div className="inbox__due-actions">
                        <button
                          type="button"
                          onClick={() => setContractQuickPayDue(due)}
                          className="inbox__action-btn"
                        >
                          سجّل دفعة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </InboxSection>
          )}

          {/* خلال 30 يوم */}
          {contractDues.dueNext30Days.length > 0 && (
            <InboxSection
              title="خلال 30 يوم"
              count={contractDues.dueNext30Days.length}
              amountLabel={`${formatCurrency(contractDues.summary.dueNext30DaysTotal)}`}
              open={false}
            >
              {contractDues.dueNext30Days.map((due) => (
                <div key={due.dueId} className="inbox__due-row inbox__due-row--hoverable">
                  <div className="inbox__due-layout">
                    <span className="inbox__due-dot inbox__due-dot--muted" />
                    <div className="inbox__due-content">
                      <button
                        type="button"
                        onClick={() => navigate(due.actionTarget)}
                        className="inbox__contract-link"
                      >
                        <div className="inbox__due-head">
                          <span className="inbox__due-name">
                            {due.tenantName || 'بدون اسم'}
                            {due.propertyName ? ` — ${due.propertyName}` : ''}
                          </span>
                          <span className="inbox__due-amount inbox__due-amount--neutral">
                            {formatCurrency(due.remainingAmount)}
                          </span>
                        </div>
                        <p className="inbox__due-meta">
                          بعد {due.daysUntil} يوم
                          {due.unitName ? ` · ${due.unitName}` : ''}
                        </p>
                      </button>
                      <div className="inbox__due-actions">
                        <button
                          type="button"
                          onClick={() => setContractQuickPayDue(due)}
                          className="inbox__action-btn"
                        >
                          سجّل دفعة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </InboxSection>
          )}
        </div>
      )}

      {selectedDue && (
        <QuickPaymentModal
          dueItem={selectedDue}
          onClose={() => setSelectedDue(null)}
          onPostpone={() => setSelectedDue(null)}
        />
      )}

      {/* نافذة الدفعة السريعة — مستحقات العقود */}
      {contractQuickPayDue && (
        <ContractQuickPaymentModal
          dueItem={contractQuickPayDue}
          onClose={() => setContractQuickPayDue(null)}
        />
      )}
    </div>
  );
}
