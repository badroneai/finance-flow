/**
 * pdf-service.js — SPR-013 تصدير PDF احترافي
 *
 * يستخدم html2canvas + jsPDF لتحويل عناصر HTML مُنسَّقة إلى PDF.
 * هذه الطريقة تدعم RTL والعربية بشكل كامل لأنها تحوّل العنصر لصورة أولاً.
 *
 * ثلاث دوال رئيسية:
 *  1. exportMonthlyReport(reportData, officeInfo)
 *  2. exportCommissionsReport(commissions, officeInfo, filters)
 *  3. exportLedgerStatement(ledger, transactions, officeInfo, period)
 *
 * كل دالة:
 *  - تبني عنصر HTML مخفي بالتنسيق المطلوب
 *  - تحوّله لصورة عبر html2canvas
 *  - تنشئ PDF عبر jsPDF بحجم A4
 *  - تحذف العنصر المؤقت وتُنزّل الملف
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import DOMPurify from 'dompurify';

// ═══════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════

const fmt = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const todayStr = () => new Date().toISOString().split('T')[0];

/**
 * تعقيم النصوص قبل حقنها في HTML — يمنع هجمات XSS
 * يحوّل الأحرف الخطرة لـ HTML entities آمنة
 */
const esc = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const MONTH_NAMES = [
  '',
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const STATUS_LABELS = { pending: 'مستحقة', partial: 'مدفوعة جزئياً', paid: 'مدفوعة' };
const STATUS_COLORS = { pending: '#b8872d', partial: '#0f1c2e', paid: '#2e7d32' };

/**
 * حقن HTML آمن باستخدام DOMPurify
 * يسمح بالعناصر والأنماط اللازمة لقوالب PDF مع حظر السكربتات
 */
function safeSetHTML(el, html) {
  el.innerHTML = DOMPurify.sanitize(html, {
    ADD_TAGS: ['style'],
    ADD_ATTR: ['style', 'class', 'dir', 'colspan', 'rowspan'],
  });
}

/** إنشاء عنصر مؤقت مخفي */
function createHiddenContainer() {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:"IBM Plex Sans Arabic",Tahoma,Arial,sans-serif;color:#0f1c2e;direction:rtl;padding:0;margin:0;z-index:-1;';
  document.body.appendChild(el);
  return el;
}

/** تحويل HTML → PDF (دعم صفحات متعددة) */
async function htmlToPdf(container, filename) {
  // انتظار تحميل الخطوط والصور
  await new Promise((r) => setTimeout(r, 200));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: 794,
    windowWidth: 794,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = 210;
  const pdfH = 297;
  const imgW = pdfW;
  const imgH = (canvas.height * pdfW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;

  // أول صفحة
  pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
  heightLeft -= pdfH;

  // صفحات إضافية إذا المحتوى طويل
  while (heightLeft > 0) {
    position -= pdfH;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pdfH;
  }

  // تنظيف
  document.body.removeChild(container);

  pdf.save(filename);
  return true;
}

/** CSS مشترك للتقارير */
const SHARED_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, div, td, th, p, span, h1, h2, h3, h4 { font-family: "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif; }
  .pdf-page { padding: 32px 28px; direction: rtl; text-align: right; }
  .pdf-header { text-align: center; border-bottom: 3px solid #0f1c2e; padding-bottom: 16px; margin-bottom: 24px; }
  .pdf-header h1 { font-size: 22px; color: #0f1c2e; margin-bottom: 4px; }
  .pdf-header .subtitle { font-size: 14px; color: #8a8f98; margin-bottom: 8px; }
  .pdf-header .period { font-size: 16px; font-weight: 700; color: #0f1c2e; }
  .pdf-header .office-name { font-size: 13px; color: #676d76; margin-top: 4px; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-card { background: #f7f6f2; border: 1px solid #e3e0d7; border-radius: 10px; padding: 12px; text-align: center; }
  .summary-card .label { font-size: 11px; color: #8a8f98; margin-bottom: 4px; }
  .summary-card .value { font-size: 18px; font-weight: 700; }
  .summary-card .value.green { color: #2e7d32; }
  .summary-card .value.red { color: #dc2626; }
  .summary-card .value.blue { color: #0f1c2e; }
  .section-title { font-size: 15px; font-weight: 700; color: #0f1c2e; margin-bottom: 12px; margin-top: 20px; border-right: 4px solid #b8a76a; padding-right: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  th { background: #0f1c2e; color: #fff; padding: 8px 10px; text-align: right; font-weight: 600; font-size: 11px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e3e0d7; text-align: right; }
  tr:nth-child(even) td { background: #faf9f6; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; color: #fff; }
  .amount-green { color: #2e7d32; font-weight: 600; }
  .amount-red { color: #dc2626; font-weight: 600; }
  .pdf-footer { text-align: center; border-top: 2px solid #e3e0d7; padding-top: 12px; margin-top: 24px; font-size: 10px; color: #8a8f98; }
  .summary-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
`;

// ═══════════════════════════════════════
// 1. تصدير التقرير الشهري
// ═══════════════════════════════════════

/**
 * قراءة شعار المكتب من التخزين (base64 data URL)
 * SPR-017: يُقرأ تلقائياً — لا يحتاج المستدعي تمريره
 */
function getOfficeLogo(officeInfo) {
  // أولوية: officeInfo.logo ← التخزين المحلي
  if (officeInfo?.logo) return officeInfo.logo;
  try {
    const stored = localStorage.getItem('ff_office_logo');
    if (stored && stored.startsWith('data:image')) return stored;
  } catch {}
  return '';
}

/**
 * بناء HTML الشعار (إذا وجد)
 */
function logoHtml(officeInfo) {
  const logo = getOfficeLogo(officeInfo);
  if (!logo) return '';
  return `<div style="text-align:center;margin-bottom:8px;"><img src="${logo}" alt="شعار المكتب" style="max-height:56px;max-width:180px;object-fit:contain;" /></div>`;
}

/**
 * @param {Object} reportData - كائن التقرير من generateMonthlyReport
 * @param {Object} officeInfo - { name, phone, address, logo }
 */
export async function exportMonthlyReport(reportData, officeInfo = {}) {
  if (!reportData) throw new Error('لا توجد بيانات تقرير');

  const {
    meta,
    summary,
    incomeBreakdown,
    expenseBreakdown,
    commitments,
    highlights,
    nextMonthForecast,
    transactions,
  } = reportData;
  const monthLabel = `${MONTH_NAMES[meta?.month] || meta?.month} ${meta?.year}`;
  const officeName = officeInfo?.name || 'مكتب عقاري';

  const container = createHiddenContainer();
  safeSetHTML(container, `<style>${SHARED_CSS}</style>
  <div class="pdf-page">
    <div class="pdf-header">
      ${logoHtml(officeInfo)}
      <h1>قيد العقار</h1>
      <div class="subtitle">التقرير الشهري</div>
      <div class="period">${esc(meta?.ledgerName) || '—'} — ${esc(monthLabel)}</div>
      <div class="office-name">${esc(officeName)}</div>
    </div>

    <div class="summary-grid-4">
      <div class="summary-card">
        <div class="label">رصيد الافتتاح</div>
        <div class="value blue">${fmt(summary?.openingBalance)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">إجمالي الدخل</div>
        <div class="value green">${fmt(summary?.totalIncome)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">إجمالي المصروف</div>
        <div class="value red">${fmt(summary?.totalExpense)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">رصيد الإغلاق</div>
        <div class="value ${(summary?.closingBalance || 0) >= 0 ? 'green' : 'red'}">${fmt(summary?.closingBalance)} ر.س</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">صافي التدفق</div>
        <div class="value ${(summary?.netCashflow || 0) >= 0 ? 'green' : 'red'}">${fmt(summary?.netCashflow)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">درجة الصحة المالية</div>
        <div class="value blue">${summary?.healthScore || 0}</div>
      </div>
      <div class="summary-card">
        <div class="label">الاتجاه</div>
        <div class="value">${summary?.healthTrend || 'مستقر'}</div>
      </div>
    </div>

    ${
      (incomeBreakdown || []).length > 0
        ? `
    <div class="section-title">تفصيل الدخل</div>
    <table>
      <thead><tr><th>المصدر</th><th>المبلغ</th><th>النسبة</th><th>العدد</th></tr></thead>
      <tbody>
        ${incomeBreakdown.map((r) => `<tr><td>${esc(r.source) || '—'}</td><td class="amount-green">${fmt(r.amount)} ر.س</td><td>${fmt(r.percentage)}%</td><td>${r.count || 0}</td></tr>`).join('')}
      </tbody>
    </table>`
        : ''
    }

    ${
      (expenseBreakdown || []).length > 0
        ? `
    <div class="section-title">تفصيل المصروفات</div>
    <table>
      <thead><tr><th>الفئة</th><th>المبلغ</th><th>النسبة</th><th>العدد</th></tr></thead>
      <tbody>
        ${expenseBreakdown.map((r) => `<tr><td>${esc(r.category) || '—'}</td><td class="amount-red">${fmt(r.amount)} ر.س</td><td>${fmt(r.percentage)}%</td><td>${r.count || 0}</td></tr>`).join('')}
      </tbody>
    </table>`
        : ''
    }

    ${
      commitments
        ? `
    <div class="section-title">الالتزامات</div>
    <div class="summary-grid">
      <div class="summary-card"><div class="label">مستحقات الشهر</div><div class="value">${fmt(commitments.totalDue)} ر.س</div></div>
      <div class="summary-card"><div class="label">المدفوع</div><div class="value green">${fmt(commitments.totalPaid)} ر.س</div></div>
      <div class="summary-card"><div class="label">نسبة الالتزام</div><div class="value blue">${commitments.complianceRate || 0}%</div></div>
    </div>`
        : ''
    }

    ${
      (highlights || []).length > 0
        ? `
    <div class="section-title">أبرز الأحداث</div>
    <div style="margin-bottom:16px;">
      ${highlights
        .map((h) => {
          const bg =
            h.type === 'positive' ? '#dcfce7' : h.type === 'negative' ? '#fee2e2' : '#f1f5f9';
          const color =
            h.type === 'positive' ? '#166534' : h.type === 'negative' ? '#991b1b' : '#334155';
          return `<div style="background:${bg};color:${color};padding:8px 12px;border-radius:6px;font-size:12px;margin-bottom:4px;">${esc(h.message)}</div>`;
        })
        .join('')}
    </div>`
        : ''
    }

    ${
      nextMonthForecast
        ? `
    <div class="section-title">توقعات الشهر القادم</div>
    <div class="summary-grid">
      <div class="summary-card"><div class="label">دخل متوقع</div><div class="value green">${fmt(nextMonthForecast.expectedIncome)} ر.س</div></div>
      <div class="summary-card"><div class="label">مصروف متوقع</div><div class="value red">${fmt(nextMonthForecast.expectedExpense)} ر.س</div></div>
      <div class="summary-card"><div class="label">صافي متوقع</div><div class="value ${(nextMonthForecast.expectedNet || 0) >= 0 ? 'green' : 'red'}">${fmt(nextMonthForecast.expectedNet)} ر.س</div></div>
    </div>`
        : ''
    }

    ${
      (transactions || []).length > 0
        ? `
    <div class="section-title">حركات الشهر (${transactions.length})</div>
    <table>
      <thead><tr><th>التاريخ</th><th>النوع</th><th>الفئة</th><th>الوصف</th><th>المبلغ</th></tr></thead>
      <tbody>
        ${transactions
          .slice(0, 100)
          .map(
            (t) => `<tr>
          <td>${esc(t.date) || '—'}</td>
          <td>${t.type === 'income' ? 'دخل' : 'مصروف'}</td>
          <td>${esc(t.category) || '—'}</td>
          <td>${esc((t.description || '—').substring(0, 40))}</td>
          <td class="${t.type === 'income' ? 'amount-green' : 'amount-red'}">${fmt(t.amount)} ر.س</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }

    <div class="pdf-footer">
      تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} &nbsp;|&nbsp; تم إنشاؤه بواسطة قيد العقار
    </div>
  </div>`);

  const safeName = (meta?.ledgerName || 'دفتر').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `تقرير_${safeName}_${meta?.month}_${meta?.year}.pdf`;

  return htmlToPdf(container, filename);
}

// ═══════════════════════════════════════
// 2. تصدير تقرير العمولات
// ═══════════════════════════════════════

function f(c, camel, snake) {
  return c[camel] ?? c[snake] ?? null;
}

function calcAmount(c) {
  return (
    ((Number(f(c, 'dealValue', 'deal_value')) || 0) *
      (Number(f(c, 'officePercent', 'office_percent')) || 0)) /
    100
  );
}

/**
 * @param {Array} commissions - العمولات المفلترة
 * @param {Object} officeInfo - { name }
 * @param {Object} filters - الفلاتر النشطة (لعرض الفترة)
 */
export async function exportCommissionsReport(commissions, officeInfo = {}, filters = {}) {
  const list = commissions || [];
  if (list.length === 0) throw new Error('لا توجد عمولات للتصدير');

  const officeName = officeInfo?.name || 'مكتب عقاري';

  // حساب الملخص
  let totalCommission = 0,
    totalPaid = 0,
    totalRemaining = 0;
  for (const c of list) {
    const amt = calcAmount(c);
    const paid = Number(f(c, 'paidAmount', 'paid_amount')) || 0;
    totalCommission += amt;
    totalPaid += paid;
    totalRemaining += Math.max(0, amt - paid);
  }

  // ملخص بالوكيل
  const byAgent = {};
  for (const c of list) {
    const agent = f(c, 'agentName', 'agent_name') || 'بدون وكيل';
    if (!byAgent[agent]) byAgent[agent] = { count: 0, commission: 0, paid: 0 };
    byAgent[agent].count++;
    byAgent[agent].commission += calcAmount(c);
    byAgent[agent].paid += Number(f(c, 'paidAmount', 'paid_amount')) || 0;
  }
  const agentSummary = Object.entries(byAgent).map(([name, d]) => ({
    name,
    ...d,
    remaining: Math.max(0, d.commission - d.paid),
  }));

  // الفترة
  let periodLabel = todayStr();
  if (filters.dateFrom && filters.dateTo) periodLabel = `${filters.dateFrom} — ${filters.dateTo}`;
  else if (filters.dateFrom) periodLabel = `من ${filters.dateFrom}`;
  else if (filters.dateTo) periodLabel = `حتى ${filters.dateTo}`;

  const container = createHiddenContainer();
  safeSetHTML(container, `<style>${SHARED_CSS}</style>
  <div class="pdf-page">
    <div class="pdf-header">
      ${logoHtml(officeInfo)}
      <h1>قيد العقار</h1>
      <div class="subtitle">تقرير العمولات</div>
      <div class="period">${esc(periodLabel)}</div>
      <div class="office-name">${esc(officeName)}</div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">إجمالي العمولات</div>
        <div class="value blue">${fmt(totalCommission)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">إجمالي المدفوع</div>
        <div class="value green">${fmt(totalPaid)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">المتبقي</div>
        <div class="value red">${fmt(totalRemaining)} ر.س</div>
      </div>
    </div>

    <div class="section-title">تفاصيل العمولات (${list.length})</div>
    <table>
      <thead><tr>
        <th>العميل</th><th>الوكيل</th><th>قيمة الصفقة</th><th>النسبة</th><th>العمولة</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th>
      </tr></thead>
      <tbody>
        ${list
          .slice(0, 200)
          .map((c) => {
            const amt = calcAmount(c);
            const paid = Number(f(c, 'paidAmount', 'paid_amount')) || 0;
            const rem = Math.max(0, amt - paid);
            const st = c.status || 'pending';
            return `<tr>
            <td>${esc(f(c, 'clientName', 'client_name')) || '—'}</td>
            <td>${esc(f(c, 'agentName', 'agent_name')) || '—'}</td>
            <td>${fmt(f(c, 'dealValue', 'deal_value'))} ر.س</td>
            <td>${f(c, 'officePercent', 'office_percent') || 0}%</td>
            <td style="font-weight:600">${fmt(amt)} ر.س</td>
            <td class="amount-green">${fmt(paid)} ر.س</td>
            <td class="amount-red">${fmt(rem)} ر.س</td>
            <td><span class="status-badge" style="background:${STATUS_COLORS[st] || '#94a3b8'}">${STATUS_LABELS[st] || st}</span></td>
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>

    ${
      agentSummary.length > 1
        ? `
    <div class="section-title">ملخص حسب الوكيل</div>
    <table>
      <thead><tr><th>الوكيل</th><th>عدد الصفقات</th><th>إجمالي العمولة</th><th>المدفوع</th><th>المتبقي</th></tr></thead>
      <tbody>
        ${agentSummary
          .sort((a, b) => b.commission - a.commission)
          .map(
            (a) => `<tr>
          <td style="font-weight:600">${esc(a.name)}</td>
          <td>${a.count}</td>
          <td>${fmt(a.commission)} ر.س</td>
          <td class="amount-green">${fmt(a.paid)} ر.س</td>
          <td class="amount-red">${fmt(a.remaining)} ر.س</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }

    <div class="pdf-footer">
      تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} &nbsp;|&nbsp; تم إنشاؤه بواسطة قيد العقار
    </div>
  </div>`);

  const filename = `عمولات_${officeName.replace(/[/\\?%*:|"<>]/g, '_')}_${todayStr()}.pdf`;
  return htmlToPdf(container, filename);
}

// ═══════════════════════════════════════
// 3. تصدير كشف حساب الدفتر
// ═══════════════════════════════════════

/**
 * @param {Object} ledger - كائن الدفتر { name, id, type }
 * @param {Array} transactions - حركات الدفتر
 * @param {Object} officeInfo - { name }
 * @param {Object} period - { from, to, month, year }
 */
export async function exportLedgerStatement(ledger, transactions, officeInfo = {}, period = {}) {
  const txs = (transactions || [])
    .slice()
    .sort((a, b) => ((a.date || '') > (b.date || '') ? 1 : -1));
  if (txs.length === 0) throw new Error('لا توجد حركات للتصدير');

  const officeName = officeInfo?.name || 'مكتب عقاري';
  const ledgerName = ledger?.name || ledger?.title || '—';

  // حساب الفترة
  let periodLabel = '';
  if (period.month && period.year) {
    periodLabel = `${MONTH_NAMES[Number(period.month)] || period.month} ${period.year}`;
  } else if (period.from && period.to) {
    periodLabel = `${period.from} — ${period.to}`;
  } else {
    const dates = txs
      .map((t) => t.date)
      .filter(Boolean)
      .sort();
    periodLabel = dates.length > 0 ? `${dates[0]} — ${dates[dates.length - 1]}` : todayStr();
  }

  // حساب الأرصدة
  let totalIncome = 0,
    totalExpense = 0;
  let runningBalance = 0;
  const rows = txs.map((t) => {
    const amt = Number(t.amount) || 0;
    const isIncome = t.type === 'income';
    if (isIncome) {
      totalIncome += amt;
      runningBalance += amt;
    } else {
      totalExpense += amt;
      runningBalance -= amt;
    }
    return {
      date: (t.date || '').slice(0, 10),
      description: t.description || t.category || '—',
      category: t.category || '—',
      debit: isIncome ? 0 : amt,
      credit: isIncome ? amt : 0,
      balance: runningBalance,
    };
  });

  const container = createHiddenContainer();
  safeSetHTML(container, `<style>${SHARED_CSS}
    .balance-row td { font-weight: 700; background: #f1f5f9 !important; }
  </style>
  <div class="pdf-page">
    <div class="pdf-header">
      ${logoHtml(officeInfo)}
      <h1>قيد العقار</h1>
      <div class="subtitle">كشف حساب</div>
      <div class="period">${esc(ledgerName)} — ${esc(periodLabel)}</div>
      <div class="office-name">${esc(officeName)}</div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">إجمالي الدخل (دائن)</div>
        <div class="value green">${fmt(totalIncome)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">إجمالي المصروف (مدين)</div>
        <div class="value red">${fmt(totalExpense)} ر.س</div>
      </div>
      <div class="summary-card">
        <div class="label">الرصيد الختامي</div>
        <div class="value ${runningBalance >= 0 ? 'green' : 'red'}">${fmt(runningBalance)} ر.س</div>
      </div>
    </div>

    <div class="section-title">كشف الحركات (${txs.length})</div>
    <table>
      <thead><tr>
        <th>التاريخ</th><th>الوصف</th><th>التصنيف</th><th>مدين</th><th>دائن</th><th>الرصيد</th>
      </tr></thead>
      <tbody>
        ${rows
          .slice(0, 200)
          .map(
            (r) => `<tr>
          <td>${esc(r.date)}</td>
          <td>${esc(r.description.substring(0, 50))}</td>
          <td>${esc(r.category)}</td>
          <td class="${r.debit > 0 ? 'amount-red' : ''}">${r.debit > 0 ? fmt(r.debit) + ' ر.س' : '—'}</td>
          <td class="${r.credit > 0 ? 'amount-green' : ''}">${r.credit > 0 ? fmt(r.credit) + ' ر.س' : '—'}</td>
          <td style="font-weight:600;color:${r.balance >= 0 ? '#059669' : '#dc2626'}">${fmt(r.balance)} ر.س</td>
        </tr>`
          )
          .join('')}
        <tr class="balance-row">
          <td colspan="3" style="text-align:center;font-size:13px;">الإجمالي</td>
          <td class="amount-red">${fmt(totalExpense)} ر.س</td>
          <td class="amount-green">${fmt(totalIncome)} ر.س</td>
          <td style="color:${runningBalance >= 0 ? '#059669' : '#dc2626'}">${fmt(runningBalance)} ر.س</td>
        </tr>
      </tbody>
    </table>

    <div class="pdf-footer">
      تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} &nbsp;|&nbsp; تم إنشاؤه بواسطة قيد العقار
    </div>
  </div>`);

  const safeName = ledgerName.replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `كشف_حساب_${safeName}_${todayStr()}.pdf`;
  return htmlToPdf(container, filename);
}

// ═══════════════════════════════════════
// 4. تصدير سند قبض / إيصال دفعة عقد
// ═══════════════════════════════════════

/** CSS خاص بسند القبض */
const RECEIPT_CSS = `
  ${SHARED_CSS}
  .receipt-page { padding: 36px 32px; direction: rtl; text-align: right; max-width: 794px; }
  .receipt-header { text-align: center; border-bottom: 3px solid #0f1c2e; padding-bottom: 16px; margin-bottom: 20px; }
  .receipt-header h1 { font-size: 24px; color: #0f1c2e; margin-bottom: 2px; }
  .receipt-header .receipt-title { font-size: 18px; color: #b8a76a; font-weight: 700; margin-top: 8px; }
  .receipt-header .receipt-number { font-size: 13px; color: #8a8f98; margin-top: 4px; }
  .receipt-body { margin-bottom: 24px; }
  .receipt-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid #e3e0d7; }
  .receipt-row .label { font-size: 13px; color: #8a8f98; flex-shrink: 0; min-width: 120px; }
  .receipt-row .value { font-size: 14px; font-weight: 600; color: #0f1c2e; text-align: left; }
  .receipt-amount-box { background: #f3f8f3; border: 2px solid #2e7d32; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
  .receipt-amount-box .amount-label { font-size: 13px; color: #2e7d32; margin-bottom: 4px; }
  .receipt-amount-box .amount-value { font-size: 28px; font-weight: 800; color: #2e7d32; }
  .receipt-note { background: #faf9f6; border: 1px solid #e3e0d7; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 13px; color: #676d76; }
  .receipt-signature { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e3e0d7; }
  .receipt-sig-box { text-align: center; width: 45%; }
  .receipt-sig-box .sig-label { font-size: 12px; color: #8a8f98; margin-bottom: 40px; }
  .receipt-sig-box .sig-line { border-bottom: 1px solid #b3b8c0; margin-bottom: 4px; }
  .receipt-sig-box .sig-name { font-size: 11px; color: #8a8f98; }
`;

/**
 * تصدير سند قبض PDF من نموذج الإيصال
 * @param {Object} receipt - نموذج الإيصال من buildReceiptModel
 * @param {Object} [officeInfo] - { name, logo }
 * @returns {Promise<boolean>}
 */
export async function exportReceiptPdf(receipt, officeInfo = {}) {
  if (!receipt) throw new Error('لا توجد بيانات إيصال');

  const container = createHiddenContainer();

  safeSetHTML(container, `<style>${RECEIPT_CSS}</style>
  <div class="receipt-page">
    <div class="receipt-header">
      ${logoHtml(officeInfo)}
      <h1>${esc(receipt.officeName || officeInfo?.name || 'قيد العقار')}</h1>
      <div class="receipt-title">سند قبض</div>
      <div class="receipt-number">رقم الإيصال: ${esc(receipt.receiptNumber)}</div>
    </div>

    <div class="receipt-body">
      <div class="receipt-row">
        <span class="label">تاريخ الإصدار</span>
        <span class="value">${esc(receipt.issueDate)}</span>
      </div>
      <div class="receipt-row">
        <span class="label">اسم المستأجر</span>
        <span class="value">${esc(receipt.tenantName) || '—'}</span>
      </div>
      <div class="receipt-row">
        <span class="label">رقم العقد</span>
        <span class="value">${esc(receipt.contractNumber) || '—'}</span>
      </div>
      <div class="receipt-row">
        <span class="label">العقار</span>
        <span class="value">${esc(receipt.propertyName) || '—'}</span>
      </div>
      ${receipt.unitName ? `<div class="receipt-row">
        <span class="label">الوحدة</span>
        <span class="value">${esc(receipt.unitName)}</span>
      </div>` : ''}
      <div class="receipt-row">
        <span class="label">طريقة الدفع</span>
        <span class="value">${esc(receipt.paymentMethodLabel)}</span>
      </div>
      ${receipt.installmentNumber ? `<div class="receipt-row">
        <span class="label">رقم القسط</span>
        <span class="value">${esc(receipt.installmentNumber)}</span>
      </div>` : ''}
      ${receipt.dueId ? `<div class="receipt-row">
        <span class="label">مرجع الاستحقاق</span>
        <span class="value" style="font-size:11px;direction:ltr;">${esc(receipt.dueId)}</span>
      </div>` : ''}
    </div>

    <div class="receipt-amount-box">
      <div class="amount-label">المبلغ المستلم</div>
      <div class="amount-value">${fmt(receipt.amount)} ر.س</div>
    </div>

    ${receipt.note ? `<div class="receipt-note"><strong>ملاحظة:</strong> ${esc(receipt.note)}</div>` : ''}

    <div class="receipt-signature">
      <div class="receipt-sig-box">
        <div class="sig-label">توقيع المستلم</div>
        <div class="sig-line"></div>
        <div class="sig-name">المكتب</div>
      </div>
      <div class="receipt-sig-box">
        <div class="sig-label">توقيع الدافع</div>
        <div class="sig-line"></div>
        <div class="sig-name">${esc(receipt.tenantName) || '—'}</div>
      </div>
    </div>

    <div class="pdf-footer">
      تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} &nbsp;|&nbsp; تم إنشاؤه بواسطة قيد العقار
    </div>
  </div>`);

  const safeNum = (receipt.receiptNumber || '').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `سند_قبض_${safeNum}_${todayStr()}.pdf`;
  return htmlToPdf(container, filename);
}
