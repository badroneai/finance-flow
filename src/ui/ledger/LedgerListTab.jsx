// تبويب قائمة الدفاتر — إنشاء + عرض + تعديل + seed/demo
import { EmptyState, Badge } from '../ui-common.jsx';
import {
  filterTransactionsForLedgerByMeta,
  buildTxMetaFromRecurring,
} from '../../core/ledger-analytics.js';
import { seedRecurringForLedger } from '../../domain/ledgerTemplates.js';
import { today, safeNum } from '../../utils/helpers.js';

function LedgersSectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="ledgers-section-header">
      <div>
        <h2 className="ledgers-section-title">{title}</h2>
        {subtitle ? <p className="ledgers-section-subtitle">{subtitle}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="btn-ghost ledgers-section-action">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function LedgerListTab({
  ledgers,
  activeId,
  activeLedger,
  activeRecurringRaw,
  recurring,
  recurringDashboard,
  completeness,
  LEDGER_TYPE_LABELS,
  normalizeLedgerType,
  // CRUD
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
  // Seed/Demo
  setConfirm,
  createRecurringItem,
  applySaudiAutoPricingForLedger,
  createDataTransaction,
  allTransactionsRef,
  allTxsForLedgerCards,
  toast,
  refresh,
}) {
  return (
    <div id="tabpanel-ledgers" role="tabpanel" aria-labelledby="tab-ledgers" tabIndex={0}>
      <section className="ledgers-composer mb-6">
        <div className="panel-card ledgers-create-card">
          <LedgersSectionHeader
            title="إنشاء دفتر جديد"
            subtitle="ابدأ بإضافة دفتر جديد أو جهّز مساحة تشغيلية مختلفة لنشاط آخر."
          />
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                اسم الدفتر الجديد
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={120}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                aria-label="اسم الدفتر"
                placeholder="مثال: مكتب قيد العقار"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                اختر نوع الدفتر
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
                aria-label="نوع الدفتر"
              >
                <option value="office">مكتب</option>
                <option value="chalet">شاليه</option>
                <option value="apartment">شقة</option>
                <option value="villa">فيلا</option>
                <option value="building">عمارة</option>
                <option value="personal">شخصي</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                وصف مختصر (اختياري)
              </label>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                maxLength={200}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                aria-label="وصف مختصر"
                placeholder="وصف مختصر (اختياري)"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => createLedger()}
              className="btn-primary"
              aria-label="إضافة دفتر"
            >
              + إضافة دفتر
            </button>
          </div>
        </div>

        <aside className="panel-card ledgers-overview-card">
          <LedgersSectionHeader
            title="الدفتر النشط الآن"
            subtitle="هذه اللقطة تساعدك على معرفة أين تعمل حالياً قبل الانتقال للتبويبات الأخرى."
          />
          {activeLedger ? (
            <>
              <div className="ledgers-overview-head">
                <div>
                  <h3 className="ledgers-overview-name">{activeLedger.name}</h3>
                  <p className="ledgers-overview-meta">
                    {LEDGER_TYPE_LABELS[normalizeLedgerType(activeLedger.type)] || 'مكتب'}
                    {' · '}
                    {activeLedger.currency || 'SAR'}
                  </p>
                </div>
                <Badge color="blue">نشط</Badge>
              </div>
              <div className="ledgers-overview-stats">
                <div className="ledgers-overview-stat">
                  <span className="ledgers-overview-stat-label">الالتزامات</span>
                  <strong className="ledgers-overview-stat-value">
                    {activeRecurringRaw.length}
                  </strong>
                </div>
                <div className="ledgers-overview-stat">
                  <span className="ledgers-overview-stat-label">المسعّر</span>
                  <strong className="ledgers-overview-stat-value">
                    {recurringDashboard.pricedItems}
                  </strong>
                </div>
                <div className="ledgers-overview-stat">
                  <span className="ledgers-overview-stat-label">الاكتمال</span>
                  <strong className="ledgers-overview-stat-value">{completeness.pct}%</strong>
                </div>
              </div>
              <p className="ledgers-overview-note">
                {String(activeLedger.note || '').trim() ||
                  'لا يوجد وصف مختصر لهذا الدفتر حتى الآن.'}
              </p>
            </>
          ) : (
            <EmptyState
              title="لا يوجد دفتر نشط"
              description="اختر أحد الدفاتر الحالية أو أنشئ دفترًا جديدًا ليصبح مركز العمل النشط."
            />
          )}
        </aside>
      </section>

      {!ledgers || ledgers.length === 0 ? (
        <div className="panel-card p-6">
          <EmptyState
            title="لا توجد دفاتر"
            description="أنشئ أول دفتر لتبدأ تنظيم الإيرادات والمصروفات والالتزامات في مساحة واحدة."
          />
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent('ui:help', { detail: { section: 'ledgers' } }))
              }
              className="btn-secondary"
              aria-label="افتح المساعدة"
            >
              افتح المساعدة
            </button>
          </div>
        </div>
      ) : (
        <>
          <LedgersSectionHeader
            title="كل الدفاتر"
            subtitle="اختر الدفتر الذي تعمل عليه الآن أو عدّل إعداداته الأساسية من نفس المكان."
            actionLabel={`${ledgers.filter((l) => !l.archived).length} دفتر`}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ledgers
              .filter((l) => !l.archived)
              .map((l) => (
                <div
                  key={l.id}
                  className={`panel-card ledgers-ledger-card p-5 ${l.id === activeId ? 'border-[var(--color-primary)]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-[var(--color-text)] truncate">{l.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs text-[var(--color-muted)]">
                          {LEDGER_TYPE_LABELS[normalizeLedgerType(l.type)] || 'مكتب'}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">•</span>
                        <span className="text-xs text-[var(--color-muted)]">{l.currency}</span>
                      </div>
                      {String(l.note || '').trim() ? (
                        <p className="text-xs text-[var(--color-muted)] mt-2">{l.note}</p>
                      ) : null}
                    </div>
                    {l.id === activeId && <Badge color="blue">نشط</Badge>}
                  </div>

                  {editingId === l.id ? (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                        تعديل الاسم
                      </label>
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={120}
                        className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                        aria-label="تعديل اسم الدفتر"
                      />

                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            اختر نوع الدفتر
                          </label>
                          <select
                            value={editingType}
                            onChange={(e) => setEditingType(e.target.value)}
                            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-surface)]"
                            aria-label="تعديل نوع الدفتر"
                          >
                            <option value="office">مكتب</option>
                            <option value="chalet">شاليه</option>
                            <option value="apartment">شقة</option>
                            <option value="villa">فيلا</option>
                            <option value="building">عمارة</option>
                            <option value="personal">شخصي</option>
                            <option value="other">أخرى</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                            وصف مختصر (اختياري)
                          </label>
                          <input
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                            aria-label="تعديل الوصف"
                            placeholder="وصف مختصر (اختياري)"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName('');
                          }}
                          className="btn-secondary"
                          aria-label="إلغاء"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit()}
                          className="btn-primary"
                          aria-label="حفظ"
                        >
                          حفظ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-end mt-4">
                      {(() => {
                        const hasRecurring = (Array.isArray(recurring) ? recurring : []).some(
                          (r) => r.ledgerId === l.id
                        );
                        const disabled = hasRecurring;
                        const title = disabled
                          ? 'تمت إضافة النموذج مسبقًا'
                          : 'إضافة التزامات افتراضية لهذا الدفتر';
                        return (
                          <button
                            type="button"
                            disabled={disabled}
                            title={title}
                            onClick={() => {
                              if (disabled) return;
                              setConfirm({
                                title: 'إضافة نموذج الالتزامات',
                                message:
                                  'سيتم إضافة التزامات افتراضية لهذا الدفتر. هل تريد المتابعة؟',
                                confirmLabel: 'نعم، أضف النموذج',
                                onConfirm: async () => {
                                  try {
                                    const list = Array.isArray(recurring) ? recurring : [];
                                    const already = list.some((r) => r.ledgerId === l.id);
                                    if (already) {
                                      toast.success('تمت إضافة النموذج مسبقًا');
                                      setConfirm(null);
                                      return;
                                    }

                                    const seeded = seedRecurringForLedger({
                                      ledgerId: l.id,
                                      ledgerType: l.type,
                                    });
                                    for (const item of seeded) {
                                      const ts = new Date().toISOString();
                                      const id = `rec_${crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
                                      await createRecurringItem({
                                        id,
                                        ledgerId: l.id,
                                        title: item.title || '',
                                        amount: item.amount || 0,
                                        frequency: item.frequency || 'monthly',
                                        nextDueDate: item.nextDueDate || today(),
                                        notes: item.notes || '',
                                        category: item.category || '',
                                        createdAt: ts,
                                        updatedAt: ts,
                                        ...item,
                                      });
                                    }
                                    toast.success('تمت إضافة الالتزامات الافتراضية.');
                                    setConfirm(null);
                                    refresh();
                                  } catch (err) {
                                    console.error('[قيد العقار] Seed error:', err);
                                    toast.error('تعذر إضافة النموذج');
                                    setConfirm(null);
                                  }
                                },
                              });
                            }}
                            className={`btn-secondary ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                            aria-label="إضافة نموذج الالتزامات"
                          >
                            إضافة نموذج الالتزامات
                          </button>
                        );
                      })()}

                      {(() => {
                        const isOffice = normalizeLedgerType(l.type) === 'office';
                        const hasRecurring = (Array.isArray(recurring) ? recurring : []).some(
                          (r) => r.ledgerId === l.id
                        );
                        const hasTx =
                          filterTransactionsForLedgerByMeta({
                            transactions: allTxsForLedgerCards,
                            ledgerId: l.id,
                          }).length > 0;
                        const disabled = !isOffice || hasRecurring || hasTx;
                        const title = !isOffice
                          ? 'متاح فقط لمكتب'
                          : hasRecurring || hasTx
                            ? 'تم إعداد الديمو مسبقًا'
                            : 'زرع نموذج مكتب كامل مع تسعير تلقائي';

                        return (
                          <button
                            type="button"
                            disabled={disabled}
                            title={title}
                            onClick={() => {
                              if (disabled) return;
                              setConfirm({
                                title: 'تفعيل نموذج مكتب كامل (Demo)',
                                message:
                                  'سيتم زرع التزامات المكتب وتطبيق تسعير مقترح. هل تريد المتابعة؟',
                                confirmLabel: 'نعم، فعّل الديمو',
                                onConfirm: async () => {
                                  try {
                                    const list = Array.isArray(recurring) ? recurring : [];
                                    const already = list.some((r) => r.ledgerId === l.id);
                                    const hasTxNow =
                                      filterTransactionsForLedgerByMeta({
                                        transactions: allTransactionsRef,
                                        ledgerId: l.id,
                                      }).length > 0;
                                    if (already || hasTxNow) {
                                      toast.success('تم إعداد الديمو مسبقًا');
                                      setConfirm(null);
                                      return;
                                    }

                                    const seeded = seedRecurringForLedger({
                                      ledgerId: l.id,
                                      ledgerType: l.type,
                                    });
                                    const createdItems = [];
                                    for (const item of seeded) {
                                      const ts = new Date().toISOString();
                                      const id = `rec_${crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
                                      const fullItem = {
                                        id,
                                        ledgerId: l.id,
                                        title: item.title || '',
                                        amount: item.amount || 0,
                                        frequency: item.frequency || 'monthly',
                                        nextDueDate: item.nextDueDate || today(),
                                        notes: item.notes || '',
                                        category: item.category || '',
                                        createdAt: ts,
                                        updatedAt: ts,
                                        ...item,
                                      };
                                      await createRecurringItem(fullItem);
                                      createdItems.push(fullItem);
                                    }

                                    const r = applySaudiAutoPricingForLedger({
                                      ledgerId: l.id,
                                      city: 'riyadh',
                                      size: 'medium',
                                      onlyUnpriced: false,
                                    });
                                    if (!r.ok) {
                                      toast.error(r.message || 'تعذر تطبيق التسعير');
                                      setConfirm(null);
                                      refresh();
                                      return;
                                    }

                                    const pick = (titleStr) =>
                                      createdItems.find((x) =>
                                        String(x.title || '').includes(titleStr)
                                      );
                                    const itemsToPay = [
                                      pick('إيجار'),
                                      pick('كهرباء'),
                                      pick('ماء'),
                                      pick('ترخيص'),
                                      pick('فال'),
                                    ]
                                      .filter(Boolean)
                                      .slice(0, 3);
                                    for (const it of itemsToPay) {
                                      const amt = safeNum(it.amount);
                                      if (amt <= 0) continue;
                                      const meta = buildTxMetaFromRecurring({
                                        activeLedgerId: l.id,
                                        recurring: it,
                                      });
                                      await createDataTransaction({
                                        type: 'expense',
                                        category: 'other',
                                        amount: amt,
                                        paymentMethod: 'cash',
                                        date: today(),
                                        description: it.title,
                                        ledgerId: l.id,
                                        meta,
                                      });
                                    }

                                    toast.success('تم تفعيل الديمو بنجاح');
                                    setConfirm(null);
                                    refresh();
                                  } catch {
                                    toast.error('تعذر تفعيل الديمو');
                                    setConfirm(null);
                                  }
                                },
                              });
                            }}
                            className={`btn-secondary ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                            aria-label="تفعيل نموذج مكتب كامل (Demo)"
                          >
                            تفعيل نموذج مكتب كامل (Demo)
                          </button>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => startEdit(l)}
                        className="btn-ghost"
                        aria-label="تعديل الاسم"
                      >
                        تعديل الاسم
                      </button>
                      <button
                        type="button"
                        onClick={() => setActive(l.id)}
                        className="btn-primary"
                        aria-label="تعيين كنشط"
                      >
                        تعيين كنشط
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
