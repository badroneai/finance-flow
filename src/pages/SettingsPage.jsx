/*
  صفحة الإعدادات — مستخرجة من App.jsx (الخطوة 7)
*/
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { dataStore, safeGet } from '../core/dataStore.js';
import { storageFacade } from '../core/storage-facade.js';
import {
  getSavedTheme,
  getSavedNumerals,
  initTheme,
  applyTheme,
  applyNumerals,
  UI_THEME_KEY,
  UI_NUMERALS_KEY,
  UI_DATE_HEADER_KEY,
  UI_ONBOARDING_SEEN_KEY,
  getSavedDateHeader,
  setDateHeaderPref,
} from '../core/theme-ui.js';
import {
  KEYS,
  STORAGE_KEYS,
  SEED_SETTINGS,
  STORAGE_ERROR_MESSAGE,
  MSG,
} from '../constants/index.js';
const OFFICE_LOGO_KEY = STORAGE_KEYS.OFFICE_LOGO;
import { SettingsField, Icons } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { formatNumber } from '../utils/format.jsx';
import { safeNum } from '../utils/helpers.js';

export function SettingsPage({ setPage, onShowOnboarding, onStartTour }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, signOut, isSupabaseConfigured, profile, office, role } = useAuth();
  const {
    isCloudMode,
    updateOfficeSettings,
    transactions,
    commissions,
    ledgers,
    recurringItems,
    contractPayments,
    fetchTransactions,
    fetchCommissions,
    fetchProperties,
    fetchUnits,
    fetchContacts,
    fetchContracts,
    fetchContractPayments,
  } = useData();

  // SPR-010: قراءة الإعدادات — سحابي: من office (Supabase)، محلي: من localStorage
  const [settings, setSettings] = useState(() => {
    const local = dataStore.settings.get();
    if (isCloudMode && office) {
      return {
        ...local,
        officeName: office.name || local.officeName,
        phone: office.phone || local.phone,
        email: office.email || local.email,
        defaultCommissionPercent:
          office.default_commission_percent ?? local.defaultCommissionPercent,
      };
    }
    return local;
  });
  const [signingOut, setSigningOut] = useState(false);
  const [uiTheme, setUiTheme] = useState(getSavedTheme() || 'system');
  const [uiNumerals, setUiNumerals] = useState(
    getSavedNumerals() || document.documentElement.dataset.numerals || 'ar'
  );
  const [confirm, setConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const importDataRef = useRef(null);
  const logoInputRef = useRef(null);

  // SPR-017: شعار المكتب (base64)
  const [officeLogo, setOfficeLogo] = useState(() => {
    try {
      return storageFacade.getRaw(OFFICE_LOGO_KEY) || '';
    } catch {
      return '';
    }
  });

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
    // حفظ محلي دائماً (للتوافق مع المحركات)
    const res = dataStore.settings.update(settings);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    // مزامنة مع Supabase إذا في وضع السحابة
    if (isCloudMode) {
      const { error } = await updateOfficeSettings({
        name: settings.officeName,
        phone: settings.phone,
        email: settings.email,
        default_commission_percent: settings.defaultCommissionPercent,
      });
      if (error) {
        toast.error('تم الحفظ محلياً لكن فشلت المزامنة السحابية');
        return;
      }
    }
    toast.success(MSG.success.saved);
  };

  const handleResetDemo = () => {
    setConfirm({
      title: 'إعادة بيانات الديمو',
      message: 'سيتم استبدال جميع البيانات ببيانات الديمو. هل أنت متأكد؟',
      onConfirm: async () => {
        const res = dataStore.seed.resetDemo();
        if (!res.ok) {
          toast.error(res.message);
          setConfirm(null);
          return;
        }
        await Promise.all([
          fetchTransactions(),
          fetchCommissions(),
          fetchProperties(),
          fetchUnits(),
          fetchContacts(),
          fetchContracts(),
          fetchContractPayments(),
        ]);
        setSettings(dataStore.settings.get());
        initTheme();
        toast.success('تمت إعادة بيانات الديمو');
        setConfirm(null);
      },
    });
  };

  const handleClearAll = () => {
    const txCount = dataStore.transactions.list().length;
    const cmCount = dataStore.commissions.list().length;
    const draftCount = safeGet(KEYS.drafts, []).length;
    setConfirm({
      title: 'حذف جميع البيانات',
      message: 'سيتم حذف جميع البيانات المحفوظة:',
      messageList: [
        `جميع الحركات المالية (${formatNumber(txCount, { maximumFractionDigits: 0 })})`,
        `جميع العمولات (${formatNumber(cmCount, { maximumFractionDigits: 0 })})`,
        `جميع المسودات (${formatNumber(draftCount, { maximumFractionDigits: 0 })})`,
        'جميع الإعدادات',
      ],
      dangerText: 'لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'نعم، احذف كل شيء',
      danger: true,
      onConfirm: async () => {
        dataStore.seed.clearAll();
        await Promise.all([
          fetchTransactions(),
          fetchCommissions(),
          fetchProperties(),
          fetchUnits(),
          fetchContacts(),
          fetchContracts(),
          fetchContractPayments(),
        ]);
        setSettings(SEED_SETTINGS);
        initTheme();
        toast.success('تم حذف جميع البيانات');
        setConfirm(null);
      },
    });
  };

  const getBackupAppKeys = () => [
    // Financial/local data keys
    KEYS.transactions,
    KEYS.commissions,
    KEYS.drafts,
    KEYS.settings,
    KEYS.seeded,
    KEYS.properties,
    KEYS.units,
    KEYS.contacts,
    KEYS.contracts,
    KEYS.contractPayments,

    // Ledgers (PR-1)
    'ff_ledgers',
    'ff_recurring_items',
    'ff_active_ledger_id',

    // UI keys
    UI_THEME_KEY,
    UI_NUMERALS_KEY,
    UI_DATE_HEADER_KEY,
    UI_ONBOARDING_SEEN_KEY,
    // Optional UI state
    STORAGE_KEYS.UI_WELCOME,
    // شعار المكتب
    STORAGE_KEYS.OFFICE_LOGO,
  ];

  // P0 #1 — حدود وتحقق استعادة النسخة الاحتياطية
  const MAX_BACKUP_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const BACKUP_DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];
  const BACKUP_JSON_KEYS = new Set([
    KEYS.transactions,
    KEYS.commissions,
    KEYS.drafts,
    KEYS.settings,
    KEYS.properties,
    KEYS.units,
    KEYS.contacts,
    KEYS.contracts,
    KEYS.contractPayments,
    'ff_ledgers',
    'ff_recurring_items',
  ]);

  const pad2 = (n) => String(n).padStart(2, '0');
  const formatBackupFilename = (d) => {
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    return `qaydalaqar-backup-${yyyy}${mm}${dd}-${hh}${min}.json`;
  };

  // SPR-010: تصدير ذكي — سحابي يجلب من DataContext، محلي من localStorage
  const handleExportBackup = () => {
    const now = new Date();
    let data;

    if (isCloudMode) {
      // في الوضع السحابي: نجمع البيانات من DataContext (Supabase) مباشرة
      data = {
        [KEYS.transactions]: transactions || [],
        [KEYS.commissions]: commissions || [],
        ff_ledgers: ledgers || [],
        ff_recurring_items: recurringItems || [],
        [KEYS.contractPayments]: contractPayments || [],
        [KEYS.settings]: settings,
      };
      // نضيف أيضاً إعدادات UI المحلية
      [UI_THEME_KEY, UI_NUMERALS_KEY, UI_DATE_HEADER_KEY].forEach((k) => {
        try {
          const v = storageFacade.getRaw(k);
          if (v != null) data[k] = v;
        } catch {}
      });
    } else {
      // في الوضع المحلي: نقرأ كل شيء من localStorage
      data = {};
      const keys = getBackupAppKeys();
      keys.forEach((k) => {
        try {
          const v = storageFacade.getRaw(k);
          if (v != null) data[k] = v;
        } catch {}
      });
    }

    const envelope = {
      app: 'qaydalaqar-finance-flow',
      schema: 1,
      exported_at: new Date().toISOString(),
      source: isCloudMode ? 'cloud' : 'local',
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

  const handleImportBackupClick = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > MAX_BACKUP_FILE_SIZE) {
      toast.error('الملف كبير جداً (الحد 10 ميجا). اختر ملفاً أصغر أو صدّر نسخة أقل.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let envelope;
      try {
        envelope = JSON.parse(reader.result);
      } catch {
        toast.error('ملف غير صالح (ليس JSON)');
        return;
      }

      const ok =
        envelope &&
        envelope.app === 'qaydalaqar-finance-flow' &&
        envelope.schema === 1 &&
        envelope.data &&
        typeof envelope.data === 'object';
      if (!ok) {
        toast.error('تنسيق النسخة الاحتياطية غير صحيح (app/schema)');
        return;
      }

      const allowedKeys = new Set(getBackupAppKeys());
      const safeData = {};
      for (const k of Object.keys(envelope.data)) {
        if (BACKUP_DANGEROUS_KEYS.includes(k)) continue;
        if (!allowedKeys.has(k)) continue;
        safeData[k] = envelope.data[k];
      }
      importDataRef.current = safeData;
      const keys = getBackupAppKeys();
      const current = {};
      keys.forEach((k) => {
        try {
          current[k] = storageFacade.getRaw(k);
        } catch {
          current[k] = null;
        }
      });

      let changeCount = 0;
      keys.forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(safeData, k)) return;
        const cur = current[k];
        const nextVal = safeData[k];
        const next =
          nextVal == null
            ? null
            : BACKUP_JSON_KEYS.has(k) &&
                (Array.isArray(nextVal) || (typeof nextVal === 'object' && nextVal !== null))
              ? JSON.stringify(nextVal)
              : String(nextVal);
        if ((cur ?? null) !== (next ?? null)) changeCount++;
      });

      setConfirm({
        title: 'استعادة نسخة احتياطية',
        message: `سيتم استبدال البيانات الحالية (${formatNumber(changeCount, { maximumFractionDigits: 0 })} مفاتيح). هل أنت متأكد؟`,
        danger: true,
        confirmLabel: 'نعم، استبدل البيانات',
        onConfirm: () => {
          const d = importDataRef.current;
          if (!d || typeof d !== 'object') {
            setConfirm(null);
            return;
          }

          const keysToRestore = getBackupAppKeys();
          const backup = {};
          keysToRestore.forEach((k) => {
            try {
              backup[k] = storageFacade.getRaw(k);
            } catch {
              backup[k] = null;
            }
          });

          let writeFailed = false;
          try {
            storageFacade.removeMany(keysToRestore);
            for (const k of keysToRestore) {
              if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
              const v = d[k];
              if (BACKUP_JSON_KEYS.has(k) && (Array.isArray(v) || (v && typeof v === 'object'))) {
                if (!storageFacade.setJSON(k, v)) {
                  writeFailed = true;
                  break;
                }
              } else {
                const str = typeof v === 'string' ? v : v != null ? JSON.stringify(v) : '';
                if (!storageFacade.setRaw(k, str)) {
                  writeFailed = true;
                  break;
                }
              }
            }
          } catch {
            writeFailed = true;
          }

          if (writeFailed) {
            keysToRestore.forEach((k) => {
              try {
                if (backup[k] == null) storageFacade.removeRaw(k);
                else storageFacade.setRaw(k, backup[k]);
              } catch {}
            });
            toast.error('فشلت الاستعادة. تمت استعادة الحالة السابقة. (مثلاً: التخزين ممتلئ)');
            setConfirm(null);
            return;
          }

          setConfirm(null);
          window.location.reload();
        },
      });
    };
    reader.readAsText(file, 'UTF-8');
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
      {/* Phase 9.1 — Data Warning Notice (LocalStorage only) */}
      {!isCloudMode && (
        <div
          className="rounded-xl p-5 shadow-sm mb-6 no-print"
          role="alert"
          aria-labelledby="data-warning-title"
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            borderColor: 'var(--color-warning-border)',
            borderWidth: '1px',
          }}
        >
          <h3
            id="data-warning-title"
            className="font-bold mb-3"
            style={{ color: 'var(--color-warning)' }}
          >
            ملاحظة مهمة
          </h3>
          <ul
            className="text-sm space-y-1.5 list-disc list-inside"
            style={{ color: 'var(--color-warning-text)' }}
          >
            <li>البيانات محفوظة على هذا الجهاز فقط (LocalStorage)</li>
            <li>مسح بيانات المتصفح/الموقع يحذف كل شيء</li>
            <li>لا تستخدم على جهاز مشترك</li>
            <li>يُنصح بتصدير نسخة احتياطية دوريًا</li>
          </ul>
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
          {isCloudMode
            ? 'بياناتك محفوظة تلقائياً في السحابة. يمكنك تصدير نسخة احتياطية محلية للاحتفاظ بها.'
            : 'صدّر نسخة احتياطية إلى ملف JSON أو استعد نسخة سابقة (استبدال كامل للبيانات الحالية).'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-75 flex items-center gap-2"
            style={{ borderColor: 'var(--color-info)', color: 'var(--color-info)' }}
            aria-label="تنزيل نسخة احتياطية JSON"
          >
            <Icons.download size={16} />{' '}
            {isCloudMode ? 'تصدير نسخة من السحابة (JSON)' : 'تنزيل نسخة احتياطية (JSON)'}
          </button>
          {!isCloudMode && (
            <button
              type="button"
              onClick={handleImportBackupClick}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] text-sm font-medium hover:bg-[var(--color-bg)] flex items-center gap-2"
              aria-label="استعادة نسخة احتياطية"
            >
              <Icons.fileText size={16} /> استعادة من نسخة احتياطية
            </button>
          )}
        </div>
        {isCloudMode ? (
          <p className="text-xs text-[var(--color-muted)] mt-2">
            التصدير يحفظ نسخة من بيانات السحابة على جهازك.
          </p>
        ) : (
          <p className="text-xs text-[var(--color-muted)] mt-2">
            النسخ الاحتياطي لا يرسل بيانات للسحابة.
          </p>
        )}

        {/* SPR-008: قسم المزامنة ديناميكي حسب وضع التخزين */}
        {isCloudMode ? (
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
        ) : (
          <div
            className="mt-4 rounded-xl border border-[var(--color-border)] p-4"
            aria-label="المزامنة السحابية"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-[var(--color-text)]">المزامنة السحابية</div>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-warning-bg)',
                  color: 'var(--color-warning)',
                  borderWidth: '1px',
                  borderColor: 'var(--color-warning-border)',
                }}
              >
                غير مُفعّل
              </span>
            </div>
            <p className="text-sm text-[var(--color-muted)] mt-2">
              لتفعيل المزامنة السحابية بين أجهزتك، سجّل حساباً وفعّل الاتصال بالسحابة.
            </p>
          </div>
        )}

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
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleResetDemo}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-75"
            style={{ borderColor: 'var(--color-info)', color: 'var(--color-info)' }}
            aria-label="إعادة بيانات الديمو"
          >
            إعادة بيانات الديمو
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
