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
        <div className="page-actions u-push-inline-start transactions-page__back-row no-print">
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
      <div className="transactions-page__summary">
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
      <div className="control-toolbar control-toolbar--filters transactions-page__toolbar no-print">
        <div className="transactions-page__toolbar-top">
          <div className="transactions-page__search">
            <Icons.search size={16} className="field-icon-inline-start" />
            <input
              type="text"
              placeholder="بحث في الوصف..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="transactions-page__search-input"
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
          className="btn-ghost transactions-page__filters-toggle"
          aria-expanded={showFilters}
          aria-label="فلاتر متقدمة"
        >
          <Icons.filter size={14} />
          فلاتر متقدمة
          <Icons.chevronDown
            size={16}
            className={`transactions-page__filters-chevron${showFilters ? ' is-open' : ''}`}
          />
        </button>
        <div
          className={`filters-panel transactions-page__filters${showFilters ? '' : ' transactions-page__filters--collapsed'}`}
        >
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="transactions-page__filter-control"
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
            className="transactions-page__filter-control"
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
            className="transactions-page__filter-control"
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
            className="transactions-page__filter-control"
            aria-label="من تاريخ"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
            className="transactions-page__filter-control"
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
            <p className="transactions-page__filtered-empty-title">لا توجد نتائج مطابقة للفلاتر</p>
            <p className="transactions-page__filtered-empty-hint">جرّب تعديل الفلاتر أو إعادة تعيينها.</p>
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
                قائمة واحدة للبطاقات (جوال) والجدول (شاشة واسعة) — العدد أدناه يشمل كل النتائج الحالية.
              </p>
            </div>
            <span className="transactions-page__results-count">
              {txs.length} {txs.length === 1 ? 'حركة' : 'حركات'}
            </span>
          </div>

          {/* عرض بطاقات — جوال فقط */}
          <div className="transactions-page__mobile-list">
            {txs.map((t) => (
              <div
                key={t.id}
                className="panel-card transactions-page__mobile-card"
                data-tx-type={t.type}
              >
                <div className="transactions-page__mobile-card-head">
                  <Badge color={t.type === 'income' ? 'green' : 'red'}>
                    {TRANSACTION_TYPES[t.type]}
                  </Badge>
                  <span className="transactions-page__mobile-meta">{t.date}</span>
                </div>
                <div className="transactions-page__mobile-card-row">
                  <span className="transactions-page__mobile-card-category transactions-page__mobile-category">
                    {TRANSACTION_CATEGORIES[t.category]}
                  </span>
                  <span className="transactions-page__amount transactions-page__mobile-amount">
                    {t.type === 'income' ? '+' : '-'}
                    <Currency value={t.amount} symbolClassName="transactions-page__currency-symbol" />
                  </span>
                </div>
                {t.description && (
                  <p className="transactions-page__mobile-card-description transactions-page__mobile-description">
                    {t.description}
                  </p>
                )}
                <div className="transactions-page__mobile-card-actions no-print">
                  <button
                    onClick={() => setModal(t)}
                    className="btn-ghost transactions-page__icon-action transactions-page__icon-action--edit"
                    aria-label="تعديل"
                  >
                    <Icons.edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="btn-ghost transactions-page__icon-action transactions-page__icon-action--delete"
                    aria-label="حذف نهائي"
                  >
                    <Icons.trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* عرض جدول — ديسكتوب فقط */}
          <div className="transactions-page__table-shell panel-card">
            <div className="transactions-page__table-meta">
              <div>
                <h2 className="transactions-page__table-title">عرض الجدول</h2>
                <p className="transactions-page__table-subtitle">
                  نفس القائمة أعلاه بتنسيق أعمدة للشاشات الواسعة.
                </p>
              </div>
            </div>
            <div className="transactions-page__table-wrap">
              <table className="transactions-page__table" aria-describedby="tx-table-desc">
                <caption id="tx-table-desc" className="sr-only">
                  جدول سجل الحركات المالية: النوع، التصنيف، المبلغ، التاريخ، الوصف، إجراءات
                </caption>
                <thead>
                  <tr className="transactions-page__table-head-row">
                    <th scope="col" className="transactions-page__table-th">
                      النوع
                    </th>
                    <th scope="col" className="transactions-page__table-th">
                      التصنيف
                    </th>
                    <th scope="col" className="transactions-page__table-th">
                      المبلغ
                    </th>
                    <th scope="col" className="transactions-page__table-th">
                      التاريخ
                    </th>
                    <th scope="col" className="transactions-page__table-th">
                      الوصف
                    </th>
                    <th
                      scope="col"
                      className="transactions-page__table-th transactions-page__table-th--actions no-print"
                    >
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => (
                    <tr
                      key={t.id}
                      className="transactions-page__table-body-row"
                      data-tx-type={t.type}
                    >
                      <td className="transactions-page__table-td">
                        <Badge color={t.type === 'income' ? 'green' : 'red'}>
                          {TRANSACTION_TYPES[t.type]}
                        </Badge>
                      </td>
                      <td className="transactions-page__table-td transactions-page__table-td--category">
                        {TRANSACTION_CATEGORIES[t.category]}
                      </td>
                      <td className="transactions-page__table-td transactions-page__table-td--amount">
                        <span className="transactions-page__amount">
                          {t.type === 'income' ? '+' : '-'}
                          <Currency value={t.amount} symbolClassName="transactions-page__currency-symbol" />
                        </span>
                      </td>
                      <td className="transactions-page__table-td transactions-page__table-td--date">{t.date}</td>
                      <td className="transactions-page__table-td transactions-page__table-td--desc transactions-page__description">
                        {t.description}
                      </td>
                      <td className="transactions-page__table-td no-print">
                        <div className="transactions-page__row-actions">
                          <button
                            onClick={() => setModal(t)}
                            className="btn-ghost transactions-page__icon-action transactions-page__icon-action--edit"
                            aria-label="تعديل"
                          >
                            <Icons.edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="btn-ghost transactions-page__icon-action transactions-page__icon-action--delete"
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
      <div className="transactions-page__form-row">
        <FormField id="tx-type" label="نوع الحركة" error={errors.type}>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="transactions-page__form-control"
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
            className="transactions-page__form-control"
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
      <div className="transactions-page__form-row">
        <FormField id="tx-amount" label="المبلغ (ر.س)" error={errors.amount}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="transactions-page__form-control"
            placeholder="أدخل المبلغ بالريال"
            aria-label="المبلغ بالريال"
            aria-required="true"
          />
        </FormField>
        <FormField label="طريقة الدفع">
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            className="transactions-page__form-control"
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
          className="transactions-page__form-control"
          aria-label="التاريخ"
        />
      </FormField>
      <FormField label="الوصف (اختياري)">
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="transactions-page__form-control"
          placeholder="وصف العملية (اختياري)..."
          aria-label="وصف العملية"
        />
      </FormField>
      <div className="transactions-page__form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" aria-label="تراجع">
          {MSG.buttons.cancel}
        </button>
        <button type="submit" className="btn-primary" aria-label="تسجيل البيانات">
          {MSG.buttons.save}
        </button>
      </div>
    </form>
  );
}
