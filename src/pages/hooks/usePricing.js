// usePricing — حالة ومعالجات التسعير اليدوي والسعودي
import { useState } from 'react';
import { setRecurringItems } from '../../core/ledger-store.js';
import { isSeededRecurring } from '../../core/recurring-intelligence.js';
import { parseRecurringAmount, ensureDateValue } from './ledger-helpers.js';

const SA_CITY_FACTOR = {
  riyadh: 1.15,
  jeddah: 1.1,
  dammam: 1.05,
  qassim: 0.95,
  other: 1.0,
};

const SA_SIZE_FACTOR = {
  small: 0.85,
  medium: 1.0,
  large: 1.25,
};

/**
 * @param {object} deps
 * @param {Function} deps.toast
 * @param {string} deps.activeId
 * @param {Array} deps.recurring
 * @param {Function} deps.setRecurringState
 * @param {Function} deps.refresh
 * @param {Array} deps.unpricedList — البنود غير المسعّرة
 */
export default function usePricing({
  toast,
  activeId,
  recurring,
  setRecurringState,
  refresh,
  unpricedList,
}) {
  // Quick pricing wizard
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingIndex, setPricingIndex] = useState(0);
  const [pricingAmount, setPricingAmount] = useState('');
  const [pricingDate, setPricingDate] = useState('');

  // Saudi auto-pricing wizard v2
  const [saPricingOpen, setSaPricingOpen] = useState(false);
  const [saCity, setSaCity] = useState('riyadh');
  const [saSize, setSaSize] = useState('medium');
  const [saOnlyUnpriced, setSaOnlyUnpriced] = useState(true);

  const pricingList = unpricedList;

  const applyPricingToItem = (itemId, { amount, nextDueDate }) => {
    const list = Array.isArray(recurring) ? recurring : [];
    const ts = new Date().toISOString();
    const next = list.map((r) => {
      if (r.id !== itemId) return r;
      return { ...r, amount, nextDueDate, updatedAt: ts };
    });
    setRecurringItems(next);
    setRecurringState(next);
  };

  const openPricingWizard = () => {
    if (unpricedList.length === 0) return;
    setPricingIndex(0);
    const item = unpricedList[0];
    setPricingAmount('');
    setPricingDate(ensureDateValue(item?.nextDueDate));
    setPricingOpen(true);
  };

  const applyQuickPricing = () => {
    try {
      if (!activeId) {
        toast.error('اختر دفترًا نشطًا');
        return;
      }
      if (!pricingList || pricingList.length === 0) {
        setPricingOpen(false);
        return;
      }

      const item = pricingList[pricingIndex];
      if (!item) {
        setPricingOpen(false);
        return;
      }

      const amount = parseRecurringAmount(pricingAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('حدد المبلغ أولاً');
        return;
      }

      const nextDueDate = ensureDateValue(pricingDate || item?.nextDueDate);
      applyPricingToItem(item.id, { amount, nextDueDate });

      const nextIndex = pricingIndex + 1;
      if (nextIndex >= pricingList.length) {
        setPricingOpen(false);
        toast.success('تم تطبيق التسعير');
      } else {
        setPricingIndex(nextIndex);
        const nextItem = pricingList[nextIndex];
        setPricingAmount('');
        setPricingDate(ensureDateValue(nextItem?.nextDueDate));
        toast.success('تم حفظ البند');
      }

      refresh();
    } catch {
      toast.error('تعذر تطبيق التسعير');
    }
  };

  const applySaudiAutoPricingForLedger = ({ ledgerId, city, size, onlyUnpriced }) => {
    const lid = String(ledgerId || '').trim();
    if (!lid) return { ok: false, message: 'دفتر غير صالح' };

    const cityFactor = SA_CITY_FACTOR[String(city || 'other')] ?? 1.0;
    const sizeFactor = SA_SIZE_FACTOR[String(size || 'medium')] ?? 1.0;

    const list = Array.isArray(recurring) ? recurring : [];
    const ts = new Date().toISOString();

    const next = list.map((r) => {
      if (r.ledgerId !== lid) return r;

      const seeded = isSeededRecurring(r);
      const band = r.priceBand && typeof r.priceBand === 'object' ? r.priceBand : null;
      const typical = band && Number.isFinite(Number(band.typical)) ? Number(band.typical) : 0;
      if (!seeded || typical <= 0) return r;

      if (onlyUnpriced && Number(r.amount) > 0) return r;

      const eligible = !!r.cityFactorEligible;
      const amount = Math.round(typical * (eligible ? cityFactor : 1.0) * sizeFactor);

      const due = String(r.nextDueDate || '').trim();
      const nextDueDate = due ? due : ensureDateValue(due);

      const desiredFreq = String(r.defaultFreq || r.frequency || 'monthly').toLowerCase();
      const freq =
        desiredFreq === 'monthly' ||
        desiredFreq === 'quarterly' ||
        desiredFreq === 'yearly' ||
        desiredFreq === 'adhoc'
          ? desiredFreq
          : String(r.frequency || 'monthly');

      return {
        ...r,
        amount: amount > 0 ? amount : r.amount,
        frequency: freq,
        nextDueDate,
        updatedAt: ts,
      };
    });

    try {
      setRecurringItems(next);
    } catch {
      return { ok: false, message: 'تعذر تطبيق التسعير' };
    }
    setRecurringState(next);
    return { ok: true };
  };

  return {
    pricingOpen,
    setPricingOpen,
    pricingIndex,
    setPricingIndex,
    pricingAmount,
    setPricingAmount,
    pricingDate,
    setPricingDate,
    pricingList,
    openPricingWizard,
    applyQuickPricing,
    applyPricingToItem,

    saPricingOpen,
    setSaPricingOpen,
    saCity,
    setSaCity,
    saSize,
    setSaSize,
    saOnlyUnpriced,
    setSaOnlyUnpriced,
    applySaudiAutoPricingForLedger,
  };
}
