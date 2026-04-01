/**
 * شروط الاستخدام — قيد العقار
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

// ─── مكوّن بطاقة الباقة ────────────────────────────────────────────────────
function PlanCard({ name, price, features, highlighted }) {
  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        background: highlighted ? 'var(--color-primary)' : 'var(--color-bg)',
        border: highlighted
          ? '2px solid var(--color-primary)'
          : '1px solid var(--color-border)',
        color: highlighted ? '#fff' : 'var(--color-text)',
        position: 'relative',
      }}
    >
      {highlighted && (
        <span
          style={{
            position: 'absolute',
            top: '-0.6rem',
            right: '1rem',
            background: '#F59E0B',
            color: '#fff',
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '0.125rem 0.625rem',
            borderRadius: '20px',
          }}
        >
          ⭐ الأكثر طلباً
        </span>
      )}
      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{name}</div>
      <div
        style={{
          fontSize: '1.375rem',
          fontWeight: 800,
          marginBottom: '0.75rem',
          color: highlighted ? '#FCD34D' : 'var(--color-text)',
        }}
      >
        {price}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 400,
            opacity: 0.8,
            marginRight: '0.25rem',
          }}
        >
          {' '}ر.س — مرة واحدة
        </span>
      </div>
      <ul style={{ paddingRight: '1.125rem', display: 'grid', gap: '0.25rem' }}>
        {features.map((f, i) => (
          <li key={i} style={{ fontSize: '0.8125rem', opacity: highlighted ? 0.95 : 0.85 }}>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── الصفحة الرئيسية ────────────────────────────────────────────────────────
export default function TermsOfServicePage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'شروط الاستخدام — قيد العقار';
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
          شروط الاستخدام
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
            📋
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '0.5rem',
            }}
          >
            شروط الاستخدام
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

        {/* إشعار قبول */}
        <div
          style={{
            background: 'var(--color-info-bg)',
            border: '1px solid var(--color-info)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
          <p style={{ color: 'var(--color-text)', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
            باستخدامك منصة قيد العقار أو شرائك أي من باقاتها، فإنك تُقرّ بقراءة هذه الشروط
            وفهمها والموافقة على الالتزام بها كاملةً. إذا كنت لا توافق على أي بند، يُرجى
            الامتناع عن استخدام المنصة والتواصل معنا.
          </p>
        </div>

        {/* القسم 1 */}
        <Section number="1" title="التعريفات">
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {[
              { term: 'المنصة', def: 'تطبيق قيد العقار بجميع إصداراته، الويب والجوال.' },
              {
                term: 'مزوّد الخدمة',
                def: 'إلكسار الرقمية، سجل تجاري 7008837028، بريدة، القصيم، المملكة العربية السعودية.',
              },
              {
                term: 'المستخدم / المرخَّص له',
                def: 'الشخص الطبيعي أو الاعتباري الذي يحصل على ترخيص استخدام المنصة.',
              },
              {
                term: 'الترخيص',
                def: 'حق الاستخدام المحدود وغير الحصري وغير القابل للنقل المُمنوح بموجب هذه الشروط.',
              },
              {
                term: 'المحتوى',
                def: 'جميع البيانات والمعلومات التي يُدخلها المستخدم في المنصة.',
              },
            ].map(({ term, def }) => (
              <div
                key={term}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: '0.75rem',
                }}
              >
                <strong
                  style={{
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                    minWidth: '5.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {term}:
                </strong>
                <span style={{ fontSize: '0.875rem' }}>{def}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* القسم 2 */}
        <Section number="2" title="طبيعة الخدمة">
          <p>
            منصة قيد العقار هي <strong>أداة برمجية لإدارة التدفقات المالية العقارية</strong>،
            تُساعد على تتبع الإيرادات والمصروفات وإدارة العقود والمستأجرين وإصدار التقارير.
          </p>
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              background: 'var(--color-warning-bg, #FEF9E7)',
              border: '1px solid var(--color-warning, #F39C12)',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.375rem' }}>⚠️ تنبيه مهم:</strong>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              المنصة <strong>ليست بديلاً عن الاستشارة المالية أو القانونية أو المحاسبية
              المتخصصة</strong>. المعلومات والتقارير المُولَّدة هي أدوات مساعدة للمستخدم فقط،
              ولا تُشكّل مشورةً مهنيةً ملزِمة. يتحمل المستخدم كامل المسؤولية عن قراراته المالية.
            </p>
          </div>
        </Section>

        {/* القسم 3 */}
        <Section number="3" title="الترخيص وشروطه">
          <p style={{ marginBottom: '0.75rem' }}>
            يمنحك مزوّد الخدمة ترخيصاً{' '}
            <strong>محدوداً، غير حصري، غير قابل للتحويل</strong>، لاستخدام المنصة على عدد
            الأجهزة المحدّد في الباقة المشتراة، وفق الشروط التالية:
          </p>
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            <li>الترخيص للمكتب أو الشخص المُسجَّل وليس قابلاً للنقل لطرف ثالث.</li>
            <li>لا يحق إعادة بيع الترخيص أو توزيعه أو منحه للغير.</li>
            <li>الترخيص للاستخدام التشغيلي فقط — لا يُجيز الاطلاع على الكود المصدري.</li>
            <li>تنتهي صلاحية الترخيص عند انتهاء المدة المُتفَق عليها أو في حالات الإنهاء المبيّنة أدناه.</li>
          </ul>
        </Section>

        {/* القسم 4 */}
        <Section number="4" title="الباقات والأسعار">
          <p style={{ marginBottom: '1.25rem' }}>
            تُقدَّم المنصة بثلاث باقات بدفعة واحدة (ليس اشتراكاً شهرياً):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <PlanCard
              name="الباقة الأساسية"
              price="399"
              features={[
                'ملف التطبيق + التوثيق',
                'دليل التثبيت والتشغيل',
                'استخدام على جهازَين',
                'بدون دعم فني مضمون',
              ]}
            />
            <PlanCard
              name="الباقة الاحترافية"
              price="899"
              highlighted
              features={[
                'كل مزايا الأساسية',
                'دعم بالبريد 12 شهراً',
                'تحديثات مجانية لسنة',
                'ضمان الاستجابة خلال 72 ساعة',
              ]}
            />
            <PlanCard
              name="الباقة المؤسسية"
              price="1,499"
              features={[
                'كل مزايا الاحترافية',
                'دعم واتساب لمدة محددة',
                'جلسة إعداد واحدة',
                'تخصيص بسيط عند التسليم',
                'تحديثات لسنتين',
              ]}
            />
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            * الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة 15%. قد تتغير الأسعار للباقات
            الجديدة مستقبلاً دون المساس بحقوق من اشتروا مسبقاً.
          </p>
        </Section>

        {/* القسم 5 */}
        <Section number="5" title="سياسة الاسترجاع">
          <div
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem',
              display: 'flex',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🛡️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
                ضمان استرجاع 14 يوماً
              </strong>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                إذا لم تكن راضياً عن المنصة لأي سبب، يحق لك طلب استرداد كامل المبلغ خلال{' '}
                <strong>14 يوم تقويمي</strong> من تاريخ الشراء.
              </p>
            </div>
          </div>
          <p style={{ marginBottom: '0.75rem' }}>شروط الاسترجاع:</p>
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            <li>يجب تقديم طلب الاسترجاع قبل انتهاء مدة الـ 14 يوماً عبر البريد الإلكتروني.</li>
            <li>لا يُشترط تقديم مبرر للاسترجاع خلال هذه المدة.</li>
            <li>
              بعد انتهاء مدة الـ 14 يوماً، لا يُقبل الاسترجاع إلا في حالة عيب جوهري مثبت في
              المنتج يمنع استخدامه للغرض المقصود.
            </li>
            <li>تُعالَج المبالغ المستردّة خلال 7 أيام عمل.</li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            للطلب:{' '}
            <a href="mailto:support@qaydalaqar.com" style={{ color: 'var(--color-primary)' }}>
              support@qaydalaqar.com
            </a>
          </p>
        </Section>

        {/* القسم 6 */}
        <Section number="6" title="التزامات المستخدم">
          <p style={{ marginBottom: '0.75rem' }}>
            بموجب هذه الشروط، يلتزم المستخدم بما يأتي:
          </p>
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            <li>تقديم معلومات صحيحة ودقيقة عند التسجيل وفي أي وقت لاحق.</li>
            <li>الحفاظ على سرية بيانات الدخول وعدم مشاركتها مع غير المُرخَّص لهم.</li>
            <li>
              عدم استخدام المنصة لأغراض غير مشروعة أو مخالفة لأنظمة المملكة العربية السعودية.
            </li>
            <li>عدم محاولة اختراق المنصة أو اكتشاف ثغراتها بطرق غير مصرّح بها.</li>
            <li>عدم استخدام المنصة لنشر محتوى مضلل أو ضار أو منافٍ للآداب العامة.</li>
            <li>
              إبلاغ مزوّد الخدمة فوراً عند اكتشاف أي وصول غير مصرّح به لحسابه.
            </li>
          </ul>
        </Section>

        {/* القسم 7 */}
        <Section number="7" title="حدود المسؤولية">
          <p style={{ marginBottom: '0.75rem' }}>
            في أقصى الحدود التي يُجيزها النظام السعودي:
          </p>
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {[
              'لا يتحمل مزوّد الخدمة المسؤولية عن أي خسائر مالية أو قرارات تجارية خاطئة نتجت عن الاعتماد على بيانات أو تقارير المنصة.',
              'الحد الأقصى للمسؤولية في جميع الأحوال هو مبلغ الباقة المدفوع فعلياً.',
              'لا يُعدّ مزوّد الخدمة مسؤولاً عن أي انقطاع في الخدمة ناتج عن أعطال خارجة عن سيطرته (Supabase، شبكة الإنترنت، قوة قاهرة).',
              'تقع على المستخدم مسؤولية النسخ الاحتياطي الدوري لبياناته.',
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  gap: '0.625rem',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* القسم 8 */}
        <Section number="8" title="الملكية الفكرية">
          <p>
            جميع حقوق الملكية الفكرية للمنصة — بما يشمل الكود المصدري، التصميم، العلامات
            التجارية، الشعارات، وأساليب العمل — هي ملك حصري لـ{' '}
            <strong>إلكسار الرقمية</strong> ومحميّة بموجب أنظمة الملكية الفكرية في المملكة
            العربية السعودية والاتفاقيات الدولية ذات الصلة.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            يحتفظ المستخدم بملكية جميع البيانات التي يُدخلها في المنصة. يمنحنا المستخدم ترخيصاً
            محدوداً لمعالجة هذه البيانات لغرض تقديم الخدمة فحسب.
          </p>
        </Section>

        {/* القسم 9 */}
        <Section number="9" title="إنهاء الخدمة وتعليق الحساب">
          <p style={{ marginBottom: '0.75rem' }}>
            يحق لمزوّد الخدمة تعليق الحساب أو إنهاء الترخيص فوراً في الحالات التالية:
          </p>
          <ul style={{ paddingRight: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            <li>ثبوت مخالفة المستخدم لأي من الالتزامات المنصوص عليها في المادة السادسة.</li>
            <li>محاولة إساءة استخدام المنصة أو اختراق أنظمتها.</li>
            <li>تقديم معلومات مزوّرة أو مضلِّلة عند التسجيل.</li>
            <li>
              انتهاء الفترة المُتفَق عليها للباقة (دعم وتحديثات) — مع الإبقاء على حق الاستخدام
              الأساسي للتطبيق.
            </li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            في حال إنهاء الخدمة من قِبل مزوّد الخدمة بسبب لا يعود للمستخدم، يُسترجع الجزء
            المتبقي من قيمة الباقة بالتناسب.
          </p>
        </Section>

        {/* القسم 10 */}
        <Section number="10" title="القانون الحاكم">
          <p>
            تخضع هذه الشروط وتُفسَّر وفق <strong>أنظمة المملكة العربية السعودية</strong>، بما
            فيها نظام التجارة الإلكترونية، نظام المعاملات المدنية، ونظام حماية المستهلك، وأي
            أنظمة ذات صلة. لا يُطبَّق أي نظام أجنبي على هذه الاتفاقية.
          </p>
        </Section>

        {/* القسم 11 */}
        <Section number="11" title="حل النزاعات">
          <p style={{ marginBottom: '0.75rem' }}>
            في حال نشوء أي نزاع يتعلق بهذه الشروط أو استخدام المنصة، يتبع الإجراء التالي:
          </p>
          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {[
              {
                step: '1',
                title: 'التسوية الودية',
                desc: 'يتواصل الطرفان مباشرةً لحل النزاع وديًّا خلال 30 يوماً من إبلاغ الطرف الآخر.',
              },
              {
                step: '2',
                title: 'الوساطة',
                desc: 'إذا تعذّرت التسوية الودية، يلجأ الطرفان إلى الوساطة عبر جهة وساطة معتمدة في منطقة القصيم.',
              },
              {
                step: '3',
                title: 'الجهات القضائية',
                desc: 'في حال عدم التوصل لحل، تختص المحاكم المختصة في منطقة القصيم، المملكة العربية السعودية، بالفصل في النزاع.',
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                style={{
                  display: 'flex',
                  gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    flexShrink: 0,
                    marginTop: '0.1rem',
                  }}
                >
                  {step}
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--color-text)' }}>
                    {title}
                  </strong>
                  <span style={{ fontSize: '0.875rem' }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* القسم 12 */}
        <Section number="12" title="التواصل معنا">
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
              إلكسار الرقمية — قيد العقار
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
            للاطلاع على سياسة الخصوصية،{' '}
            <a href="/privacy" style={{ color: 'var(--color-primary)' }}>
              اضغط هنا
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
