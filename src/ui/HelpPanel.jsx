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
      className="help-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="دليل سريع"
    >
      <div className="help-modal__backdrop" onClick={onClose} />
      <div className="modal-sheet modal-surface help-modal">
        <div className="help-modal__header">
          <div>
            <h3 className="help-modal__section-title--lg">
              الأسئلة الشائعة والمساعدة
            </h3>
            <p className="help-modal__section-desc">
              دليل عملي — بدون تسويق، فقط خطوات واضحة.
            </p>
          </div>
          <button type="button" className="modal-sheet__close" aria-label="إغلاق" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="help-modal__chips">
          {HELP_SECTIONS.map((x) => (
            <button
              key={x.k}
              type="button"
              onClick={() => scrollToSection(x.k)}
              className="btn-secondary"
              style={{
                background: helpSection === x.k ? 'var(--color-info)' : 'transparent',
                color:
                  helpSection === x.k ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                borderColor: helpSection === x.k ? 'var(--color-info)' : 'var(--color-border)',
              }}
              aria-label={x.label}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div className="help-modal__content">
          <div data-help-section="start">
            <div className="help-modal__section-title">كيف أبدأ؟</div>
            <ol className="help-modal__list">
              <li>اذهب إلى: الدفاتر → أنشئ أول دفتر (عقار) وعيّنه كنشط.</li>
              <li>اذهب إلى: الحركات المالية → اضغط (إضافة) وسجّل أول حركة دخل/مصروف.</li>
              <li>
                اذهب إلى: الالتزامات المتكررة → أضف البنود الأساسية (إيجار/كهرباء/صيانة/تسويق...)
              </li>
              <li>استخدم: "سجّل كدفعة الآن" للبنود المهمة حتى يظهر أثرها في التقارير/الأداء.</li>
            </ol>
          </div>

          <div data-help-section="ledgers">
            <div className="help-modal__section-title">الدفاتر</div>
            <div className="help-modal__text-muted">
              الدفتر = مجموعة بيانات مستقلة. استخدمه لفصل مكاتب/جهات مختلفة.
            </div>
            <ul className="help-modal__list">
              <li>عيّن دفتر واحد كنشط حتى تكون التقارير/الالتزامات محسوبة عليه.</li>
              <li>يمكنك تعديل الاسم/الوصف بسهولة من نفس الصفحة.</li>
            </ul>
          </div>

          <div data-help-section="recurring">
            <div className="help-modal__section-title">الالتزامات المتكررة</div>
            <ul className="help-modal__list">
              <li>استخدم "غير مسعّر" عندما يكون مبلغ البند غير واضح بعد.</li>
              <li>المستحقات تساعدك في متابعة: المتأخر/القريب/عالي المخاطر/غير المسعّر.</li>
              <li>زر "سجّل كدفعة الآن" ينشئ حركة مالية (تصنيف: أخرى) ويحدّث سجل البند.</li>
            </ul>
          </div>

          <div data-help-section="reports">
            <div className="help-modal__section-title">التقارير والتصدير CSV</div>
            <ul className="help-modal__list">
              <li>التقارير تُظهر ملخصات مفيدة للمتابعة.</li>
              <li>CSV يخرج "قيم خام" (بدون تنسيق لغة) ومناسب للإكسل.</li>
            </ul>
          </div>

          <div data-help-section="backup">
            <div className="help-modal__section-title">النسخ الاحتياطي والاستعادة</div>
            <ul className="help-modal__list">
              <li>من الإعدادات: تنزيل نسخة احتياطية (JSON).</li>
              <li>من الإعدادات: استعادة من نسخة احتياطية.</li>
              <li>مهم: النسخة الاحتياطية تحميك من حذف بيانات المتصفح.</li>
            </ul>
          </div>

          <div data-help-section="privacy">
            <div className="help-modal__section-title">الخصوصية</div>
            <div className="help-modal__text-muted">
              {isCloud
                ? 'بياناتك محفوظة بأمان في السحابة ومشفّرة. لا يمكن لأحد غيرك الوصول إليها.'
                : 'بياناتك تُحفظ على هذا الجهاز فقط داخل المتصفح. لا يوجد رفع تلقائي للسحابة.'}
            </div>
          </div>
        </div>

        <div className="help-modal__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
          >
            افتح الإعدادات
          </button>
          <button
            type="button"
            className="btn-secondary"
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
