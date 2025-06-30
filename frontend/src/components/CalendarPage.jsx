// src/components/CalendarPage.jsx - הסרה רק של ניווט מההתראות
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
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // ✅ הסרתי את כל הקוד המסובך של ניווט לתאריך מההתראות
  // הקוד הזה כלל:
  // - useLocation ו-location.state?.targetDate
  // - useEffect מסובך עם setTimeout וחיפוש אלמנטים
  // - ניסיונות להדגיש תאריכים ספציפיים
  // - window.history.replaceState
  // הכל הוסר כי החלטנו לוותר על הפיצ'ר הזה

  if (loading) {
    return (
      <>
        <style jsx>{`
          @keyframes highlightFlash {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.8);
            }
            25% { 
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(147, 51, 234, 0.4);
            }
            50% { 
              transform: scale(1.08);
              box-shadow: 0 0 0 20px rgba(147, 51, 234, 0.2);
            }
            75% { 
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(147, 51, 234, 0.4);
            }
          }
        `}</style>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">טוען נתוני יומן...</p>
          </div>
        </div>
      </>
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
    <>
      {/* ✅ שמרתי על CSS להדגשה כללית - לא קשור להתראות */}
      <style jsx global>{`
        @keyframes highlightFlash {
          0% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 1);
            border-color: #9333ea !important;
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%) !important;
          }
          15% { 
            transform: scale(1.1);
            box-shadow: 0 0 0 15px rgba(147, 51, 234, 0.6);
            border-color: #7c3aed !important;
            background: linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 100%) !important;
          }
          30% { 
            transform: scale(1.15);
            box-shadow: 0 0 0 25px rgba(147, 51, 234, 0.4);
            border-color: #6d28d9 !important;
            background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%) !important;
          }
          50% { 
            transform: scale(1.12);
            box-shadow: 0 0 0 30px rgba(147, 51, 234, 0.2);
            border-color: #5b21b6 !important;
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%) !important;
          }
          70% { 
            transform: scale(1.08);
            box-shadow: 0 0 0 20px rgba(147, 51, 234, 0.3);
            border-color: #7c3aed !important;
            background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%) !important;
          }
          85% { 
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(147, 51, 234, 0.5);
            border-color: #9333ea !important;
            background: linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 100%) !important;
          }
          100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.8);
            border-color: #9333ea !important;
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%) !important;
          }
        }
        
        /* סטיילינג נוסף למחוון יום מודגש */
        .day-cell[style*="highlightFlash"] {
          position: relative !important;
          z-index: 1000 !important;
        }
        
        .day-cell[style*="highlightFlash"] .day-number {
          color: #581c87 !important;
          font-weight: bold !important;
          font-size: 1.2rem !important;
        }
      `}</style>
      
      <div className="container mx-auto px-4">
        <HebrewCalendar
          allItems={allItems}
          itemsMap={itemsMap}
          events={events}
          setAllItems={setAllItems}
          setItemsMap={setItemsMap}
          setEvents={setEvents}
          fetchItemsAndOrders={fetchData}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />
      </div>
    </>
  );
};

export default CalendarPage;