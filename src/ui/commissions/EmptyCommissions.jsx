/**
 * حالة فارغة — صفحة العمولات
 * مُستخرج من CommissionsPage.jsx — نفس الـ behavior تمامًا.
 */
import { Icons, EmptyState } from '../ui-common.jsx';

export function EmptyCommissions({ onAdd }) {
  return (
    <EmptyState
      icon={<Icons.percent size={32} style={{ color: 'var(--color-muted)' }} />}
      title="لا توجد عمولات بعد"
      description="سجّل عمولات صفقاتك لتتبع المستحقات والمدفوعات من مكان واحد."
      actionLabel={onAdd ? 'أضف أول عمولة' : undefined}
      onAction={onAdd}
    />
  );
}
