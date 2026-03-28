/*
  صفحة الحركات المالية + نموذج الحركة — مستخرجة من App.jsx (الخطوة 4)
*/
import React, { useState, useEffect, useCallback, useContext } from 'react';
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
import { FormField, SummaryCard, EnhancedEmptyState, Badge, Icons, MobileFAB } from '../ui/ui-common.jsx';
import { Modal, ConfirmDialog } from '../ui/Modals.jsx';
import { Currency } from '../utils/format.jsx';
import { today, isValidDateStr, safeNum } from '../utils/helpers.js';
import { downloadCSV } from '../utils/csvExport.js';

export function TransactionsPage({ setPage }) {
  const toast = useToast();
  const setDirty = useContext(UnsavedContext);
  const {
    transactions,
    transactionsLoading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    activeLedgerId,
    isCloudMode,
  } = useData();

  const [filters, setFilters] = useState({ fromDate:'', toDate:'', type:'', category:'', paymentMethod:'', search:'' });
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

  useEffect(() => { refresh(); }, [refresh]);

  // ملاحظة: أُزيل listener الـ ledger:activeChanged لأن تغيير activeLedgerId
  // في DataContext يُعيد إنشاء refresh تلقائياً عبر dependency array أعلاه.
  // الاحتفاظ بالاثنين كان يسبب double-fetch عند تبديل الدفتر.

  const txs = transactions;
  const { income, expense } = sumTransactions(txs);

  const handleSave = async (data, editId) => {
    const { error } = editId
      ? await updateTransaction(editId, data)
      : await createTransaction(data);
    if (error) { toast.error(error?.message || STORAGE_ERROR_MESSAGE); return; }
    toast.success(editId ? MSG.success.updated : MSG.success.transaction);
    setDirty(false); setModal(null);
  };

  const handleDelete = (id) => {
    setConfirm({ title:'حذف الحركة', message: MSG.confirm.deleteAction + ' سيتم حذف هذه الحركة نهائياً.', onConfirm: async () => {
      const { error } = await deleteTransaction(id);
      if (error) { toast.error(error?.message || STORAGE_ERROR_MESSAGE); setConfirm(null); return; }
      toast.success(MSG.success.deleted); setConfirm(null);
    }});
  };

  const exportCSV = () => {
    const headers = ['النوع', 'التصنيف', 'المبلغ', 'طريقة الدفع', 'التاريخ', 'الوصف'];
    const rows = txs.map(t => [TRANSACTION_TYPES[t.type], TRANSACTION_CATEGORIES[t.category], String(t.amount), PAYMENT_METHODS[t.paymentMethod], t.date, t.description || '']);
    downloadCSV({ filename: `transactions_${today()}.csv`, headers, rows });
    toast.success('تم تصدير CSV');
  };

  const handlePrint = () => window.print();

  const resetFilters = () => setFilters({ fromDate:'', toDate:'', type:'', category:'', paymentMethod:'', search:'' });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto print-container" dir="rtl">
      {setPage && (
        <div className="flex justify-end mb-4 no-print">
          <button type="button" onClick={() => setPage('pulse')} className="text-sm font-medium hover:opacity-80" style={{ color: 'var(--color-info)' }}>
            عرض النبض المالي
          </button>
        </div>
      )}
      {/* Summary Cards — موبايل: 2+1 (الدليل implementation-guide) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <SummaryCard label="إجمالي الدخل" value={<Currency value={income} />} color="green" icon={<Icons.arrowUp size={16}/>}/>
        <SummaryCard label="إجمالي الخرج" value={<Currency value={expense} />} color="red" icon={<Icons.arrowDown size={16}/>}/>
        <div className="col-span-2">
          <SummaryCard label="الصافي" value={<Currency value={income - expense} />} color={income - expense >= 0 ? 'blue' : 'red'}/>
        </div>
      </div>

      {/* Filters + Actions — موبايل: فلاتر قابلة للطي (الدفعة 3) */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 mb-4 no-print">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Icons.search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"/>
            <input type="text" placeholder="بحث في الوصف..." value={filters.search} onChange={e => setFilters(f => ({...f, search:e.target.value}))} className="w-full border border-[var(--color-border)] rounded-lg ps-9 pe-3 py-2 text-sm focus:ring-1 focus:border-[var(--color-accent)]" style={{ '--color-ring': 'var(--color-accent)' }} aria-label="بحث"/>
          </div>
        </div>
        <button type="button" onClick={() => setShowFilters(s => !s)} className="flex items-center gap-2 text-sm text-[var(--color-muted)] mt-2 md:hidden" aria-expanded={showFilters} aria-label="فلاتر متقدمة">
          <Icons.filter size={14}/>
          فلاتر متقدمة
          <Icons.chevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
        </button>
        <div className={`filters-panel flex flex-wrap gap-2 items-center mt-2 ${showFilters ? 'flex' : 'hidden'} md:flex`}>
          <select value={filters.type} onChange={e => setFilters(f => ({...f, type:e.target.value}))} className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]" aria-label="نوع الحركة">
            <option value="">كل الأنواع</option>
            {Object.entries(TRANSACTION_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({...f, category:e.target.value}))} className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]" aria-label="التصنيف">
            <option value="">كل التصنيفات</option>
            {Object.entries(TRANSACTION_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.paymentMethod} onChange={e => setFilters(f => ({...f, paymentMethod:e.target.value}))} className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]" aria-label="طريقة الدفع">
            <option value="">كل طرق الدفع</option>
            {Object.entries(PAYMENT_METHODS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={filters.fromDate} onChange={e => setFilters(f => ({...f, fromDate:e.target.value}))} className="border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm" aria-label="من تاريخ"/>
          <input type="date" value={filters.toDate} onChange={e => setFilters(f => ({...f, toDate:e.target.value}))} className="border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm" aria-label="إلى تاريخ"/>
          <button onClick={resetFilters} className="px-3 py-2 rounded-lg text-sm text-[var(--color-muted)] hover:bg-[var(--color-bg)] border border-[var(--color-border)]" aria-label="إعادة تعيين الفلاتر"><Icons.filter size={14}/></button>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={() => setModal('add')} className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 flex items-center gap-2" style={{ backgroundColor: 'var(--color-info)' }} aria-label="تسجيل عملية جديدة" title="سجّل عملية دخل أو مصروف جديدة"><Icons.plus size={16}/>إضافة حركة</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:bg-[var(--color-bg)] flex items-center gap-1.5" aria-label="تصدير CSV"><Icons.download size={14}/>CSV</button>
          <button onClick={handlePrint} className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:bg-[var(--color-bg)] flex items-center gap-1.5" aria-label="طباعة"><Icons.printer size={14}/>طباعة</button>
        </div>
      </div>

      {/* Table */}
      {txs.length === 0 ? (
        Object.values(filters).some(Boolean) ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted)]">
            <Icons.empty size={64} aria-hidden="true"/>
            <p className="mt-4 text-sm font-medium text-[var(--color-muted)]">لا توجد نتائج مطابقة للفلاتر</p>
            <p className="mt-1 text-sm">جرّب تعديل الفلاتر أو إعادة تعيينها.</p>
            <button onClick={resetFilters} className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium border border-[var(--color-border)]" aria-label="إعادة تعيين الفلاتر">إعادة تعيين الفلاتر</button>
          </div>
        ) : (
          <EnhancedEmptyState
            icon=""
            title="لا توجد معاملات مسجلة"
            description="سجّل أول عملية دخل أو مصروف لبدء تتبع التدفق المالي"
            ctaText="سجّل أول معاملة"
            onCtaClick={() => setModal('add')}
          />
        )
      ) : (
        <>
          {/* عرض بطاقات — جوال فقط */}
          <div className="md:hidden flex flex-col gap-3">
            {txs.map(t => (
              <div key={t.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge color={t.type==='income'?'green':'red'}>{TRANSACTION_TYPES[t.type]}</Badge>
                  <span className="text-xs text-[var(--color-muted)]">{t.date}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--color-text)]">{TRANSACTION_CATEGORIES[t.category]}</span>
                  <span className="text-base font-bold" style={{ color: t.type==='income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {t.type==='income'?'+':'-'}<Currency value={t.amount} symbolClassName="w-3.5 h-3.5" />
                  </span>
                </div>
                {t.description && <p className="text-xs text-[var(--color-muted)] mb-2 line-clamp-2">{t.description}</p>}
                <div className="flex gap-2 justify-end no-print border-t border-[var(--color-border)] pt-2 mt-1">
                  <button onClick={() => setModal(t)} className="p-2 rounded-lg hover:opacity-75" style={{ color: 'var(--color-info)', backgroundColor: 'transparent' }} aria-label="تعديل"><Icons.edit size={16}/></button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:opacity-75" style={{ color: 'var(--color-danger)', backgroundColor: 'transparent' }} aria-label="حذف نهائي"><Icons.trash size={16}/></button>
                </div>
              </div>
            ))}
          </div>

          {/* عرض جدول — ديسكتوب فقط */}
          <div className="hidden md:block relative overflow-hidden rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-describedby="tx-table-desc">
                <caption id="tx-table-desc" className="sr-only">جدول سجل الحركات المالية: النوع، التصنيف، المبلغ، التاريخ، الوصف، إجراءات</caption>
                <thead><tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                  <th scope="col" className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">النوع</th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">التصنيف</th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">المبلغ</th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">التاريخ</th>
                  <th scope="col" className="px-4 py-3 text-end font-semibold text-[var(--color-muted)]">الوصف</th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold text-[var(--color-muted)] no-print">إجراءات</th>
                </tr></thead>
                <tbody>
                  {txs.map(t => (
                  <tr key={t.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)]/50">
                    <td className="px-4 py-3"><Badge color={t.type==='income'?'green':'red'}>{TRANSACTION_TYPES[t.type]}</Badge></td>
                    <td className="px-4 py-3 text-[var(--color-text)]">{TRANSACTION_CATEGORIES[t.category]}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: t.type==='income' ? 'var(--color-success)' : 'var(--color-danger)' }}>{t.type==='income'?'+':'-'}<Currency value={t.amount} symbolClassName="w-3.5 h-3.5" /></td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{t.date}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)] max-w-[200px] truncate">{t.description}</td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => setModal(t)} className="p-1.5 rounded-lg hover:opacity-75" style={{ color: 'var(--color-info)', backgroundColor: 'transparent' }} aria-label="تعديل"><Icons.edit size={15}/></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:opacity-75" style={{ color: 'var(--color-danger)', backgroundColor: 'transparent' }} aria-label="حذف نهائي"><Icons.trash size={15}/></button>
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
      <Modal open={modal !== null} onClose={() => { setDirty(false); setModal(null); }} title={modal && modal !== 'add' ? 'تعديل العملية' : 'تسجيل عملية جديدة'}>
        <TransactionForm initial={modal !== 'add' ? modal : null} onSave={handleSave} onCancel={() => { setDirty(false); setModal(null); }}/>
      </Modal>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger/>

      {/* زر إضافة عائم — جوال فقط */}
      <MobileFAB onClick={() => setModal('add')} label="إضافة حركة" />
    </div>
  );
}

function TransactionForm({ initial, onSave, onCancel }) {
  const setDirty = useContext(UnsavedContext);
  const [form, setForm] = useState(initial ? { type:initial.type, category:initial.category, amount:initial.amount, paymentMethod:initial.paymentMethod, date:initial.date, description:initial.description||'' } : { type:'income', category:'commission', amount:'', paymentMethod:'cash', date:today(), description:'' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.type) errs.type = 'اختر نوع الحركة';
    if (!form.category) errs.category = 'اختر تصنيفًا صحيحًا';
    const amt = Number(form.amount);
    if (form.amount === '' || form.amount == null || !Number.isFinite(amt) || amt <= 0) errs.amount = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
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
          <select value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" aria-label="اختر نوع العملية" aria-required="true">
            <option value="">-- اختر نوع العملية --</option>
            {Object.entries(TRANSACTION_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormField>
        <FormField id="tx-category" label="التصنيف" error={errors.category}>
          <select value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" aria-label="التصنيف">
            {Object.entries(TRANSACTION_CATEGORIES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="tx-amount" label="المبلغ (ر.س)" error={errors.amount}>
          <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({...f, amount:e.target.value}))} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" placeholder="أدخل المبلغ بالريال" aria-label="المبلغ بالريال" aria-required="true"/>
        </FormField>
        <FormField label="طريقة الدفع">
          <select value={form.paymentMethod} onChange={e => setForm(f => ({...f, paymentMethod:e.target.value}))} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" aria-label="طريقة الدفع">
            {Object.entries(PAYMENT_METHODS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormField>
      </div>
      <FormField id="tx-date" label="التاريخ" error={errors.date}>
        <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" aria-label="التاريخ"/>
      </FormField>
      <FormField label="الوصف (اختياري)">
        <input type="text" value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" placeholder="وصف العملية (اختياري)..." aria-label="وصف العملية"/>
      </FormField>
      <div className="flex gap-3 justify-end mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-bg)] text-[var(--color-text)] text-sm font-medium" aria-label="تراجع">{MSG.buttons.cancel}</button>
        <button type="submit" className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: 'var(--color-info)' }} aria-label="تسجيل البيانات">{MSG.buttons.save}</button>
      </div>
    </form>
  );
}
