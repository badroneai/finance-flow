/**
 * شروط الاستخدام — قيد العقار
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

// ─── مكوّن بطاقة الباقة ────────────────────────────────────────────────────
function PlanCard({ name, price, features, highlighted }) {
  return (
    <div className={`legal__plan-card${highlighted ? ' legal__plan-card--highlighted' : ''}`}>
      {highlighted && (
        <span className="legal__plan-badge">⭐ الأكثر طلباً</span>
      )}
      <div className="legal__plan-name">{name}</div>
      <div className="legal__plan-price">
        {price}
        <span className="legal__plan-period"> ر.س — مرة واحدة</span>
      </div>
      <ul className="legal__plan-features">
        {features.map((f, i) => (
          <li key={i}>{f}</li>
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
    <div dir="rtl" className="legal-page">
      {/* شريط العودة */}
      <div className="legal__nav">
        <button type="button" onClick={() => navigate(-1)} className="legal__back-btn">
          ← رجوع
        </button>
        <span className="legal__nav-title">شروط الاستخدام</span>
      </div>

      {/* المحتوى */}
      <div className="legal__content">
        {/* الترويسة */}
        <header className="legal__header">
          <div className="legal__header-icon">📋</div>
          <h1 className="legal__header-title">شروط الاستخدام</h1>
          <p className="legal__header-subtitle">قيد العقار — إلكسار الرقمية</p>
          <div className="legal__header-badge">آخر تحديث: 1 أبريل 2026</div>
        </header>

        {/* إشعار قبول */}
        <div className="legal__notice legal__notice--info">
          <span className="legal__notice-icon" style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <p className="legal__notice-text">
            باستخدامك منصة قيد العقار أو شرائك أي من باقاتها، فإنك تُقرّ بقراءة هذه الشروط
            وفهمها والموافقة على الالتزام بها كاملةً. إذا كنت لا توافق على أي بند، يُرجى
            الامتناع عن استخدام المنصة والتواصل معنا.
          </p>
        </div>

        {/* القسم 1 */}
        <Section number="1" title="التعريفات">
          <div className="legal__data-grid">
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
              <div key={term} className="legal__term-card">
                <strong className="legal__term-label">{term}:</strong>
                <span className="legal__term-def">{def}</span>
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
          <div className="legal__notice legal__notice--warning" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <span className="legal__notice-icon" style={{ fontSize: '1.1rem' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.375rem' }}>تنبيه مهم:</strong>
              <p className="legal__notice-text">
                المنصة <strong>ليست بديلاً عن الاستشارة المالية أو القانونية أو المحاسبية
                المتخصصة</strong>. المعلومات والتقارير المُولَّدة هي أدوات مساعدة للمستخدم فقط،
                ولا تُشكّل مشورةً مهنيةً ملزِمة. يتحمل المستخدم كامل المسؤولية عن قراراته المالية.
              </p>
            </div>
          </div>
        </Section>

        {/* القسم 3 */}
        <Section number="3" title="الترخيص وشروطه">
          <p style={{ marginBottom: '0.75rem' }}>
            يمنحك مزوّد الخدمة ترخيصاً{' '}
            <strong>محدوداً، غير حصري، غير قابل للتحويل</strong>، لاستخدام المنصة على عدد
            الأجهزة المحدّد في الباقة المشتراة، وفق الشروط التالية:
          </p>
          <ul className="legal__list">
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
          <div className="legal__plans-grid">
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
          <p className="legal__small">
            * الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة 15%. قد تتغير الأسعار للباقات
            الجديدة مستقبلاً دون المساس بحقوق من اشتروا مسبقاً.
          </p>
        </Section>

        {/* القسم 5 */}
        <Section number="5" title="سياسة الاسترجاع">
          <div className="legal__notice legal__notice--success">
            <span className="legal__notice-icon">🛡️</span>
            <div>
              <strong className="legal__data-title">ضمان استرجاع 14 يوماً</strong>
              <p className="legal__notice-text">
                إذا لم تكن راضياً عن المنصة لأي سبب، يحق لك طلب استرداد كامل المبلغ خلال{' '}
                <strong>14 يوم تقويمي</strong> من تاريخ الشراء.
              </p>
            </div>
          </div>
          <p style={{ marginBottom: '0.75rem' }}>شروط الاسترجاع:</p>
          <ul className="legal__list">
            <li>يجب تقديم طلب الاسترجاع قبل انتهاء مدة الـ 14 يوماً عبر البريد الإلكتروني.</li>
            <li>لا يُشترط تقديم مبرر للاسترجاع خلال هذه المدة.</li>
            <li>
              بعد انتهاء مدة الـ 14 يوماً، لا يُقبل الاسترجاع إلا في حالة عيب جوهري مثبت في
              المنتج يمنع استخدامه للغرض المقصود.
            </li>
            <li>تُعالَج المبالغ المستردّة خلال 7 أيام عمل.</li>
          </ul>
          <p>
            للطلب:{' '}
            <a href="mailto:support@qaydalaqar.com" className="legal__link">
              support@qaydalaqar.com
            </a>
          </p>
        </Section>

        {/* القسم 6 */}
        <Section number="6" title="التزامات المستخدم">
          <p style={{ marginBottom: '0.75rem' }}>
            بموجب هذه الشروط، يلتزم المستخدم بما يأتي:
          </p>
          <ul className="legal__list">
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
          <div className="legal__basis-grid">
            {[
              'لا يتحمل مزوّد الخدمة المسؤولية عن أي خسائر مالية أو قرارات تجارية خاطئة نتجت عن الاعتماد على بيانات أو تقارير المنصة.',
              'الحد الأقصى للمسؤولية في جميع الأحوال هو مبلغ الباقة المدفوع فعلياً.',
              'لا يُعدّ مزوّد الخدمة مسؤولاً عن أي انقطاع في الخدمة ناتج عن أعطال خارجة عن سيطرته (Supabase، شبكة الإنترنت، قوة قاهرة).',
              'تقع على المستخدم مسؤولية النسخ الاحتياطي الدوري لبياناته.',
            ].map((item, i) => (
              <div key={i} className="legal__bullet-card">
                <span className="legal__bullet">•</span>
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
          <p>
            يحتفظ المستخدم بملكية جميع البيانات التي يُدخلها في المنصة. يمنحنا المستخدم ترخيصاً
            محدوداً لمعالجة هذه البيانات لغرض تقديم الخدمة فحسب.
          </p>
        </Section>

        {/* القسم 9 */}
        <Section number="9" title="إنهاء الخدمة وتعليق الحساب">
          <p style={{ marginBottom: '0.75rem' }}>
            يحق لمزوّد الخدمة تعليق الحساب أو إنهاء الترخيص فوراً في الحالات التالية:
          </p>
          <ul className="legal__list">
            <li>ثبوت مخالفة المستخدم لأي من الالتزامات المنصوص عليها في المادة السادسة.</li>
            <li>محاولة إساءة استخدام المنصة أو اختراق أنظمتها.</li>
            <li>تقديم معلومات مزوّرة أو مضلِّلة عند التسجيل.</li>
            <li>
              انتهاء الفترة المُتفَق عليها للباقة (دعم وتحديثات) — مع الإبقاء على حق الاستخدام
              الأساسي للتطبيق.
            </li>
          </ul>
          <p>
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
          <div className="legal__data-grid">
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
              <div key={step} className="legal__step-card">
                <div className="legal__step-number">{step}</div>
                <div>
                  <strong className="legal__step-title">{title}</strong>
                  <span className="legal__step-desc">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* القسم 12 */}
        <Section number="12" title="التواصل معنا">
          <div className="legal__contact-card">
            <p className="legal__contact-title">إلكسار الرقمية — قيد العقار</p>
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
        </Section>

        {/* ذيل الصفحة */}
        <footer className="legal__footer">
          <p>© 2024–2026 إلكسار الرقمية. جميع الحقوق محفوظة.</p>
          <p>
            للاطلاع على سياسة الخصوصية،{' '}
            <a href="/privacy" className="legal__link">اضغط هنا</a>.
          </p>
        </footer>
      </div>
    </div>
  );
}
