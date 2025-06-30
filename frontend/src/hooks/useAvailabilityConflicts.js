// src/hooks/useAvailabilityConflicts.js - הוק חכם לניהול בעיות זמינות
import { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

export const useAvailabilityConflicts = (user) => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // בדיקה האם המשתמש רשאי לראות התראות
  const canSeeNotifications = user && (user.role === 'MainAdmin' || user.role === 'GmachAdmin');

  useEffect(() => {
    if (!canSeeNotifications) {
      setConflicts([]);
      return;
    }

    let unsubscribe;

    const setupRealtimeListener = () => {
      console.log('🔔 מתחיל מעקב אחרי בעיות זמינות...');
      setLoading(true);

      // מאזין בזמן אמת לשינויים בהזמנות
      unsubscribe = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          const problematicOrders = [];

          snapshot.docs.forEach(doc => {
            const order = doc.data();
            
            // רק הזמנות פעילות עם בעיות זמינות
            if (order.status === 'open' && 
                order.availabilityStatus === 'CONFLICT' && 
                order.availabilityConflicts && 
                order.availabilityConflicts.length > 0) {
              
              problematicOrders.push({
                id: doc.id,
                clientName: order.clientName,
                phone: order.phone,
                pickupDate: order.pickupDate,
                returnDate: order.returnDate,
                conflicts: order.availabilityConflicts,
                conflictDetectedAt: order.conflictDetectedAt,
                totalConflicts: order.availabilityConflicts.length
              });
            }
          });

          // מיון לפי תאריך איסוף
          problematicOrders.sort((a, b) => 
            new Date(a.pickupDate) - new Date(b.pickupDate)
          );

          console.log(`🔔 נמצאו ${problematicOrders.length} הזמנות עם בעיות זמינות`);
          
          setConflicts(problematicOrders);
          setLastUpdate(new Date());
          setLoading(false);
        },
        (error) => {
          console.error('❌ שגיאה במעקב אחרי בעיות זמינות:', error);
          setLoading(false);
        }
      );
    };

    setupRealtimeListener();

    // ניקוי המאזין כשהקומפוננט נמחק
    return () => {
      if (unsubscribe) {
        console.log('🔔 מפסיק מעקב אחרי בעיות זמינות');
        unsubscribe();
      }
    };
  }, [canSeeNotifications]);

  // פונקציה לרענון ידני
  const refreshConflicts = async () => {
    if (!canSeeNotifications) return;

    console.log('🔄 מרענן בעיות זמינות ידנית...');
    setLoading(true);

    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const problematicOrders = [];

      ordersSnap.docs.forEach(doc => {
        const order = doc.data();
        if (order.status === 'open' && 
            order.availabilityStatus === 'CONFLICT' && 
            order.availabilityConflicts && 
            order.availabilityConflicts.length > 0) {
          
          problematicOrders.push({
            id: doc.id,
            clientName: order.clientName,
            phone: order.phone,
            pickupDate: order.pickupDate,
            returnDate: order.returnDate,
            conflicts: order.availabilityConflicts,
            conflictDetectedAt: order.conflictDetectedAt,
            totalConflicts: order.availabilityConflicts.length
          });
        }
      });

      problematicOrders.sort((a, b) => 
        new Date(a.pickupDate) - new Date(b.pickupDate)
      );

      setConflicts(problematicOrders);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ שגיאה ברענון בעיות זמינות:', error);
    } finally {
      setLoading(false);
    }
  };

  // סטטיסטיקות מועילות
  const stats = {
    totalConflicts: conflicts.length,
    totalItems: conflicts.reduce((sum, order) => sum + order.totalConflicts, 0),
    urgentOrders: conflicts.filter(order => {
      const pickupDate = new Date(order.pickupDate);
      const today = new Date();
      const daysDiff = Math.ceil((pickupDate - today) / (1000 * 60 * 60 * 24));
      return daysDiff <= 3; // הזמנות דחופות - פחות מ-3 ימים
    }).length,
    oldestConflict: conflicts.length > 0 ? 
      Math.min(...conflicts.map(order => 
        order.conflictDetectedAt ? new Date(order.conflictDetectedAt).getTime() : Date.now()
      )) : null
  };

  return {
    conflicts,
    loading,
    lastUpdate,
    stats,
    refreshConflicts,
    hasConflicts: conflicts.length > 0,
    canSeeNotifications
  };
};