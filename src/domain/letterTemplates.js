/*
  Domain: Letter templates
  Contains template metadata and default bodies (copied 1:1).
*/

/** نصوص خطاب كاملة افتراضية لكل قالب (مثل قالب مخاطبة جهة) */
export const DEFAULT_BODIES = {
  intro: 'يسعدنا أن نعرّف بأنفسنا كمكتب عقاري معتمد، ونقدّم خدماتنا في مجال التسويق وإدارة العقارات والاستشارات. نتطلع إلى التعاون معكم وخدمتكم بأفضل ما لدينا، مع ضمان الجدية والسرية في التعامل.',
  request: '',
  delegation: 'نفيدكم بأنه قد تم تفويض السيد/ة ________ صاحب/ة الهوية رقم ________ للقيام بـ ________ نيابة عن هذا المكتب. وهذا التفويض ساري المفعول من تاريخه حتى إشعار آخر.',
};

export const TEMPLATES = [
  { type:'intro', title:'خطاب تعريف بالمكتب', desc:'تعريف رسمي بالمكتب العقاري وخدماته', fields:['officeName','recipientName','recipientOrg','body','date','managerName'] },
  { type:'request', title:'خطاب مخاطبة جهة', desc:'مخاطبة رسمية لجهة حكومية أو خاصة', fields:['officeName','recipientOrg','subject','body','date','managerName'] },
  { type:'delegation', title:'خطاب تفويض', desc:'تفويض مندوب لتمثيل المكتب', fields:['officeName','delegateName','delegateId','purpose','body','date','managerName'] },
];

export const FIELD_LABELS = {
  officeName:'اسم المكتب', recipientName:'اسم المستلم', recipientOrg:'الجهة المستلمة', date:'التاريخ',
  managerName:'اسم المدير', subject:'الموضوع', body:'نص الخطاب', delegateName:'اسم المفوَّض', delegateId:'رقم الهوية', purpose:'الغرض من التفويض'
};

export function getTemplateByType(letterType) {
  return TEMPLATES.find(t => t.type === letterType) || TEMPLATES[0];
}

export function buildInitialFields(template, { officeName = '', today = '' } = {}) {
  const f = {};
  (template?.fields || []).forEach((k) => {
    if (k === 'officeName') f[k] = officeName;
    else if (k === 'date') f[k] = today;
    else if (k === 'body') f[k] = DEFAULT_BODIES[template.type] ?? '';
    else f[k] = '';
  });
  return f;
}
