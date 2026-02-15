/*
  صفحة التقويم والملاحظات — مستخرجة من App.jsx (الخطوة 6)
  المكونات: NotesCalendarAddInput، NotesCalendarPinnedCard، NotesCalendarAddPinnedInput، NotesCalendarAddEventModal، NotesCalendar
*/
import React, { useState, useMemo, useCallback } from 'react';
import {
  gregorianToHijri,
  getKeyNC,
  toArabicNumNC,
  buildCalendarDays,
  getEventsForDate,
  isHoliday,
  addDailyNote as domainAddDailyNote,
  toggleDailyNote as domainToggleDailyNote,
  deleteDailyNote as domainDeleteDailyNote,
  addPinnedNote as domainAddPinnedNote,
  deletePinnedNote as domainDeletePinnedNote,
  updatePinnedNote as domainUpdatePinnedNote,
} from '../domain/index.js';

// ثوابت محلية (كانت في App.jsx)
const HIJRI_MONTHS_NC = ["محرّم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
const GREG_MONTHS_NC = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY_NAMES_NC = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const DAY_NAMES_SHORT_NC = ["أحد","إثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
const EVENT_CATEGORIES_NC = [
  { id: "holiday", label: "إجازة رسمية", color: "#0F1C2E", bg: "rgba(15,28,46,0.08)", icon: "" },
  { id: "school", label: "تقويم دراسي", color: "#8A8F98", bg: "rgba(138,143,152,0.12)", icon: "" },
  { id: "personal", label: "شخصي", color: "#B8A76A", bg: "rgba(184,167,106,0.15)", icon: "" },
  { id: "work", label: "عمل", color: "#1a2d45", bg: "rgba(15,28,46,0.06)", icon: "" },
  { id: "rental", label: "تأجير/حجوزات", color: "#6b7a4a", bg: "rgba(184,167,106,0.12)", icon: "" },
  { id: "religious", label: "مناسبة دينية", color: "#5c6b7a", bg: "rgba(138,143,152,0.1)", icon: "" },
];
const DEFAULT_EVENTS_NC = [
  { id: "e1", title: "عيد الفطر", category: "holiday", dateType: "hijri", hMonth: 10, hDay: 1, duration: 3, recurring: true },
  { id: "e2", title: "عيد الأضحى", category: "holiday", dateType: "hijri", hMonth: 12, hDay: 10, duration: 4, recurring: true },
  { id: "e3", title: "اليوم الوطني", category: "holiday", dateType: "gregorian", gMonth: 9, gDay: 23, duration: 1, recurring: true },
  { id: "e4", title: "يوم التأسيس", category: "holiday", dateType: "gregorian", gMonth: 2, gDay: 22, duration: 1, recurring: true },
  { id: "e5", title: "بداية رمضان", category: "religious", dateType: "hijri", hMonth: 9, hDay: 1, duration: 1, recurring: true },
];

function NotesCalendarAddInput({ placeholder, onAdd, colors }) {
  const [text, setText] = useState("");
  const handleAdd = () => {
    const t = text.trim();
    if (t) { onAdd(t); setText(""); }
  };
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
        placeholder={placeholder}
        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", direction: "rtl", background: "#f8fafc" }}
      />
      <button type="button" onClick={handleAdd}
        style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
        + إضافة
      </button>
    </div>
  );
}

function NotesCalendarPinnedCard({ note, colors, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  return (
    <div style={{ background: note.color || "rgba(15,28,46,0.06)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, border: "1px solid rgba(15,28,46,0.08)" }}>
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
              style={{ background: "rgba(15,28,46,0.08)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: colors.text }}>تعديل</button>
            <button onClick={onDelete}
              style={{ background: "rgba(198,40,40,0.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: colors.danger }}>حذف</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesCalendarAddPinnedInput({ onAdd, colors }) {
  const [text, setText] = useState("");
  const [color, setColor] = useState("rgba(15,28,46,0.06)");
  const [open, setOpen] = useState(false);
  const COLORS = ["rgba(15,28,46,0.06)", "rgba(184,167,106,0.2)", "rgba(138,143,152,0.12)", "rgba(15,28,46,0.1)", "rgba(184,167,106,0.12)", "rgba(138,143,152,0.08)"];
  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ width: "100%", padding: "10px", borderRadius: 10, border: `2px dashed ${colors.border}`, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: colors.primary, marginTop: 4 }}>
      + إضافة ملاحظة ثابتة
    </button>
  );
  return (
    <div style={{ background: color, borderRadius: 12, padding: 16, marginTop: 8, border: "1px solid rgba(15,28,46,0.08)" }}>
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

function NotesCalendarAddEventModal({ colors, onClose, onAdd }) {
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
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: colors.primaryDark }}>إضافة مناسبة جديدة</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: colors.textMuted, padding: 4 }} aria-label="إغلاق">×</button>
        </div>
        <div style={{ padding: "16px 24px 24px" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>اسم المناسبة</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: بداية الإجازة الصيفية"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, fontFamily: "inherit", direction: "rtl", marginBottom: 16, boxSizing: "border-box" }}
          />
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>التصنيف</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {EVENT_CATEGORIES_NC.map(cat => (
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
          <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>نوع التاريخ</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[{k:"hijri",l:"هجري"},{k:"gregorian",l:"ميلادي"}].map(t => (
              <button key={t.k} onClick={() => setDateType(t.k)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: dateType === t.k ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`, background: dateType === t.k ? colors.primaryLight : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: dateType === t.k ? colors.primary : colors.textLight }}>
                {t.l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            {dateType === "hijri" ? (
              <>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>الشهر الهجري</label>
                  <select value={hMonth} onChange={e => setHMonth(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 13, fontFamily: "inherit", direction: "rtl", background: "#fff" }}>
                    {HIJRI_MONTHS_NC.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
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
                    {GREG_MONTHS_NC.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
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
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: colors.text, display: "block", marginBottom: 6 }}>مدة المناسبة (بالأيام)</label>
              <input type="number" min={1} max={30} value={duration} onChange={e => setDuration(e.target.value)}
                style={{ width: 80, padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 14, textAlign: "center" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 20 }}>
              <div onClick={() => setRecurring(!recurring)}
                style={{ width: 44, height: 24, borderRadius: 12, background: recurring ? colors.primary : "#d1d5db", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, transition: "all 0.2s", ...(recurring ? { left: 3 } : { right: 3 }) }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>تتكرر سنوياً</span>
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={submit}
              style={{ flex: 1, padding: "12px 20px", borderRadius: 12, border: "none", background: "#0F1C2E", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 800, boxShadow: "0 4px 12px rgba(15,28,46,0.25)" }}>
              حفظ المناسبة
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

function NotesCalendar({ mode = 'calendar' }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(getKeyNC(today.getFullYear(), today.getMonth() + 1, today.getDate()));
  const [pinnedNotes, setPinnedNotes] = useState([{ id: "p1", text: "أرقام الحسابات البنكية المهمة", color: "rgba(15,28,46,0.06)", createdAt: Date.now() }]);
  const [dailyNotes, setDailyNotes] = useState({});
  const [events, setEvents] = useState(DEFAULT_EVENTS_NC);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const selParts = selectedDate.split("-").map(Number);
  const selHijri = gregorianToHijri(selParts[0], selParts[1], selParts[2]);
  const selDayName = DAY_NAMES_NC[new Date(selParts[0], selParts[1] - 1, selParts[2]).getDay()];

  const calendarDays = useMemo(() => buildCalendarDays(currentYear, currentMonth), [currentMonth, currentYear]);

  const getEventsForDateLocal = useCallback((gY, gM, gD) => getEventsForDate(events, gY, gM, gD), [events]);
  const isHolidayLocal = useCallback((gY, gM, gD) => isHoliday(getEventsForDateLocal(gY, gM, gD)), [getEventsForDateLocal]);

  const currentDailyNotes = dailyNotes[selectedDate] || [];
  const setCurrentDailyNotes = (notes) => { setDailyNotes(prev => ({ ...prev, [selectedDate]: notes })); };
  const addDailyNote = (text) => { setDailyNotes(prev => domainAddDailyNote(prev, selectedDate, text)); };
  const toggleDailyNote = (id) => { setCurrentDailyNotes(domainToggleDailyNote(currentDailyNotes, id)); };
  const deleteDailyNote = (id) => { setCurrentDailyNotes(domainDeleteDailyNote(currentDailyNotes, id)); };
  const addPinnedNote = (text, color) => { setPinnedNotes(prev => domainAddPinnedNote(prev, text, color, "rgba(15,28,46,0.06)")); };
  const deletePinnedNote = (id) => { setPinnedNotes(prev => domainDeletePinnedNote(prev, id)); };
  const updatePinnedNote = (id, text) => { setPinnedNotes(prev => domainUpdatePinnedNote(prev, id, text)); };

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };
  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(getKeyNC(today.getFullYear(), today.getMonth() + 1, today.getDate()));
  };

  const todayKey = getKeyNC(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const hijriCurrent = gregorianToHijri(currentYear, currentMonth + 1, 15);
  const pendingTasks = currentDailyNotes.filter(n => !n.done).length;
  const colors = { bg: "#FAFBFC", card: "#ffffff", primary: "#0F1C2E", primaryLight: "rgba(15,28,46,0.08)", primaryDark: "#0F1C2E", accent: "#B8A76A", text: "#0F1C2E", textLight: "#8A8F98", textMuted: "#8A8F98", border: "rgba(15,28,46,0.08)", success: "#2E7D32", danger: "#C62828", warning: "#E65100", holidayBg: "rgba(198,40,40,0.06)", todayBorder: "#B8A76A" };

  const showCal = mode === 'calendar';
  const showNotes = mode === 'notes';

  return (
    <div dir="rtl" className="p-4 max-w-6xl mx-auto" style={{ fontFamily: "var(--qa-font, 'IBM Plex Sans Arabic', 'Noto Sans Arabic', Tahoma, sans-serif)", minHeight: '100%' }}>
      <div style={{ display: "flex", flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        {showCal && (
          <div style={{ flex: "1 1 520px", minWidth: 320 }}>
          <div style={{ background: colors.card, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", border: `1px solid ${colors.border}` }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(15,28,46,0.06)", borderBottom: `1px solid ${colors.border}` }}>
              <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700 }}>→</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: colors.primaryDark }}>{GREG_MONTHS_NC[currentMonth]} {toArabicNumNC(currentYear)}</div>
                <div style={{ fontSize: 13, color: colors.accent, fontWeight: 600, marginTop: 2 }}>{HIJRI_MONTHS_NC[hijriCurrent.month-1]} {toArabicNumNC(hijriCurrent.year)} هـ</div>
              </div>
              <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary, fontWeight: 700 }}>←</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 12px", background: "rgba(15,28,46,0.04)" }}>
              {DAY_NAMES_SHORT_NC.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: colors.textLight, padding: 4 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 12px 12px", gap: 3 }}>
              {calendarDays.map((item, idx) => {
                const key = getKeyNC(item.year, item.month, item.day);
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const hijri = gregorianToHijri(item.year, item.month, item.day);
                const dayEvents = getEventsForDateLocal(item.year, item.month, item.day);
                const holiday = isHolidayLocal(item.year, item.month, item.day);
                const hasTasks = dailyNotes[key]?.length > 0;
                const hasPendingTasks = dailyNotes[key]?.some(n => !n.done);
                const dayOfWeek = new Date(item.year, item.month - 1, item.day).getDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
                return (
                  <button key={idx} onClick={() => setSelectedDate(key)}
                    style={{
                      position: "relative", padding: "6px 2px", border: isToday ? `2px solid ${colors.todayBorder}` : isSelected ? `2px solid ${colors.primary}` : "2px solid transparent",
                      borderRadius: 10, cursor: "pointer", transition: "all 0.15s", minHeight: 56,
                      background: isToday ? "rgba(184,167,106,0.15)" : isSelected ? colors.primaryLight : holiday ? colors.holidayBg : isWeekend && item.current ? "rgba(15,28,46,0.04)" : "transparent",
                      opacity: item.current ? 1 : 0.35,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
                    }}>
                    <span style={{ fontSize: 15, fontWeight: isToday || isSelected ? 800 : 600, color: isSelected ? colors.primary : holiday ? colors.danger : isWeekend ? colors.textLight : colors.text }}>{toArabicNumNC(item.day)}</span>
                    <span style={{ fontSize: 9, color: isSelected ? colors.accent : colors.textMuted, fontWeight: 600 }}>{toArabicNumNC(hijri.day)}</span>
                    {dayEvents.length > 0 && (
                      <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 3 }}>
                        {dayEvents.slice(0, 3).map((ev, i) => {
                          const cat = EVENT_CATEGORIES_NC.find(c => c.id === ev.category);
                          return <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: cat?.color || "#999" }} />;
                        })}
                      </div>
                    )}
                    {hasTasks && (
                      <div style={{ position: "absolute", top: 3, left: 3, width: 7, height: 7, borderRadius: "50%", background: hasPendingTasks ? colors.warning : colors.success }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.border}`, display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {EVENT_CATEGORIES_NC.map(cat => (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: colors.textLight }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />{cat.label}
                </div>
              ))}
            </div>
          </div>
          {(() => {
            const evs = getEventsForDateLocal(selParts[0], selParts[1], selParts[2]);
            if (evs.length === 0) return null;
            return (
              <div style={{ marginTop: 12, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark, marginBottom: 10 }}>مناسبات هذا اليوم</div>
                {evs.map(ev => {
                  const cat = EVENT_CATEGORIES_NC.find(c => c.id === ev.category);
                  return (
                    <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: cat?.bg || "#f5f5f5", marginBottom: 6, border: `1px solid ${cat?.color}22` }}>
                      {cat?.icon ? <span style={{ fontSize: 18 }}>{cat.icon}</span> : null}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: cat?.color }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: colors.textLight }}>{cat?.label}{ev.duration > 1 ? ` — ${toArabicNumNC(ev.duration)} أيام` : ""}</div>
                      </div>
                      <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: colors.textMuted, padding: 4 }} aria-label="حذف">×</button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <button onClick={() => { setShowAddEvent(true); }}
            style={{ width: "100%", marginTop: 12, padding: "12px 16px", borderRadius: 12, border: `2px dashed ${colors.border}`, background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 600, color: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>+</span> إضافة مناسبة / إجازة
          </button>
          <div style={{ marginTop: 12, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15,28,46,0.06)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.primaryDark }}>جميع المناسبات المسجلة</span>
              <span style={{ fontSize: 11, color: colors.textMuted, background: colors.primaryLight, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{toArabicNumNC(events.length)}</span>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {events.map(ev => {
                const cat = EVENT_CATEGORIES_NC.find(c => c.id === ev.category);
                return (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${colors.border}08` }}>
                    {cat?.icon ? <span style={{ fontSize: 16 }}>{cat.icon}</span> : null}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>
                        {ev.dateType === "hijri" ? `${toArabicNumNC(ev.hDay)} ${HIJRI_MONTHS_NC[ev.hMonth-1]} (هجري)` : `${toArabicNumNC(ev.gDay)} ${GREG_MONTHS_NC[ev.gMonth-1]} (ميلادي)`}
                        {ev.duration > 1 && ` — ${toArabicNumNC(ev.duration)} أيام`}{ev.recurring && " (متكرر)"}
                      </div>
                    </div>
                    <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 12, padding: 4 }} aria-label="حذف">حذف</button>
                  </div>
                );
              })}
              {events.length === 0 && <div style={{ padding: 30, textAlign: "center", color: colors.textMuted, fontSize: 13 }}>لا توجد مناسبات مسجلة</div>}
            </div>
          </div>
        </div>
        )}

        {showNotes && (
          <div style={{ flex: "1 1 420px", minWidth: 300 }}>
          <div style={{ background: "rgba(15,28,46,0.06)", borderRadius: 14, padding: "16px 20px", marginBottom: 12, border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>{selDayName}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: colors.primary }}>{toArabicNumNC(selParts[2])} {GREG_MONTHS_NC[selParts[1]-1]} {toArabicNumNC(selParts[0])}</div>
                <div style={{ fontSize: 14, marginTop: 4, color: colors.textMuted }}>{toArabicNumNC(selHijri.day)} {HIJRI_MONTHS_NC[selHijri.month-1]} {toArabicNumNC(selHijri.year)} هـ</div>
              </div>
              <button onClick={goToday} style={{ background: colors.primary, border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>اليوم</button>
            </div>
          </div>
          <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, background: "rgba(15,28,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0F1C2E" }}>مهام وملاحظات اليوم</span>
              </div>
              {currentDailyNotes.length > 0 && <div style={{ fontSize: 11, color: colors.textMuted }}>{toArabicNumNC(currentDailyNotes.filter(n => n.done).length)}/{toArabicNumNC(currentDailyNotes.length)} مكتملة</div>}
            </div>
            {currentDailyNotes.length > 0 && (
              <div style={{ padding: "8px 16px 4px", background: "rgba(15,28,46,0.03)" }}>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(15,28,46,0.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, transition: "width 0.4s ease", width: `${(currentDailyNotes.filter(n => n.done).length / currentDailyNotes.length) * 100}%`, background: currentDailyNotes.every(n => n.done) ? colors.success : colors.accent }} />
                </div>
              </div>
            )}
            <div style={{ padding: "8px 16px 12px" }}>
              {currentDailyNotes.map(note => (
                <div key={note.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${colors.border}33` }}>
                  <button onClick={() => toggleDailyNote(note.id)} style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${note.done ? colors.success : colors.border}`, background: note.done ? colors.success : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }} aria-label={note.done ? "تم" : "غير مكتمل"} />
                  <span style={{ flex: 1, fontSize: 14, lineHeight: 1.6, textDecoration: note.done ? "line-through" : "none", color: note.done ? colors.textMuted : colors.text }}>{note.text}</span>
                  <button onClick={() => deleteDailyNote(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: 14, padding: "2px 4px", opacity: 0.5 }} aria-label="حذف">×</button>
                </div>
              ))}
              {currentDailyNotes.length === 0 && (
                <div style={{ padding: "24px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
                  لا توجد مهام لهذا اليوم
                </div>
              )}
              <div style={{ marginTop: 8 }}><NotesCalendarAddInput placeholder="أضف مهمة أو ملاحظة لهذا اليوم..." onAdd={addDailyNote} colors={colors} /></div>
            </div>
          </div>
          <div style={{ background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.border}`, background: "rgba(15,28,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 700, color: "#0F1C2E" }}>ملاحظات ثابتة</span></div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>(تظهر دائماً)</span>
            </div>
            <div style={{ padding: "12px 16px" }}>
              {pinnedNotes.map(note => (
                <NotesCalendarPinnedCard key={note.id} note={note} colors={colors} onDelete={() => deletePinnedNote(note.id)} onUpdate={(text) => updatePinnedNote(note.id, text)} />
              ))}
              {pinnedNotes.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>لا توجد ملاحظات ثابتة</div>}
              <NotesCalendarAddPinnedInput onAdd={addPinnedNote} colors={colors} />
            </div>
          </div>
        </div>
        )}
      </div>
      {showAddEvent && (
        <NotesCalendarAddEventModal colors={colors} onClose={() => setShowAddEvent(false)} onAdd={(ev) => { setEvents(prev => [...prev, { ...ev, id: `e${Date.now()}` }]); setShowAddEvent(false); }} />
      )}
    </div>
  );
}

export default NotesCalendar;
