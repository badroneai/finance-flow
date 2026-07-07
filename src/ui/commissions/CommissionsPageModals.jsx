/**
 * CommissionsPageModals — غلاف مودالات صفحة العمولات
 * مستخرج من CommissionsPage.jsx (Slice 8) — لا تغيير سلوكي.
 * يلفّ CommissionForm + PaymentForm داخل Modal shell.
 */
import { Modal } from '../Modals.jsx';
import { CommissionForm } from './CommissionForm.jsx';
import { PaymentForm } from './PaymentForm.jsx';

export function CommissionsPageModals({
  canWrite,
  modal,
  setModal,
  paymentModal,
  setPaymentModal,
  ledgers,
  activeLedgerId,
  onSave,
  onPayment,
}) {
  if (!canWrite) return null;

  return (
    <>
      {/* ═══ Modal إضافة/تعديل ═══ */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal && modal !== 'add' ? 'تعديل العمولة' : 'إضافة عمولة جديدة'}
      >
        <CommissionForm
          initial={modal !== 'add' ? modal : null}
          ledgers={ledgers}
          activeLedgerId={activeLedgerId}
          onSave={onSave}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* ═══ Modal تسجيل دفعة ═══ */}
      <Modal
        open={paymentModal !== null}
        onClose={() => setPaymentModal(null)}
        title="تسجيل دفعة"
      >
        {paymentModal && (
          <PaymentForm
            commission={paymentModal}
            onSave={onPayment}
            onCancel={() => setPaymentModal(null)}
          />
        )}
      </Modal>
    </>
  );
}

export default CommissionsPageModals;
