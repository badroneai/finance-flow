/*
  صفحة الإعدادات — مستخرجة من App.jsx (الخطوة 7)
*/
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { storageFacade } from '../core/storage-facade.js';
import {
  getSavedTheme,
  getSavedNumerals,
  applyTheme,
  applyNumerals,
  UI_THEME_KEY,
  getSavedDateHeader,
  setDateHeaderPref,
} from '../core/theme-ui.js';
import { STORAGE_KEYS, STORAGE_ERROR_MESSAGE, MSG } from '../constants/index.js';
import { dataStore } from '../core/dataStore.js';
const OFFICE_LOGO_KEY = STORAGE_KEYS.OFFICE_LOGO;
import { SettingsField, Icons } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { safeNum } from '../utils/helpers.js';

export function SettingsPage({ setPage, onShowOnboarding, onStartTour }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, signOut, isSupabaseConfigured, profile, office, role } = useAuth();
  const {
    updateOfficeSettings,
    reloadFromLocalStorage,
    transactions,
    commissions,
    ledgers,
    recurringItems,
    contractPayments,
    contractReceipts,
    properties,
    units,
    contacts,
    contracts,
  } = useData();

  // SPR-010: قراءة الإعدادات من office (Supabase دائماً)
  const [settings, setSettings] = useState(() => {
    if (office) {
      return {
        officeName: office.name || '',
        phone: office.phone || '',
        email: office.email || '',
        defaultCommissionPercent: office.default_commission_percent ?? 0,
      };
    }
    return {
      officeName: '',
      phone: '',
      email: '',
      defaultCommissionPercent: 0,
    };
  });
  // مزامنة الإعدادات عند وصول بيانات المكتب متأخرة من Supabase
  useEffect(() => {
    if (office) {
      setSettings({
        officeName: office.name || '',
        phone: office.phone || '',
        email: office.email || '',
        defaultCommissionPercent: office.default_commission_percent ?? 0,
      });
    }
  }, [office]);

  const [signingOut, setSigningOut] = useState(false);
  const [uiTheme, setUiTheme] = useState(getSavedTheme() || 'system');
  const [uiNumerals, setUiNumerals] = useState(
    getSavedNumerals() || document.documentElement.dataset.numerals || 'ar'
  );
  const [confirm, setConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // SPR-017: شعار المكتب (base64)
  const [officeLogo, setOfficeLogo] = useState(() => {
    try {
      return storageFacade.getRaw(OFFICE_LOGO_KEY) || '';
    } catch {
      return '';
    }
  });

  // شعار المكتب محفوظ في localStorage للأداء والتجربة الفورية (UI preference)
  // البيانات الرئيسية (إعدادات المكتب) محفوظة في Supabase فقط
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    // تحقق الحجم — حد 500KB
    if (file.size > 500 * 1024) {
      toast.error('حجم الشعار كبير. الحد الأقصى 500 كيلوبايت.');
      return;
    }
    // تحقق النوع
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة (PNG, JPG, SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result;
      try {
        storageFacade.setRaw(OFFICE_LOGO_KEY, b64);
        setOfficeLogo(b64);
        toast.success('تم حفظ شعار المكتب');
      } catch {
        toast.error(STORAGE_ERROR_MESSAGE);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    try {
      storageFacade.removeRaw(OFFICE_LOGO_KEY);
    } catch {}
    setOfficeLogo('');
    toast.success('تم حذف شعار المكتب');
  };

  const handleSave = async () => {
    // حفظ في Supabase فقط
    const { error } = await updateOfficeSettings({
      name: settings.officeName,
      phone: settings.phone,
      email: settings.email,
      default_commission_percent: settings.defaultCommissionPercent,
    });
    if (error) {
      toast.error('فشل الحفظ: ' + (error.message || 'خطأ غير معروف'));
      return;
    }
    toast.success(MSG.success.saved);
  };

  // إعادة بيانات الديمو التجريبية
  const handleResetDemo = () => {
    setConfirm({
      title: 'تحميل بيانات تجريبية',
      message: 'سيتم استبدال جميع البيانات الحالية ببيانات تجريبية جاهزة. هل أنت متأكد؟',
      confirmLabel: 'نعم، حمّل البيانات',
      onConfirm: () => {
        const res = dataStore.seed.resetDemo();
        if (!res.ok) {
          toast.error(res.message);
          setConfirm(null);
          return;
        }
        reloadFromLocalStorage();
        toast.success('تم تحميل البيانات التجريبية بنجاح');
        setConfirm(null);
      },
    });
  };

  // حذف جميع البيانات
  const handleClearAll = () => {
    const propCount = (properties || []).length;
    const contactCount = (contacts || []).length;
    const contractCount = (contracts || []).length;
    const txCount = (transactions || []).length;
    setConfirm({
      title: 'حذف جميع البيانات',
      message: [
        `سيتم حذف:`,
        `${propCount} عقار، ${contactCount} عميل، ${contractCount} عقد، ${txCount} حركة مالية`,
        'وجميع البيانات الأخرى.',
      ].join('\n'),
      dangerText: 'لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'نعم، احذف كل شيء',
      danger: true,
      onConfirm: () => {
        dataStore.seed.clearAll();
        reloadFromLocalStorage();
        toast.success('تم حذف جميع البيانات');
        setConfirm(null);
      },
    });
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  const formatBackupFilename = (d) => {
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    return `qaydalaqar-backup-${yyyy}${mm}${dd}-${hh}${min}.json`;
  };

  // تصدير شامل — يجمع كل بيانات المكتب من DataContext
  const handleExportBackup = () => {
    const now = new Date();
    const data = {
      transactions: transactions || [],
      commissions: commissions || [],
      ledgers: ledgers || [],
      recurringItems: recurringItems || [],
      contractPayments: contractPayments || [],
      contractReceipts: contractReceipts || [],
      properties: properties || [],
      units: units || [],
      contacts: contacts || [],
      contracts: contracts || [],
      settings,
    };

    const envelope = {
      app: 'qaydalaqar-finance-flow',
      schema: 2,
      exported_at: new Date().toISOString(),
      source: 'cloud',
      record_counts: {
        transactions: (data.transactions || []).length,
        properties: (data.properties || []).length,
        contacts: (data.contacts || []).length,
        contracts: (data.contracts || []).length,
        units: (data.units || []).length,
      },
      data,
    };

    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formatBackupFilename(now);
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تنزيل النسخة الاحتياطية');
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';

    toast.info(
      'البيانات الآن محفوظة في السحابة (Supabase). استخدم لوحة تحكم Supabase لإدارة النسخ الاحتياطية والبيانات.'
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      {setPage && (
        <div className="flex justify-end mb-4 no-print">
          <button
            type="button"
            onClick={() => setPage('pulse')}
            className="text-sm font-medium hover:opacity-80"
            style={{ color: 'var(--color-info)' }}
          >
            النبض المالي
          </button>
        </div>
      )}

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm mb-6">
        <h3 className="font-bold text-[var(--color-text)] mb-4">وضع العرض</h3>
        <SettingsField label="المظهر">
          <select
            value={uiTheme}
            onChange={(e) => {
              const v = e.target.value;
              setUiTheme(v);
              applyTheme(v);
              toast.success('تم تحديث المظهر');
            }}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
            aria-label="وضع العرض"
          >
            <option value="system">النظام</option>
            <option value="light">نهاري</option>
            <option value="dim">خافت</option>
            <option value="dark">ليلي</option>
          </select>
        </SettingsField>
        <SettingsField label="عرض الأرقام">
          <select
            value={uiNumerals}
            onChange={(e) => {
              const v = e.target.value;
              setUiNumerals(v);
              applyNumerals(v);
              toast.success('تم تحديث عرض الأرقام');
            }}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
            aria-label="عرض الأرقام"
          >
            <option value="ar">عربي</option>
            <option value="en">إنجليزي</option>
          </select>
        </SettingsField>
        <SettingsField label="عرض التاريخ">
          <select
            value={getSavedDateHeader() || 'both'}
            onChange={(e) => {
              const v = e.target.value;
              setDateHeaderPref(v);
              toast.success('تم تحديث إعداد التاريخ');
            }}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
            aria-label="عرض التاريخ"
          >
            <option value="off">بدون</option>
            <option value="greg">ميلادي</option>
            <option value="hijri">هجري</option>
            <option value="both">ميلادي + هجري</option>
          </select>
        </SettingsField>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              try {
                storageFacade.removeRaw(UI_THEME_KEY);
              } catch {}
              setUiTheme('system');
              applyTheme('system');
              toast.success('تمت إعادة ضبط المظهر');
            }}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
            aria-label="إعادة ضبط المظهر"
          >
            إعادة ضبط المظهر
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof onShowOnboarding === 'function') onShowOnboarding();
              toast.info('سيتم عرض شاشة الترحيب');
            }}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)]"
            aria-label="إعادة عرض شاشة الترحيب"
          >
            إعادة عرض شاشة الترحيب
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof onStartTour === 'function') onStartTour();
              toast.info('جاري بدء الجولة التعريفية');
            }}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-75"
            style={{ borderColor: 'var(--color-info)', color: 'var(--color-info)' }}
            aria-label="بدء الجولة التعريفية"
          >
            بدء الجولة التعريفية
          </button>
        </div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm mb-6">
        <h3 className="font-bold text-[var(--color-text)] mb-4">معلومات المكتب</h3>
        <SettingsField label="اسم المكتب">
          <input
            type="text"
            value={settings.officeName}
            onChange={(e) => setSettings((s) => ({ ...s, officeName: e.target.value }))}
            maxLength={120}
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="اسم المكتب"
          />
        </SettingsField>
        <div className="grid grid-cols-2 gap-3">
          <SettingsField label="رقم الهاتف">
            <input
              type="tel"
              value={settings.phone || ''}
              onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="رقم الهاتف"
            />
          </SettingsField>
          <SettingsField label="البريد الإلكتروني">
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              aria-label="البريد الإلكتروني"
            />
          </SettingsField>
        </div>
        <SettingsField label="نسبة العمولة الافتراضية للمكتب (%)">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={settings.defaultCommissionPercent}
            onChange={(e) =>
              setSettings((s) => ({ ...s, defaultCommissionPercent: safeNum(e.target.value, 50) }))
            }
            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            aria-label="نسبة العمولة الافتراضية"
          />
          <p className="text-xs text-[var(--color-muted)] mt-1">تؤثر على العمولات الجديدة فقط</p>
        </SettingsField>
        {/* SPR-017: شعار المكتب */}
        <SettingsField label="شعار المكتب">
          <div className="flex items-center gap-3">
            {officeLogo ? (
              <div className="flex items-center gap-3">
                <img
                  src={officeLogo}
                  alt="شعار المكتب"
                  className="w-12 h-12 object-contain rounded border border-[var(--color-border)]"
                />
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="text-xs hover:opacity-80"
                  style={{ color: 'var(--color-danger)' }}
                >
                  حذف الشعار
                </button>
              </div>
            ) : (
              <div className="w-12 h-12 rounded border border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] text-xs">
                لا يوجد
              </div>
            )}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
            >
              {officeLogo ? 'تغيير' : 'رفع شعار'}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            يظهر في رأس التقارير PDF (PNG/JPG/SVG — حد 500 كيلوبايت)
          </p>
        </SettingsField>

        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: 'var(--color-info)' }}
          aria-label="حفظ الإعدادات"
        >
          حفظ الإعدادات
        </button>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm mb-6">
        <h3 className="font-bold text-[var(--color-text)] mb-4">النسخ الاحتياطي</h3>
        <p className="text-sm text-[var(--color-muted)] mb-4">
          بياناتك محفوظة تلقائياً في السحابة. يمكنك تصدير نسخة احتياطية محلية للاحتفاظ بها.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-75 flex items-center gap-2"
            style={{ borderColor: 'var(--color-info)', color: 'var(--color-info)' }}
            aria-label="تصدير نسخة احتياطية JSON"
          >
            <Icons.download size={16} /> تصدير نسخة من السحابة (JSON)
          </button>
        </div>
        <p className="text-xs text-[var(--color-muted)] mt-2">
          التصدير يحفظ نسخة من بيانات السحابة على جهازك.
        </p>

        {/* المزامنة السحابية — مُفعّلة دائماً */}
        <div
          className="mt-4 rounded-xl p-4"
          style={{
            borderWidth: '1px',
            borderColor: 'var(--color-success)',
            backgroundColor: 'var(--color-success-bg)',
          }}
          aria-label="المزامنة السحابية"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold" style={{ color: 'var(--color-success)' }}>
              بياناتك متزامنة مع السحابة
            </div>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-success-light)',
                color: 'var(--color-success)',
                borderWidth: '1px',
                borderColor: 'var(--color-success)',
              }}
            >
              مُفعّل
            </span>
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--color-success)' }}>
            بياناتك محفوظة بأمان في السحابة ومتاحة من أي جهاز مسجّل بنفس الحساب.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
        <h3 className="font-bold text-[var(--color-text)] mb-4">إدارة البيانات</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          حمّل بيانات تجريبية لاستعراض النظام، أو احذف جميع البيانات للبدء من الصفر.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleResetDemo}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-75"
            style={{ borderColor: 'var(--color-info)', color: 'var(--color-info)' }}
            aria-label="تحميل بيانات تجريبية"
          >
            تحميل بيانات تجريبية
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-75"
            style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            aria-label="حذف جميع البيانات"
          >
            حذف جميع البيانات
          </button>
        </div>
      </div>

      {/* ── قسم الحساب — يظهر فقط عند تفعيل Supabase (SPR-004d) ── */}
      {isSupabaseConfigured && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm mb-6">
          <h3 className="font-bold text-[var(--color-text)] mb-4">الحساب</h3>
          <div className="space-y-2 mb-4 text-sm text-[var(--color-muted)]">
            {profile?.full_name && (
              <p>
                الاسم:{' '}
                <span className="font-medium text-[var(--color-text)]">{profile.full_name}</span>
              </p>
            )}
            {user?.email && (
              <p>
                البريد:{' '}
                <span className="font-medium text-[var(--color-text)]" dir="ltr">
                  {user.email}
                </span>
              </p>
            )}
            {role && (
              <p>
                الدور:{' '}
                <span className="font-medium text-[var(--color-text)]">
                  {role === 'super_admin'
                    ? 'مدير المنصة'
                    : role === 'owner'
                      ? 'مالك المكتب'
                      : role === 'manager'
                        ? 'مدير / محاسب'
                        : role === 'agent'
                          ? 'وسيط عقاري'
                          : role}
                </span>
              </p>
            )}
            {office?.name && role !== 'super_admin' && (
              <p>
                المكتب: <span className="font-medium text-[var(--color-text)]">{office.name}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              if (!window.confirm('هل تريد تسجيل الخروج؟')) return;
              setSigningOut(true);
              const { error: err } = await signOut();
              setSigningOut(false);
              if (err) {
                toast.error('حدث خطأ أثناء تسجيل الخروج');
              } else {
                navigate('/auth', { replace: true });
              }
            }}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-75 disabled:opacity-50"
            style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
            aria-label="تسجيل الخروج"
          >
            {signingOut ? 'جاري الخروج…' : 'تسجيل الخروج'}
          </button>
        </div>
      )}

      {/* ── روابط قانونية ── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-base font-bold text-[var(--color-text)] mb-4">معلومات قانونية</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/privacy"
            className="text-sm px-4 py-2 rounded-lg"
            style={{
              color: 'var(--color-primary)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
            }}
          >
            🔒 سياسة الخصوصية
          </a>
          <a
            href="/terms"
            className="text-sm px-4 py-2 rounded-lg"
            style={{
              color: 'var(--color-primary)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
            }}
          >
            📋 شروط الاستخدام
          </a>
          <a
            href="mailto:support@qaydalaqar.com"
            className="text-sm px-4 py-2 rounded-lg"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              textDecoration: 'none',
            }}
          >
            📧 support@qaydalaqar.com
          </a>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
          © 2024–2026 إلكسار الرقمية — سجل تجاري: 7008837028
        </p>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        messageList={confirm?.messageList}
        dangerText={confirm?.dangerText}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
        danger={confirm?.danger}
      />
    </div>
  );
}
