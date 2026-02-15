/*
  صفحة قوالب الخطابات — مستخرجة من App.jsx (الخطوة 3)
*/
import React from 'react';
import { TEMPLATES } from '../domain/index.js';
import { Icons } from '../ui/ui-common.jsx';

export function TemplatesPage({ setPage, setLetterType }) {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map(t => (
          <div key={t.type} className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 flex items-start gap-3 md:gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-blue-600"><Icons.fileText size={20}/></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 mb-0.5">{t.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{t.desc}</p>
              <button onClick={() => { setLetterType(t.type); setPage('generator'); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label={`استخدام ${t.title}`}>استخدام القالب</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
