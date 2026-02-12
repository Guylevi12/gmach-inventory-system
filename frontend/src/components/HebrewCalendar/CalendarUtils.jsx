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
  const today = stripTime(new Date());

  return orderSnap.docs.flatMap(docSnap => {
    const order = docSnap.data();

    if (order.status === 'closed') return [];

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
      const pickupDate = new Date(order.pickupDate);
      const returnDate = new Date(order.returnDate);

      pickupDate.setHours(0, 0, 0, 0);
      returnDate.setHours(0, 0, 0, 0);

      // ✅ Check if order is overdue
      const isOverdue = today > returnDate;
      const overdueDays = isOverdue ? Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)) : 0;

      const daysDiff = Math.ceil((returnDate - pickupDate) / (1000 * 60 * 60 * 24));

      for (let i = 0; i <= daysDiff; i++) {
        if (i !== 0 && i !== daysDiff) continue; // דילוג על ימים באמצע

        const currentDate = new Date(pickupDate);
        currentDate.setDate(pickupDate.getDate() + i);

        let eventType;
        let eventIcon;
        let eventDescription;

        if (i === 0) {
          eventType = 'השאלה';
          eventIcon = '📦';
          eventDescription = 'איסוף מוצרים';
        } else if (i === daysDiff) {
          eventType = 'החזרה';
          eventIcon = '🔄';
          eventDescription = 'החזרת מוצרים';
        }

        events.push({
          id: `${docSnap.id}-${currentDate.toISOString().slice(0, 10)}`,
          orderId: docSnap.id,
          date: new Date(currentDate),
          clientName: order.clientName,
          phone: order.phone,
          email: order.email,
          orderNotes: order.orderNotes || '',
          orderNotesUpdatedAt: order.orderNotesUpdatedAt || null,
          manualEmailSent: order.manualEmailSent || false,
          manualEmailSentAt: order.manualEmailSentAt || null,
          type: eventType,
          icon: eventIcon,
          description: eventDescription,
          items: decorateItems(order.items),
          pickupDate: order.pickupDate,
          returnDate: order.returnDate,
          dayNumber: i + 1,
          totalDays: daysDiff + 1,
          isMultiDay: daysDiff > 0,
          // ✅ Add overdue status
          isOverdue: isOverdue,
          overdueDays: overdueDays,
          // הוספת מידע על בעיות זמינות
          availabilityStatus: order.availabilityStatus || 'OK',
          availabilityConflicts: order.availabilityConflicts || [],
          needsAttention: order.needsAttention || false,
          // Additional order fields
          eventType: order.eventType || 'כללי',
          pickupLocation: order.pickupLocation || 'מיקום לפי תיאום',
          specialInstructions: order.specialInstructions || 'אין הוראות מיוחדות'
        });
      }
    }

    return events;
  });
};

export const fetchItemsAndOrders = async (db, setAllItems, setItemsMap, setEvents) => {
  try {
    console.log('🔄 Fetching items and orders...');

    const itemSnap = await getDocs(collection(db, 'items'));
    const itemsData = itemSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        itemId: data.ItemId,
        name: data.name,
        imageUrl: data.imageUrl,
        quantity: data.quantity || 0,
        isDeleted: data.isDeleted || false
      };
    }).filter(item => !item.isDeleted); // Filter out deleted items

    console.log('📊 Items loaded with quantities:', itemsData.map(i => ({ name: i.name, quantity: i.quantity })));

    setAllItems(itemsData);

    const itemsMapObj = {};
    itemsData.forEach(item => {
      itemsMapObj[item.name] = item.imageUrl || null;
    });
    setItemsMap(itemsMapObj);

    const orderSnap = await getDocs(collection(db, 'orders'));
    console.log('📋 Orders loaded:', orderSnap.docs.length);

    await updateStockIfNeeded(orderSnap, db);

    const events = buildCalendarEvents(orderSnap, itemsData);
    console.log('📅 Events built:', events.length);

    setEvents(events);

    console.log('✅ Data refresh completed');
  } catch (error) {
    console.error('❌ שגיאה בטעינת ההזמנות והפריטים:', error);
  }
};
