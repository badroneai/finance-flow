/**
 * شريط أدوات صفحة العمولات
 * البحث + أزرار التصدير والإضافة + الفلاتر القابلة للطي.
 * مُستخرج من CommissionsPage.jsx — نفس الـ behavior تمامًا.
 */
import { Icons } from '../ui-common.jsx';

// ─── خيارات الفلاتر (تخص التولبار فقط) ───
const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'pending', label: 'مستحقة' },
  { value: 'partial', label: 'مدفوعة جزئياً' },
  { value: 'paid', label: 'مدفوعة' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'oldest', label: 'الأقدم أولاً' },
  { value: 'amount_desc', label: 'الأعلى مبلغاً' },
  { value: 'amount_asc', label: 'الأقل مبلغاً' },
  { value: 'client_asc', label: 'العميل (أ-ي)' },
];

export function CommissionsToolbar({
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  resultsCount,
  ledgers,
  agentNames,
  isAgentOnly,
  canWrite,
  onAdd,
  onExportPdf,
  onExportCsv,
  pdfExporting,
}) {
  const resetFilters = () =>
    setFilters({
      status: '',
      ledgerId: '',
      search: '',
      agent: '',
      dateFrom: '',
      dateTo: '',
      sort: 'newest',
    });

  return (
    <div className="control-toolbar control-toolbar--filters commissions-page__toolbar">
      <div className="commissions-page__toolbar-top">
        <div className="commissions-page__search">
          <Icons.search size={16} className="field-icon-inline-start" />
          <input
            type="text"
            placeholder="بحث بالعميل أو الوكيل..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            className="commissions-page__search-input"
            aria-label="بحث"
          />
        </div>
        <div className="commissions-page__toolbar-actions">
          {resultsCount > 0 && (
            <>
              <button
                onClick={onExportPdf}
                disabled={pdfExporting}
                className="btn-primary disabled:opacity-50"
                aria-label="تصدير PDF"
              >
                <Icons.download size={16} />
                {pdfExporting ? 'جاري…' : 'تصدير PDF'}
              </button>
              <button
                onClick={onExportCsv}
                className="btn-secondary"
                aria-label="تصدير CSV"
              >
                <Icons.download size={16} />
                تصدير CSV
              </button>
            </>
          )}
          {canWrite && (
            <button
              onClick={onAdd}
              className="btn-primary"
              aria-label="إضافة عمولة"
            >
              <Icons.plus size={16} />
              إضافة عمولة
            </button>
          )}
        </div>
      </div>
      <p className="commissions-page__toolbar-note">
        ابدأ بالبحث، ثم استخدم الحالة أو الدفتر أو الوكيل والتاريخ لتضييق النتائج بشكل أدق.
      </p>

      {/* فلاتر متقدمة — قابلة للطي على الموبايل */}
      <button
        type="button"
        onClick={() => setShowFilters((s) => !s)}
        className="btn-ghost commissions-page__filters-toggle"
        aria-expanded={showFilters}
        aria-label="فلاتر متقدمة"
      >
        <Icons.filter size={14} />
        فلاتر متقدمة
        <Icons.chevronDown
          size={16}
          className={`commissions-page__filters-chevron${showFilters ? ' is-open' : ''}`}
        />
      </button>

      <div
        className={`commissions-page__filters${showFilters ? '' : ' commissions-page__filters--collapsed'}`}
      >
        <select
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          className="commissions-page__filter-control"
          aria-label="حالة العمولة"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={filters.ledgerId}
          onChange={(e) => setFilters((p) => ({ ...p, ledgerId: e.target.value }))}
          className="commissions-page__filter-control"
          aria-label="الدفتر"
        >
          <option value="">كل الدفاتر</option>
          {(ledgers || []).map((l) => (
            <option key={l.id} value={l.id}>
              {l.name || l.title || l.id}
            </option>
          ))}
        </select>

        {/* SPR-012: فلتر الوكيل */}
        {!isAgentOnly && agentNames.length > 0 && (
          <select
            value={filters.agent}
            onChange={(e) => setFilters((p) => ({ ...p, agent: e.target.value }))}
            className="commissions-page__filter-control"
            aria-label="الوكيل"
          >
            <option value="">كل الوكلاء</option>
            {agentNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}

        {/* SPR-012: فلتر التاريخ */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
          className="commissions-page__filter-control"
          aria-label="من تاريخ"
          title="من تاريخ"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
          className="commissions-page__filter-control"
          aria-label="إلى تاريخ"
          title="إلى تاريخ"
        />

        {/* SPR-012: ترتيب */}
        <select
          value={filters.sort}
          onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
          className="commissions-page__filter-control"
          aria-label="ترتيب"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={resetFilters}
          className="btn-secondary commissions-page__filters-action"
          aria-label="إعادة تعيين الفلاتر"
          title="إعادة تعيين"
        >
          <Icons.filter size={14} />
          إعادة التعيين
        </button>
      </div>
    </div>
  );
}
