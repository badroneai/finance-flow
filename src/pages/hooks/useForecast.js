// useForecast — حالة ومحسوبات سيناريوهات التوقع (6 أشهر)
import { useState } from 'react';
import {
  normalizeMonthlyRunRate,
  forecast6m,
  cashGapModel,
  insightsFromForecast,
} from '../../core/ledger-planner.js';
import { parseRecurringAmount } from './ledger-helpers.js';

/**
 * @param {object} deps
 * @param {Array} deps.seededOnlyList — بنود الالتزامات المصنفة
 */
export default function useForecast({ seededOnlyList }) {
  const [forecastPreset, setForecastPreset] = useState('realistic');
  const [assumedInflow, setAssumedInflow] = useState('0');
  const [scRent, setScRent] = useState(1.0);
  const [scUtilities, setScUtilities] = useState(1.0);
  const [scMaintenance, setScMaintenance] = useState(1.0);
  const [scMarketing, setScMarketing] = useState(1.0);
  const [scOther, setScOther] = useState(1.0);

  const forecastScenario = (() => {
    if (forecastPreset === 'optimistic')
      return {
        rent: 0.95,
        utilities: 0.9,
        maintenance: 0.85,
        marketing: 0.9,
        system: 1.0,
        other: 1.0,
      };
    if (forecastPreset === 'stressed')
      return {
        rent: 1.05,
        utilities: 1.15,
        maintenance: 1.25,
        marketing: 1.1,
        system: 1.0,
        other: 1.0,
      };
    if (forecastPreset === 'custom')
      return {
        rent: scRent,
        utilities: scUtilities,
        maintenance: scMaintenance,
        marketing: scMarketing,
        system: 1.0,
        other: scOther,
      };
    return { rent: 1.0, utilities: 1.0, maintenance: 1.0, marketing: 1.0, system: 1.0, other: 1.0 };
  })();

  const forecastRunRate = normalizeMonthlyRunRate(
    seededOnlyList.filter((r) => Number(r?.amount) > 0)
  );
  const forecast = forecast6m(seededOnlyList, forecastScenario);
  const cashGap = cashGapModel(forecast, parseRecurringAmount(assumedInflow));
  const forecastInsights = insightsFromForecast(forecast, cashGap);

  return {
    forecastPreset,
    setForecastPreset,
    assumedInflow,
    setAssumedInflow,
    scRent,
    setScRent,
    scUtilities,
    setScUtilities,
    scMaintenance,
    setScMaintenance,
    scMarketing,
    setScMarketing,
    scOther,
    setScOther,
    forecastRunRate,
    forecast,
    cashGap,
    forecastInsights,
  };
}
