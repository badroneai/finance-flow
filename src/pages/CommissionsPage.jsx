/*
  صفحة العمولات + نموذج العمولة — مستخرجة من App.jsx (الخطوة 4)
*/
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';
import { UnsavedContext } from '../contexts/UnsavedContext.jsx';
import { dataStore } from '../core/dataStore.js';
import { filterCommissions, computeCommissionTotals, listAgentNames } from '../domain/index.js';
import { COMMISSION_STATUSES, MSG, STORAGE_ERROR_MESSAGE } from '../constants/index.js';
import { FormField, SummaryCard, EnhancedEmptyState, Badge, Icons } from '../ui/ui-common.jsx';
import { Modal, ConfirmDialog } from '../ui/Modals.jsx';
import { Currency, formatPercent } from '../utils/format.jsx';
import { today, isValidDateStr, safeNum } from '../utils/helpers.js';
import { downloadCSV } from '../utils/csvExport.js';

export function CommissionsPage() {
  const toast = useToast();
  const setDirty = useContext(UnsavedContext);
  const [filters, setFilters] = useState({ search:'', status:'', agent:'', fromDate:'', toDate:'' });
  const [showFilters, setShowFilters] = useState(false); // موبايل: فلاتر قابلة للطي (الدفعة 3)
  const [allCms, setAllCms] = useState([]);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const settings = dataStore.settings.get();

  const refresh = useCallback(() => setAllCms(dataStore.commissions.list()), []);

  useEffect(() => { refresh(); }, [refresh]);

  const cms = useMemo(() => filterCommissions(allCms, filters), [allCms, filters]);
  const { pendingOffice, paidOffice, totalAgent } = useMemo(() => computeCommissionTotals(cms), [cms]);

  const agentNames = useMemo(() => listAgentNames(allCms), [allCms]);

  const handleSave = (data, editId) => {
    const res = editId ? dataStore.commissions.update(editId, data) : dataStore.commissions.create(data);
    if (!res || !res.ok) { toast(res?.message || STORAGE_ERROR_MESSAGE, 'error'); return; }
    toast(editId ? MSG.success.updated : MSG.success.commission);
    setDirty(false); setModal(null); refresh();
  };

  const handleDelete = (id) => {
    setConfirm({ title:'حذف العمولة', message: MSG.confirm.deleteAction + ' سيتم حذف هذه العمولة نهائياً.', onConfirm: () => {
      const res = dataStore.commissions.remove(id);
      if (!res.ok) { toast(res.message, 'error'); setConfirm(null); return; }
      toast(MSG.success.deleted); setConfirm(null); refresh();
    }});
  };

  const handleMarkPaid = (id) => {
    setConfirm({ title:'تحديد كمدفوعة', message:'تحديد كمدفوعة؟', onConfirm: () => {
      const res = dataStore.commissions.update(id, { status:'paid', paidDate: today() });
      if (!res || !res.ok) { toast(res?.message || STORAGE_ERROR_MESSAGE, 'error'); setConfirm(null); return; }
      toast('تم تحديث حالة العمولة إلى مدفوعة'); setConfirm(null); refresh();
    }});
  };

  const resetFilters = () => setFilters({ search:'', status:'', agent:'', fromDate:'', toDate:'' });

  const exportCSV = () => {
    const headers = ['العميل/الصفقة', 'قيمة الصفقة', 'نسبة المكتب', 'حصة المكتب', 'اسم الوكيل', 'نسبة الوكيل', 'حصة الوكيل', 'الحالة', 'تاريخ الاستحقاق', 'تاريخ الدفع'];
    const rows = cms.map(c => {
      const officeAmt = c.dealValue * c.officePercent / 100;
      const agentAmt = c.dealValue * c.agentPercent / 100;
      return [c.clientName || '', String(c.dealValue), String(c.officePercent), String(officeAmt), c.agentName || '', String(c.agentPercent), String(agentAmt), COMMISSION_STATUSES[c.status] || c.status, c.dueDate || '', c.paidDate || ''];
    });
    downloadCSV({ filename: `commissions_${today()}.csv`, headers, rows });
    toast('تم تصدير CSV');
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto print-container">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="عمولات معلقة" value={<Currency value={pendingOffice} />} color="yellow"/>
        <SummaryCard label="عمولات مدفوعة" value={<Currency value={paidOffice} />} color="green"/>
        <SummaryCard label="إجمالي حصة المكتب" value={<Currency value={pendingOffice + paidOffice} />} color="blue"/>
        <SummaryCard label="إجمالي حصة الوكلاء" value={<Currency value={totalAgent} />} color="gray"/>
      </div>

      {/* Filters + Actions — موبايل: فلاتر قابلة للطي (الدفعة 3) */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 no-print">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Icons.search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="بحث في العميل/الصفقة..." value={filters.search} onChange={e => setFilters(f => ({...f, search:e.target.value}))} className="w-full border border-gray-200 rounded-lg ps-9 pe-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" aria-label="بحث"/>
          </div>
        </div>
        <button type="button" onClick={() => setShowFilters(s => !s)} className="flex items-center gap-2 text-sm text-gray-500 mt-2 md:hidden" aria-expanded={showFilters} aria-label="فلاتر متقدمة">
          <Icons.filter size={14}/>
          فلاتر متقدمة
          <Icons.chevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
        </button>
        <div className={`filters-panel flex flex-wrap gap-2 items-center mt-2 ${showFilters ? 'flex' : 'hidden'} md:flex`}>
          <select value={filters.status} onChange={e => setFilters(f => ({...f, status:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="الحالة">
            <option value="">كل الحالات</option>
            <option value="pending">معلقة</option>
            <option value="paid">مدفوعة</option>
          </select>
          <select value={filters.agent} onChange={e => setFilters(f => ({...f, agent:e.target.value}))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="الوكيل">
            <option value="">كل الوكلاء</option>
            {agentNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <input type="date" value={filters.fromDate} onChange={e => setFilters(f => ({...f, fromDate:e.target.value}))} className="border border-gray-200 rounded-lg px-2 py-2 text-sm" aria-label="من تاريخ"/>
          <input type="date" value={filters.toDate} onChange={e => setFilters(f => ({...f, toDate:e.target.value}))} className="border border-gray-200 rounded-lg px-2 py-2 text-sm" aria-label="إلى تاريخ"/>
          <button onClick={resetFilters} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 border border-gray-200" aria-label="إعادة تعيين الفلاتر"><Icons.filter size={14}/></button>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={() => setModal('add')} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2" aria-label="تسجيل عمولة جديدة" title="سجّل عمولة جديدة"><Icons.plus size={16}/>إضافة عمولة</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="تصدير CSV"><Icons.download size={14}/>CSV</button>
          <button onClick={handlePrint} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="طباعة"><Icons.printer size={14}/>طباعة</button>
        </div>
      </div>

      {/* Table or Empty */}
      {allCms.length === 0 ? (
        <EnhancedEmptyState
          icon=""
          title="لا توجد عمولات مسجلة"
          description="ابدأ بإضافة أول عمولة لتتبع حصص المكتب والوكلاء"
          ctaText="أضف أول عمولة"
          onCtaClick={() => setModal('add')}
        />
      ) : cms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Icons.empty size={64} aria-hidden="true"/>
          <p className="mt-4 text-sm font-medium text-gray-600">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-sm">جرّب تعديل الفلاتر أو إعادة تعيينها.</p>
          <button onClick={resetFilters} className="mt-4 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-200" aria-label="إعادة تعيين الفلاتر">إعادة تعيين الفلاتر</button>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-sm min-w-[600px]" aria-describedby="cms-table-desc">
              <caption id="cms-table-desc" className="sr-only">جدول العمولات: العميل/الصفقة، قيمة الصفقة، النسب، الحصص، الحالة، إجراءات</caption>
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-600">العميل/الصفقة</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-600">قيمة الصفقة</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-600">النسب</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-600">الحصص</th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-gray-600">الحالة</th>
                <th scope="col" className="px-4 py-3 text-center font-semibold text-gray-600 no-print">إجراءات</th>
              </tr></thead>
              <tbody>
                {cms.map(c => {
                const officeAmt = c.dealValue * c.officePercent / 100;
                const agentAmt = c.dealValue * c.agentPercent / 100;
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.clientName}</div>
                      <div className="text-xs text-gray-400">{c.agentName}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900"><Currency value={c.dealValue} symbolClassName="w-3.5 h-3.5" /></td>
                    <td className="px-4 py-3">
                      <div className="text-xs">مكتب: {formatPercent(c.officePercent)}</div>
                      <div className="text-xs">وكيل: {formatPercent(c.agentPercent)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-blue-600 font-medium"><Currency value={officeAmt} symbolClassName="w-3 h-3" /></div>
                      <div className="text-xs text-gray-500"><Currency value={agentAmt} symbolClassName="w-3 h-3" /></div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={c.status==='paid'?'green':'yellow'}>{COMMISSION_STATUSES[c.status]}</Badge>
                      {c.paidDate && <div className="text-xs text-gray-400 mt-0.5">{c.paidDate}</div>}
                    </td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {c.status === 'pending' && (
                          <button onClick={() => handleMarkPaid(c.id)} className="px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100" aria-label="تحديد كمدفوعة"><Icons.check size={12}/> دفع</button>
                        )}
                        <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" aria-label="تعديل"><Icons.edit size={15}/></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" aria-label="حذف نهائي"><Icons.trash size={15}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center py-2 md:hidden no-print" aria-hidden="true">← اسحب لعرض المزيد →</p>
        </div>
      )}

      <Modal open={modal !== null} onClose={() => { setDirty(false); setModal(null); }} title={modal && modal !== 'add' ? 'تعديل العمولة' : 'تسجيل عمولة جديدة'}>
        <CommissionForm initial={modal !== 'add' ? modal : null} onSave={handleSave} onCancel={() => { setDirty(false); setModal(null); }} defaultPercent={settings.defaultCommissionPercent}/>
      </Modal>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger={confirm?.title?.includes('حذف')}/>
    </div>
  );
}

function CommissionForm({ initial, onSave, onCancel, defaultPercent }) {
  const setDirty = useContext(UnsavedContext);
  const [form, setForm] = useState(initial ? {
    clientName:initial.clientName, dealValue:initial.dealValue, officePercent:initial.officePercent,
    agentName:initial.agentName, agentPercent:initial.agentPercent, status:initial.status, dueDate:initial.dueDate
  } : {
    clientName:'', dealValue:'', officePercent:defaultPercent || 50, agentName:'', agentPercent: 100 - (defaultPercent || 50), status:'pending', dueDate:today()
  });
  const [errors, setErrors] = useState({});

  const handleOfficeChange = (val) => {
    const v = Number(val);
    setForm(f => ({ ...f, officePercent: val, agentPercent: 100 - v }));
  };

  const validate = () => {
    const errs = {};
    if (!form.clientName?.trim()) errs.clientName = 'اسم العميل/الصفقة مطلوب';
    const dealVal = Number(form.dealValue);
    if (form.dealValue === '' || form.dealValue == null || !Number.isFinite(dealVal) || dealVal <= 0) errs.dealValue = 'قيمة الصفقة مطلوبة ويجب أن تكون أكبر من صفر';
    const offPct = Number(form.officePercent);
    const agPct = Number(form.agentPercent);
    if (!Number.isFinite(offPct) || offPct < 0 || offPct > 100) errs.officePercent = 'نسبة المكتب يجب أن تكون بين 0 و100';
    if (!Number.isFinite(agPct) || agPct < 0 || agPct > 100) errs.agentPercent = 'نسبة الوكيل يجب أن تكون بين 0 و100';
    if (Number.isFinite(offPct) && Number.isFinite(agPct) && Math.abs(offPct + agPct - 100) > 0.01) errs.total = 'يجب أن يكون مجموع نسبة المكتب والوكيل = 100%';
    if (!form.agentName?.trim()) errs.agentName = 'اسم الوكيل مطلوب';
    if (form.dueDate && !isValidDateStr(form.dueDate)) errs.dueDate = 'تاريخ الاستحقاق غير صالح';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, dealValue: safeNum(form.dealValue, 0), officePercent: safeNum(form.officePercent, 50), agentPercent: safeNum(form.agentPercent, 50) }, initial?.id);
  };

  const officeAmt = Number(form.dealValue) * Number(form.officePercent) / 100 || 0;
  const agentAmt = Number(form.dealValue) * Number(form.agentPercent) / 100 || 0;

  return (
    <form onSubmit={handleSubmit} onInput={() => setDirty && setDirty(true)}>
      <FormField id="cm-clientName" label="العميل/الصفقة" error={errors.clientName}>
        <input type="text" value={form.clientName} onChange={e => setForm(f => ({...f, clientName:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="العميل"/>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="cm-dealValue" label="قيمة الصفقة (ر.س)" error={errors.dealValue}>
          <input type="number" min="0" value={form.dealValue} onChange={e => setForm(f => ({...f, dealValue:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="قيمة الصفقة"/>
        </FormField>
        <FormField id="cm-agentName" label="اسم الوكيل" error={errors.agentName}>
          <input type="text" value={form.agentName} onChange={e => setForm(f => ({...f, agentName:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اسم الوكيل"/>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="cm-officePercent" label="نسبة المكتب (%)" error={errors.officePercent || errors.total}>
          <input type="number" step="0.1" min="0" max="100" value={form.officePercent} onChange={e => handleOfficeChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="نسبة المكتب"/>
        </FormField>
        <FormField id="cm-agentPercent" label="نسبة الوكيل (%)" error={errors.agentPercent}>
          <input type="number" step="0.1" min="0" max="100" value={form.agentPercent} onChange={e => setForm(f => ({...f, agentPercent:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="نسبة الوكيل"/>
        </FormField>
      </div>
      {/* Calculated preview */}
      <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm">
        <div className="flex justify-between"><span>حصة المكتب:</span><span className="font-bold text-blue-700"><Currency value={officeAmt} symbolClassName="w-3.5 h-3.5" /></span></div>
        <div className="flex justify-between mt-1"><span>حصة الوكيل:</span><span className="font-bold text-gray-700"><Currency value={agentAmt} symbolClassName="w-3.5 h-3.5" /></span></div>
      </div>
      <FormField id="cm-dueDate" label="تاريخ الاستحقاق" error={errors.dueDate}>
        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="تاريخ الاستحقاق"/>
      </FormField>
      <div className="flex gap-3 justify-end mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium" aria-label="تراجع">{MSG.buttons.cancel}</button>
        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" aria-label="تسجيل البيانات">{MSG.buttons.save}</button>
      </div>
    </form>
  );
}
