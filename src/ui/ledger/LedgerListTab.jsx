// تبويب قائمة الدفاتر — موحّد ضمن نظام ledger-* البصري
import { EmptyState, Badge } from '../ui-common.jsx';
import {
  filterTransactionsForLedgerByMeta,
  buildTxMetaFromRecurring,
} from '../../core/ledger-analytics.js';
import { seedRecurringForLedger } from '../../domain/ledgerTemplates.js';
import { today, safeNum } from '../../utils/helpers.js';

// ─── أيقونات SVG خفيفة (inline لتجنب تبعيات إضافية) ───
const IconBook = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconCheck = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconTag = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IconPercent = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);
const IconPlus = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

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
  const activeLedgerCount = ledgers ? ledgers.filter((l) => !l.archived).length : 0;

  // ─── مساعد: زرع الالتزامات الافتراضية ───
  const handleSeedRecurring = (ledger) => {
    const recList = Array.isArray(recurring) ? recurring : [];
    const hasRecurring = recList.some((r) => r.ledgerId === ledger.id);
    if (hasRecurring) return;
    setConfirm({
      title: 'إضافة نموذج الالتزامات',
      message: 'سيتم إضافة التزامات افتراضية لهذا الدفتر. هل تريد المتابعة؟',
      confirmLabel: 'نعم، أضف النموذج',
      onConfirm: async () => {
        try {
          const already = recList.some((r) => r.ledgerId === ledger.id);
          if (already) {
            toast.success('تمت إضافة النموذج مسبقًا');
            setConfirm(null);
            return;
          }
          const seeded = seedRecurringForLedger({ ledgerId: ledger.id, ledgerType: ledger.type });
          for (const item of seeded) {
            const ts = new Date().toISOString();
            const id = `rec_${crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
            await createRecurringItem({
              id,
              ledgerId: ledger.id,
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
  };

  // ─── مساعد: تفعيل ديمو مكتب كامل ───
  const handleSeedDemo = (ledger) => {
    setConfirm({
      title: 'تفعيل نموذج مكتب كامل (Demo)',
      message: 'سيتم زرع التزامات المكتب وتطبيق تسعير مقترح. هل تريد المتابعة؟',
      confirmLabel: 'نعم، فعّل الديمو',
      onConfirm: async () => {
        try {
          const recList = Array.isArray(recurring) ? recurring : [];
          const already = recList.some((r) => r.ledgerId === ledger.id);
          const hasTxNow =
            filterTransactionsForLedgerByMeta({
              transactions: allTransactionsRef,
              ledgerId: ledger.id,
            }).length > 0;
          if (already || hasTxNow) {
            toast.success('تم إعداد الديمو مسبقًا');
            setConfirm(null);
            return;
          }

          const seeded = seedRecurringForLedger({ ledgerId: ledger.id, ledgerType: ledger.type });
          const createdItems = [];
          for (const item of seeded) {
            const ts = new Date().toISOString();
            const id = `rec_${crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`;
            const fullItem = {
              id,
              ledgerId: ledger.id,
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
            ledgerId: ledger.id,
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
            createdItems.find((x) => String(x.title || '').includes(titleStr));
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
            const meta = buildTxMetaFromRecurring({ activeLedgerId: ledger.id, recurring: it });
            await createDataTransaction({
              type: 'expense',
              category: 'other',
              amount: amt,
              paymentMethod: 'cash',
              date: today(),
              description: it.title,
              ledgerId: ledger.id,
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
  };

  return (
    <div
      id="tabpanel-ledgers"
      role="tabpanel"
      aria-labelledby="tab-ledgers"
      tabIndex={0}
      className="ledger-view"
    >
      {/* ═══════ طبقة الملخص: الدفتر النشط + المقاييس ═══════ */}
      <section className="ledger-layer ledger-layer--summary">
        <div className="ledger-layer__header">
          <span className="ledger-layer__label">الدفتر النشط</span>
        </div>

        {activeLedger ? (
          <>
            <div className="ledger-hero-card">
              <div className="ledger-hero-card__header">
                <div className="ledger-hero-card__identity">
                  <h3 className="ledger-hero-card__name">{activeLedger.name}</h3>
                  <span className="ledger-hero-card__type">
                    {LEDGER_TYPE_LABELS[normalizeLedgerType(activeLedger.type)] || 'مكتب'}
                    {' · '}
                    {activeLedger.currency || 'SAR'}
                  </span>
                </div>
                <Badge color="blue">نشط</Badge>
              </div>

              {/* ─── شريط المقاييس (Status Strip) ─── */}
              <div className="ledger-status-strip">
                <div className="ledger-status-strip__item">
                  <div className="ledger-status-strip__icon ledger-status-strip__icon--primary">
                    <IconBook />
                  </div>
                  <div className="ledger-status-strip__content">
                    <span className="ledger-status-strip__value">{activeRecurringRaw.length}</span>
                    <span className="ledger-status-strip__label">الالتزامات</span>
                  </div>
                </div>
                <div className="ledger-status-strip__item">
                  <div className="ledger-status-strip__icon ledger-status-strip__icon--accent">
                    <IconTag />
                  </div>
                  <div className="ledger-status-strip__content">
                    <span className="ledger-status-strip__value">
                      {recurringDashboard.pricedItems}
                    </span>
                    <span className="ledger-status-strip__label">المسعّر</span>
                  </div>
                </div>
                <div className="ledger-status-strip__item">
                  <div className="ledger-status-strip__icon ledger-status-strip__icon--success">
                    <IconPercent />
                  </div>
                  <div className="ledger-status-strip__content">
                    <span className="ledger-status-strip__value">{completeness?.pct ?? 0}%</span>
                    <span className="ledger-status-strip__label">الاكتمال</span>
                  </div>
                </div>
              </div>

              <p className="ledger-hero-card__note">
                {String(activeLedger.note || '').trim() ||
                  'لا يوجد وصف مختصر لهذا الدفتر حتى الآن.'}
              </p>
            </div>
          </>
        ) : (
          <div className="ledger-empty-wrap">
            <EmptyState
              title="لا يوجد دفتر نشط"
              description="اختر أحد الدفاتر الحالية أو أنشئ دفترًا جديدًا ليصبح مركز العمل النشط."
            />
          </div>
        )}
      </section>

      {/* ═══════ طبقة الإجراءات: إنشاء دفتر جديد ═══════ */}
      <section className="ledger-layer ledger-layer--controls">
        <div className="ledger-layer__header">
          <span className="ledger-layer__label">إنشاء دفتر جديد</span>
          <p className="ledger-layer__hint">
            أضف دفترًا جديدًا أو جهّز مساحة تشغيلية مختلفة لنشاط آخر.
          </p>
        </div>

        <div className="panel-card ledger-panel ledger-control-panel">
          <div className="ledger-panel__body">
            <div className="ledger-create-form">
              <div className="ledger-create-form__field">
                <label className="ledger-form-label">اسم الدفتر</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={120}
                  className="ledger-form-input"
                  aria-label="اسم الدفتر"
                  placeholder="مثال: مكتب قيد العقار"
                />
              </div>
              <div className="ledger-create-form__field">
                <label className="ledger-form-label">نوع الدفتر</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="ledger-form-input ledger-form-select"
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
              <div className="ledger-create-form__field">
                <label className="ledger-form-label">وصف مختصر (اختياري)</label>
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  maxLength={200}
                  className="ledger-form-input"
                  aria-label="وصف مختصر"
                  placeholder="وصف مختصر (اختياري)"
                />
              </div>
              <div className="ledger-create-form__submit">
                <button
                  type="button"
                  onClick={() => createLedger()}
                  className="ledger-chip-action ledger-chip-action--primary"
                  aria-label="إضافة دفتر"
                >
                  <IconPlus />
                  <span>إضافة دفتر</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ طبقة المحتوى: شبكة كل الدفاتر ═══════ */}
      {!ledgers || ledgers.length === 0 ? (
        <section className="ledger-layer">
          <div className="ledger-layer__header">
            <span className="ledger-layer__label">كل الدفاتر</span>
          </div>
          <div className="ledger-empty-wrap">
            <EmptyState
              title="لا توجد دفاتر"
              description="أنشئ أول دفتر لتبدأ تنظيم الإيرادات والمصروفات والالتزامات في مساحة واحدة."
              actionLabel="افتح المساعدة"
              onAction={() =>
                window.dispatchEvent(new CustomEvent('ui:help', { detail: { section: 'ledgers' } }))
              }
            />
          </div>
        </section>
      ) : (
        <section className="ledger-layer">
          <div className="ledger-layer__header">
            <span className="ledger-layer__label">
              كل الدفاتر
              <span className="ledger-count-badge">{activeLedgerCount}</span>
            </span>
          </div>

          <div className="ledger-card-grid">
            {ledgers
              .filter((l) => !l.archived)
              .map((l) => (
                <div
                  key={l.id}
                  className={`ledger-card-item ${l.id === activeId ? 'ledger-card-item--active' : ''}`}
                >
                  <div className="ledger-card-item__header">
                    <div>
                      <h4 className="ledger-card-item__name">{l.name}</h4>
                      <div className="ledger-card-item__badges">
                        <span className="ledger-chip-label">
                          {LEDGER_TYPE_LABELS[normalizeLedgerType(l.type)] || 'مكتب'}
                        </span>
                        <span className="ledger-chip-label">{l.currency}</span>
                      </div>
                    </div>
                    {l.id === activeId && <Badge color="blue">نشط</Badge>}
                  </div>

                  {String(l.note || '').trim() ? (
                    <p className="ledger-card-item__note">{l.note}</p>
                  ) : null}

                  {editingId === l.id ? (
                    <div className="ledger-card-item__edit-form">
                      <div className="ledger-create-form__field">
                        <label className="ledger-form-label">تعديل الاسم</label>
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          maxLength={120}
                          className="ledger-form-input"
                          aria-label="تعديل اسم الدفتر"
                        />
                      </div>
                      <div className="ledger-card-item__edit-row">
                        <div className="ledger-create-form__field">
                          <label className="ledger-form-label">نوع الدفتر</label>
                          <select
                            value={editingType}
                            onChange={(e) => setEditingType(e.target.value)}
                            className="ledger-form-input ledger-form-select"
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
                        <div className="ledger-create-form__field">
                          <label className="ledger-form-label">وصف مختصر (اختياري)</label>
                          <input
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            className="ledger-form-input"
                            aria-label="تعديل الوصف"
                            placeholder="وصف مختصر"
                          />
                        </div>
                      </div>
                      <div className="ledger-card-item__edit-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName('');
                          }}
                          className="ledger-chip-action"
                          aria-label="إلغاء"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit()}
                          className="ledger-chip-action ledger-chip-action--primary"
                          aria-label="حفظ"
                        >
                          <IconCheck />
                          <span>حفظ</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ledger-card-item__actions">
                      <div className="ledger-card-item__seed-group">
                        {(() => {
                          const hasRec = (Array.isArray(recurring) ? recurring : []).some(
                            (r) => r.ledgerId === l.id
                          );
                          return (
                            <button
                              type="button"
                              disabled={hasRec}
                              title={
                                hasRec
                                  ? 'تمت إضافة النموذج مسبقًا'
                                  : 'إضافة التزامات افتراضية لهذا الدفتر'
                              }
                              onClick={() => !hasRec && handleSeedRecurring(l)}
                              className="ledger-chip-action"
                              aria-label="إضافة نموذج الالتزامات"
                            >
                              إضافة نموذج الالتزامات
                            </button>
                          );
                        })()}

                        {(() => {
                          const isOffice = normalizeLedgerType(l.type) === 'office';
                          const hasRec = (Array.isArray(recurring) ? recurring : []).some(
                            (r) => r.ledgerId === l.id
                          );
                          const hasTx =
                            filterTransactionsForLedgerByMeta({
                              transactions: allTxsForLedgerCards,
                              ledgerId: l.id,
                            }).length > 0;
                          const off = !isOffice || hasRec || hasTx;
                          return (
                            <button
                              type="button"
                              disabled={off}
                              title={
                                !isOffice
                                  ? 'متاح فقط لمكتب'
                                  : hasRec || hasTx
                                    ? 'تم إعداد الديمو مسبقًا'
                                    : 'زرع نموذج مكتب كامل مع تسعير تلقائي'
                              }
                              onClick={() => !off && handleSeedDemo(l)}
                              className="ledger-chip-action"
                              aria-label="تفعيل نموذج مكتب كامل (Demo)"
                            >
                              تفعيل نموذج مكتب كامل (Demo)
                            </button>
                          );
                        })()}
                      </div>

                      <div className="ledger-card-item__main-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(l)}
                          className="ledger-chip-action"
                          aria-label="تعديل الاسم"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => setActive(l.id)}
                          className="ledger-chip-action ledger-chip-action--primary"
                          aria-label="تعيين كنشط"
                        >
                          <IconCheck />
                          <span>تعيين كنشط</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
