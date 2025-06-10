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

  const handleDateClick = (day) => {
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      setSelectedEvents(dayEvents);
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
    const currentFullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const safeEvents = Array.isArray(events) ? events : [];

    // Find events for this specific date
    const dayEvents = safeEvents.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === currentFullDate.toDateString();
    });

    // Separate pickup and return events
    const pickupEvents = dayEvents.filter(e => e.type === 'השאלה');
    const returnEvents = dayEvents.filter(e => e.type === 'החזרה');
    const activeEvents = dayEvents.filter(e => e.type === 'השאלה פעילה');

    const hasPickup = pickupEvents.length > 0;
    const hasReturn = returnEvents.length > 0;
    const hasActive = activeEvents.length > 0;
    const hasAnyEvent = dayEvents.length > 0;

    days.push(
      <div
        key={day}
        className={`day-cell ${hasPickup ? 'pickup-day' : ''} ${hasReturn ? 'return-day' : ''} ${hasActive ? 'active-day' : ''} ${hasAnyEvent ? 'has-events' : ''}`}
        onClick={() => handleDateClick(day)}
        style={{ cursor: hasAnyEvent ? 'pointer' : 'default' }}
      >
        <span>{day}</span>
        {hasPickup && <div className="event-tag pickup-tag">📦</div>}
        {hasReturn && <div className="event-tag return-tag">🔄</div>}
        {hasActive && <div className="event-tag active-tag">⏰</div>}
        {hasAnyEvent && <div className="event-count">{dayEvents.length}</div>}
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
          <span className="legend-item">📦 השאלה</span>
          <span className="legend-item">🔄 החזרה</span>
          <span className="legend-item">⏰ השאלה פעילה</span>
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