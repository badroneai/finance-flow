/*
  Domain: Calendar (Notes/Calendar)
  Pure helpers only — no UI copy.
*/

import { gregorianToHijri, getDaysInMonthNC } from './utils.js';

export function buildCalendarDays(currentYear, currentMonthIndex0) {
  const firstDay = new Date(currentYear, currentMonthIndex0, 1).getDay();
  const daysInMonth = getDaysInMonthNC(currentYear, currentMonthIndex0 + 1);
  const prevDays = getDaysInMonthNC(currentYear, currentMonthIndex0);

  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = currentMonthIndex0 === 0 ? 12 : currentMonthIndex0;
    const y = currentMonthIndex0 === 0 ? currentYear - 1 : currentYear;
    days.push({ day: d, month: m, year: y, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) days.push({ day: d, month: currentMonthIndex0 + 1, year: currentYear, current: true });

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonthIndex0 === 11 ? 1 : currentMonthIndex0 + 2;
    const y = currentMonthIndex0 === 11 ? currentYear + 1 : currentYear;
    days.push({ day: d, month: m, year: y, current: false });
  }

  return days;
}

export function getEventsForDate(events, gY, gM, gD) {
  const list = Array.isArray(events) ? events : [];
  const h = gregorianToHijri(gY, gM, gD);

  return list.filter(ev => {
    if (ev.dateType === 'hijri') {
      for (let i = 0; i < (ev.duration || 1); i++) {
        if (h.month === ev.hMonth && h.day === ev.hDay + i) return true;
      }
    } else {
      for (let i = 0; i < (ev.duration || 1); i++) {
        const checkDate = new Date(gY, gM - 1, gD);
        const evDate = new Date(gY, ev.gMonth - 1, ev.gDay + i);
        if (checkDate.getTime() === evDate.getTime()) return true;
      }
    }
    return false;
  });
}

export function isHoliday(eventsForDate) {
  const list = Array.isArray(eventsForDate) ? eventsForDate : [];
  return list.some(e => e.category === 'holiday' || e.category === 'religious');
}
