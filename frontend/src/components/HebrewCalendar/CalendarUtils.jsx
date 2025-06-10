// src/components/HebrewCalendar/CalendarUtils.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export const stripTime = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const migrateEventDateToPickupDate = async (db, collectionFn, getDocsFn) => {
  const snap = await getDocsFn(collectionFn(db, 'orders'));
  const updates = snap.docs.filter(d => !d.data().pickupDate && d.data().eventDate);
  for (const docSnap of updates) {
    await updateDoc(doc(db, 'orders', docSnap.id), { pickupDate: docSnap.data().eventDate });
  }
};

export const updateStockIfNeeded = async (orderSnap, db) => {
  const today = stripTime(new Date());
  for (const docSnap of orderSnap.docs) {
    const order = docSnap.data();
    if (!order.pickupDate || order.stockUpdated) continue;
    const pickup = stripTime(new Date(order.pickupDate));
    if (pickup > today) continue;
    await updateDoc(doc(db, 'orders', docSnap.id), { stockUpdated: true });
  }
};

export const buildCalendarEvents = (orderSnap, itemsData) => {
  return orderSnap.docs.flatMap(docSnap => {
    const order = docSnap.data();

    const decorateItems = (items = []) => items.map(item => {
      const refItem = itemsData.find(i => i.id === item.id);
      return {
        ...item,
        imageUrl: refItem?.imageUrl || null,
        itemId: refItem?.itemId || 'לא נמצא'
      };
    });

    const events = [];

    if (order.pickupDate && order.returnDate) {
      let current = new Date(order.pickupDate);
      const end = new Date(order.returnDate);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      while (current <= end) {
        const type = current.getTime() === new Date(order.pickupDate).getTime()
          ? 'השאלה'
          : current.getTime() === new Date(order.returnDate).getTime()
          ? 'החזרה'
          : 'השאלה פעילה';

        events.push({
          id: `${docSnap.id}-${current.toISOString().slice(0, 10)}`,
          date: new Date(current),
          clientName: order.clientName,
          phone: order.phone,
          type,
          items: decorateItems(order.items),
          pickupDate: order.pickupDate,
          returnDate: order.returnDate
        });

        current.setDate(current.getDate() + 1);
      }
    }

    return events;
  });
};

export const fetchItemsAndOrders = async (db, setAllItems, setItemsMap, setEvents) => {
  try {
    const itemSnap = await getDocs(collection(db, 'items'));
    const itemsData = itemSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        itemId: data.ItemId,
        name: data.name,
        imageUrl: data.imageUrl,
      };
    });

    setAllItems(itemsData);

    const itemsMapObj = {};
    itemsData.forEach(item => {
      itemsMapObj[item.name] = item.imageUrl || null;
    });
    setItemsMap(itemsMapObj);

    const orderSnap = await getDocs(collection(db, 'orders'));

    await updateStockIfNeeded(orderSnap, db);

    const events = buildCalendarEvents(orderSnap, itemsData);
    setEvents(events);
  } catch (error) {
    console.error('שגיאה בטעינת ההזמנות והפריטים:', error);
  }
};
