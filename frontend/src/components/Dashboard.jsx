// src/components/Dashboard.jsx
import React, { useState, useCallback, useEffect } from 'react';
import NewLoan from './NewLoan';
import HebrewCalendar from './HebrewCalendar/HebrewCalendar';
import {
  migrateEventDateToPickupDate,
  updateStockIfNeeded,
  buildCalendarEvents
} from './HebrewCalendar/CalendarUtils';
import { db } from '../firebase/firebase-config';
import { collection, getDocs } from 'firebase/firestore';

const Dashboard = () => {
  const [allItems, setAllItems] = useState([]);
  const [itemsMap, setItemsMap] = useState({});
  const [events, setEvents] = useState([]);

  const loadItemsAndOrders = useCallback(async () => {
    try {
      const [itemsSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, 'items')),
        getDocs(collection(db, 'orders')),
      ]);

      const itemsData = itemsSnap.docs.map(doc => ({
        id: doc.id,
        itemId: doc.data().ItemId,
        name: doc.data().name,
        imageUrl: doc.data().imageUrl,
      }));
      setAllItems(itemsData);

      const map = {};
      itemsData.forEach(item => {
        map[item.name] = item.imageUrl || null;
      });
      setItemsMap(map);

      await updateStockIfNeeded(ordersSnap, db);
      const calendarEvents = buildCalendarEvents(ordersSnap, itemsData);
      setEvents(calendarEvents);
    } catch (err) {
      console.error('שגיאה בטעינה:', err);
    }
  }, []);

  useEffect(() => {
    migrateEventDateToPickupDate(db, collection, getDocs);
    loadItemsAndOrders();
  }, [loadItemsAndOrders]);

  return (
    <div className="max-w-6xl mx-auto p-4" dir="rtl">
      <h2 className="text-2xl font-bold mb-4 text-center">מערכת השאלות ומעקב</h2>
      <NewLoan onOrderCreated={loadItemsAndOrders} />
      <hr className="my-8" />
      <HebrewCalendar
        allItems={allItems}
        itemsMap={itemsMap}
        events={events}
        setAllItems={setAllItems}
        setItemsMap={setItemsMap}
        setEvents={setEvents}
        fetchItemsAndOrders={loadItemsAndOrders}
      />
    </div>
  );
};

export default Dashboard;
