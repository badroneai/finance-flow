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
    <section style={{ marginBottom: '2rem' }}>
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.75rem',
            height: '1.75rem',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        {title}
      </h2>
      <div
        style={{
          color: 'var(--color-text-secondary)',
          lineHeight: 1.9,
          fontSize: '0.9375rem',
        }}
      >
        {children}
      </div>
    </section>
  );
}

// ─── مكوّن نقطة حق ─────────────────────────────────────────────────────────
function RightItem({ title, desc }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        marginBottom: '0.5rem',
      }}
    >
      <span style={{ color: 'var(--color-success)', fontWeight: 700, flexShrink: 0 }}>✓</span>
      <div>
        <strong style={{ color: 'var(--color-text)', display: 'block', marginBottom: '0.15rem' }}>
          {title}
        </strong>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{desc}</span>
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
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        fontFamily: '"IBM Plex Sans Arabic", Tahoma, Arial, sans-serif',
        color: 'var(--color-text)',
      }}
    >
      {/* شريط العودة */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '0.375rem 0.875rem',
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          ← رجوع
        </button>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          سياسة الخصوصية
        </span>
      </div>

      {/* المحتوى */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem 1.5rem 4rem',
        }}
      >
        {/* الترويسة */}
        <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '16px',
              background: 'var(--color-primary)',
              marginBottom: '1rem',
              fontSize: '1.5rem',
            }}
          >
            🔒
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '0.5rem',
            }}
          >
            سياسة الخصوصية
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            قيد العقار — إلكسار الرقمية
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: '0.75rem',
              padding: '0.375rem 1rem',
              borderRadius: '20px',
              background: 'var(--color-info-bg)',
              color: 'var(--color-info)',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            آخر تحديث: 1 أبريل 2026
          </div>
        </header>

        {/* إشعار PDPL */}
        <div
          style={{
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🇸🇦</span>
          <p style={{ color: 'var(--color-text)', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
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
          <p style={{ marginTop: '0.75rem' }}>
            يُتيح التطبيق تتبُّع الإيرادات والمصروفات، وإدارة العقود والمستأجرين، ومتابعة العمولات،
            وإصدار التقارير المالية، كل ذلك بواجهة عربية كاملة.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            للتواصل: <a href="mailto:support@qaydalaqar.com" style={{ color: 'var(--color-primary)' }}>support@qaydalaqar.com</a>
          </p>
        </Section>

        {/* القسم 2 */}
        <Section number="2" title="البيانات التي نجمعها">
          <p style={{ marginBottom: '1rem' }}>نجمع الفئات التالية من البيانات الشخصية:</p>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
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
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
                    {item.title}
                  </strong>
                  <span style={{ fontSize: '0.875rem' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* القسم 3 */}
        <Section number="3" title="أغراض معالجة البيانات">
          <p style={{ marginBottom: '0.75rem' }}>نعالج بياناتك للأغراض التالية حصراً:</p>
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            {[
              'تقديم خدمات المنصة وتشغيلها وصيانتها.',
              'التحقق من هويتك وحماية حسابك من الوصول غير المصرح به.',
              'تحسين تجربة الاستخدام وتطوير ميزات جديدة بناءً على أنماط الاستخدام المجهولة الهوية.',
              'تقديم الدعم الفني عند الحاجة.',
              'الامتثال للمتطلبات النظامية والقانونية في المملكة العربية السعودية.',
              'إرسال الإشعارات التقنية الضرورية المتعلقة بالخدمة (ليس للتسويق دون إذن).',
            ].map((item, i) => (
              <li key={i} style={{ color: 'var(--color-text-secondary)' }}>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* القسم 4 */}
        <Section number="4" title="الأساس القانوني للمعالجة">
          <p style={{ marginBottom: '0.75rem' }}>
            نستند في معالجة بياناتك إلى الأسس القانونية الآتية وفق <strong>نظام حماية البيانات
            الشخصية (PDPL) — المادة السادسة</strong>:
          </p>
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <strong style={{ color: 'var(--color-text)' }}>موافقة صريحة</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                عند إنشاء حسابك، فإنك توافق صراحةً على جمع بياناتك الشخصية ومعالجتها وفق هذه السياسة.
                يمكنك سحب موافقتك في أي وقت عبر التواصل معنا.
              </p>
            </div>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <strong style={{ color: 'var(--color-text)' }}>تنفيذ العقد</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                بعض البيانات ضرورية لتقديم الخدمة التي اشتركت فيها ولا يمكن تقديمها بدونها.
              </p>
            </div>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <strong style={{ color: 'var(--color-text)' }}>المصلحة المشروعة</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                تحسين أمن المنصة وتطوير الخدمة بما لا يتعارض مع مصالحك أو حقوقك.
              </p>
            </div>
          </div>
        </Section>

        {/* القسم 5 */}
        <Section number="5" title="نقل البيانات خارج المملكة العربية السعودية">
          <div
            style={{
              background: 'var(--color-warning-bg, #FEF9E7)',
              border: '1px solid var(--color-warning, #F39C12)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7 }}>
              <strong>إفصاح مهم:</strong> يستخدم تطبيق قيد العقار خدمة{' '}
              <strong>Supabase</strong> لتخزين البيانات وإدارة المصادقة. قد تُخزَّن بياناتك على
              خوادم تقع خارج حدود المملكة العربية السعودية.
            </p>
          </div>
          <p style={{ marginBottom: '0.75rem' }}>
            نتخذ الإجراءات التالية لضمان الحماية الكافية عند النقل:
          </p>
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            <li>تشفير جميع البيانات أثناء النقل باستخدام بروتوكول TLS 1.3.</li>
            <li>تطبيق سياسات أمن الصفوف (RLS) لعزل بيانات كل مكتب عن غيره.</li>
            <li>
              التعامل حصراً مع Supabase Inc. التي تلتزم بمعايير حماية البيانات الدولية
              (ISO 27001 وSOC 2 Type II).
            </li>
            <li>عدم مشاركة بياناتك مع أي طرف ثالث آخر دون إذنك الصريح.</li>
          </ul>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            يُعدّ استمرارك في استخدام المنصة بعد الاطلاع على هذه السياسة موافقةً ضمنية على نقل
            بياناتك للخارج وفق الضمانات المذكورة.
          </p>
        </Section>

        {/* القسم 6 */}
        <Section number="6" title="حقوق صاحب البيانات">
          <p style={{ marginBottom: '1rem' }}>
            وفق نظام حماية البيانات الشخصية السعودي (المواد 13–18)، تتمتع بالحقوق التالية:
          </p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <RightItem title="حق الوصول" desc="طلب نسخة من بياناتك الشخصية التي نحتفظ بها." />
            <RightItem title="حق التصحيح" desc="تصحيح أي بيانات غير دقيقة أو غير مكتملة." />
            <RightItem title="حق الحذف" desc="طلب حذف بياناتك نهائياً من أنظمتنا (الحق في النسيان)." />
            <RightItem title="حق الاعتراض" desc="الاعتراض على معالجة بياناتك في حالات معينة." />
            <RightItem title="حق نقل البيانات" desc="استلام بياناتك بصيغة قابلة للقراءة الآلية." />
            <RightItem title="حق سحب الموافقة" desc="سحب موافقتك على المعالجة في أي وقت دون أثر رجعي." />
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            لممارسة أي من هذه الحقوق، راسلنا على:{' '}
            <a href="mailto:support@qaydalaqar.com" style={{ color: 'var(--color-primary)' }}>
              support@qaydalaqar.com
            </a>
            {' '}مع ذكر طبيعة طلبك. سنرد خلال <strong>15 يوم عمل</strong>.
          </p>
        </Section>

        {/* القسم 7 */}
        <Section number="7" title="مدة الاحتفاظ بالبيانات">
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
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
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
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
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
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
          <p style={{ marginTop: '0.75rem' }}>
            ملفات الجلسة هذه ضرورية لعمل التطبيق ولا يمكن تعطيلها.
          </p>
        </Section>

        {/* القسم 10 */}
        <Section number="10" title="التعديلات على هذه السياسة">
          <p>
            نحتفظ بحق تعديل هذه السياسة عند الضرورة. في حال إجراء تغييرات جوهرية، سنُخطرك
            بإحدى الوسيلتين:
          </p>
          <ul style={{ paddingRight: '1.25rem', marginTop: '0.5rem', display: 'grid', gap: '0.375rem' }}>
            <li>إشعار داخل التطبيق عند تسجيل الدخول.</li>
            <li>إرسال بريد إلكتروني إلى العنوان المسجّل لديك.</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            يُعدّ استمرارك في استخدام المنصة بعد سريان التعديلات موافقةً عليها. إذا رفضت
            التعديلات، يحق لك طلب حذف حسابك.
          </p>
        </Section>

        {/* القسم 11 */}
        <Section number="11" title="التواصل وتقديم الشكاوى">
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
              مسؤول حماية البيانات — إلكسار الرقمية
            </p>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span>📧</span>
                <a href="mailto:support@qaydalaqar.com" style={{ color: 'var(--color-primary)' }}>
                  support@qaydalaqar.com
                </a>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span>📍</span>
                <span>بريدة، منطقة القصيم، المملكة العربية السعودية</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span>🏢</span>
                <span>سجل تجاري: 7008837028</span>
              </div>
            </div>
          </div>
          <p style={{ marginTop: '0.875rem', fontSize: '0.875rem' }}>
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
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              marginTop: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.375rem', color: 'var(--color-text)' }}>
              الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)
            </strong>
            <div style={{ display: 'grid', gap: '0.25rem', color: 'var(--color-text-secondary)' }}>
              <span>🌐 pdpregulations.saudidataai.gov.sa</span>
              <span>📞 920033360</span>
            </div>
          </div>
        </Section>

        {/* ذيل الصفحة */}
        <footer
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: '0.8125rem',
          }}
        >
          <p>© 2024–2026 إلكسار الرقمية. جميع الحقوق محفوظة.</p>
          <p style={{ marginTop: '0.375rem' }}>
            للاطلاع على شروط الاستخدام،{' '}
            <a href="/terms" style={{ color: 'var(--color-primary)' }}>
              اضغط هنا
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
