/*
  صفحة الإعدادات — مستخرجة من App.jsx (الخطوة 7)
*/
import React, { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';
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
import { KEYS, SEED_SETTINGS, STORAGE_ERROR_MESSAGE, MSG } from '../constants/index.js';
import { STORAGE_KEYS } from '../../assets/js/core/keys.js';
import { SettingsField, Icons } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { formatNumber } from '../utils/format.jsx';
import { safeNum } from '../utils/helpers.js';

export function SettingsPage({ onShowOnboarding }) {
  const toast = useToast();
  const [settings, setSettings] = useState(dataStore.settings.get());
  const [uiTheme, setUiTheme] = useState(getSavedTheme() || 'system');
  const [uiNumerals, setUiNumerals] = useState(getSavedNumerals() || document.documentElement.dataset.numerals || 'ar');
  const [confirm, setConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const importDataRef = useRef(null);

  const handleSave = () => {
    const res = dataStore.settings.update(settings);
    if (!res.ok) { toast(res.message, 'error'); return; }
    toast(MSG.success.saved);
  };

  const handleResetDemo = () => {
    setConfirm({ title:'إعادة بيانات الديمو', message:'سيتم استبدال جميع البيانات ببيانات الديمو. هل أنت متأكد؟', onConfirm: () => {
      const res = dataStore.seed.resetDemo();
      if (!res.ok) { toast(res.message, 'error'); setConfirm(null); return; }
      setSettings(dataStore.settings.get());
      initTheme();
      toast('تمت إعادة بيانات الديمو');
      setConfirm(null);
    }});
  };

  const handleClearAll = () => {
    const txCount = dataStore.transactions.list().length;
    const cmCount = dataStore.commissions.list().length;
    const draftCount = (safeGet(KEYS.drafts, [])).length;
    setConfirm({
      title: 'حذف جميع البيانات',
      message: 'سيتم حذف جميع البيانات المحفوظة:',
      messageList: [
        `جميع الحركات المالية (${formatNumber(txCount, { maximumFractionDigits: 0 })})`,
        `جميع العمولات (${formatNumber(cmCount, { maximumFractionDigits: 0 })})`,
        `جميع المسودات (${formatNumber(draftCount, { maximumFractionDigits: 0 })})`,
        'جميع الإعدادات'
      ],
      dangerText: 'لا يمكن التراجع عن هذا الإجراء.',
      confirmLabel: 'نعم، احذف كل شيء',
      danger: true,
      onConfirm: () => {
        dataStore.seed.clearAll();
        setSettings(SEED_SETTINGS);
        initTheme();
        toast('تم حذف جميع البيانات');
        setConfirm(null);
      }
    });
  };

  const getBackupAppKeys = () => ([
    // Financial/local data keys
    KEYS.transactions,
    KEYS.commissions,
    KEYS.drafts,
    KEYS.settings,
    KEYS.seeded,

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
    STORAGE_KEYS.UI_WELCOME
  ]);

  // P0 #1 — حدود وتحقق استعادة النسخة الاحتياطية
  const MAX_BACKUP_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const BACKUP_DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];
  const BACKUP_JSON_KEYS = new Set([KEYS.transactions, KEYS.commissions, KEYS.drafts, KEYS.settings, 'ff_ledgers', 'ff_recurring_items']);

  const pad2 = (n) => String(n).padStart(2, '0');
  const formatBackupFilename = (d) => {
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const min = pad2(d.getMinutes());
    return `qaydalaqar-backup-${yyyy}${mm}${dd}-${hh}${min}.json`;
  };

  const handleExportBackup = () => {
    const now = new Date();
    const keys = getBackupAppKeys();
    const data = {};
    keys.forEach((k) => {
      try {
        const v = storageFacade.getRaw(k);
        if (v != null) data[k] = v;
      } catch {
        // ignore
      }
    });

    const envelope = {
      app: 'qaydalaqar-finance-flow',
      schema: 1,
      exported_at: new Date().toISOString(),
      data
    };

    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formatBackupFilename(now);
    a.click();
    URL.revokeObjectURL(url);
    toast('تم تنزيل النسخة الاحتياطية');
  };

  const handleImportBackupClick = () => { fileInputRef.current && fileInputRef.current.click(); };

  const handleImportFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > MAX_BACKUP_FILE_SIZE) {
      toast('الملف كبير جداً (الحد 10 ميجا). اختر ملفاً أصغر أو صدّر نسخة أقل.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let envelope;
      try { envelope = JSON.parse(reader.result); } catch {
        toast('ملف غير صالح (ليس JSON)', 'error');
        return;
      }

      const ok = envelope && envelope.app === 'qaydalaqar-finance-flow' && envelope.schema === 1 && envelope.data && typeof envelope.data === 'object';
      if (!ok) {
        toast('تنسيق النسخة الاحتياطية غير صحيح (app/schema)', 'error');
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
        try { current[k] = storageFacade.getRaw(k); } catch { current[k] = null; }
      });

      let changeCount = 0;
      keys.forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(safeData, k)) return;
        const cur = current[k];
        const nextVal = safeData[k];
        const next = nextVal == null ? null : (BACKUP_JSON_KEYS.has(k) && (Array.isArray(nextVal) || (typeof nextVal === 'object' && nextVal !== null)) ? JSON.stringify(nextVal) : String(nextVal));
        if ((cur ?? null) !== (next ?? null)) changeCount++;
      });

      setConfirm({
        title: 'استعادة نسخة احتياطية',
        message: `سيتم استبدال البيانات الحالية (${formatNumber(changeCount, { maximumFractionDigits: 0 })} مفاتيح). هل أنت متأكد؟`,
        danger: true,
        confirmLabel: 'نعم، استبدل البيانات',
        onConfirm: () => {
          const d = importDataRef.current;
          if (!d || typeof d !== 'object') { setConfirm(null); return; }

          const keysToRestore = getBackupAppKeys();
          const backup = {};
          keysToRestore.forEach((k) => {
            try { backup[k] = storageFacade.getRaw(k); } catch { backup[k] = null; }
          });

          let writeFailed = false;
          try {
            storageFacade.removeMany(keysToRestore);
            for (const k of keysToRestore) {
              if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
              const v = d[k];
              if (BACKUP_JSON_KEYS.has(k) && (Array.isArray(v) || (v && typeof v === 'object'))) {
                if (!storageFacade.setJSON(k, v)) { writeFailed = true; break; }
              } else {
                const str = typeof v === 'string' ? v : (v != null ? JSON.stringify(v) : '');
                if (!storageFacade.setRaw(k, str)) { writeFailed = true; break; }
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
            toast('فشلت الاستعادة. تمت استعادة الحالة السابقة. (مثلاً: التخزين ممتلئ)', 'error');
            setConfirm(null);
            return;
          }

          setConfirm(null);
          window.location.reload();
        }
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Phase 9.1 — Data Warning Notice (LocalStorage) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm mb-6 no-print" role="alert" aria-labelledby="data-warning-title">
        <h3 id="data-warning-title" className="font-bold text-amber-800 mb-3">
          ملاحظة مهمة
        </h3>
        <ul className="text-sm text-amber-900 space-y-1.5 list-disc list-inside">
          <li>البيانات محفوظة على هذا الجهاز فقط (LocalStorage)</li>
          <li>مسح بيانات المتصفح/الموقع يحذف كل شيء</li>
          <li>لا تستخدم على جهاز مشترك</li>
          <li>يُنصح بتصدير نسخة احتياطية دوريًا</li>
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4">وضع العرض</h3>
        <SettingsField label="المظهر">
          <select value={uiTheme} onChange={e => { const v = e.target.value; setUiTheme(v); applyTheme(v); toast('تم تحديث المظهر'); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="وضع العرض">
            <option value="system">النظام</option>
            <option value="light">نهاري</option>
            <option value="dim">خافت</option>
            <option value="dark">ليلي</option>
          </select>
        </SettingsField>
        <SettingsField label="عرض الأرقام">
          <select value={uiNumerals} onChange={e => { const v = e.target.value; setUiNumerals(v); applyNumerals(v); toast('تم تحديث عرض الأرقام'); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="عرض الأرقام">
            <option value="ar">عربي</option>
            <option value="en">إنجليزي</option>
          </select>
        </SettingsField>
        <SettingsField label="عرض التاريخ">
          <select value={(getSavedDateHeader() || 'both')} onChange={e => { const v = e.target.value; setDateHeaderPref(v); toast('تم تحديث إعداد التاريخ'); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label="عرض التاريخ">
            <option value="off">بدون</option>
            <option value="greg">ميلادي</option>
            <option value="hijri">هجري</option>
            <option value="both">ميلادي + هجري</option>
          </select>
        </SettingsField>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => {
            try { storageFacade.removeRaw(UI_THEME_KEY); } catch {}
            setUiTheme('system');
            applyTheme('system');
            toast('تمت إعادة ضبط المظهر');
          }} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="إعادة ضبط المظهر">
            إعادة ضبط المظهر
          </button>

          <button type="button" onClick={() => {
            if (typeof onShowOnboarding === 'function') onShowOnboarding();
            toast('سيتم عرض شاشة الترحيب');
          }} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50" aria-label="إعادة عرض شاشة الترحيب">
            إعادة عرض شاشة الترحيب
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4">معلومات المكتب</h3>
        <SettingsField label="اسم المكتب">
          <input type="text" value={settings.officeName} onChange={e => setSettings(s => ({...s, officeName:e.target.value}))} maxLength={120} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="اسم المكتب"/>
        </SettingsField>
        <div className="grid grid-cols-2 gap-3">
          <SettingsField label="رقم الهاتف">
            <input type="tel" value={settings.phone||''} onChange={e => setSettings(s => ({...s, phone:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="رقم الهاتف"/>
          </SettingsField>
          <SettingsField label="البريد الإلكتروني">
            <input type="email" value={settings.email||''} onChange={e => setSettings(s => ({...s, email:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="البريد الإلكتروني"/>
          </SettingsField>
        </div>
        <SettingsField label="نسبة العمولة الافتراضية للمكتب (%)">
          <input type="number" min="0" max="100" step="0.5" value={settings.defaultCommissionPercent} onChange={e => setSettings(s => ({...s, defaultCommissionPercent:safeNum(e.target.value, 50)}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label="نسبة العمولة الافتراضية"/>
          <p className="text-xs text-gray-400 mt-1">تؤثر على العمولات الجديدة فقط</p>
        </SettingsField>
        <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ الإعدادات">حفظ الإعدادات</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-4">النسخ الاحتياطي</h3>
        <p className="text-sm text-gray-600 mb-4">صدّر نسخة احتياطية إلى ملف JSON أو استعد نسخة سابقة (استبدال كامل للبيانات الحالية).</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleExportBackup} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 flex items-center gap-2" aria-label="تنزيل نسخة احتياطية JSON">
            <Icons.download size={16}/> تنزيل نسخة احتياطية (JSON)
          </button>
          <button type="button" onClick={handleImportBackupClick} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center gap-2" aria-label="استعادة نسخة احتياطية">
            <Icons.fileText size={16}/> استعادة من نسخة احتياطية
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">النسخ الاحتياطي لا يرسل بيانات للسحابة.</p>

        <div className="mt-4 rounded-xl border border-gray-100 p-4" aria-label="المزامنة السحابية">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-gray-900">المزامنة السحابية (Pro) — قريبًا</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Pro</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">مزامنة بياناتك بين أكثر من جهاز مع تسجيل دخول آمن.</p>
        </div>

        <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImportFileChange} className="hidden" aria-hidden="true"/>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">إدارة البيانات</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleResetDemo} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50" aria-label="إعادة بيانات الديمو">إعادة بيانات الديمو</button>
          <button onClick={handleClearAll} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50" aria-label="حذف جميع البيانات">حذف جميع البيانات</button>
        </div>
      </div>

      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} messageList={confirm?.messageList} dangerText={confirm?.dangerText} confirmLabel={confirm?.confirmLabel} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger={confirm?.danger}/>
    </div>
  );
}
