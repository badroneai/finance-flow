// نموذج سند القبض / إيصال الدفعة — دوال نقية بدون React أو side effects
// يبني كائن receipt موحد من بيانات العقد والدفعة والعقار والمستأجر
// يتضمن حقول ZATCA للفوترة الإلكترونية والضريبة

import { safeNum } from '../utils/helpers.js';

/** تسميات طرق الدفع */
const PAYMENT_METHOD_LABELS = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  check: 'شيك',
  electronic: 'بطاقة إلكترونية',
};

/** معدل ضريبة القيمة المضافة الافتراضي (ZATCA) */
const DEFAULT_VAT_RATE = 0.15;

/**
 * توليد رقم إيصال فريد مبني على الوقت
 * الصيغة: RCP-YYYYMMDD-XXXX (4 أحرف عشوائية)
 * @param {string} [dateStr] - تاريخ الإصدار (YYYY-MM-DD)
 * @returns {string}
 */
export function generateReceiptNumber(dateStr) {
  const d = dateStr
    ? dateStr.replace(/-/g, '')
    : new Date().toISOString().split('T')[0].replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${d}-${rand}`;
}

/**
 * بناء نموذج الإيصال الموحد من بيانات الدفعة والعقد
 *
 * @param {Object} params
 * @param {Object} params.contract - بيانات العقد
 * @param {Object} params.formData - بيانات النموذج { amount, date, paymentMethod, dueId, note }
 * @param {string} [params.tenantName] - اسم المستأجر
 * @param {string} [params.propertyName] - اسم العقار
 * @param {string} [params.unitName] - اسم الوحدة
 * @param {string} [params.officeName] - اسم المكتب
 * @param {string} [params.installmentNumber] - رقم القسط
 * @param {string} [params.receiptNumber] - رقم الإيصال (يُولَّد تلقائياً إذا لم يُمرر)
 * @param {string} [params.sellerName] - اسم البائع (ZATCA)
 * @param {string} [params.sellerTaxNumber] - الرقم الضريبي (ZATCA)
 * @param {number} [params.vatRate] - معدل الضريبة (افتراضي: 0.15)
 * @returns {Object} نموذج الإيصال مع حقول ZATCA
 */
export function buildReceiptModel({
  contract,
  formData,
  tenantName,
  propertyName,
  unitName,
  officeName,
  installmentNumber,
  receiptNumber,
  sellerName,
  sellerTaxNumber,
  vatRate,
}) {
  if (!contract || !formData) return null;

  const amount = safeNum(formData.amount);
  const date = formData.date || new Date().toISOString().split('T')[0];
  const contractNumber = contract.contractNumber || contract.contract_number || '';

  // حسابات الضريبة (ZATCA)
  const rate = vatRate || DEFAULT_VAT_RATE;
  const vatAmount = Math.round(amount * rate * 100) / 100; // تقريب لأقرب هللة
  const totalWithVat = amount + vatAmount;

  return {
    // بيانات الإيصال
    receiptNumber: receiptNumber || generateReceiptNumber(date),
    issueDate: date,

    // بيانات المكتب
    officeName: officeName || 'قيد العقار',

    // بيانات المستأجر
    tenantName: tenantName || '',

    // بيانات العقد
    contractId: contract.id,
    contractNumber,
    contractType: contract.type || 'rent',

    // بيانات العقار
    propertyName: propertyName || '',
    unitName: unitName || '',

    // بيانات الدفعة
    amount,
    paymentMethod: formData.paymentMethod || 'bank_transfer',
    paymentMethodLabel:
      PAYMENT_METHOD_LABELS[formData.paymentMethod] || PAYMENT_METHOD_LABELS.bank_transfer,
    dueId: formData.dueId || '',
    installmentNumber: installmentNumber || '',
    note: String(formData.note || '').trim(),

    // بيانات ZATCA — الضريبة
    vatRate: rate,
    vatAmount,
    totalWithVat,
    sellerName: sellerName || 'قيد العقار',
    sellerTaxNumber: sellerTaxNumber || '',

    // بيانات وصفية
    createdAt: new Date().toISOString(),
  };
}

/**
 * بناء نموذج إيصال من عنصر مستحق (due item من buildOperationalDues)
 * مناسب للاستخدام في QuickPaymentModal بعد نجاح الدفعة
 *
 * @param {Object} params
 * @param {Object} params.dueItem - عنصر المستحق من dues.js
 * @param {Object} params.contract - بيانات العقد
 * @param {Object} params.formData - بيانات النموذج
 * @param {string} [params.officeName] - اسم المكتب
 * @param {string} [params.sellerName] - اسم البائع (ZATCA)
 * @param {string} [params.sellerTaxNumber] - الرقم الضريبي (ZATCA)
 * @param {number} [params.vatRate] - معدل الضريبة (افتراضي: 0.15)
 * @returns {Object} نموذج الإيصال مع حقول ZATCA
 */
export function buildReceiptFromDue({
  dueItem,
  contract,
  formData,
  officeName,
  sellerName,
  sellerTaxNumber,
  vatRate,
}) {
  if (!dueItem || !contract) return null;

  return buildReceiptModel({
    contract,
    formData,
    tenantName: dueItem.tenantName,
    propertyName: dueItem.propertyName,
    unitName: dueItem.unitName,
    officeName,
    installmentNumber: dueItem.installmentNumber ? String(dueItem.installmentNumber) : '',
    sellerName,
    sellerTaxNumber,
    vatRate,
  });
}

/**
 * التحقق من صحة الرقم الضريبي السعودي (ZATCA)
 * يجب أن يكون 15 رقم، يبدأ بـ 3 وينتهي بـ 3
 *
 * @param {string} taxNumber - الرقم الضريبي
 * @returns {boolean} صحيح إذا كان الرقم صالحاً، خطأ وإلا
 */
export function validateTaxNumber(taxNumber) {
  if (!taxNumber || typeof taxNumber !== 'string') return false;
  // إزالة أي مسافات
  const num = taxNumber.trim();
  // التحقق من الطول والبداية والنهاية
  return /^\d{15}$/.test(num) && num[0] === '3' && num[14] === '3';
}

/**
 * بناء TLV (Tag-Length-Value) للرمز السريع (QR Code) ZATCA — المرحلة الأولى
 * يدعم Tags 1-5:
 * - Tag 1: اسم البائع
 * - Tag 2: الرقم الضريبي
 * - Tag 3: تاريخ الفاتورة (ISO format: YYYY-MM-DD)
 * - Tag 4: الإجمالي شامل الضريبة
 * - Tag 5: مبلغ الضريبة
 *
 * الصيغة: [Tag (1 بايت)] + [الطول (1 بايت)] + [القيمة (UTF-8)]
 * النتيجة: Base64 string للرمز السريع
 *
 * @param {Object} receipt - نموذج الإيصال من buildReceiptModel
 * @returns {string} TLV Base64 string للرمز السريع
 */
export function buildZatcaQrTlv(receipt) {
  if (!receipt) return '';

  // التحقق من البيانات المطلوبة
  if (!receipt.sellerName || !receipt.sellerTaxNumber || !receipt.issueDate) return '';

  // التحقق من صحة الرقم الضريبي
  if (!validateTaxNumber(receipt.sellerTaxNumber)) return '';

  // بناء TLV
  const tlvParts = [];

  // Tag 1: اسم البائع
  const sellerName = (receipt.sellerName || '').trim();
  if (sellerName) {
    const sellerBytes = new TextEncoder().encode(sellerName);
    tlvParts.push(1); // Tag
    tlvParts.push(sellerBytes.length); // Length
    tlvParts.push(...sellerBytes); // Value
  }

  // Tag 2: الرقم الضريبي
  const taxNumber = receipt.sellerTaxNumber.trim();
  const taxBytes = new TextEncoder().encode(taxNumber);
  tlvParts.push(2); // Tag
  tlvParts.push(taxBytes.length); // Length
  tlvParts.push(...taxBytes); // Value

  // Tag 3: تاريخ الفاتورة
  const dateStr = receipt.issueDate || '';
  const dateBytes = new TextEncoder().encode(dateStr);
  tlvParts.push(3); // Tag
  tlvParts.push(dateBytes.length); // Length
  tlvParts.push(...dateBytes); // Value

  // Tag 4: الإجمالي شامل الضريبة
  const total = (receipt.totalWithVat || 0).toFixed(2);
  const totalBytes = new TextEncoder().encode(total);
  tlvParts.push(4); // Tag
  tlvParts.push(totalBytes.length); // Length
  tlvParts.push(...totalBytes); // Value

  // Tag 5: مبلغ الضريبة
  const vat = (receipt.vatAmount || 0).toFixed(2);
  const vatBytes = new TextEncoder().encode(vat);
  tlvParts.push(5); // Tag
  tlvParts.push(vatBytes.length); // Length
  tlvParts.push(...vatBytes); // Value

  // تحويل إلى Uint8Array ثم Base64
  const uint8array = new Uint8Array(tlvParts);
  const binaryStr = String.fromCharCode(...uint8array);
  const base64 = btoa(binaryStr);

  return base64;
}
