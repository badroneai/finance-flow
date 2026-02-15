/*
  صفحة المسودات — مستخرجة من App.jsx (الخطوة 5)
*/
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext.jsx';
import { dataStore } from '../core/dataStore.js';
import { formatDraftDate } from '../domain/index.js';
import { LETTER_TYPES } from '../constants/index.js';
import { MSG } from '../constants/index.js';
import { EmptyState, Icons } from '../ui/ui-common.jsx';
import { ConfirmDialog } from '../ui/Modals.jsx';
import { formatDateHeader } from '../utils/dateFormat.js';

export function DraftsPage({ setPage, setLetterType, setEditDraft }) {
  const toast = useToast();
  const [drafts, setDrafts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const refresh = useCallback(() => setDrafts(dataStore.letters.listDrafts()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = (id) => {
    setConfirm({ title:'حذف المسودة', message: MSG.confirm.deleteAction + ' سيتم حذف هذه المسودة نهائياً.', onConfirm: () => {
      const res = dataStore.letters.removeDraft(id);
      if (!res.ok) { toast(res.message, 'error'); setConfirm(null); return; }
      toast(MSG.success.deleted); setConfirm(null); refresh();
    }});
  };

  const handleEdit = (draft) => {
    setLetterType(draft.templateType);
    setEditDraft(draft);
    setPage('generator');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {drafts.length === 0 ? (
        <EmptyState message="لا توجد مسودات محفوظة"/>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {drafts.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <button onClick={() => handleDelete(d.id)} className="absolute top-2 left-2 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" aria-label="حذف المسودة نهائياً"><Icons.trash size={16}/></button>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-blue-600"><Icons.fileText size={20}/></div>
              <h3 className="font-bold text-gray-900 mb-1">{LETTER_TYPES[d.templateType]}</h3>
              <p className="text-sm text-gray-500 mb-2">{d.fields?.officeName || ''} — {d.fields?.recipientOrg || d.fields?.recipientName || d.fields?.delegateName || ''}</p>
              <p className="text-sm text-gray-500 mb-4">{formatDraftDate(d.updatedAt, formatDateHeader)}</p>
              <button onClick={() => handleEdit(d)} className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700" aria-label="فتح المسودة">فتح المسودة</button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!confirm} title={confirm?.title} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} danger/>
    </div>
  );
}
