---
name: pdf-invoice
description: >
  يساعد في إنشاء وتعديل الفواتير والتقارير PDF.
  يُستخدم عند العمل على pdf-service أو كود تصدير الفواتير.
allowed-tools: Read, Grep, Glob
---

عند العمل على PDF:

1. استخدم `jsPDF` الموجود في المشروع (`^4.2.1`) — لا مكتبات جديدة
2. استخدم `html2canvas` (`^1.4.1`) لتحويل HTML إلى صور عند الحاجة
3. الخط يجب أن يدعم العربية (Arabic font embedding)
4. الاتجاه RTL في الفاتورة
5. راجع @INVOICE_TEMPLATE.md لهيكل الفاتورة
6. QR Code إلزامي لفواتير ZATCA
7. الأرقام المالية بدقة هللتان (0.01 SAR)
8. تنسيق التاريخ: هجري + ميلادي

الملفات المعنية:
- `src/core/pdf-service.js` — خدمة PDF الرئيسية
- `src/core/monthly-report-generator.js` — مولد التقارير
- `src/utils/report-to-pdf.js` — تحويل التقرير
