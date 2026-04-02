// useLedgerCRUD — CRUD حالة ومعالجات الدفاتر
import { useState } from 'react';
import { getActiveLedgerId, setActiveLedgerId } from '../../core/ledger-store.js';

const normalizeLedgerType = (t) => {
  const x = String(t || '').toLowerCase();
  return x === 'office' ||
    x === 'chalet' ||
    x === 'apartment' ||
    x === 'villa' ||
    x === 'building' ||
    x === 'personal' ||
    x === 'other'
    ? x
    : 'office';
};

const normalizeNote = (s) => {
  const x = String(s ?? '').trim();
  if (!x) return '';
  return x.length > 120 ? x.slice(0, 120) : x;
};

/**
 * @param {object} deps
 * @param {Function} deps.toast
 * @param {Function} deps.createDataLedger
 * @param {Function} deps.updateDataLedger
 * @param {Function} deps.setDataActiveLedgerId
 * @param {Function} deps.refresh
 * @param {Array} deps.ledgers
 */
export default function useLedgerCRUD({
  toast,
  createDataLedger,
  updateDataLedger,
  setDataActiveLedgerId,
  refresh,
  ledgers,
}) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('office');
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState('office');
  const [editingNote, setEditingNote] = useState('');

  const createLedger = async () => {
    const t = (newName || '').trim();
    if (!t) {
      toast.error('اسم الدفتر مطلوب');
      return;
    }

    const ts = new Date().toISOString();
    const id = (() => {
      try {
        if (crypto && typeof crypto.randomUUID === 'function') return `ledg_${crypto.randomUUID()}`;
      } catch {}
      return `ledg_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    })();

    const newLedger = {
      id,
      name: t,
      type: normalizeLedgerType(newType),
      note: normalizeNote(newNote),
      currency: 'SAR',
      createdAt: ts,
      updatedAt: ts,
      archived: false,
    };

    try {
      await createDataLedger(newLedger);
    } catch {
      toast.error('تعذر حفظ الدفتر');
      return;
    }

    try {
      if (!getActiveLedgerId()) setDataActiveLedgerId(id);
    } catch {}

    setNewName('');
    setNewType('office');
    setNewNote('');
    toast.success('تمت إضافة الدفتر');
    refresh();
  };

  const startEdit = (ledger) => {
    setEditingId(ledger.id);
    setEditingName(ledger.name || '');
    setEditingType(normalizeLedgerType(ledger.type));
    setEditingNote(String(ledger.note ?? ''));
  };

  const saveEdit = async () => {
    const t = (editingName || '').trim();
    if (!t) {
      toast.error('اسم الدفتر مطلوب');
      return;
    }

    const ledgerToUpdate = (Array.isArray(ledgers) ? ledgers : []).find((l) => l.id === editingId);
    if (!ledgerToUpdate) {
      toast.error('لم يتم العثور على الدفتر');
      return;
    }

    try {
      await updateDataLedger(editingId, {
        name: t,
        type: normalizeLedgerType(editingType),
        note: normalizeNote(editingNote),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      toast.error('تعذر حفظ التعديل');
      return;
    }

    toast.success('تم تحديث الدفتر');
    setEditingId(null);
    setEditingName('');
    setEditingType('office');
    setEditingNote('');
    refresh();
  };

  const setActive = (id) => {
    try {
      setActiveLedgerId(id);
      setDataActiveLedgerId(id);
    } catch {
      toast.error('تعذر تعيين الدفتر النشط');
      return;
    }
    toast.success('تم تعيين الدفتر النشط');
    refresh();
  };

  return {
    newName,
    setNewName,
    newType,
    setNewType,
    newNote,
    setNewNote,
    editingId,
    setEditingId,
    editingName,
    setEditingName,
    editingType,
    setEditingType,
    editingNote,
    setEditingNote,
    createLedger,
    startEdit,
    saveEdit,
    setActive,
  };
}

export { normalizeLedgerType, normalizeNote };
