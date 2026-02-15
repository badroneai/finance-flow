# تقرير الخطوة 6: استخراج صفحة التقويم والملاحظات من App.jsx

**قواعد مُطبقة:** لا حذف لملفات موجودة مسبقاً، لا تغيير سلوك أو منطق. التحقق بـ `npm run build`.

---

## 1. الملف الذي تم إنشاؤه

**`src/pages/NotesCalendar.jsx`**

- **مُصدَّر:** `NotesCalendar` فقط (default export).
- **مكونات داخلية (غير مُصدَّرة):** NotesCalendarAddInput، NotesCalendarPinnedCard، NotesCalendarAddPinnedInput، NotesCalendarAddEventModal — كلها معرّفة في نفس الملف وتُستخدم داخل NotesCalendar فقط.

### المحتوى المنقول
- ثوابت محلية: HIJRI_MONTHS_NC، GREG_MONTHS_NC، DAY_NAMES_NC، DAY_NAMES_SHORT_NC، EVENT_CATEGORIES_NC، DEFAULT_EVENTS_NC (كما كانت في App.jsx).
- دوال domain المستوردة من `../domain/index.js`: gregorianToHijri، getKeyNC، toArabicNumNC، buildCalendarDays، getEventsForDate، isHoliday، addDailyNote (domainAddDailyNote)، toggleDailyNote (domainToggleDailyNote)، deleteDailyNote (domainDeleteDailyNote)، addPinnedNote (domainAddPinnedNote)، deletePinnedNote (domainDeletePinnedNote)، updatePinnedNote (domainUpdatePinnedNote).

### ملاحظة
- المهمة ذكرت استخدام Icons و Modal من ui/ — في الكود المنقول لا يُستخدمان (NotesCalendarAddEventModal مبنية كـ div ثابت وليس مكون Modal من ui). لم تتم إضافة استيرادات غير مستخدمة.

---

## 2. التعديل على App.jsx

- **إضافة استيراد:** `import NotesCalendar from './pages/NotesCalendar.jsx';`
- **حذف التعريفات:** الثوابت (HIJRI_MONTHS_NC … DEFAULT_EVENTS_NC)، والمكونات الخمسة: NotesCalendarAddInput، NotesCalendarPinnedCard، NotesCalendarAddPinnedInput، NotesCalendarAddEventModal، NotesCalendar (بما فيها التعليق «NOTES & CALENDAR»).
- **renderPage (switch):** لم يُغيّر — لا يزال يستخدم `<NotesCalendar mode="calendar"/>` و `<NotesCalendar mode="notes"/>`.

---

## 3. عدد الأسطر المُزالة من App.jsx وحجمه الجديد

- **عدد الأسطر المُزالة:** **450** سطراً (من 2479 إلى 2029).
- **حجم App.jsx بعد التعديل:** **2029** سطراً.

---

## 4. نتيجة `npm run build`

- **النتيجة:** نجاح (exit code 0).
- **مخرجات البناء:** `✓ 94 modules transformed.`، `✓ built in 1.61s`، إنشاء `dist/` بنجاح.

---

## 5. مشاكل واجهتها وحلولها

- **لا توجد.** نقل الثوابت والمكونات الخمسة كما هي مع استيراد دوال domain من `../domain/index.js`. البناء نجح من أول تشغيل.

---

*تم إعداد هذا التقرير بعد إكمال الخطوة 6 دون تعديل منطق التطبيق.*
