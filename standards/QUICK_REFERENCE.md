# 📑 مرجع سريع - Quick Reference

> دليل مختصر للوصول السريع لجميع القوالب

---

## 📊 جدول القوالب

| # | اسم القالب | الغرض | الملف | الحجم | الأولوية |
|---|-----------|-------|------|-------|---------|
| 1 | **ADR Template** | قالب توثيق القرارات المعمارية | [`adr/0000-template.md`](adr/0000-template.md) | 3.4 KB | ⭐⭐⭐ |
| 2 | **ADR Example** | مثال عملي: اختيار PostgreSQL | [`adr/0001-example.md`](adr/0001-example.md) | 5.7 KB | ⭐⭐⭐ |
| 3 | **Incident Response** | قالب الاستجابة للحوادث التقنية | [`runbooks/incident-response-template.md`](runbooks/incident-response-template.md) | 7.3 KB | ⭐⭐⭐ |
| 4 | **API Failover** | قالب التحويل الاحتياطي للـ APIs | [`runbooks/api-failover-template.md`](runbooks/api-failover-template.md) | 9.9 KB | ⭐⭐ |
| 5 | **System Prompt** | قالب System Prompt للذكاء الاصطناعي | [`prompts/system-prompt-template.md`](prompts/system-prompt-template.md) | 6.8 KB | ⭐⭐ |
| 6 | **Prompt Library** | هيكلة وتنظيم مكتبة Prompts | [`prompts/prompt-library-structure.md`](prompts/prompt-library-structure.md) | 9.3 KB | ⭐⭐ |
| 7 | **Test Plan** | خطة اختبار شاملة | [`testing/test-plan-template.md`](testing/test-plan-template.md) | 13.0 KB | ⭐⭐⭐ |

**الحجم الإجمالي:** ~55 KB  
**عدد القوالب:** 7 ملفات

---

## 🎯 اختيار سريع حسب الحالة

### "أريد توثيق قرار تقني"
➡️ استخدم: **ADR Template** ([`adr/0000-template.md`](adr/0000-template.md))  
📖 راجع المثال: [`adr/0001-example.md`](adr/0001-example.md)

### "لدي خدمة Production وأحتاج استعداد للطوارئ"
➡️ استخدم: **Incident Response Template** ([`runbooks/incident-response-template.md`](runbooks/incident-response-template.md))

### "API رئيسي معرض للفشل"
➡️ استخدم: **API Failover Template** ([`runbooks/api-failover-template.md`](runbooks/api-failover-template.md))

### "أبني تطبيق AI/Chatbot"
➡️ استخدم: **System Prompt Template** ([`prompts/system-prompt-template.md`](prompts/system-prompt-template.md))  
📚 ثم نظّم مكتبتك: [`prompts/prompt-library-structure.md`](prompts/prompt-library-structure.md)

### "أخطط لتطوير ميزة جديدة"
➡️ استخدم: **Test Plan Template** ([`testing/test-plan-template.md`](testing/test-plan-template.md))

---

## 🚀 أوامر سريعة

### نسخ جميع القوالب لمشروعك
```bash
# نسخ الهيكل الكامل
cp -r standards/ /path/to/your-project/docs/

# أو نسخ فئة واحدة فقط
cp -r standards/adr/ /path/to/your-project/docs/adr/
```

### إنشاء ملف من قالب
```bash
# ADR
cp standards/adr/0000-template.md docs/adr/0001-my-decision.md

# Runbook
cp standards/runbooks/incident-response-template.md docs/runbooks/my-incident.md

# Test Plan
cp standards/testing/test-plan-template.md docs/testing/feature-x-test.md
```

### بحث سريع في القوالب
```bash
# البحث عن كلمة معينة في جميع القوالب
grep -r "keyword" standards/

# عرض جميع العناوين الرئيسية
grep -h "^##" standards/**/*.md
```

---

## 📦 محتويات كل قالب

### 1. ADR Template
```
✓ Metadata (status, date, decision-makers)
✓ Context & Problem Statement
✓ Decision Drivers
✓ Considered Options
✓ Decision Outcome
✓ Consequences
✓ Pros & Cons comparison
✓ Additional info
```

### 2. Incident Response Template
```
✓ Contact info (Slack, War room, Phone)
✓ Overview (severity, affected systems)
✓ Indicators & Alerts
✓ Initial response steps
✓ Resolution scenarios (Rollback, Scaling, DB failover)
✓ Post-resolution checklist
✓ Contact points
```

### 3. API Failover Template
```
✓ Quick contacts
✓ Scenario description
✓ Monitoring indicators
✓ Verification steps
✓ Failover scenarios:
  - Internal API failover
  - External API failover
  - Circuit breaker activation
  - Database failover
✓ Post-failover steps
✓ Primary restoration plan
```

### 4. System Prompt Template
```
✓ Metadata (name, version, model)
✓ Role & Persona
✓ Capabilities
✓ Constraints & Limitations
✓ Behavioral guidelines
✓ Special cases handling
✓ Interaction examples
✓ Quality standards
✓ Safety & moderation
```

### 5. Prompt Library Structure
```
✓ Folder structure
✓ Prompt index (System, User, Few-shot, Chains)
✓ Documentation standards
✓ Best practices
✓ Versioning
✓ Testing & evaluation
✓ Advanced techniques (RAG, ReAct, CoT)
✓ Security & monitoring
```

### 6. Test Plan Template
```
✓ Overview & scope
✓ Test strategy (Unit, Integration, E2E, Perf, Security)
✓ Test environments
✓ Test data management
✓ Detailed test cases with code examples
✓ Acceptance criteria
✓ Timeline
✓ Reporting & tracking
```

---

## 🎨 نصائح سريعة للتعريب

| العنصر | العربية | الإنجليزية | مثال |
|--------|---------|------------|------|
| العناوين | ✅ | ✅ | `## السياق (Context)` |
| المصطلحات التقنية | ❌ | ✅ | API, Database, Docker |
| الشروحات | ✅ | ❌ | "تحقق من حالة الخدمة" |
| أسماء الملفات | ❌ | ✅ | `0001-database-choice.md` |
| الأكواد | ❌ | ✅ | `kubectl get pods` |

---

## ⏱️ وقت ملء كل قالب

| القالب | الوقت المتوقع | المستوى |
|--------|---------------|---------|
| ADR Template | 30-60 دقيقة | متوسط |
| Incident Response | 45-90 دقيقة | متقدم |
| API Failover | 60-120 دقيقة | متقدم |
| System Prompt | 20-45 دقيقة | مبتدئ-متوسط |
| Prompt Library | 15-30 دقيقة | مبتدئ |
| Test Plan | 2-4 ساعات | متقدم |

---

## 🔗 روابط سريعة للمصادر الأصلية

| المصدر | الرابط | الوصف |
|--------|--------|-------|
| MADR | https://github.com/adr/madr | قوالب ADR الأصلية |
| PagerDuty Docs | https://response.pagerduty.com/ | Incident response docs |
| DAIR.AI Guide | https://www.promptingguide.ai/ | Prompt engineering guide |
| Microsoft Playbook | https://microsoft.github.io/code-with-engineering-playbook/ | Testing best practices |

---

## 📞 الدعم والمساعدة

**وجدت خطأ؟**
- افتح Issue أو Pull Request

**تحتاج مثال إضافي؟**
- راجع [`adr/0001-example.md`](adr/0001-example.md)

**تريد تخصيص قالب؟**
- جميع القوالب قابلة للتعديل - استخدمها كما يناسبك!

---

## ✅ Checklist: قبل استخدام أي قالب

- [ ] قرأت القالب كاملاً
- [ ] راجعت المثال (إن وُجد)
- [ ] فهمت جميع الأقسام
- [ ] جهزت المعلومات المطلوبة
- [ ] حذفت التعليقات (<!-- -->)
- [ ] ملأت جميع الأقسام المطلوبة
- [ ] راجعت مع شخص آخر
- [ ] أضفت للـ Git

---

## 🏆 أفضل 3 ممارسات

1. **ابدأ صغيراً:** لا تحاول تطبيق كل القوالب دفعة واحدة
2. **خصص للسياق:** عدّل القوالب لتناسب مشروعك
3. **حدّث باستمرار:** القوالب ليست ثابتة - طوّرها مع نمو المشروع

---

**تاريخ الإنشاء:** 2026-01-30  
**آخر تحديث:** 2026-01-30  

**🎉 جاهز للاستخدام!**
