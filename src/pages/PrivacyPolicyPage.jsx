/**
 * سياسة الخصوصية — قيد العقار
 * متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL)
 * آخر تحديث: 1 أبريل 2026
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── مكوّن قسم ─────────────────────────────────────────────────────────────
function Section({ number, title, children }) {
  return (
    <section className="legal__section">
      <h2 className="legal__section-heading">
        <span className="legal__section-number">{number}</span>
        {title}
      </h2>
      <div className="legal__section-body">{children}</div>
    </section>
  );
}

// ─── مكوّن نقطة حق ─────────────────────────────────────────────────────────
function RightItem({ title, desc }) {
  return (
    <div className="legal__right-card">
      <span className="legal__right-check">✓</span>
      <div>
        <strong className="legal__right-title">{title}</strong>
        <span className="legal__right-desc">{desc}</span>
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية ────────────────────────────────────────────────────────
export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'سياسة الخصوصية — قيد العقار';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      document.title = 'قيد العقار';
    };
  }, []);

  return (
    <div dir="rtl" className="legal-page">
      {/* شريط العودة */}
      <div className="legal__nav">
        <button type="button" onClick={() => navigate(-1)} className="legal__back-btn">
          ← رجوع
        </button>
        <span className="legal__nav-title">سياسة الخصوصية</span>
      </div>

      {/* المحتوى */}
      <div className="legal__content">
        {/* الترويسة */}
        <header className="legal__header">
          <div className="legal__header-icon">🔒</div>
          <h1 className="legal__header-title">سياسة الخصوصية</h1>
          <p className="legal__header-subtitle">قيد العقار — إلكسار الرقمية</p>
          <div className="legal__header-badge">آخر تحديث: 1 أبريل 2026</div>
        </header>

        {/* إشعار PDPL */}
        <div className="legal__notice legal__notice--success">
          <span className="legal__notice-icon">🇸🇦</span>
          <p className="legal__notice-text">
            هذه السياسة متوافقة مع <strong>نظام حماية البيانات الشخصية السعودي (PDPL)</strong> الصادر
            بالمرسوم الملكي رقم م/19 وتعديلاته. نلتزم بحماية خصوصيتك وفق أعلى المعايير.
          </p>
        </div>

        {/* القسم 1 */}
        <Section number="1" title="من نحن">
          <p>
            <strong>إلكسار الرقمية</strong> (سجل تجاري: 7008837028)، شركة سعودية مقرها بريدة، منطقة
            القصيم، المملكة العربية السعودية. نُقدّم منصة{' '}
            <strong>قيد العقار</strong> — أداة متخصصة لإدارة التدفقات المالية العقارية، مُصمَّمة
            خصيصاً للمكاتب العقارية الصغيرة والمستثمرين الأفراد في المملكة العربية السعودية.
          </p>
          <p>
            يُتيح التطبيق تتبُّع الإيرادات والمصروفات، وإدارة العقود والمستأجرين، ومتابعة العمولات،
            وإصدار التقارير المالية، كل ذلك بواجهة عربية كاملة.
          </p>
          <p>
            للتواصل: <a href="mailto:support@qaydalaqar.com" className="legal__link">support@qaydalaqar.com</a>
          </p>
        </Section>

        {/* القسم 2 */}
        <Section number="2" title="البيانات التي نجمعها">
          <p style={{ marginBottom: '1rem' }}>نجمع الفئات التالية من البيانات الشخصية:</p>

          <div className="legal__data-grid">
            {[
              {
                icon: '👤',
                title: 'بيانات الحساب',
                desc: 'الاسم الكامل، عنوان البريد الإلكتروني، كلمة المرور (مشفّرة ولا نطّلع عليها)، ودور المستخدم (مالك مكتب، مدير، وكيل).',
              },
              {
                icon: '🏢',
                title: 'بيانات العمل والعقارات',
                desc: 'معلومات العقارات (الموقع، النوع، القيمة)، بيانات العقود، وبيانات المستأجرين والعملاء التي تُدخلها بنفسك.',
              },
              {
                icon: '💰',
                title: 'البيانات المالية',
                desc: 'سجلات الإيرادات والمصروفات، المعاملات المالية، وبيانات العمولات — جميعها مُدخَلة من قِبلك مباشرةً.',
              },
              {
                icon: '🔧',
                title: 'بيانات الاستخدام التقنية',
                desc: 'بيانات الجلسة وسجلات تسجيل الدخول لأغراض الأمن والحماية من وصول غير مصرّح.',
              },
            ].map((item) => (
              <div key={item.title} className="legal__data-card">
                <span className="legal__data-icon">{item.icon}</span>
                <div>
                  <strong className="legal__data-title">{item.title}</strong>
                  <span className="legal__data-desc">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* القسم 3 */}
        <Section number="3" title="أغراض معالجة البيانات">
          <p style={{ marginBottom: '0.75rem' }}>نعالج بياناتك للأغراض التالية حصراً:</p>
          <ul className="legal__list">
            {[
              'تقديم خدمات المنصة وتشغيلها وصيانتها.',
              'التحقق من هويتك وحماية حسابك من الوصول غير المصرح به.',
              'تحسين تجربة الاستخدام وتطوير ميزات جديدة بناءً على أنماط الاستخدام المجهولة الهوية.',
              'تقديم الدعم الفني عند الحاجة.',
              'الامتثال للمتطلبات النظامية والقانونية في المملكة العربية السعودية.',
              'إرسال الإشعارات التقنية الضرورية المتعلقة بالخدمة (ليس للتسويق دون إذن).',
            ].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Section>

        {/* القسم 4 */}
        <Section number="4" title="الأساس القانوني للمعالجة">
          <p style={{ marginBottom: '0.75rem' }}>
            نستند في معالجة بياناتك إلى الأسس القانونية الآتية وفق <strong>نظام حماية البيانات
            الشخصية (PDPL) — المادة السادسة</strong>:
          </p>
          <div className="legal__basis-grid">
            <div className="legal__basis-card">
              <strong className="legal__basis-title">موافقة صريحة</strong>
              <p className="legal__basis-desc">
                عند إنشاء حسابك، فإنك توافق صراحةً على جمع بياناتك الشخصية ومعالجتها وفق هذه السياسة.
                يمكنك سحب موافقتك في أي وقت عبر التواصل معنا.
              </p>
            </div>
            <div className="legal__basis-card">
              <strong className="legal__basis-title">تنفيذ العقد</strong>
              <p className="legal__basis-desc">
                بعض البيانات ضرورية لتقديم الخدمة التي اشتركت فيها ولا يمكن تقديمها بدونها.
              </p>
            </div>
            <div className="legal__basis-card">
              <strong className="legal__basis-title">المصلحة المشروعة</strong>
              <p className="legal__basis-desc">
                تحسين أمن المنصة وتطوير الخدمة بما لا يتعارض مع مصالحك أو حقوقك.
              </p>
            </div>
          </div>
        </Section>

        {/* القسم 5 */}
        <Section number="5" title="نقل البيانات خارج المملكة العربية السعودية">
          <div className="legal__notice legal__notice--warning">
            <span className="legal__notice-icon" style={{ fontSize: '1.1rem' }}>⚠️</span>
            <p className="legal__notice-text">
              <strong>إفصاح مهم:</strong> يستخدم تطبيق قيد العقار خدمة{' '}
              <strong>Supabase</strong> لتخزين البيانات وإدارة المصادقة. قد تُخزَّن بياناتك على
              خوادم تقع خارج حدود المملكة العربية السعودية.
            </p>
          </div>
          <p style={{ marginBottom: '0.75rem' }}>
            نتخذ الإجراءات التالية لضمان الحماية الكافية عند النقل:
          </p>
          <ul className="legal__list">
            <li>تشفير جميع البيانات أثناء النقل باستخدام بروتوكول TLS 1.3.</li>
            <li>تطبيق سياسات أمن الصفوف (RLS) لعزل بيانات كل مكتب عن غيره.</li>
            <li>
              التعامل حصراً مع Supabase Inc. التي تلتزم بمعايير حماية البيانات الدولية
              (ISO 27001 وSOC 2 Type II).
            </li>
            <li>عدم مشاركة بياناتك مع أي طرف ثالث آخر دون إذنك الصريح.</li>
          </ul>
          <p className="legal__footnote legal__footnote--muted">
            يُعدّ استمرارك في استخدام المنصة بعد الاطلاع على هذه السياسة موافقةً ضمنية على نقل
            بياناتك للخارج وفق الضمانات المذكورة.
          </p>
        </Section>

        {/* القسم 6 */}
        <Section number="6" title="حقوق صاحب البيانات">
          <p style={{ marginBottom: '1rem' }}>
            وفق نظام حماية البيانات الشخصية السعودي (المواد 13–18)، تتمتع بالحقوق التالية:
          </p>
          <div className="legal__data-grid">
            <RightItem title="حق الوصول" desc="طلب نسخة من بياناتك الشخصية التي نحتفظ بها." />
            <RightItem title="حق التصحيح" desc="تصحيح أي بيانات غير دقيقة أو غير مكتملة." />
            <RightItem title="حق الحذف" desc="طلب حذف بياناتك نهائياً من أنظمتنا (الحق في النسيان)." />
            <RightItem title="حق الاعتراض" desc="الاعتراض على معالجة بياناتك في حالات معينة." />
            <RightItem title="حق نقل البيانات" desc="استلام بياناتك بصيغة قابلة للقراءة الآلية." />
            <RightItem title="حق سحب الموافقة" desc="سحب موافقتك على المعالجة في أي وقت دون أثر رجعي." />
          </div>
          <p className="legal__footnote">
            لممارسة أي من هذه الحقوق، راسلنا على:{' '}
            <a href="mailto:support@qaydalaqar.com" className="legal__link">
              support@qaydalaqar.com
            </a>
            {' '}مع ذكر طبيعة طلبك. سنرد خلال <strong>15 يوم عمل</strong>.
          </p>
        </Section>

        {/* القسم 7 */}
        <Section number="7" title="مدة الاحتفاظ بالبيانات">
          <ul className="legal__list">
            <li>
              <strong>بيانات الحساب:</strong> طوال فترة الاشتراك النشط، ولمدة لا تتجاوز{' '}
              <strong>سنتين</strong> بعد انتهاء الترخيص أو طلب الحذف — أيهما أسبق.
            </li>
            <li>
              <strong>البيانات المالية والعقارية:</strong> محتفظ بها طوال نشاط الحساب؛ تُحذف
              فور تنفيذ طلب الحذف باستثناء ما يُلزم نظام المحاسبة السعودي بالاحتفاظ به.
            </li>
            <li>
              <strong>سجلات الأمن:</strong> تُحتفظ بها لمدة <strong>90 يوماً</strong> لأغراض
              الحماية والتحقيق في الحوادث الأمنية.
            </li>
            <li>
              <strong>النسخ الاحتياطية:</strong> تُحتفظ بها لمدة لا تتجاوز <strong>30 يوماً</strong>
              {' '}ثم تُحذف تلقائياً.
            </li>
          </ul>
        </Section>

        {/* القسم 8 */}
        <Section number="8" title="أمن البيانات">
          <p style={{ marginBottom: '0.75rem' }}>
            نتخذ إجراءات تقنية وتنظيمية صارمة لحماية بياناتك:
          </p>
          <ul className="legal__list">
            <li>تشفير البيانات أثناء النقل بـ TLS 1.3 وأثناء التخزين بـ AES-256.</li>
            <li>
              تطبيق سياسة أمن الصفوف (Row-Level Security) على كل الجداول — كل مكتب يرى
              بياناته فقط.
            </li>
            <li>المصادقة الآمنة عبر Supabase Auth مع حماية ضد هجمات القوة الغاشمة.</li>
            <li>لا نخزن كلمات المرور — تُعالَج عبر بروتوكول bcrypt المشفّر.</li>
            <li>مراجعة أمنية دورية وتحديث التبعيات لمعالجة الثغرات.</li>
            <li>الحد من الوصول الداخلي — يصل للبيانات فقط من يحتاجها لتقديم الخدمة.</li>
          </ul>
          <p className="legal__footnote">
            في حال اكتشاف اختراق أمني يؤثر على بياناتك، سنُخطرك فوراً وفق متطلبات PDPL.
          </p>
        </Section>

        {/* القسم 9 */}
        <Section number="9" title="ملفات تعريف الارتباط (Cookies)">
          <p>
            يستخدم تطبيق قيد العقار <strong>ملفات جلسة تقنية ضرورية فقط</strong> للحفاظ على
            حالة تسجيل دخولك وضبط التفضيلات (مثل اللغة والثيم). لا نستخدم أي ملفات تتبع
            تسويقية أو تحليلية من أطراف ثالثة.
          </p>
          <p>
            ملفات الجلسة هذه ضرورية لعمل التطبيق ولا يمكن تعطيلها.
          </p>
        </Section>

        {/* القسم 10 */}
        <Section number="10" title="التعديلات على هذه السياسة">
          <p>
            نحتفظ بحق تعديل هذه السياسة عند الضرورة. في حال إجراء تغييرات جوهرية، سنُخطرك
            بإحدى الوسيلتين:
          </p>
          <ul className="legal__list legal__list--tight" style={{ marginTop: '0.5rem' }}>
            <li>إشعار داخل التطبيق عند تسجيل الدخول.</li>
            <li>إرسال بريد إلكتروني إلى العنوان المسجّل لديك.</li>
          </ul>
          <p>
            يُعدّ استمرارك في استخدام المنصة بعد سريان التعديلات موافقةً عليها. إذا رفضت
            التعديلات، يحق لك طلب حذف حسابك.
          </p>
        </Section>

        {/* القسم 11 */}
        <Section number="11" title="التواصل وتقديم الشكاوى">
          <div className="legal__contact-card">
            <p className="legal__contact-title">مسؤول حماية البيانات — إلكسار الرقمية</p>
            <div className="legal__contact-grid">
              <div className="legal__contact-row">
                <span>📧</span>
                <a href="mailto:support@qaydalaqar.com" className="legal__link">
                  support@qaydalaqar.com
                </a>
              </div>
              <div className="legal__contact-row">
                <span>📍</span>
                <span>بريدة، منطقة القصيم، المملكة العربية السعودية</span>
              </div>
              <div className="legal__contact-row">
                <span>🏢</span>
                <span>سجل تجاري: 7008837028</span>
              </div>
            </div>
          </div>
          <p className="legal__footnote">
            نلتزم بالرد على استفساراتك وشكاواك المتعلقة بالبيانات الشخصية خلال{' '}
            <strong>15 يوم عمل</strong>.
          </p>
        </Section>

        {/* القسم 12 */}
        <Section number="12" title="الجهة المختصة بالرقابة">
          <p>
            إذا رأيت أن معالجتنا لبياناتك الشخصية تنتهك أحكام نظام حماية البيانات الشخصية
            السعودي، يحق لك التقدم بشكوى إلى الجهة الرقابية المختصة:
          </p>
          <div className="legal__authority-card">
            <strong className="legal__authority-name">
              الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)
            </strong>
            <div className="legal__authority-details">
              <span>🌐 pdpregulations.saudidataai.gov.sa</span>
              <span>📞 920033360</span>
            </div>
          </div>
        </Section>

        {/* ذيل الصفحة */}
        <footer className="legal__footer">
          <p>© 2024–2026 إلكسار الرقمية. جميع الحقوق محفوظة.</p>
          <p>
            للاطلاع على شروط الاستخدام،{' '}
            <a href="/terms" className="legal__link">اضغط هنا</a>.
          </p>
        </footer>
      </div>
    </div>
  );
}
