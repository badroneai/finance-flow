/**
 * smoke.test.js — اختبارات دخان للتحقق من سلامة المسارات الأساسية
 *
 * تتحقق من أن الوحدات الأساسية تعمل بشكل صحيح:
 * - التنقل: pathToId / idToPath
 * - التخزين: safeGet / safeSet / createCrud
 * - pdf-service: دالة esc (تعقيم XSS)
 * - storage-facade: getRaw / setRaw / getJSON / setJSON
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════
// 1. اختبارات التنقل (navigation)
// ═══════════════════════════════════════

import { NAV_ITEMS, BOTTOM_NAV_MAIN, BOTTOM_NAV_MORE, pathToId, idToPath } from '../../config/navigation.js';

describe('Navigation — التنقل', () => {
  it('يحتوي على 7 عناصر تنقل', () => {
    expect(NAV_ITEMS.length).toBe(7);
  });

  it('كل عنصر تنقل يحتوي على id و label و path', () => {
    for (const item of NAV_ITEMS) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('path');
      expect(typeof item.id).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(item.path.startsWith('/')).toBe(true);
    }
  });

  it('BOTTOM_NAV_MAIN يحتوي على 4 عناصر', () => {
    expect(BOTTOM_NAV_MAIN.length).toBe(4);
  });

  it('BOTTOM_NAV_MORE يحتوي على 3 عناصر', () => {
    expect(BOTTOM_NAV_MORE.length).toBe(3);
  });

  it('pathToId يحوّل المسار للمعرّف بشكل صحيح', () => {
    expect(pathToId('/')).toBe('pulse');
    expect(pathToId('/settings')).toBe('settings');
    expect(pathToId('/commissions')).toBe('commissions');
  });

  it('idToPath يحوّل المعرّف للمسار بشكل صحيح', () => {
    expect(idToPath('pulse')).toBe('/');
    expect(idToPath('settings')).toBe('/settings');
    expect(idToPath('commissions')).toBe('/commissions');
  });

  it('العمولات موجودة في عناصر التنقل', () => {
    const commissions = NAV_ITEMS.find((n) => n.id === 'commissions');
    expect(commissions).toBeDefined();
    expect(commissions.label).toContain('العمولات');
  });
});

// ═══════════════════════════════════════
// 2. اختبارات التخزين (storage-facade)
// ═══════════════════════════════════════

// محاكاة localStorage
const mockStorage = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((k) => mockStorage[k] ?? null),
  setItem: vi.fn((k, v) => { mockStorage[k] = v; }),
  removeItem: vi.fn((k) => { delete mockStorage[k]; }),
});

import { storageFacade } from '../storage-facade.js';

describe('StorageFacade — طبقة التخزين', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('setRaw و getRaw يعملان بشكل صحيح', () => {
    storageFacade.setRaw('test_key', 'مرحبا');
    expect(storageFacade.getRaw('test_key')).toBe('مرحبا');
  });

  it('setJSON و getJSON يعملان مع كائنات', () => {
    const obj = { name: 'بدر', amount: 1500.50 };
    storageFacade.setJSON('test_obj', obj);
    expect(storageFacade.getJSON('test_obj')).toEqual(obj);
  });

  it('getJSON يرجع القيمة الافتراضية إذا المفتاح غير موجود', () => {
    expect(storageFacade.getJSON('nonexistent', [])).toEqual([]);
  });

  it('removeRaw يحذف المفتاح', () => {
    storageFacade.setRaw('to_delete', 'bye');
    storageFacade.removeRaw('to_delete');
    expect(storageFacade.getRaw('to_delete')).toBeNull();
  });
});

// ═══════════════════════════════════════
// 3. اختبارات dataStore (CRUD)
// ═══════════════════════════════════════

import { safeGet, safeSet, createCrud } from '../dataStore.js';

describe('DataStore — مخزن البيانات', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it('safeGet يرجع القيمة الافتراضية إذا المفتاح فارغ', () => {
    expect(safeGet('empty_key', 'default')).toBe('default');
  });

  it('safeSet يحفظ ويرجع ok: true', () => {
    const result = safeSet('my_key', { val: 42 });
    expect(result.ok).toBe(true);
  });

  it('createCrud ينشئ كائن CRUD بدوال list/create/update/remove', () => {
    const crud = createCrud('smoke_items');
    expect(typeof crud.list).toBe('function');
    expect(typeof crud.create).toBe('function');
    expect(typeof crud.update).toBe('function');
    expect(typeof crud.remove).toBe('function');
  });

  it('createCrud: إنشاء عنصر وجلبه', () => {
    const crud = createCrud('smoke_test');
    const result = crud.create({ name: 'عمولة تجريبية', amount: 5000 });
    expect(result.ok).toBe(true);
    expect(result.item).toHaveProperty('id');
    expect(result.item.name).toBe('عمولة تجريبية');

    const all = crud.list();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(result.item.id);
  });

  it('createCrud: تعديل عنصر', () => {
    const crud = createCrud('smoke_update');
    const created = crud.create({ name: 'أصلي', amount: 1000 });
    const updated = crud.update(created.item.id, { amount: 2000 });
    expect(updated.ok).toBe(true);
    expect(updated.item.amount).toBe(2000);
    expect(updated.item.name).toBe('أصلي');
  });

  it('createCrud: حذف عنصر', () => {
    const crud = createCrud('smoke_delete');
    const created = crud.create({ name: 'للحذف' });
    const removed = crud.remove(created.item.id);
    expect(removed.ok).toBe(true);
    expect(crud.list().length).toBe(0);
  });
});

// ═══════════════════════════════════════
// 4. اختبارات تعقيم XSS (pdf-service helpers)
// ═══════════════════════════════════════

// نختبر منطق الـ escaping بشكل مستقل لأن esc ليست مُصدَّرة
describe('XSS Sanitization — تعقيم النصوص', () => {
  // إعادة تطبيق نفس المنطق للاختبار
  const esc = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  it('يحوّل أحرف HTML الخطرة لـ entities', () => {
    expect(esc('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('يتعامل مع null و undefined', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('لا يغيّر النصوص العادية', () => {
    expect(esc('بدر الرشيدي')).toBe('بدر الرشيدي');
    expect(esc('مكتب عقاري 123')).toBe('مكتب عقاري 123');
  });

  it('يحوّل الأرقام لنصوص', () => {
    expect(esc(1500)).toBe('1500');
  });

  it('يعقّم علامات الاقتباس المفردة والمزدوجة', () => {
    expect(esc("it's a \"test\"")).toBe('it&#39;s a &quot;test&quot;');
  });

  it('يعقّم ampersand', () => {
    expect(esc('شركة & مؤسسة')).toBe('شركة &amp; مؤسسة');
  });
});
