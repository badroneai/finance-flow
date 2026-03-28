import React from 'react';
import { useData } from '../contexts/DataContext.jsx';

const HELP_SECTIONS = [
  { k: 'start', label: 'كيف أبدأ؟' },
  { k: 'ledgers', label: 'الدفاتر' },
  { k: 'recurring', label: 'الالتزامات المتكررة' },
  { k: 'reports', label: 'التقارير + CSV' },
  { k: 'backup', label: 'النسخ الاحتياطي' },
  { k: 'privacy', label: 'الخصوصية' },
];

/**
 * HelpPanel — دليل سريع مكوّن منفصل.
 * Props: helpSection, setHelpSection, onClose, onOpenSettings (optional)
 *
 * SPR-008: نصوص عربية بالكامل + رسالة الخصوصية ديناميكية حسب وضع التخزين.
 */
export function HelpPanel({ helpSection, setHelpSection, onClose, onOpenSettings }) {
  let isCloud = false;
  try {
    const data = useData();
    isCloud = !!data?.isCloudMode;
  } catch {
    // خارج DataProvider — الافتراضي محلي
  }

  const scrollToSection = (k) => {
    setHelpSection(k);
    setTimeout(() => {
      const el = document.querySelector(`[data-help-section="${k}"]`);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="دليل سريع"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border p-5 shadow-lg"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold" style={{ margin: 0 }}>
              الأسئلة الشائعة والمساعدة
            </h3>
            <p className="text-sm" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
              دليل عملي — بدون تسويق، فقط خطوات واضحة.
            </p>
          </div>
          <button
            type="button"
            className="text-sm"
            style={{ color: 'var(--color-muted)' }}
            aria-label="إغلاق"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {HELP_SECTIONS.map((x) => (
            <button
              key={x.k}
              type="button"
              onClick={() => scrollToSection(x.k)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                background: helpSection === x.k ? 'var(--color-info)' : 'transparent',
                color: helpSection === x.k ? 'white' : 'var(--color-text)',
                borderColor: helpSection === x.k ? 'var(--color-info)' : 'var(--color-border)',
              }}
              aria-label={x.label}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4 text-sm" style={{ color: 'var(--color-text)' }}>
          <div data-help-section="start">
            <div className="font-semibold">كيف أبدأ؟</div>
            <ol
              style={{
                color: 'var(--color-muted)',
                marginTop: '0.4rem',
                paddingInlineStart: '1.2rem',
              }}
            >
              <li>اذهب إلى: الدفاتر → أنشئ أول دفتر (عقار) وعيّنه كنشط.</li>
              <li>اذهب إلى: الحركات المالية → اضغط (إضافة) وسجّل أول حركة دخل/مصروف.</li>
              <li>
                اذهب إلى: الالتزامات المتكررة → أضف البنود الأساسية (إيجار/كهرباء/صيانة/تسويق...)
              </li>
              <li>استخدم: "سجّل كدفعة الآن" للبنود المهمة حتى يظهر أثرها في التقارير/الأداء.</li>
            </ol>
          </div>

          <div data-help-section="ledgers">
            <div className="font-semibold">الدفاتر</div>
            <div style={{ color: 'var(--color-muted)' }}>
              الدفتر = مجموعة بيانات مستقلة. استخدمه لفصل مكاتب/جهات مختلفة.
            </div>
            <ul
              style={{
                color: 'var(--color-muted)',
                marginTop: '0.4rem',
                paddingInlineStart: '1.2rem',
              }}
            >
              <li>عيّن دفتر واحد كنشط حتى تكون التقارير/الالتزامات محسوبة عليه.</li>
              <li>يمكنك تعديل الاسم/الوصف بسهولة من نفس الصفحة.</li>
            </ul>
          </div>

          <div data-help-section="recurring">
            <div className="font-semibold">الالتزامات المتكررة</div>
            <ul
              style={{
                color: 'var(--color-muted)',
                marginTop: '0.4rem',
                paddingInlineStart: '1.2rem',
              }}
            >
              <li>استخدم "غير مسعّر" عندما يكون مبلغ البند غير واضح بعد.</li>
              <li>المستحقات تساعدك في متابعة: المتأخر/القريب/عالي المخاطر/غير المسعّر.</li>
              <li>زر "سجّل كدفعة الآن" ينشئ حركة مالية (تصنيف: أخرى) ويحدّث سجل البند.</li>
            </ul>
          </div>

          <div data-help-section="reports">
            <div className="font-semibold">التقارير والتصدير CSV</div>
            <ul
              style={{
                color: 'var(--color-muted)',
                marginTop: '0.4rem',
                paddingInlineStart: '1.2rem',
              }}
            >
              <li>التقارير تُظهر ملخصات مفيدة للمتابعة.</li>
              <li>CSV يخرج "قيم خام" (بدون تنسيق لغة) ومناسب للإكسل.</li>
            </ul>
          </div>

          <div data-help-section="backup">
            <div className="font-semibold">النسخ الاحتياطي والاستعادة</div>
            <ul
              style={{
                color: 'var(--color-muted)',
                marginTop: '0.4rem',
                paddingInlineStart: '1.2rem',
              }}
            >
              <li>من الإعدادات: تنزيل نسخة احتياطية (JSON).</li>
              <li>من الإعدادات: استعادة من نسخة احتياطية.</li>
              <li>مهم: النسخة الاحتياطية تحميك من حذف بيانات المتصفح.</li>
            </ul>
          </div>

          <div data-help-section="privacy">
            <div className="font-semibold">الخصوصية</div>
            <div style={{ color: 'var(--color-muted)' }}>
              {isCloud
                ? 'بياناتك محفوظة بأمان في السحابة ومشفّرة. لا يمكن لأحد غيرك الوصول إليها.'
                : 'بياناتك تُحفظ على هذا الجهاز فقط داخل المتصفح. لا يوجد رفع تلقائي للسحابة.'}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
          >
            افتح الإعدادات
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            onClick={() => scrollToSection('backup')}
          >
            فتح ملف النسخ الاحتياطي
          </button>
          {/* Help contact intentionally omitted (local-first app). */}
        </div>
      </div>
    </div>
  );
}

export default HelpPanel;
