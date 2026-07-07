/**
 * commissions-export-utils — منطق تصدير العمولات إلى CSV
 * مستخرج من CommissionsPage.jsx (Slice 7) — لا تغيير سلوكي.
 */
import { today, safeNum } from '../../utils/helpers.js';

// ═══════════════════════════════════════
// حساب مبلغ العمولة
// ═══════════════════════════════════════
function calcCommissionAmount(dealValue, officePercent) {
  return (safeNum(dealValue, 0) * safeNum(officePercent, 0)) / 100;
}

/** الحصول على قيمة الحقل بدعم camelCase و snake_case */
function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

// ═══════════════════════════════════════
// تصدير CSV
// ═══════════════════════════════════════
export function exportCommissionsCSV(data, ledgerNameFn) {
  const BOM = '\uFEFF';
  const headers = [
    'العميل',
    'الوكيل',
    'الدفتر',
    'قيمة الصفقة',
    'نسبة المكتب %',
    'العمولة',
    'المدفوع',
    'المتبقي',
    'الحالة',
    'تاريخ الاستحقاق',
    'ملاحظات',
  ];
  const statusLabel = { pending: 'مستحقة', partial: 'مدفوعة جزئياً', paid: 'مدفوعة' };

  const rows = data.map((c) => {
    const amount = calcCommissionAmount(
      f(c, 'dealValue', 'deal_value'),
      f(c, 'officePercent', 'office_percent')
    );
    const paid = safeNum(f(c, 'paidAmount', 'paid_amount'), 0);
    const remaining = Math.max(0, amount - paid);
    return [
      f(c, 'clientName', 'client_name') || '',
      f(c, 'agentName', 'agent_name') || '',
      ledgerNameFn(f(c, 'ledgerId', 'ledger_id')),
      safeNum(f(c, 'dealValue', 'deal_value'), 0),
      safeNum(f(c, 'officePercent', 'office_percent'), 0),
      amount,
      paid,
      remaining,
      statusLabel[c.status] || c.status,
      f(c, 'dueDate', 'due_date') || '',
      (c.notes || '').replace(/[\r\n]+/g, ' '),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });

  const csv = BOM + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commissions_${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
