// src/components/CalendarGrid.jsx - גרסה סופית ללא כפתור מחק הכל
import React, { useState, useEffect } from 'react';
import './css/CalendarGrid.css';
import { ChevronRight, ChevronLeft, Calendar, Ban, Save, X } from 'lucide-react';
import { closedDatesService } from '@/services/closedDatesService';
import { useUser } from '../../UserContext';

const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
};

const CalendarGrid = ({ currentDate, events = [], setCurrentDate, setSelectedEvents, setSelectedDate, setShowReport, fetchItemsAndOrders }) => {
  const { user } = useUser();
  const [closedDates, setClosedDates] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedDatesForClosure, setSelectedDatesForClosure] = useState(new Set());
  const [saving, setSaving] = useState(false);

  // טעינת ימים סגורים
  useEffect(() => {
    loadClosedDates();
  }, []);

  const loadClosedDates = async () => {
    try {
      const dates = await closedDatesService.getClosedDates();
      console.log('📅 ימים סגורים נטענו:', dates.map(d => ({ id: d.id, date: d.date })));
      setClosedDates(dates);
    } catch (error) {
      console.error('❌ שגיאה בטעינת ימים סגורים:', error);
    }
  };

  // בדיקה האם המשתמש הוא מנהל
  const isManager = () => {
    if (!user) {
      console.log('❌ אין משתמש מחובר');
      return false;
    }
    
    const hasPermission = user.role === 'MainAdmin';
    console.log('✅ יש הרשאות מנהל:', hasPermission, 'תפקיד:', user.role);
    return hasPermission;
  };

  // יצירת תאריך מקומי נכון
  const createLocalDate = (year, month, day) => {
    const date = new Date(year, month, day);
    const year_str = date.getFullYear();
    const month_str = String(date.getMonth() + 1).padStart(2, '0');
    const day_str = String(date.getDate()).padStart(2, '0');
    return `${year_str}-${month_str}-${day_str}`;
  };

  // קבלת אירועים לתאריך ספציפי
  const getEventsForDate = (day) => {
    if (!Array.isArray(events)) return [];
    const targetDateStr = createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), day);

    return events.filter(event => {
      if (!event.date) return false;
      const eventDateStr = closedDatesService.formatDateToString(event.date);
      return eventDateStr === targetDateStr;
    });
  };

  // בדיקה האם תאריך סגור
  const isDateClosed = (day) => {
    const dateStr = createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    return closedDatesService.isDateClosed(dateStr, closedDates);
  };

  // בדיקה האם יום ניתן לסגירה/ביטול
  const canCloseDate = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    // לא ניתן לסגור תאריכים בעבר
    if (targetDate < today) {
      return false;
    }
    
    const dayEvents = getEventsForDate(day);
    const hasRealEvents = dayEvents.some(e => e.type !== 'השאלה פעילה');
    return !hasRealEvents;
  };

  // בדיקה האם יום בעבר
  const isPastDate = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate < today;
  };

  // בדיקה האם זה היום הנוכחי
  const isToday = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    
    return targetDate.getDate() === today.getDate() &&
           targetDate.getMonth() === today.getMonth() &&
           targetDate.getFullYear() === today.getFullYear();
  };

  // טיפול בלחיצה על תאריך
  const handleDateClick = (day) => {
    if (editMode) {
      handleDateSelectionForClosure(day);
      return;
    }

    const allEventsForDay = getEventsForDate(day);
    const onlyActive = allEventsForDay.length > 0 && allEventsForDay.every(e => e.type === 'השאלה פעילה');
    if (onlyActive) return;

    if (allEventsForDay.length > 0) {
      setSelectedEvents(allEventsForDay);
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      setShowReport(true);
    }
  };

  // טיפול בבחירת תאריכים לסגירה/ביטול סגירה - עם לוג מפורט
  const handleDateSelectionForClosure = async (day) => {
    console.log(`🎯 לחיצה על יום ${day} במצב עריכה`);
    const isClosed = isDateClosed(day);
    console.log(`🔍 היום סגור: ${isClosed}, מצב עריכה: ${editMode}`);
    
    // אם היום כבר סגור - בטל את הסגירה מיידית ועדכן את התצוגה!
    if (isClosed) {
      const dateStr = createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), day);
      console.log(`🔓 מבטל סגירה של ${dateStr} - עדכון מיידי + נשאר במצב עריכה`);
      
      // עדכון מיידי לפני הקריאה לשרת
      setClosedDates(prevDates => {
        const newDates = prevDates.filter(d => d.date !== dateStr && d.id !== dateStr);
        console.log(`📋 עדכון מיידי: הוסרו ${prevDates.length - newDates.length} ימים`);
        return newDates;
      });
      
      // כעת שלח לשרת (ללא רענון נוסף שיכול לאפס את המצב)
      await removeClosedDateInEditMode(dateStr);
      
      console.log(`✅ סיום טיפול ביום ${day} - מצב עריכה: ${editMode}`);
      return;
    }
    
    // אם היום לא סגור - בדוק אם ניתן לסגור
    if (!canCloseDate(day)) {
      if (isPastDate(day)) {
        alert('לא ניתן לסגור תאריכים שכבר עברו');
      } else {
        alert('ניתן לסגור רק ימים ללא אירועים קיימים');
      }
      return;
    }

    const dateStr = createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    console.log(`⭕ מסמן יום לבן ${dateStr} לסגירה`);
    
    const newSelected = new Set(selectedDatesForClosure);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
      console.log(`❌ הוסר מהבחירה: ${dateStr}`);
    } else {
      newSelected.add(dateStr);
      console.log(`✅ נוסף לבחירה: ${dateStr}`);
    }
    setSelectedDatesForClosure(newSelected);
    console.log(`📊 סה"כ נבחרו לסגירה: ${newSelected.size} ימים`);
  };

  // הסרת יום סגור במצב עריכה (נשאר במצב עריכה!) - ללא fetchItemsAndOrders
  const removeClosedDateInEditMode = async (dateStr) => {
    try {
      console.log(`🔓 מבטל סגירה במצב עריכה: ${dateStr}`);
      const success = await closedDatesService.removeClosedDate(dateStr);
      if (success) {
        console.log(`✅ הסגירה של ${dateStr} בוטלה - נשאר במצב עריכה`);
        
        // ⚠️ רק רענון ימים סגורים - לא כל הנתונים!
        await loadClosedDates();
        // 🚫 לא קוראים ל-fetchItemsAndOrders כדי לא לאפס את מצב העריכה
        
        console.log('🔓 יום בוטל מהסגירה - נשאר במצב עריכה');
      } else {
        // אם השרת נכשל, החזר את המצב
        await loadClosedDates();
        alert('שגיאה בביטול הסגירה');
      }
    } catch (error) {
      console.error('❌ שגיאה בביטול סגירת יום:', error);
      // החזר את המצב אם יש שגיאה
      await loadClosedDates();
      alert('שגיאה בביטול הסגירה');
    }
  };

  // הפעלת מצב עריכה - עם לוג
  const startEditMode = () => {
    console.log('🔧 מפעיל מצב עריכה');
    setEditMode(true);
    setSelectedDatesForClosure(new Set());
    console.log('✅ מצב עריכה פעיל');
  };

  // ביטול מצב עריכה - עם לוג
  const cancelEditMode = () => {
    console.log('❌ מבטל מצב עריכה');
    setEditMode(false);
    setSelectedDatesForClosure(new Set());
    console.log('✅ יצאנו ממצב עריכה');
  };

  // שמירת ימים סגורים - מתוקן
  const saveClosedDates = async () => {
    if (selectedDatesForClosure.size === 0) {
      alert('לא נבחרו תאריכים לסגירה');
      return;
    }

    setSaving(true);
    try {
      const dates = Array.from(selectedDatesForClosure);
      console.log('📅 שומר ימים סגורים:', dates);
      
      const results = await closedDatesService.addMultipleClosedDates(
        dates, 
        user.uid, 
        'יום סגור - נקבע על ידי המנהל'
      );

      if (results.success.length > 0) {
        alert(`✅ ${results.success.length} ימים נסגרו בהצלחה`);
        await loadClosedDates();
        
        // 🔄 רק כאן נרענן את כל הנתונים כי אנחנו יוצאים ממצב עריכה
        if (fetchItemsAndOrders) {
          await fetchItemsAndOrders();
        }
      }

      if (results.failed.length > 0) {
        alert(`⚠️ ${results.failed.length} ימים לא הצליחו להיסגר`);
      }

      // יציאה ממצב עריכה רק אחרי שמירה מוצלחת
      setEditMode(false);
      setSelectedDatesForClosure(new Set());
    } catch (error) {
      console.error('❌ שגיאה בשמירת ימים סגורים:', error);
      alert('שגיאה בשמירת הימים הסגורים');
    } finally {
      setSaving(false);
    }
  };

  // קבלת הזמנות ייחודיות לתאריך
  const getUniqueOrdersForDate = (day) => {
    const dayEvents = getEventsForDate(day);
    const uniqueOrders = new Map();

    dayEvents.forEach(event => {
      if (!uniqueOrders.has(event.orderId)) {
        uniqueOrders.set(event.orderId, {
          ...event,
          allEventsForOrder: dayEvents.filter(e => e.orderId === event.orderId)
        });
      }
    });

    return Array.from(uniqueOrders.values());
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];
  
  // ימים ריקים בתחילת החודש
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
  }

  // ימי החודש
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const uniqueOrders = getUniqueOrdersForDate(day);
    const pickupEvents = dayEvents.filter(e => e.type === 'השאלה');
    const returnEvents = dayEvents.filter(e => e.type === 'החזרה');

    const hasAnyEvent = dayEvents.length > 0;
    const uniqueOrderCount = uniqueOrders.length;
    const isClosed = isDateClosed(day);
    const canClose = canCloseDate(day);
    const isPast = isPastDate(day);
    const isCurrentDay = isToday(day);
    
    const dateStr = createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isSelectedForClosure = selectedDatesForClosure.has(dateStr);

    let dayClasses = 'day-cell';
    if (hasAnyEvent) dayClasses += ' has-events';
    if (pickupEvents.length > 0) dayClasses += ' pickup-day';
    if (returnEvents.length > 0) dayClasses += ' return-day';
    if (isClosed) dayClasses += ' closed-day';
    if (isPast) dayClasses += ' past-day';
    if (isCurrentDay) dayClasses += ' today';
    if (editMode && (canClose || isClosed)) dayClasses += ' can-manage';
    if (isSelectedForClosure) dayClasses += ' selected-for-closure';

    days.push(
      <div
        key={day}
        className={dayClasses}
        onClick={() => handleDateClick(day)}
        style={{
          cursor: editMode ? 
            (canClose || isClosed ? 'pointer' : 'not-allowed') : 
            (dayEvents.some(e => e.type !== 'השאלה פעילה') ? 'pointer' : 'default')
        }}
      >
        <span className="day-number">{day}</span>

        {/* יום היום */}
        {isCurrentDay && (
          <div className="today-indicator" title="היום">
            📅
          </div>
        )}

        {/* יום סגור */}
        {isClosed && (
          <div className="closed-indicator" title="יום סגור - במצב עריכה: לחץ לביטול מיידי">
            🔒
          </div>
        )}

        {/* סימון לבחירה לסגירה */}
        {editMode && (canClose || isClosed) && (
          <div className="closure-selector" title={
            isClosed ? "לחץ לביטול מיידי" : "לחץ לבחירה לסגירה"
          }>
            {isClosed ? '🔓' : (isSelectedForClosure ? '✅' : '⭕')}
          </div>
        )}

        {/* אייקוני אירועים */}
        {!isClosed && (
          <div className="event-icons">
            {pickupEvents.length > 0 && (
              <div className="event-tag pickup-tag" title="איסוף מוצרים">
                📦 {pickupEvents.length > 1 && pickupEvents.length}
              </div>
            )}
            {returnEvents.length > 0 && (
              <div className="event-tag return-tag" title="החזרת מוצרים">
                🔄 {returnEvents.length > 1 && returnEvents.length}
              </div>
            )}
          </div>
        )}

        {/* מספר הזמנות */}
        {!isClosed && uniqueOrderCount > 0 && (
          <div className="event-count" title={`${uniqueOrderCount} הזמנות`}>
            {uniqueOrderCount}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
          <ChevronRight size={20} />
        </button>
        
        <h2 className="calendar-title">
          <Calendar size={24} /> {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* כלי עריכה למנהלים - ללא כפתור מחק הכל */}
      {isManager() && (
        <div className="calendar-controls">
          {!editMode ? (
            <div className="control-buttons">
              <button 
                className="btn-edit-dates"
                onClick={startEditMode}
                title="בטל תאריכים"
              >
                <Ban size={18} />
                בטל תאריכים
              </button>
            </div>
          ) : (
            <div className="edit-controls">
              <span className="edit-mode-indicator">
                📝 מצב עריכה: בחר ימים לבנים לסגירה או ימים סגורים לביטול ({selectedDatesForClosure.size} נבחרו)
              </span>
              <div className="edit-buttons">
                <button 
                  className="btn-save"
                  onClick={saveClosedDates}
                  disabled={saving || selectedDatesForClosure.size === 0}
                >
                  <Save size={16} />
                  {saving ? 'שומר...' : 'שמור'}
                </button>
                <button 
                  className="btn-cancel"
                  onClick={cancelEditMode}
                  disabled={saving}
                >
                  <X size={16} />
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="day-names">
        {dayNames.map(day => (
          <div key={day} className="day-name">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {days}
      </div>

      <div className="calendar-footer">
        <div className="calendar-legend">
          <span className="legend-item">📦 איסוף מוצרים</span>
          <span className="legend-item">🔄 החזרת מוצרים</span>
          {closedDates.length > 0 && <span className="legend-item">🔒 ימים סגורים ({closedDates.length})</span>}
          {editMode && <span className="legend-item">⭕ זמין לסגירה • 🔓 זמין לביטול</span>}
          <span className="legend-item">📅 היום</span>
        </div>
        <div className="calendar-stats">
          לחץ על יום עם אירועים כדי לראות פרטים • סה"כ אירועים: {Array.isArray(events) ? events.length : 0}
          {closedDates.length > 0 && ` • ימים סגורים: ${closedDates.length}`}
        </div>
        {(!Array.isArray(events) || events.length === 0) && (
          <div className="warning">אין אירועים נטענים - בדוק את החיבור למסד הנתונים</div>
        )}
      </div>
    </div>
  );
};

export default CalendarGrid;