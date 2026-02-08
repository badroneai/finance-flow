import { useState, useEffect, useCallback, useMemo } from "react";

/* ──────────────────────────────────────────────
   Hijri Conversion (Umm al-Qura approximation)
   ────────────────────────────────────────────── */
function gregorianToHijri(gY, gM, gD) {
  const d = new Date(gY, gM - 1, gD);
  const jd = Math.floor((d.getTime() - new Date(1970, 0, 1).getTime()) / 86400000) + 2440588;
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const ll = l - 10631 * n + 354;
  const jj = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719) + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
  const ll2 = ll - Math.floor((30 - jj) / 15) * Math.floor((17719 * jj) / 50) - Math.floor(jj / 16) * Math.floor((15238 * jj) / 43) + 29;
  const hM = Math.floor((24 * ll2) / 709);
  const hD = ll2 - Math.floor((709 * hM) / 24);
  const hY = 30 * n + jj - 30;
  return { year: hY, month: hM, day: hD };
}

function hijriToGregorian(hY, hM, hD) {
  const jd = Math.floor((11 * hY + 3) / 30) + 354 * hY + 30 * hM - Math.floor((hM - 1) / 2) + hD + 1948440 - 385;
  const la = jd + 68569;
  const n = Math.floor((4 * la) / 146097);
  const la2 = la - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (la2 + 1)) / 1461001);
  const la3 = la2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * la3) / 2447);
  const gD2 = la3 - Math.floor((2447 * j) / 80);
  const la4 = Math.floor(j / 11);
  const gM2 = j + 2 - 12 * la4;
  const gY2 = 100 * (n - 49) + i + la4;
  return { year: gY2, month: gM2, day: gD2 };
}

const HIJRI_MONTHS = ["محرّم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
const GREG_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY_NAMES = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const DAY_NAMES_SHORT = ["أحد","إثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];

const EVENT_CATEGORIES = [
  { id: "holiday", label: "إجازة رسمية", color: "#ef4444", bg: "#fef2f2", icon: "🏖️" },
  { id: "school", label: "تقويم دراسي", color: "#3b82f6", bg: "#eff6ff", icon: "🎓" },
  { id: "personal", label: "شخصي", color: "#8b5cf6", bg: "#f5f3ff", icon: "👤" },
  { id: "work", label: "عمل", color: "#f59e0b", bg: "#fffbeb", icon: "💼" },
  { id: "rental", label: "تأجير/حجوزات", color: "#10b981", bg: "#ecfdf5", icon: "🏠" },
  { id: "religious", label: "مناسبة دينية", color: "#06b6d4", bg: "#ecfeff", icon: "🕌" },
];

const DEFAULT_EVENTS = [
  { id: "e1", title: "عيد الفطر", category: "holiday", dateType: "hijri", hMonth: 10, hDay: 1, duration: 3, recurring: true },
  { id: "e2", title: "عيد الأضحى", category: "holiday", dateType: "hijri", hMonth: 12, hDay: 10, duration: 4, recurring: true },
  { id: "e3", title: "اليوم الوطني", category: "holiday", dateType: "gregorian", gMonth: 9, gDay: 23, duration: 1, recurring: true },
  { id: "e4", title: "يوم التأسيس", category: "holiday", dateType: "gregorian", gMonth: 2, gDay: 22, duration: 1, recurring: true },
  { id: "e5", title: "بداية رمضان", category: "religious", dateType: "hijri", hMonth: 9, hDay: 1, duration: 1, recurring: true },
];

function getKey(y, m, d) { return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }

function getDaysInMonth(year, month) { return new Date(year, month, 0).getDate(); }

function toArabicNum(n) { return String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]); }

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
export default function NotesCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(getKey(today.getFullYear(), today.getMonth() + 1, today.getDate()));
  const [view, setView] = useState("calendar"); // calendar | notes | events

  // Data stores
  const [pinnedNotes, setPinnedNotes] = useState([
    { id: "p1", text: "أرقام الحسابات البنكية المهمة", color: "#fef3c7", createdAt: Date.now() },
  ]);
  const [dailyNotes, setDailyNotes] = useState({});
  const [events, setEvents] = useState(DEFAULT_EVENTS);

  // Modals
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddPinned, setShowAddPinned] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingPinned, setEditingPinned] = useState(null);
  const [mobileTab, setMobileTab] = useState("cal"); // cal | notes

  // Parse selected date
  const selParts = selectedDate.split("-").map(Number);
  const selHijri = gregorianToHijri(selParts[0], selParts[1], selParts[2]);
  const selDayName = DAY_NAMES[new Date(selParts[0], selParts[1] - 1, selParts[2]).getDay()];

  /* ── Calendar Grid ── */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth + 1);
    const prevDays = getDaysInMonth(currentYear, currentMonth);
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({ day: d, month: m, year: y, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: currentMonth + 1, year: currentYear, current: true });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({ day: d, month: m, year: y, current: false });
    }
    return days;
  }, [currentMonth, currentYear]);

  /* ── Event matching ── */
  const getEventsForDate = useCallback((gY, gM, gD) => {
    const h = gregorianToHijri(gY, gM, gD);
    return events.filter(ev => {
      if (ev.dateType === "hijri") {
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
  }, [events]);

  const isHoliday = useCallback((gY, gM, gD) => {
    return getEventsForDate(gY, gM, gD).some(e => e.category === "holiday" || e.category === "religious");
  }, [getEventsForDate]);

  /* ── Daily notes for selected date ── */
  const currentDailyNotes = dailyNotes[selectedDate] || [];
  const setCurrentDailyNotes = (notes) => {
    setDailyNotes(prev => ({ ...prev, [selectedDate]: notes }));
  };

  const addDailyNote = (text) => {
    if (!text.trim()) return;
    const note = { id: `d${Date.now()}`, text, done: false, createdAt: Date.now() };
    setCurrentDailyNotes([...currentDailyNotes, note]);
  };

  const toggleDailyNote = (id) => {
    setCurrentDailyNotes(currentDailyNotes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  };

  const deleteDailyNote = (id) => {
    setCurrentDailyNotes(currentDailyNotes.filter(n => n.id !== id));
  };

  const addPinnedNote = (text, color) => {
    if (!text.trim()) return;
    setPinnedNotes(prev => [...prev, { id: `p${Date.now()}`, text, color: color || "#fef3c7", createdAt: Date.now() }]);
  };

  const deletePinnedNote = (id) => {
    setPinnedNotes(prev => prev.filter(n => n.id !== id));
  };

  const updatePinnedNote = (id, text) => {
    setPinnedNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  };

  /* ── Navigation ── */
  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(getKey(today.getFullYear(), today.getMonth() + 1, today.getDate()));
  };

  const todayKey = getKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const hijriCurrent = gregorianToHijri(currentYear, currentMonth + 1, 15);
  const pendingTasks = currentDailyNotes.filter(n => !n.done).length;

  // Count all daily notes with pending tasks
  const totalPending = Object.values(dailyNotes).reduce((sum, notes) => sum + notes.filter(n => !n.done).length, 0);

  /* ── Styles ── */
  const colors = {
    bg: "#f8fafc",
    card: "#ffffff",
    primary: "#1e40af",
    primaryLight: "#dbeafe",
    primaryDark: "#1e3a5f",
    accent: "#0ea5e9",
    text: "#1e293b",
    textLight: "#64748b",
    textMuted: "#94a3b8",
    border: "#e2e8f0",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    holidayBg: "#fef2f2",
    selectedBg: "#1e40af",
    todayBorder: "#0ea5e9",
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', Tahoma, sans-serif", background: `linear-gradient(135deg, ${colors.bg} 0%, #eef2ff 100%)`, minHeight: "100vh", color: colors.text }}>

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #0ea5e9 100%)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(30,64,175,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, backdropFilter: "blur(10px)" }}>📝</div>
          <div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>الملاحظات والتقويم</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {selDayName} — {toArabicNum(selParts[2])} {GREG_MONTHS[selParts[1]-1]} {toArabicNum(selParts[0])} — {toArabicNum(selHijri.day)} {HIJRI_MONTHS[selHijri.month-1]} {toArabicNum(selHijri.year)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {totalPending > 0 && (
            <div style={{ background: "#ef4444", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <span>{toArabicNum(totalPending)}</span>
              <span>مهمة معلقة</span>
            </div>
          )}
          <button onClick={goToday} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, backdropFilter: "blur(10px)" }}>اليوم</button>
        </div>
      </div>

      {/* ── MOBILE TABS ── */}
      <div style={{ display: "flex", background: colors.card, borderBottom: `1px solid ${colors.border}`, padding: "0 16px" }}>
        {[{k:"cal",l:"📅 التقويم"},{k:"notes",l:`📝 الملاحظات${pendingTasks?` (${toArabicNum(pendingTasks)})`:""}`}].map(t => (
          <button key={t.k} onClick={() => setMobileTab(t.k)}
            style={{ flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: mobileTab===t.k?700:500, color: mobileTab===t.k?colors.primary:colors.textLight, borderBottom: mobileTab===t.k?`3px solid ${colors.primary}`:"3px solid transparent", transition: "all 0.2s" }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "row", gap: 16, padding: 16, maxWidth: 1400, margin: "0 auto", flexWrap: "wrap" }}>

        {/* ════════════════════════════════════════
            LEFT: CALENDAR SECTION
           ════════════════════════════════════════ */}
        <div style={{ flex: "1 1 520px", minWidth: 320, display: mobileTab === "cal" || window.innerWidth > 900 ? "block" : "none" }}>

          {/* Calendar Card */}
          <div style={{ background: colors.card, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", border: `1px solid ${colors.border}` }}>

            {/* Month Navigation */}
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", borderBottom: `1px solid ${colors.border}` }}>
              <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700 }}>→</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: colors.primaryDark }}>
                  {GREG_MONTHS[currentMonth]} {toArabicNum(currentYear)}
                </div>
                <div style={{ fontSize: 13, color: colors.accent, fontWeight: 600, marginTop: 2 }}>
                  {HIJRI_MONTHS[hijriCurrent.month-1]} {toArabicNum(hijriCurrent.year)} هـ
                </div>
              </div>
              <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700 }}>←</button>
            </div>

            {/* Day Headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 12px", background: "#f8fafc" }}>
              {DAY_NAMES_SHORT.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: d === "جمعة" || d === "سبت" ? colors.danger : colors.textLight, padding: 4 }}>{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 12px 12px", gap: 3 }}>
              {calendarDays.map((item, idx) => {
                const key = getKey(item.year, item.month, item.day);
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const hijri = gregorianToHijri(item.year, item.month, item.day);
                const dayEvents = getEventsForDate(item.year, item.month, item.day);
                const holiday = isHoliday(item.year, item.month, item.day);
                const hasTasks = dailyNotes[key]?.length > 0;
                const hasPendingTasks = dailyNotes[key]?.some(n => !n.done);
                const dayOfWeek = new Date(item.year, item.month - 1, item.day).getDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                return (
                  <button key={idx} onClick={() => { setSelectedDate(key); setMobileTab("notes"); }}
                    style={{
                      position: "relative", padding: "6px 2px", border: isToday ? `2px solid ${colors.todayBorder}` : isSelected ? `2px solid ${colors.primary}` : "2px solid transparent",
                      borderRadius: 10, cursor: "pointer", transition: "all 0.15s", minHeight: 56,
                      background: isSelected ? colors.primaryLight : holiday ? colors.holidayBg : isWeekend && item.current ? "#f8fafc" : "transparent",
                      opacity: item.current ? 1 : 0.35,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
                    }}>
                    {/* Gregorian */}
                    <span style={{ fontSize: 15, fontWeight: isToday || isSelected ? 800 : 600, color: isSelected ? colors.primary : holiday ? colors.danger : isWeekend ? colors.textLight : colors.text }}>
                      {toArabicNum(item.day)}
                    </span>
                    {/* Hijri */}
                    <span style={{ fontSize: 9, color: isSelected ? colors.accent : colors.textMuted, fontWeight: 600 }}>
                      {toArabicNum(hijri.day)}
                    </span>
                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 3 }}>
                        {dayEvents.slice(0, 3).map((ev, i) => {
                          const cat = EVENT_CATEGORIES.find(c => c.id === ev.category);
                          return <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: cat?.color || "#999" }} />;
                        })}
                      </div>
                    )}
                    {/* Task indicator */}
                    {hasTasks && (
                      <div style={{ position: "absolute", top: 3, left: 3, width: 7, height: 7, borderRadius: "50%", background: hasPendingTasks ? colors.warning : colors.success }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.border}`, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {EVENT_CATEGORIES.map(cat => (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: colors.textLight }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                  {cat.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── EVENTS FOR SELECTED DATE ── */}
          {(() => {
            const evs = getEventsForDate(selParts[0], selParts[1], selParts[2]);
            if (evs.length === 0) return null;
            return (
              <div style={{ marginTop: 12, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark, marginBottom: 10 }}>📌 مناسبات هذا اليوم</div>
                {evs.map(ev => {
                  const cat = EVENT_CATEGORIES.find(c => c.id === ev.category);
                  return (
                    <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: cat?.bg || "#f5f5f5", marginBottom: 6, border: `1px solid ${cat?.color}22` }}>
                      <span style={{ fontSize: 18 }}>{cat?.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: cat?.color }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: colors.textLight }}>{cat?.label}{ev.duration > 1 ? ` — ${toArabicNum(ev.duration)} أيام` : ""}</div>
                      </div>
                      <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: colors.textMuted, padding: 4 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── ADD EVENT BUTTON ── */}
          <button onClick={() => { setShowAddEvent(true); setEditingEvent(null); }}
            style={{ width: "100%", marginTop: 12, padding: "12px 16px", borderRadius: 12, border: `2px dashed ${colors.border}`, background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 600, color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
            <span style={{ fontSize: 18 }}>+</span> إضافة مناسبة / إجازة
          </button>

          {/* ── Events Manager ── */}
          <div style={{ marginTop: 12, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark }}>📋 جميع المناسبات المسجلة</span>
              <span style={{ fontSize: 11, color: colors.textMuted, background: colors.primaryLight, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{toArabicNum(events.length)}</span>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {events.map(ev => {
                const cat = EVENT_CATEGORIES.find(c => c.id === ev.category);
                return (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${colors.border}08` }}>
                    <span style={{ fontSize: 16 }}>{cat?.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>
                        {ev.dateType === "hijri"
                          ? `${toArabicNum(ev.hDay)} ${HIJRI_MONTHS[ev.hMonth-1]} (هجري)`
                          : `${toArabicNum(ev.gDay)} ${GREG_MONTHS[ev.gMonth-1]} (ميلادي)`
                        }
                        {ev.duration > 1 && ` — ${toArabicNum(ev.duration)} أيام`}
                        {ev.recurring && " 🔄"}
                      </div>
                    </div>
                    <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 12, padding: 4 }}>🗑</button>
                  </div>
                );
              })}
              {events.length === 0 && (
                <div style={{ padding: 30, textAlign: "center", color: colors.textMuted, fontSize: 13 }}>لا توجد مناسبات مسجلة</div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            RIGHT: NOTES SECTION
           ════════════════════════════════════════ */}
        <div style={{ flex: "1 1 420px", minWidth: 300, display: mobileTab === "notes" || window.innerWidth > 900 ? "block" : "none" }}>

          {/* ── SELECTED DATE INFO BAR ── */}
          <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)", borderRadius: 14, padding: "16px 20px", marginBottom: 12, color: "#fff", boxShadow: "0 4px 16px rgba(30,64,175,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>{selDayName}</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>
                  {toArabicNum(selParts[2])} {GREG_MONTHS[selParts[1]-1]} {toArabicNum(selParts[0])}
                </div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4, color: "#7dd3fc" }}>
                  {toArabicNum(selHijri.day)} {HIJRI_MONTHS[selHijri.month-1]} {toArabicNum(selHijri.year)} هـ
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                {isHoliday(selParts[0], selParts[1], selParts[2]) && (
                  <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#fca5a5" }}>
                    🏖️ إجازة
                  </div>
                )}
                {pendingTasks > 0 && (
                  <div style={{ marginTop: 6, background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#fcd34d" }}>
                    {toArabicNum(pendingTasks)} مهمة متبقية
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── DAILY NOTES / TASKS ── */}
          <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: colors.primaryDark }}>مهام وملاحظات اليوم</span>
              </div>
              {currentDailyNotes.length > 0 && (
                <div style={{ fontSize: 11, color: colors.textMuted }}>
                  {toArabicNum(currentDailyNotes.filter(n => n.done).length)}/{toArabicNum(currentDailyNotes.length)} مكتملة
                </div>
              )}
            </div>

            {/* Progress bar */}
            {currentDailyNotes.length > 0 && (
              <div style={{ padding: "8px 16px 4px", background: "#fffdf7" }}>
                <div style={{ height: 6, borderRadius: 3, background: "#e5e7eb", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3, transition: "width 0.4s ease",
                    width: `${(currentDailyNotes.filter(n => n.done).length / currentDailyNotes.length) * 100}%`,
                    background: currentDailyNotes.every(n => n.done) ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  }} />
                </div>
              </div>
            )}

            {/* Notes list */}
            <div style={{ padding: "8px 16px 12px" }}>
              {currentDailyNotes.map(note => (
                <div key={note.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${colors.border}33` }}>
                  <button onClick={() => toggleDailyNote(note.id)}
                    style={{
                      width: 24, height: 24, borderRadius: 7, border: `2px solid ${note.done ? colors.success : colors.border}`,
                      background: note.done ? colors.success : "transparent", cursor: "pointer", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", marginTop: 2, transition: "all 0.2s"
                    }}>
                    {note.done && "✓"}
                  </button>
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.6, textDecoration: note.done ? "line-through" : "none", color: note.done ? colors.textMuted : colors.text, transition: "all 0.2s" }}>
                    {note.text}
                  </span>
                  <button onClick={() => deleteDailyNote(note.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 14, padding: "2px 4px", opacity: 0.5 }}>✕</button>
                </div>
              ))}

              {currentDailyNotes.length === 0 && (
                <div style={{ padding: "24px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  لا توجد مهام لهذا اليوم
                </div>
              )}

              {/* Add task input */}
              <div style={{ marginTop: 8 }}>
                <AddInput placeholder="أضف مهمة أو ملاحظة لهذا اليوم..." onAdd={addDailyNote} colors={colors} />
              </div>
            </div>
          </div>

          {/* ── PINNED NOTES ── */}
          <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📌</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: colors.primaryDark }}>ملاحظات ثابتة</span>
              </div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>(تظهر دائماً)</span>
            </div>

            <div style={{ padding: "12px 16px" }}>
              {pinnedNotes.map(note => (
                <PinnedNoteCard key={note.id} note={note} colors={colors}
                  onDelete={() => deletePinnedNote(note.id)}
                  onUpdate={(text) => updatePinnedNote(note.id, text)} />
              ))}

              {pinnedNotes.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📌</div>
                  لا توجد ملاحظات ثابتة
                </div>
              )}

              {/* Color picker + add */}
              <AddPinnedInput onAdd={addPinnedNote} colors={colors} />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          ADD EVENT MODAL
         ════════════════════════════════════════ */}
      {showAddEvent && (
        <AddEventModal
          colors={colors}
          onClose={() => setShowAddEvent(false)}
          onAdd={(ev) => { setEvents(prev => [...prev, { ...ev, id: `e${Date.now()}` }]); setShowAddEvent(false); }}
        />
      )}
    </div>
  );
}

/* ── ADD INPUT COMPONENT ── */
function AddInput({ placeholder, onAdd, colors }) {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && text.trim()) { onAdd(text); setText(""); } }}
        placeholder={placeholder}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#f8fafc" }}
      />
      <button onClick={() => { if (text.trim()) { onAdd(text); setText(""); } }}
        style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
        + إضافة
      </button>
    </div>
  );
}

/* ── PINNED NOTE CARD ── */
function PinnedNoteCard({ note, colors, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);

  const COLORS = ["#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3", "#f3e8ff", "#ffedd5"];

  return (
    <div style={{ background: note.color || "#fef3c7", borderRadius: 12, padding: "12px 16px", marginBottom: 8, border: "1px solid rgba(0,0,0,0.06)", position: "relative" }}>
      {editing ? (
        <div>
          <textarea value={text} onChange={e => setText(e.target.value)} autoFocus
            style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, fontFamily: "inherit", direction: "rtl", resize: "vertical", minHeight: 60, background: "rgba(255,255,255,0.7)" }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-start" }}>
            <button onClick={() => { onUpdate(text); setEditing(false); }}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>حفظ</button>
            <button onClick={() => { setText(note.text); setEditing(false); }}
              style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 12 }}>إلغاء</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{note.text}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(true)}
              style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: colors.textLight }}>✏️ تعديل</button>
            <button onClick={onDelete}
              style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: colors.danger }}>🗑 حذف</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ADD PINNED INPUT ── */
function AddPinnedInput({ onAdd, colors }) {
  const [text, setText] = useState("");
  const [color, setColor] = useState("#fef3c7");
  const [open, setOpen] = useState(false);
  const COLORS = ["#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3", "#f3e8ff", "#ffedd5"];

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: "100%", padding: "10px", borderRadius: 10, border: `2px dashed ${colors.border}`, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: colors.primary, marginTop: 4 }}>
      + إضافة ملاحظة ثابتة
    </button>
  );

  return (
    <div style={{ background: color, borderRadius: 12, padding: 16, marginTop: 8, border: "1px solid rgba(0,0,0,0.08)" }}>
      <textarea value={text} onChange={e => setText(e.target.value)} autoFocus
        placeholder="اكتب ملاحظتك الثابتة هنا..."
        style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, fontFamily: "inherit", direction: "rtl", resize: "vertical", minHeight: 60, background: "rgba(255,255,255,0.7)" }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: color === c ? `3px solid ${colors.primary}` : "2px solid rgba(0,0,0,0.1)", cursor: "pointer" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button onClick={() => { onAdd(text, color); setText(""); setOpen(false); }}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>حفظ</button>
        <button onClick={() => { setText(""); setOpen(false); }}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 13 }}>إلغاء</button>
      </div>
    </div>
  );
}

/* ── ADD EVENT MODAL ── */
function AddEventModal({ colors, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("holiday");
  const [dateType, setDateType] = useState("hijri");
  const [hMonth, setHMonth] = useState(1);
  const [hDay, setHDay] = useState(1);
  const [gMonth, setGMonth] = useState(1);
  const [gDay, setGDay] = useState(1);
  const [duration, setDuration] = useState(1);
  const [recurring, setRecurring] = useState(true);

  const submit = () => {
    if (!title.trim()) return;
    const ev = { title, category, dateType, duration: Number(duration), recurring };
    if (dateType === "hijri") { ev.hMonth = Number(hMonth); ev.hDay = Number(hDay); }
    else { ev.gMonth = Number(gMonth); ev.gDay = Number(gDay); }
    onAdd(ev);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }}>
      <div dir="rtl" style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>📅 إضافة مناسبة جديدة</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: colors.textMuted, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: "16px 24px 24px" }}>
          {/* Title */}
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>اسم المناسبة</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: بداية الإجازة الصيفية"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, fontFamily: "inherit", direction: "rtl", marginBottom: 16, boxSizing: "border-box" }}
          />

          {/* Category */}
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>التصنيف</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {EVENT_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                style={{
                  padding: "8px 14px", borderRadius: 10, border: category === cat.id ? `2px solid ${cat.color}` : `1px solid ${colors.border}`,
                  background: category === cat.id ? cat.bg : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  color: category === cat.id ? cat.color : colors.textLight, display: "flex", alignItems: "center", gap: 4
                }}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Date Type */}
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>نوع التاريخ</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[{k:"hijri",l:"هجري 🌙"},{k:"gregorian",l:"ميلادي 📅"}].map(t => (
              <button key={t.k} onClick={() => setDateType(t.k)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: dateType === t.k ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, background: dateType === t.k ? colors.primaryLight : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: dateType === t.k ? colors.primary : colors.textLight }}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Date Inputs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {dateType === "hijri" ? (
              <>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>الشهر الهجري</label>
                  <select value={hMonth} onChange={e => setHMonth(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", direction: "rtl", background: "#fff" }}>
                    {HIJRI_MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>اليوم</label>
                  <input type="number" min={1} max={30} value={hDay} onChange={e => setHDay(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, textAlign: "center" }} />
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>الشهر الميلادي</label>
                  <select value={gMonth} onChange={e => setGMonth(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", direction: "rtl", background: "#fff" }}>
                    {GREG_MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>اليوم</label>
                  <input type="number" min={1} max={31} value={gDay} onChange={e => setGDay(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, textAlign: "center" }} />
                </div>
              </>
            )}
          </div>

          {/* Duration */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>مدة المناسبة (بالأيام)</label>
              <input type="number" min={1} max={30} value={duration} onChange={e => setDuration(e.target.value)}
                style={{ width: 80, padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, textAlign: "center" }} />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 20 }}>
                <div onClick={() => setRecurring(!recurring)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: recurring ? colors.primary : "#d1d5db", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.2s", ...(recurring ? { left: 3 } : { right: 3 }) }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>تتكرر سنوياً</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={submit}
              style={{ flex: 1, padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1e40af, #0ea5e9)", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 800, boxShadow: "0 4px 12px rgba(30,64,175,0.3)" }}>
              ✅ حفظ المناسبة
            </button>
            <button onClick={onClose}
              style={{ padding: "12px 20px", borderRadius: 12, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: colors.textLight }}>
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
