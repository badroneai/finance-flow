/*
  صفحة الحركات المالية + نموذج الحركة — مستخرجة من App.jsx (الخطوة 4)
*/
import { useState, useEffect, useCallback, useContext } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';
import { UnsavedContext } from '../contexts/UnsavedContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { sumTransactions } from '../domain/index.js';
import {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHODS,
  MSG,
  STORAGE_ERROR_MESSAGE,
} from '../constants/index.js';
import {
  FormField,
  SummaryCard,
  EnhancedEmptyState,
  Badge,
  Icons,
  MobileFAB,
} from '../ui/ui-common.jsx';
import { Modal, ConfirmDialog } from '../ui/Modals.jsx';
import { Currency } from '../utils/format.jsx';
import { today, isValidDateStr, safeNum } from '../utils/helpers.js';
import { downloadCSV } from '../utils/csvExport.js';

export function TransactionsPage({ setPage }) {
  const toast = useToast();
  const setDirty = useContext(UnsavedContext);
  const {
    transactions,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    activeLedgerId,
  } = useData();

  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    type: '',
    category: '',
    paymentMethod: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false); // موبايل: فلاتر قابلة للطي (الدفعة 3)
  const [modal, setModal] = useState(null); // null | 'add' | {editing tx}
  const [confirm, setConfirm] = useState(null);

  // جلب الحركات عند تغيير الفلاتر أو الدفتر النشط
  const refresh = useCallback(() => {
    fetchTransactions({
      ...filters,
      ledgerId: activeLedgerId || undefined,
    });
  }, [filters, activeLedgerId, fetchTransactions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ملاحظة: أُزيل listener الـ ledger:activeChanged لأن تغيير activeLedgerId
  // في DataContext يُعيد إنشاء refresh تلقائياً عبر dependency array أعلاه.
  // الاحتفاظ بالاثنين كان يسبب double-fetch عند تبديل الدفتر.

  const txs = transactions;
  const { income, expense } = sumTransactions(txs);

  const handleSave = async (data, editId) => {
    const { error } = editId
      ? await updateTransaction(editId, data)
      : await createTransaction(data);
    if (error) {
      toast.error(error?.message || STORAGE_ERROR_MESSAGE);
      return;
    }
    toast.success(editId ? MSG.success.updated : MSG.success.transaction);
    setDirty(false);
    setModal(null);
  };

  const handleDelete = (id) => {
    setConfirm({
      title: 'حذف الحركة',
      message: MSG.confirm.deleteAction + ' سيتم حذف هذه الحركة نهائياً.',
      onConfirm: async () => {
        const { error } = await deleteTransaction(id);
        if (error) {
          toast.error(error?.message || STORAGE_ERROR_MESSAGE);
          setConfirm(null);
          return;
        }
        toast.success(MSG.success.deleted);
        setConfirm(null);
      },
    });
  };

  const exportCSV = () => {
    const headers = ['النوع', 'التصنيف', 'المبلغ', 'طريقة الدفع', 'التاريخ', 'الوصف'];
    const rows = txs.map((t) => [
      TRANSACTION_TYPES[t.type],
      TRANSACTION_CATEGORIES[t.category],
      String(t.amount),
      PAYMENT_METHODS[t.paymentMethod],
      t.date,
      t.description || '',
    ]);
    downloadCSV({ filename: `transactions_${today()}.csv`, headers, rows });
    toast.success('تم تصدير CSV');
  };

  const handlePrint = () => window.print();

  const resetFilters = () =>
    setFilters({ fromDate: '', toDate: '', type: '', category: '', paymentMethod: '', search: '' });

  return (
    <div className="page-shell page-shell--wide print-container transactions-page" dir="rtl">
      <div className="page-header">
        <div className="page-header-copy">
          <span className="page-kicker">السجل المالي</span>
          <h1 className="page-title">الحركات المالية</h1>
          <p className="page-subtitle">
            سجّل الدخل والمصروفات بسرعة، ثم فلترها وراجع صافي الأداء بدون تشويش بصري.
          </p>
        </div>
      </div>
      {setPage && (
        <div className="page-actions u-push-inline-start mb-4 no-print">
          <button
            type="button"
            onClick={() => setPage('pulse')}
            className="btn-ghost transactions-page__pulse-link"
          >
            عرض النبض المالي
          </button>
        </div>
      )}
      {/* Summary Cards — موبايل: 2+1 (الدليل implementation-guide) */}
      <div className="transactions-page__summary mb-6">
        <div className="route-summary-grid">
          <SummaryCard
            label="إجمالي الدخل"
            value={<Currency value={income} />}
            color="green"
            icon={<Icons.arrowUp size={16} />}
          />
          <SummaryCard
            label="إجمالي الخرج"
            value={<Currency value={expense} />}
            color="red"
            icon={<Icons.arrowDown size={16} />}
          />
          <div className="route-summary-grid__full">
            <SummaryCard
              label="الصافي"
              value={<Currency value={income - expense} />}
              color={income - expense >= 0 ? 'blue' : 'red'}
            />
          </div>
        </div>
      </div>

      {/* Filters + Actions — موبايل: فلاتر قابلة للطي (الدفعة 3) */}
      <div className="control-toolbar control-toolbar--filters transactions-page__toolbar mb-4 no-print">
        <div className="transactions-page__toolbar-top">
          <div className="transactions-page__search">
            <Icons.search size={16} className="field-icon-inline-start" />
            <input
              type="text"
              placeholder="بحث في الوصف..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="transactions-page__search-input text-sm"
              style={{ '--color-ring': 'var(--color-accent)' }}
              aria-label="بحث"
            />
          </div>
          <div className="transactions-page__toolbar-actions">
            <button
              onClick={() => setModal('add')}
              className="btn-primary"
              aria-label="تسجيل عملية جديدة"
              title="سجّل عملية دخل أو مصروف جديدة"
            >
              <Icons.plus size={16} />
              إضافة حركة
            </button>
            <button onClick={exportCSV} className="btn-secondary" aria-label="تصدير CSV">
              <Icons.download size={14} />
              CSV
            </button>
            <button onClick={handlePrint} className="btn-secondary" aria-label="طباعة">
              <Icons.printer size={14} />
              طباعة
            </button>
          </div>
        </div>
        <p className="transactions-page__toolbar-note">
          استخدم البحث للوصف، ثم ضيّق النتائج بالتاريخ أو النوع أو طريقة الدفع عند الحاجة.
        </p>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="btn-ghost transactions-page__filters-toggle md:hidden"
          aria-expanded={showFilters}
          aria-label="فلاتر متقدمة"
        >
          <Icons.filter size={14} />
          فلاتر متقدمة
          <Icons.chevronDown
            size={16}
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>
        <div
          className={`filters-panel transactions-page__filters ${showFilters ? 'flex' : 'hidden'} md:flex`}
        >
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="transactions-page__filter-control text-sm bg-[var(--color-surface)]"
            aria-label="نوع الحركة"
          >
            <option value="">كل الأنواع</option>
            {Object.entries(TRANSACTION_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="transactions-page__filter-control text-sm bg-[var(--color-surface)]"
            aria-label="التصنيف"
          >
            <option value="">كل التصنيفات</option>
            {Object.entries(TRANSACTION_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
            className="transactions-page__filter-control text-sm bg-[var(--color-surface)]"
            aria-label="طريقة الدفع"
          >
            <option value="">كل طرق الدفع</option>
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
            className="transactions-page__filter-control text-sm"
            aria-label="من تاريخ"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
            className="transactions-page__filter-control text-sm"
            aria-label="إلى تاريخ"
          />
          <button
            onClick={resetFilters}
            className="btn-secondary transactions-page__filters-action"
            aria-label="إعادة تعيين الفلاتر"
          >
            <Icons.filter size={14} />
            إعادة التعيين
          </button>
        </div>
      </div>

      {/* Table */}
      {txs.length === 0 ? (
        Object.values(filters).some(Boolean) ? (
          <div className="panel-card transactions-page__filtered-empty">
            <Icons.empty size={64} aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--color-muted)]">
              لا توجد نتائج مطابقة للفلاتر
            </p>
            <p className="text-sm">جرّب تعديل الفلاتر أو إعادة تعيينها.</p>
            <button
              onClick={resetFilters}
              className="btn-secondary"
              aria-label="إعادة تعيين الفلاتر"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <div className="transactions-page__empty">
            <EnhancedEmptyState
              icon=""
              title="لا توجد معاملات مسجلة"
              description="سجّل أول عملية دخل أو مصروف لبدء تتبع التدفق المالي"
              ctaText="سجّل أول معاملة"
              onCtaClick={() => setModal('add')}
            />
          </div>
        )
      ) : (
        <>
          <div className="transactions-page__results-head">
            <div>
              <h2 className="transactions-page__results-title">نتائج الحركات</h2>
              <p className="transactions-page__results-subtitle">
                راجع أحدث العمليات بسرعة، ثم افتح التعديل أو الحذف عند الحاجة.
              </p>
            </div>
            <span className="transactions-page__results-count">
              {txs.length} {txs.length === 1 ? 'حركة' : 'حركات'}
            </span>
          </div>

          {/* عرض بطاقات — جوال فقط */}
          <div className="transactions-page__mobile-list md:hidden">
            {txs.map((t) => (
              <div key={t.id} className="panel-card">
                <div className="transactions-page__mobile-card-head">
                  <Badge color={t.type === 'income' ? 'green' : 'red'}>
                    {TRANSACTION_TYPES[t.type]}
                  </Badge>
                  <span className="text-xs text-[var(--color-muted)]">{t.date}</span>
                </div>
                <div className="transactions-page__mobile-card-row">
                  <span className="transactions-page__mobile-card-category text-sm text-[var(--color-text)]">
                    {TRANSACTION_CATEGORIES[t.category]}
                  </span>
                  <span
                    className="transactions-page__amount text-base font-bold"
                    style={{
                      color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    <Currency value={t.amount} symbolClassName="w-3.5 h-3.5" />
                  </span>
                </div>
                {t.description && (
                  <p className="transactions-page__mobile-card-description text-xs text-[var(--color-muted)] line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="transactions-page__mobile-card-actions no-print">
                  <button
                    onClick={() => setModal(t)}
                    className="btn-ghost transactions-page__icon-action"
                    style={{ color: 'var(--color-info)', backgroundColor: 'transparent' }}
                    aria-label="تعديل"
                  >
                    <Icons.edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="btn-ghost transactions-page__icon-action"
                    style={{ color: 'var(--color-danger)', backgroundColor: 'transparent' }}
                    aria-label="حذف نهائي"
                  >
                    <Icons.trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* عرض جدول — ديسكتوب فقط */}
          <div className="transactions-page__table-shell hidden md:block panel-card">
            <div className="transactions-page__table-meta">
              <div>
                <h2 className="transactions-page__table-title">سجل الحركات</h2>
                <p className="transactions-page__table-subtitle">
                  عرض واضح للحركات الأخيرة مع إجراءات سريعة للمراجعة والتعديل.
                </p>
              </div>
              <span className="transactions-page__table-count">
                {txs.length} {txs.length === 1 ? 'حركة' : 'حركات'}
              </span>
            </div>
            <div className="transactions-page__table-wrap">
              <table className="transactions-page__table text-sm" aria-describedby="tx-table-desc">
                <caption id="tx-table-desc" className="sr-only">
                  جدول سجل الحركات المالية: النوع، التصنيف، المبلغ، التاريخ، الوصف، إجراءات
                </caption>
                <thead>
                  <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                    <th
                      scope="col"
                      className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]"
                    >
                      النوع
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]"
                    >
                      التصنيف
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]"
                    >
                      المبلغ
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]"
                    >
                      التاريخ
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]"
                    >
                      الوصف
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-center font-semibold text-[var(--color-muted)] no-print"
                    >
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)]/50"
                    >
                      <td className="px-4 py-3">
                        <Badge color={t.type === 'income' ? 'green' : 'red'}>
                          {TRANSACTION_TYPES[t.type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text)]">
                        {TRANSACTION_CATEGORIES[t.category]}
                      </td>
                      <td
                        className="transactions-page__amount px-4 py-3 font-semibold"
                        style={{
                          color:
                            t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
                        }}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        <Currency value={t.amount} symbolClassName="w-3.5 h-3.5" />
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">{t.date}</td>
                      <td className="transactions-page__description px-4 py-3 text-[var(--color-muted)] truncate">
                        {t.description}
                      </td>
                      <td className="px-4 py-3 no-print">
                        <div className="transactions-page__row-actions">
                          <button
                            onClick={() => setModal(t)}
                            className="btn-ghost transactions-page__icon-action"
                            style={{ color: 'var(--color-info)', backgroundColor: 'transparent' }}
                            aria-label="تعديل"
                          >
                            <Icons.edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="btn-ghost transactions-page__icon-action"
                            style={{ color: 'var(--color-danger)', backgroundColor: 'transparent' }}
                            aria-label="حذف نهائي"
                          >
                            <Icons.trash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Transaction Form Modal */}
      <Modal
        open={modal !== null}
        onClose={() => {
          setDirty(false);
          setModal(null);
        }}
        title={modal && modal !== 'add' ? 'تعديل العملية' : 'تسجيل عملية جديدة'}
      >
        <TransactionForm
          initial={modal !== 'add' ? modal : null}
          onSave={handleSave}
          onCancel={() => {
            setDirty(false);
            setModal(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
        danger
      />

      {/* زر إضافة عائم — جوال فقط */}
      <MobileFAB onClick={() => setModal('add')} label="إضافة حركة" />
    </div>
  );
}

function TransactionForm({ initial, onSave, onCancel }) {
  const setDirty = useContext(UnsavedContext);
  const [form, setForm] = useState(
    initial
      ? {
          type: initial.type,
          category: initial.category,
          amount: initial.amount,
          paymentMethod: initial.paymentMethod,
          date: initial.date,
          description: initial.description || '',
        }
      : {
          type: 'income',
          category: 'commission',
          amount: '',
          paymentMethod: 'cash',
          date: today(),
          description: '',
        }
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.type) errs.type = 'اختر نوع الحركة';
    if (!form.category) errs.category = 'اختر تصنيفًا صحيحًا';
    const amt = Number(form.amount);
    if (form.amount === '' || form.amount == null || !Number.isFinite(amt) || amt <= 0)
      errs.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
    if (!form.date) errs.date = 'التاريخ مطلوب';
    else if (!isValidDateStr(form.date)) errs.date = 'تاريخ غير صالح';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, amount: safeNum(form.amount, 0) }, initial?.id);
  };

  return (
    <form onSubmit={handleSubmit} onInput={() => setDirty && setDirty(true)}>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="tx-type" label="نوع الحركة" error={errors.type}>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="اختر نوع العملية"
            aria-required="true"
          >
            <option value="">-- اختر نوع العملية --</option>
            {Object.entries(TRANSACTION_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="tx-category" label="التصنيف" error={errors.category}>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="التصنيف"
          >
            {Object.entries(TRANSACTION_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="tx-amount" label="المبلغ (ر.س)" error={errors.amount}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            placeholder="أدخل المبلغ بالريال"
            aria-label="المبلغ بالريال"
            aria-required="true"
          />
        </FormField>
        <FormField label="طريقة الدفع">
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="طريقة الدفع"
          >
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField id="tx-date" label="التاريخ" error={errors.date}>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          aria-label="التاريخ"
        />
      </FormField>
      <FormField label="الوصف (اختياري)">
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
          placeholder="وصف العملية (اختياري)..."
          aria-label="وصف العملية"
        />
      </FormField>
      <div className="flex gap-3 justify-end mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium"
          aria-label="تراجع"
        >
          {MSG.buttons.cancel}
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: 'var(--color-info)' }}
          aria-label="تسجيل البيانات"
        >
          {MSG.buttons.save}
        </button>
      </div>
    </form>
  );
}
