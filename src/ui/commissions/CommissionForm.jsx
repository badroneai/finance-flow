/**
 * نموذج إضافة/تعديل العمولة
 * مُستخرج من CommissionsPage.jsx — نفس الـ behavior تمامًا.
 */
import { useState } from 'react';
import { FormField } from '../ui-common.jsx';
import { Currency } from '../../utils/format.jsx';
import { safeNum } from '../../utils/helpers.js';

// ─── دوال مساعدة نقية ───

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

/** حساب مبلغ العمولة */
function calcCommissionAmount(dealValue, officePercent) {
  return (safeNum(dealValue, 0) * safeNum(officePercent, 0)) / 100;
}

/** حساب مبلغ عمولة الوكيل */
function calcAgentAmount(dealValue, agentPercent) {
  return (safeNum(dealValue, 0) * safeNum(agentPercent, 0)) / 100;
}

export function CommissionForm({ initial, ledgers, activeLedgerId, onSave, onCancel }) {
  const isEdit = initial && initial !== 'add' && initial.id;

  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        clientName: f(initial, 'clientName', 'client_name') || '',
        ledgerId: f(initial, 'ledgerId', 'ledger_id') || '',
        agentName: f(initial, 'agentName', 'agent_name') || '',
        dealValue: f(initial, 'dealValue', 'deal_value') || '',
        officePercent: f(initial, 'officePercent', 'office_percent') || 2.5,
        agentPercent: f(initial, 'agentPercent', 'agent_percent') || 0,
        dueDate: f(initial, 'dueDate', 'due_date') || '',
        notes: initial.notes || '',
      };
    }
    return {
      clientName: '',
      ledgerId: activeLedgerId || '',
      agentName: '',
      dealValue: '',
      officePercent: 2.5,
      agentPercent: 0,
      dueDate: '',
      notes: '',
    };
  });
  const [errors, setErrors] = useState({});

  const officeAmount = calcCommissionAmount(form.dealValue, form.officePercent);
  const agentAmount = calcAgentAmount(form.dealValue, form.agentPercent);
  const netOffice = officeAmount - agentAmount;

  const validate = () => {
    const errs = {};
    if (!form.clientName.trim()) errs.clientName = 'اسم العميل مطلوب';
    const dv = Number(form.dealValue);
    if (!form.dealValue || !Number.isFinite(dv) || dv <= 0)
      errs.dealValue = 'قيمة الصفقة مطلوبة وأكبر من صفر';
    const op = Number(form.officePercent);
    if (!Number.isFinite(op) || op < 0 || op > 100) errs.officePercent = 'النسبة بين 0 و 100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      clientName: form.clientName.trim(),
      ledgerId: form.ledgerId || null,
      agentName: form.agentName.trim() || null,
      dealValue: safeNum(form.dealValue, 0),
      officePercent: safeNum(form.officePercent, 2.5),
      agentPercent: safeNum(form.agentPercent, 0),
      dueDate: form.dueDate || null,
      notes: form.notes.trim() || null,
      status: isEdit ? undefined : 'pending',
      paidAmount: isEdit ? undefined : 0,
    };
    // لا نرسل undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    onSave(data, isEdit ? initial.id : null);
  };

  const updateField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <form onSubmit={handleSubmit}>
      <FormField id="cm-client" label="اسم العميل / الصفقة" error={errors.clientName}>
        <input
          type="text"
          value={form.clientName}
          onChange={(e) => updateField('clientName', e.target.value)}
          className="commissions-page__form-control"
          placeholder="مثال: عبدالله العتيبي — شقة 5"
          aria-required="true"
        />
      </FormField>

      <div className="commissions-page__form-row">
        <FormField label="الدفتر (اختياري)">
          <select
            value={form.ledgerId}
            onChange={(e) => updateField('ledgerId', e.target.value)}
            className="commissions-page__form-control commissions-page__form-control--surface"
            aria-label="الدفتر"
          >
            <option value="">بدون دفتر</option>
            {(ledgers || []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name || l.title || l.id}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="اسم الوكيل (اختياري)">
          <input
            type="text"
            value={form.agentName}
            onChange={(e) => updateField('agentName', e.target.value)}
            className="commissions-page__form-control"
            placeholder="اسم الوكيل"
          />
        </FormField>
      </div>

      <FormField id="cm-deal" label="قيمة الصفقة" error={errors.dealValue}>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.dealValue}
          onChange={(e) => updateField('dealValue', e.target.value)}
          className="commissions-page__form-control"
          placeholder="مثال: 500000"
          aria-required="true"
        />
      </FormField>

      <div className="commissions-page__form-row">
        <FormField id="cm-office-pct" label="نسبة المكتب %" error={errors.officePercent}>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.officePercent}
            onChange={(e) => updateField('officePercent', e.target.value)}
            className="commissions-page__form-control"
          />
        </FormField>

        <FormField label="نسبة الوكيل %">
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.agentPercent}
            onChange={(e) => updateField('agentPercent', e.target.value)}
            className="commissions-page__form-control"
          />
        </FormField>
      </div>

      {/* حقول محسوبة */}
      {safeNum(form.dealValue, 0) > 0 && (
        <div className="commissions-page__form-computed">
          <div className="commissions-page__form-computed-row">
            <span className="commissions-page__form-computed-label">عمولة المكتب:</span>
            <span className="commissions-page__form-computed-value">
              <Currency value={officeAmount} symbolClassName="commissions-page__currency-symbol" />
            </span>
          </div>
          {safeNum(form.agentPercent, 0) > 0 && (
            <>
              <div className="commissions-page__form-computed-row">
                <span className="commissions-page__form-computed-label">عمولة الوكيل:</span>
                <span className="commissions-page__form-computed-value">
                  <Currency
                    value={agentAmount}
                    symbolClassName="commissions-page__currency-symbol"
                  />
                </span>
              </div>
              <div className="commissions-page__form-computed-row commissions-page__form-computed-row--total">
                <span className="commissions-page__form-computed-label">صافي المكتب:</span>
                <span className="commissions-page__form-computed-value commissions-page__form-computed-value--net">
                  <Currency value={netOffice} symbolClassName="commissions-page__currency-symbol" />
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <FormField label="تاريخ الاستحقاق (اختياري)">
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => updateField('dueDate', e.target.value)}
          className="commissions-page__form-control"
        />
      </FormField>

      <FormField label="ملاحظات (اختياري)">
        <textarea
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
          className="commissions-page__form-control"
          placeholder="أي ملاحظات إضافية..."
        />
      </FormField>

      <div className="commissions-page__form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          إلغاء
        </button>
        <button type="submit" className="btn-primary">
          {isEdit ? 'حفظ التعديلات' : 'إضافة العمولة'}
        </button>
      </div>
    </form>
  );
}
