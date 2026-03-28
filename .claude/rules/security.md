# قواعد الأمن

- لا مفاتيح أو أسرار في الكود — استخدم `import.meta.env.VITE_*`
- ملفات `.env` و `.env.local` و `.env*.local` في `.gitignore` دائماً
- RLS (Row Level Security) إلزامي على كل جدول Supabase
- لا `eval()` أو `Function()` أبداً
- لا `dangerouslySetInnerHTML` أو `innerHTML` بدون تعقيم
- لا تثق بمدخلات المستخدم — validate + sanitize قبل الاستخدام
- `npm audit` قبل كل نشر — لا ثغرات critical
- لا hardcoded passwords أو tokens أو connection strings
- VITE_* فقط يظهر في الكود العميل — لا تضع أسرار الخادم فيها
