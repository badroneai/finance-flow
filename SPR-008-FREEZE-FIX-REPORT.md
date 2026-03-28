# SPR-008 — تقرير إصلاح تجمّد صفحة الحركات والحلقات اللانهائية

**التاريخ:** 2026-03-18
**المهمة:** تشخيص وإصلاح تجمّد #/transactions + اكتشاف حلقات مماثلة في صفحات أخرى
**النتيجة:** ✅ نجاح — 4 إصلاحات في 4 ملفات

---

## ١. السبب الجذري

### المشكلة الأساسية: مراجع مصفوفات غير مستقرة في DataContext

دالة `fetchTransactions` (وجميع دوال الجلب الأخرى) في `DataContext.jsx` كانت **تُنشئ مصفوفة جديدة في كل استدعاء** عبر `setTransactions(filtered)` — حتى لو البيانات لم تتغير فعلاً.

**التأثير المتسلسل:**
```
fetchTransactions() → setTransactions(مصفوفة_جديدة)
  → transactions state تتغير (مرجع جديد)
  → useMemo(value) في DataContext يُعاد حسابه
  → جميع المستهلكين (الصفحات) يُعاد رسمهم
  → useCallback(refresh) يُعاد إنشاؤه (إذا transactions في deps)
  → useEffect([refresh]) يُشغّل مرة أخرى
  → fetchTransactions() مرة أخرى ← حلقة لا نهائية
```

### الحلقة المباشرة: LedgersPage.jsx (الأخطر)

```javascript
// قبل الإصلاح — حلقة لا نهائية مؤكدة:
const refresh = useCallback(async () => {
  await fetchDataLedgers();          // ← تُحدّث dataLedgers
  await fetchDataRecurringItems();   // ← تُحدّث dataRecurringItems
  await fetchDataTransactions();
  setLedgersState(dataLedgers);      // ← تقرأ dataLedgers
  setRecurringState(dataRecurringItems);
}, [fetchDataLedgers, ..., dataLedgers, dataRecurringItems]);
//                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                         هذه القيم تتغير عند كل fetch ← refresh يُعاد ← effect يُشغّل ← LOOP!

useEffect(() => { refresh(); }, [refresh]);
```

### مشاكل إضافية مكتشفة:

| الملف | المشكلة | الخطورة |
|-------|---------|---------|
| `DataContext.jsx` | جميع دوال fetch تُنشئ مراجع جديدة دائماً | 🔴 حرجة |
| `LedgersPage.jsx` | refresh deps تشمل بيانات تُحدّثها refresh نفسها | 🔴 حلقة لانهائية |
| `TransactionsPage.jsx` | listener مكرر: `ledger:activeChanged` + `activeLedgerId` dep | 🟡 double-fetch |
| `InboxPage.jsx` | `useEffect(refresh, [])` ← stale closure، البيانات لا تتحدث | 🟡 بيانات قديمة |

---

## ٢. الإصلاحات المُطبّقة

### إصلاح 1: DataContext.jsx — مراجع مصفوفات مستقرة

أُضيفت دالة `stableSetArray()` تمنع `setState` إذا البيانات لم تتغير فعلاً:

```javascript
function stableSetArray(setter, newArr, prevRef) {
  const prev = prevRef.current;
  if (prev.length === newArr.length) {
    let same = true;
    for (let i = 0; i < prev.length; i++) {
      if (prev[i]?.id !== newArr[i]?.id || prev[i]?.updatedAt !== newArr[i]?.updatedAt) {
        same = false;
        break;
      }
    }
    if (same) return; // لا تغيير — لا نُحدّث الحالة
  }
  prevRef.current = newArr;
  setter(newArr);
}
```

**طُبّقت على جميع دوال الجلب الأربع:**
- `fetchLedgers` → `stableSetArray(setLedgers, ..., ledgersRef)`
- `fetchTransactions` → `stableSetArray(setTransactions, ..., transactionsRef)`
- `fetchRecurringItems` → `stableSetArray(setRecurringItems, ..., recurringRef)`
- `fetchCommissions` → `stableSetArray(setCommissions, ..., commissionsRef)`

**المقارنة:** تقارن `id` + `updatedAt` لكل عنصر — كافية لاكتشاف أي تغيير حقيقي دون تكلفة `JSON.stringify`.

### إصلاح 2: LedgersPage.jsx — فصل الجلب عن المزامنة

```javascript
// بعد الإصلاح:

// (1) الجلب فقط — deps مستقرة (لا تشمل بيانات)
const refresh = useCallback(async () => {
  await fetchDataLedgers();
  await fetchDataRecurringItems();
  await fetchDataTransactions();
}, [fetchDataLedgers, fetchDataRecurringItems, fetchDataTransactions]);

useEffect(() => { refresh(); }, [refresh]);

// (2) مزامنة منفصلة — تُشغّل عند وصول البيانات الجديدة
useEffect(() => {
  setLedgersState(dataLedgers || []);
  setActiveIdState(dataActiveLedgerId || '');
  setRecurringState(dataRecurringItems || []);
}, [dataLedgers, dataActiveLedgerId, dataRecurringItems]);
```

**لماذا هذا آمن:** الجلب والمزامنة في effects منفصلة. الجلب لا يعتمد على البيانات، والمزامنة لا تُشغّل جلب.

### إصلاح 3: TransactionsPage.jsx — إزالة listener مكرر

أُزيل `ledger:activeChanged` event listener لأن `activeLedgerId` في dependency array الـ `refresh` useCallback يُغطّي نفس الحالة:

```javascript
// أُزيل:
// useEffect(() => {
//   window.addEventListener('ledger:activeChanged', onActive);
//   ...
// }, [refresh]);

// السبب: تغيير activeLedgerId في DataContext يُعيد إنشاء refresh
// تلقائياً عبر dependency array → الـ effect يُشغّل → fetchTransactions.
```

### إصلاح 4: InboxPage.jsx — إصلاح stale closure

```javascript
// قبل:
useEffect(() => { refresh(); }, []);     // ← يُشغّل مرة واحدة فقط بقيم فارغة

// بعد:
useEffect(() => { refresh(); }, [refresh]); // ← يُعاد عند تغيّر البيانات الفعلية
```

أُزيل أيضاً `ledger:activeChanged` listener (مكرر — `dataActiveLedgerId` في refresh deps يُغطّيه).

---

## ٣. الصفحات المفحوصة

| الصفحة | حلقة؟ | إصلاح؟ | ملاحظات |
|--------|-------|--------|---------|
| TransactionsPage | ⚠️ double-fetch | ✅ | أُزيل listener مكرر |
| LedgersPage | 🔴 حلقة لانهائية | ✅ | فُصل الجلب عن المزامنة |
| InboxPage | ⚠️ stale closure | ✅ | أُصلح deps + أُزيل listener مكرر |
| PulsePage | ✅ آمنة | — | تحسب محلياً بدون fetch، listener مطلوب |
| SettingsPage | ✅ آمنة | — | لا يوجد fetch/refresh pattern |

---

## ٤. نتائج التحقق

- ✅ `npm run build` — نجاح (2.48 ثانية)
- ✅ `npm test` — 5/5 اختبارات نجحت (2 ملف اختبار)
- ✅ لا حلقات fetch في أي صفحة
- ✅ CRUD operations تعمل (refresh بعد create/update/delete يُحدّث البيانات عبر stableSetArray)
- ✅ تبديل الدفتر يعمل بشكل طبيعي (مرة واحدة بدل مرتين)

---

## ٥. حجم الحزمة قبل وبعد

| الملف | قبل SPR-008 | بعد SPR-008 | الفرق |
|-------|-------------|-------------|-------|
| app.js | 582,865 | 583,150 | +285 (+0.05%) |
| LedgersPage.js | 147,684 | 147,710 | +26 (≈0%) |
| TransactionsPage.js | 14,390 | 14,110 | **−280** (−1.9%) |
| InboxPage (ضمن app.js) | — | — | تغيير طفيف |

**ملاحظة:** TransactionsPage أصغر لأن listener أُزيل.

---

## ٦. ملخص تقني

**السبب:** `setTransactions(filtered)` في localStorage mode يُنشئ مرجع جديد كل مرة → يُعيد حساب useMemo الـ context value → يُعيد رسم كل المستهلكين → في LedgersPage: refresh يعتمد على البيانات التي يُحدّثها = حلقة لانهائية.

**الحل:** `stableSetArray()` تمنع setState إذا البيانات (id + updatedAt) لم تتغير. بالإضافة لفصل الجلب عن المزامنة في LedgersPage وإزالة listeners مكررة.

**الملفات المُعدّلة:**
1. `src/contexts/DataContext.jsx` — `stableSetArray` + refs + 4 دوال fetch مُحدّثة
2. `src/pages/LedgersPage.jsx` — فصل refresh إلى fetch + sync effects
3. `src/pages/TransactionsPage.jsx` — إزالة `ledger:activeChanged` listener
4. `src/pages/InboxPage.jsx` — إصلاح `[]` → `[refresh]` + إزالة listener مكرر

---

*نهاية التقرير — SPR-008*
