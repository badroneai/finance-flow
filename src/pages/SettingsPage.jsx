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
    <div className="set--page" dir="rtl">
      <header className="set--page-head">
        <h1 className="set--page-title">الإعدادات</h1>
        <p className="set--page-kicker">
          المظهر، بيانات المكتب، النسخ الاحتياطي، والحساب.
        </p>
      </header>

      {setPage && (
        <div className="set--nav no-print">
          <button
            type="button"
            onClick={() => setPage('pulse')}
            className="set--link"
          >
            النبض المالي
          </button>
        </div>
      )}

      {/* ── وضع العرض ── */}
      <div className="set--section">
        <h3 className="set--title">وضع العرض</h3>
        <SettingsField label="المظهر">
          <select
            value={uiTheme}
            onChange={(e) => {
              const v = e.target.value;
              setUiTheme(v);
              applyTheme(v);
              toast.success('تم تحديث المظهر');
            }}
            className="set--select"
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
            className="set--select"
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
            className="set--select"
            aria-label="عرض التاريخ"
          >
            <option value="off">بدون</option>
            <option value="greg">ميلادي</option>
            <option value="hijri">هجري</option>
            <option value="both">ميلادي + هجري</option>
          </select>
        </SettingsField>

        <div className="set--actions">
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
            className="set--btn"
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
            className="set--btn"
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
            className="set--btn--outline-info"
            aria-label="بدء الجولة التعريفية"
          >
            بدء الجولة التعريفية
          </button>
        </div>
      </div>

      {/* ── معلومات المكتب ── */}
      <div className="set--section">
        <h3 className="set--title">معلومات المكتب</h3>
        <SettingsField label="اسم المكتب">
          <input
            type="text"
            value={settings.officeName}
            onChange={(e) => setSettings((s) => ({ ...s, officeName: e.target.value }))}
            maxLength={120}
            className="set--input"
            aria-label="اسم المكتب"
          />
        </SettingsField>
        <div className="set--grid-2">
          <SettingsField label="رقم الهاتف">
            <input
              type="tel"
              value={settings.phone || ''}
              onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
              className="set--input"
              aria-label="رقم الهاتف"
            />
          </SettingsField>
          <SettingsField label="البريد الإلكتروني">
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
              className="set--input"
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
            className="set--input"
            aria-label="نسبة العمولة الافتراضية"
          />
          <p className="set--hint">تؤثر على العمولات الجديدة فقط</p>
        </SettingsField>
        {/* SPR-017: شعار المكتب */}
        <SettingsField label="شعار المكتب">
          <div className="set--logo-row">
            {officeLogo ? (
              <div className="set--logo-row">
                <img
                  src={officeLogo}
                  alt="شعار المكتب"
                  className="set--logo-preview"
                />
                <button
                  type="button"
                  onClick={handleLogoRemove}
                  className="set--link--danger"
                >
                  حذف الشعار
                </button>
              </div>
            ) : (
              <div className="set--logo-empty">
                لا يوجد
              </div>
            )}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="set--logo-upload"
            >
              {officeLogo ? 'تغيير' : 'رفع شعار'}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="set--hidden"
              aria-hidden="true"
            />
          </div>
          <p className="set--hint">
            يظهر في رأس التقارير PDF (PNG/JPG/SVG — حد 500 كيلوبايت)
          </p>
        </SettingsField>

        <button
          onClick={handleSave}
          className="set--btn--primary"
          aria-label="حفظ الإعدادات"
        >
          حفظ الإعدادات
        </button>
      </div>

      {/* ── النسخ الاحتياطي ── */}
      <div className="set--section">
        <h3 className="set--title">النسخ الاحتياطي</h3>
        <p className="set--desc">
          بياناتك محفوظة تلقائياً في السحابة. يمكنك تصدير نسخة احتياطية محلية للاحتفاظ بها.
        </p>
        <div className="set--actions--mt0">
          <button
            type="button"
            onClick={handleExportBackup}
            className="set--btn--outline-info set--btn__icon"
            aria-label="تصدير نسخة احتياطية JSON"
          >
            <Icons.download size={16} /> تصدير نسخة من السحابة (JSON)
          </button>
        </div>
        <p className="set--hint--below">
          التصدير يحفظ نسخة من بيانات السحابة على جهازك.
        </p>

        {/* المزامنة السحابية — مُفعّلة دائماً */}
        <div className="set--sync-banner" aria-label="المزامنة السحابية">
          <div className="set--sync-banner__head">
            <div className="set--sync-banner__title">
              بياناتك متزامنة مع السحابة
            </div>
            <span className="set--sync-banner__badge">
              مُفعّل
            </span>
          </div>
          <p className="set--sync-banner__text">
            بياناتك محفوظة بأمان في السحابة ومتاحة من أي جهاز مسجّل بنفس الحساب.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFileChange}
          className="set--hidden"
          aria-hidden="true"
        />
      </div>

      {/* ── إدارة البيانات ── */}
      <div className="set--section set--section--risk">
        <h3 className="set--title">إدارة البيانات</h3>
        <p className="set--desc--xs">
          حمّل بيانات تجريبية لاستعراض النظام، أو احذف جميع البيانات للبدء من الصفر.
        </p>
        <div className="set--actions--mt0">
          <button
            onClick={handleResetDemo}
            className="set--btn--outline-info"
            aria-label="تحميل بيانات تجريبية"
          >
            تحميل بيانات تجريبية
          </button>
          <button
            onClick={handleClearAll}
            className="set--btn--outline-danger"
            aria-label="حذف جميع البيانات"
          >
            حذف جميع البيانات
          </button>
        </div>
      </div>

      {/* ── قسم الحساب — يظهر فقط عند تفعيل Supabase (SPR-004d) ── */}
      {isSupabaseConfigured && (
        <div className="set--section">
          <h3 className="set--title">الحساب</h3>
          <div className="set--account-info">
            {profile?.full_name && (
              <p>
                الاسم:{' '}
                <span className="set--account-info__val">{profile.full_name}</span>
              </p>
            )}
            {user?.email && (
              <p>
                البريد:{' '}
                <span className="set--account-info__val" dir="ltr">
                  {user.email}
                </span>
              </p>
            )}
            {role && (
              <p>
                الدور:{' '}
                <span className="set--account-info__val">
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
                المكتب: <span className="set--account-info__val">{office.name}</span>
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
            className="set--btn--outline-danger"
            aria-label="تسجيل الخروج"
          >
            {signingOut ? 'جاري الخروج…' : 'تسجيل الخروج'}
          </button>
        </div>
      )}

      {/* ── روابط قانونية ── */}
      <div className="set--section set--section--legal">
        <h3 className="set--title">معلومات قانونية</h3>
        <div className="set--actions--mt0">
          <a href="/privacy" className="set--legal-link">
            🔒 سياسة الخصوصية
          </a>
          <a href="/terms" className="set--legal-link">
            📋 شروط الاستخدام
          </a>
          <a href="mailto:support@qaydalaqar.com" className="set--legal-link--muted">
            📧 support@qaydalaqar.com
          </a>
        </div>
        <p className="set--copyright">
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
