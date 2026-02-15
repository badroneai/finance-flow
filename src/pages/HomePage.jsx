/*
  الصفحة الرئيسية — مستخرجة من App.jsx (الخطوة 3)
*/
import React from 'react';
import { dataStore } from '../core/dataStore.js';
import { Icons } from '../ui/ui-common.jsx';

export function HomePage({ setPage }) {
  const officeName = (dataStore.settings.get().officeName || '').trim();
  const subtitle = officeName || 'نظام متكامل لإدارة التدفقات المالية والخطابات للمكاتب العقارية';
  return (
  <div className="max-w-4xl mx-auto p-6">
    <div className="value-proposition">
      <h1 className="main-value">
        نظام مالي يجمع بين بساطة الإدارة وخصوصية البيانات
      </h1>
      <p className="sub-value">
        صُمم لمكاتب العقار والمستثمرين الأفراد لإدارة الدخل والمصروفات ومتابعة الأداء المالي بسهولة تامة
      </p>
    </div>
    <div className="text-center mb-12 mt-8">
      <div className="w-20 h-20 rounded-2xl bg-[#0F1C2E] mx-auto mb-6 flex items-center justify-center text-white shadow-md" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" width="48" height="48" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z"/>
          <path d="M62 30V24H68V36"/>
          <path d="M20 80H80" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" strokeOpacity="0.4" strokeWidth="1.5"/>
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">قيد العقار</h1>
      <p className="text-gray-500 text-lg">{subtitle}</p>
    </div>
    <div className="grid sm:grid-cols-2 gap-4 mb-8">
      {[
        { id:'dashboard', title:'لوحة المعلومات', desc:'نظرة شاملة على الأرقام والمؤشرات', icon:Icons.dashboard, color:'blue' },
        { id:'transactions', title:'الحركات المالية', desc:'تتبع الدخل والمصروفات', icon:Icons.list, color:'green' },
        { id:'commissions', title:'العمولات', desc:'إدارة العمولات وحصص الوكلاء', icon:Icons.percent, color:'yellow' },
        { id:'templates', title:'الخطابات', desc:'إنشاء وطباعة خطابات رسمية', icon:Icons.mail, color:'purple' },
      ].map(item => (
        <button key={item.id} onClick={() => setPage(item.id)} className="bg-white rounded-xl border border-gray-100 p-6 text-end hover:shadow-md hover:border-blue-200 transition-all group" aria-label={item.title}>
          <div className={`w-10 h-10 rounded-lg bg-${item.color}-50 flex items-center justify-center mb-3 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
            <item.icon size={20}/>
          </div>
          <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </button>
      ))}
    </div>
  </div>
  );
}
