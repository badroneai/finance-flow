/*
  صفحة إنشاء الخطاب (محرر الخطابات) — مستخرجة من App.jsx (الخطوة 5)
*/
import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';
import { dataStore } from '../core/dataStore.js';
import {
  getTemplateByType,
  buildInitialFields,
  validateLetterFields,
  TEMPLATES,
  FIELD_LABELS,
} from '../domain/index.js';
import { MSG } from '../constants/index.js';
import { today } from '../utils/helpers.js';
import { formatDateHeader } from '../utils/dateFormat.js';
import { Icons } from '../ui/ui-common.jsx';

export function GeneratorPage({ letterType, setLetterType }) {
  const toast = useToast();
  const template = getTemplateByType(letterType);
  const settings = dataStore.settings.get();
  const [fields, setFields] = useState(() => buildInitialFields(template, { officeName: settings.officeName, today: today() }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFields(buildInitialFields(template, { officeName: settings.officeName, today: today() }));
  }, [letterType]);

  const validate = () => {
    const errs = validateLetterFields(template, fields, FIELD_LABELS);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    const res = dataStore.letters.saveDraft({ templateType: template.type, fields: { ...fields } });
    if (!res.ok) { toast(res.message, 'error'); return; }
    toast(MSG.success.saved);
  };

  const renderPreview = () => {
    const f = fields;
    if (template.type === 'intro') return (
      <div className="space-y-4 text-gray-900 leading-relaxed">
        <div className="text-center mb-6"><h2 className="text-xl font-bold">{f.officeName || '___'}</h2></div>
        <p>التاريخ: {f.date ? formatDateHeader(f.date) : '___'}</p>
        <p>إلى السيد/ة: {f.recipientName || '___'}</p>
        <p>الجهة: {f.recipientOrg || '___'}</p>
        <p className="mt-4">السلام عليكم ورحمة الله وبركاته،</p>
        <p>{f.body || '___'}</p>
        <p>وتفضلوا بقبول فائق الاحترام والتقدير،</p>
        <p className="mt-4 font-bold">{f.managerName || '___'}</p>
        <p>المدير العام</p>
      </div>
    );
    if (template.type === 'request') return (
      <div className="space-y-4 text-gray-900 leading-relaxed">
        <div className="text-center mb-6"><h2 className="text-xl font-bold">{f.officeName || '___'}</h2></div>
        <p>التاريخ: {f.date ? formatDateHeader(f.date) : '___'}</p>
        <p>إلى: {f.recipientOrg || '___'}</p>
        <p className="font-bold">الموضوع: {f.subject || '___'}</p>
        <p className="mt-4">السلام عليكم ورحمة الله وبركاته،</p>
        <p>{f.body || '___'}</p>
        <p>وتفضلوا بقبول فائق الاحترام والتقدير،</p>
        <p className="mt-4 font-bold">{f.managerName || '___'}</p>
        <p>المدير العام</p>
      </div>
    );
    return (
      <div className="space-y-4 text-gray-900 leading-relaxed">
        <div className="text-center mb-6"><h2 className="text-xl font-bold">{f.officeName || '___'}</h2></div>
        <p>التاريخ: {f.date ? formatDateHeader(f.date) : '___'}</p>
        <h3 className="font-bold text-center text-lg mt-4">خطاب تفويض</h3>
        <p className="mt-4">نحن {f.officeName || '___'} نفوّض السيد/ة <strong>{f.delegateName || '___'}</strong> صاحب/ة الهوية رقم <strong>{f.delegateId || '___'}</strong> بـ {f.purpose || '___'}. وهذا التفويض ساري المفعول من تاريخه حتى إشعار آخر.</p>
        {f.body?.trim() ? <p>{f.body}</p> : null}
        <p>وتفضلوا بقبول فائق الاحترام والتقدير،</p>
        <p className="mt-4 font-bold">{f.managerName || '___'}</p>
        <p>المدير العام</p>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Template selector */}
      <div className="flex gap-2 mb-4 no-print">
        {TEMPLATES.map(t => (
          <button key={t.type} onClick={() => setLetterType(t.type)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${letterType === t.type ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`} aria-label={t.title}>{t.title}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 no-print">
          <h3 className="font-bold mb-4">تعبئة البيانات</h3>
          {template.fields.map(k => (
            <div key={k} className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{FIELD_LABELS[k]}</label>
              {k === 'body' ? (
                <textarea value={fields[k]||''} onChange={e => setFields(f => ({...f, [k]:e.target.value}))} rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label={FIELD_LABELS[k]}/>
              ) : k === 'date' ? (
                <input type="date" value={fields[k]||''} onChange={e => setFields(f => ({...f, [k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label={FIELD_LABELS[k]}/>
              ) : (
                <input type="text" value={fields[k]||''} onChange={e => setFields(f => ({...f, [k]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" aria-label={FIELD_LABELS[k]}/>
              )}
              {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveDraft} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="حفظ كمسودة">حفظ كمسودة</button>
            <button onClick={() => { if (validate()) window.print(); }} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5" aria-label="طباعة"><Icons.printer size={14}/>طباعة</button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 print-container" style={{minHeight:'400px'}}>
          <div className="border border-gray-200 rounded-lg p-8" style={{fontFamily:'"Noto Sans Arabic", sans-serif'}}>
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
}
