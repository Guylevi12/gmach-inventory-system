// src/components/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { db } from '@/firebase/firebase-config';
import HebrewCalendar from './HebrewCalendar/HebrewCalendar';
import { fetchItemsAndOrders } from './HebrewCalendar/CalendarUtils';

const CalendarPage = () => {
  const [allItems, setAllItems] = useState([]);
  const [itemsMap, setItemsMap] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wrapper function to handle loading states
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchItemsAndOrders(db, setAllItems, setItemsMap, setEvents);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('שגיאה בטעינת נתוני היומן. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">טוען נתוני יומן...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <HebrewCalendar
        allItems={allItems}
        itemsMap={itemsMap}
        events={events}
        setAllItems={setAllItems}
        setItemsMap={setItemsMap}
        setEvents={setEvents}
        fetchItemsAndOrders={fetchData}
      />
    </div>
  );
};

export default CalendarPage;