// useRecurringCRUD — CRUD حالة ومعالجات الالتزامات المتكررة والميزانيات
import { useState } from 'react';
import { setRecurringItems } from '../../core/ledger-store.js';
import { pushHistoryEntry } from '../../core/ledger-item-history.js';
import { isValidDateStr } from '../../utils/helpers.js';
import { parseRecurringAmount } from './ledger-helpers.js';

/**
 * @param {object} deps
 * @param {Function} deps.toast
 * @param {string} deps.activeId
 * @param {Array} deps.ledgers
 * @param {Array} deps.recurring
 * @param {Function} deps.setRecurringState
 * @param {Function} deps.updateDataLedger
 * @param {Function} deps.updateRecurringItem
 * @param {Function} deps.deleteRecurringItem
 * @param {Function} deps.refresh
 * @param {Function} deps.setConfirm
 */
export default function useRecurringCRUD({
  toast,
  activeId,
  ledgers,
  recurring,
  setRecurringState,
  updateDataLedger,
  updateRecurringItem,
  deleteRecurringItem,
  refresh,
  setConfirm,
}) {
  const [recForm, setRecForm] = useState({
    title: '',
    amount: '',
    frequency: 'monthly',
    nextDueDate: '',
    notes: '',
  });
  const [recEditingId, setRecEditingId] = useState(null);
  const [budgetForm, setBudgetForm] = useState({ monthlyTarget: '', yearlyTarget: '' });

  const resetRecForm = () =>
    setRecForm({ title: '', amount: '', frequency: 'monthly', nextDueDate: '', notes: '' });

  const startEditRecurring = (item) => {
    setRecEditingId(item.id);
    setRecForm({
      title: item.title || '',
      amount: String(item.amount ?? ''),
      frequency: item.frequency || 'monthly',
      nextDueDate: item.nextDueDate || '',
      notes: item.notes || '',
    });
  };

  const saveRecurring = () => {
    if (!activeId) {
      toast.error('اختر دفترًا نشطًا أولًا');
      return;
    }

    const title = (recForm.title || '').trim();
    if (!title) {
      toast.error('اسم الالتزام مطلوب');
      return;
    }

    const amount = parseRecurringAmount(recForm.amount);
    if (!Number.isFinite(amount)) {
      toast.error('المبلغ غير صالح');
      return;
    }

    const freq =
      recForm.frequency === 'monthly' ||
      recForm.frequency === 'quarterly' ||
      recForm.frequency === 'yearly' ||
      recForm.frequency === 'adhoc'
        ? recForm.frequency
        : 'monthly';
    const nextDueDate = String(recForm.nextDueDate || '').trim();
    if (!nextDueDate) {
      toast.error('تاريخ الاستحقاق القادم مطلوب');
      return;
    }
    if (!isValidDateStr(nextDueDate)) {
      toast.error('تاريخ الاستحقاق القادم غير صالح');
      return;
    }

    const ts = new Date().toISOString();
    const id =
      recEditingId ||
      (() => {
        try {
          if (crypto && typeof crypto.randomUUID === 'function')
            return `rec_${crypto.randomUUID()}`;
        } catch {}
        return `rec_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      })();

    const next = (() => {
      const list = Array.isArray(recurring) ? recurring : [];
      if (!recEditingId) {
        return [
          ...list,
          {
            id,
            ledgerId: activeId,
            title,
            category: '',
            amount,
            frequency: freq,
            nextDueDate,
            notes: String(recForm.notes || ''),
            createdAt: ts,
            updatedAt: ts,
          },
        ];
      }
      return list.map((r) =>
        r.id === recEditingId
          ? {
              ...r,
              title,
              amount,
              frequency: freq,
              nextDueDate,
              notes: String(recForm.notes || ''),
              updatedAt: ts,
            }
          : r
      );
    })();

    try {
      setRecurringItems(next);
    } catch {
      toast.error('تعذر حفظ الالتزام');
      return;
    }

    toast.success(recEditingId ? 'تم تحديث الالتزام' : 'تمت إضافة الالتزام');
    setRecEditingId(null);
    resetRecForm();
    refresh();
  };

  const deleteRecurring = (id) => {
    const item = (Array.isArray(recurring) ? recurring : []).find((r) => r.id === id);
    const itemName = item?.title || 'الالتزام';
    setConfirm({
      title: 'حذف الالتزام',
      message: `هل أنت متأكد من حذف "${itemName}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmLabel: 'نعم، احذف',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteRecurringItem(id);
        } catch {
          toast.error('تعذر حذف الالتزام');
          setConfirm(null);
          return;
        }
        toast.success('تم حذف الالتزام');
        setConfirm(null);
        refresh();
      },
    });
  };

  const updateRecurringOps = async (itemId, patch = {}, historyEntry = null) => {
    const list = Array.isArray(recurring) ? recurring : [];
    const ts = new Date().toISOString();
    let updated = { ...patch, updatedAt: ts };
    if (historyEntry) {
      const item = list.find((r) => r.id === itemId);
      if (item) {
        updated = pushHistoryEntry(
          { ...item, ...updated },
          { ...historyEntry, at: historyEntry.at || ts }
        );
      }
    }
    try {
      await updateRecurringItem(itemId, updated);
    } catch {
      toast.error('تعذر حفظ حالة العنصر');
      return false;
    }
    setRecurringState(list.map((r) => (r.id === itemId ? { ...r, ...updated } : r)));
    return true;
  };

  const saveLedgerBudgets = async (patch = {}) => {
    if (!activeId) return false;
    if (patch.monthlyTarget !== undefined) {
      const s = String(patch.monthlyTarget).trim();
      if (s !== '' && !Number.isFinite(Number(s))) {
        toast.error('قيمة الهدف الشهري غير صالحة. أدخل رقماً.');
        return false;
      }
    }
    if (patch.yearlyTarget !== undefined) {
      const s = String(patch.yearlyTarget).trim();
      if (s !== '' && !Number.isFinite(Number(s))) {
        toast.error('قيمة الهدف السنوي غير صالحة. أدخل رقماً.');
        return false;
      }
    }
    const currentLedger = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === activeId);
    if (!currentLedger) return false;
    const ts = new Date().toISOString();
    try {
      await updateDataLedger(activeId, {
        budgets: { ...(currentLedger.budgets || {}), ...patch },
        updatedAt: ts,
      });
    } catch {
      toast.error('تعذر حفظ الميزانيات');
      return false;
    }
    toast.success('تم حفظ الميزانيات');
    refresh();
    return true;
  };

  return {
    recForm,
    setRecForm,
    recEditingId,
    setRecEditingId,
    budgetForm,
    setBudgetForm,
    resetRecForm,
    startEditRecurring,
    saveRecurring,
    deleteRecurring,
    updateRecurringOps,
    saveLedgerBudgets,
  };
}
