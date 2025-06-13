// src/components/CalendarGrid.jsx
import React, { useState, useEffect } from 'react';
import './css/CalendarGrid.css';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
};

const CalendarGrid = ({ currentDate, events = [], setCurrentDate, setSelectedEvents, setSelectedDate, setShowReport }) => {
  const getEventsForDate = (day) => {
    if (!Array.isArray(events)) return [];
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate.getDate() === targetDate.getDate() && 
             eventDate.getMonth() === targetDate.getMonth() && 
             eventDate.getFullYear() === targetDate.getFullYear();
    });
  };

  // Group events by order ID to show unique orders per day
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

const handleDateClick = (day) => {
  const allEventsForDay = getEventsForDate(day);

  // אל תפתח דוח אם כל האירועים הם רק "השאלה פעילה"
  const onlyActive = allEventsForDay.length > 0 && allEventsForDay.every(e => e.type === 'השאלה פעילה');
  if (onlyActive) return;

  if (allEventsForDay.length > 0) {
    setSelectedEvents(allEventsForDay);
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setShowReport(true);
  }
};


  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const uniqueOrders = getUniqueOrdersForDate(day);
    
    // Group events by type for display
    const pickupEvents = dayEvents.filter(e => e.type === 'השאלה');
    const returnEvents = dayEvents.filter(e => e.type === 'החזרה');
    const activeEvents = dayEvents.filter(e => e.type === 'השאלה פעילה');

    const hasAnyEvent = dayEvents.length > 0;
    const uniqueOrderCount = uniqueOrders.length;

    let dayClasses = 'day-cell';
    if (hasAnyEvent) dayClasses += ' has-events';
    if (pickupEvents.length > 0) dayClasses += ' pickup-day';
    if (returnEvents.length > 0) dayClasses += ' return-day';
    // if (activeEvents.length > 0) dayClasses += ' active-day';

    days.push(
      <div
        key={day}
        className={dayClasses}
        onClick={() => handleDateClick(day)}
        style={{
          cursor: (dayEvents.some(e => e.type !== 'השאלה פעילה')) ? 'pointer' : 'default'
        }}
      >
        <span className="day-number">{day}</span>
        
        {/* Event Icons */}
        <div className="event-icons">
          {pickupEvents.length > 0 && (
            <div className="event-tag pickup-tag" title="איסוף מוצרים">
              📦 {pickupEvents.length > 1 && pickupEvents.length}
            </div>
          )}
          {/* {activeEvents.length > 0 && (
            <div className="event-tag active-tag" title="מוצרים בשימוש">
              ⏰ {activeEvents.length > 1 && activeEvents.length}
            </div>
          )} */}
          {returnEvents.length > 0 && (
            <div className="event-tag return-tag" title="החזרת מוצרים">
              🔄 {returnEvents.length > 1 && returnEvents.length}
            </div>
          )}
        </div>

        {/* Order Count */}
        {uniqueOrderCount > 0 && (
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
          {/* <span className="legend-item">⏰ מוצרים בשימוש</span> */}
          <span className="legend-item">🔄 החזרת מוצרים</span>
        </div>
        <div className="calendar-stats">
          לחץ על יום עם אירועים כדי לראות פרטים • סה"כ אירועים: {Array.isArray(events) ? events.length : 0}
        </div>
        {(!Array.isArray(events) || events.length === 0) && (
          <div className="warning">אין אירועים נטענים - בדוק את החיבור למסד הנתונים</div>
        )}
      </div>
    </div>
  );
};

export default CalendarGrid;