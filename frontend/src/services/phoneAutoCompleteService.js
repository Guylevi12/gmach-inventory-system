// services/phoneAutoCompleteService.js
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

/**
 * שירות לחיפוש פרטי לקוח לפי מספר טלפון בהיסטוריית ההזמנות
 */
export const phoneAutoCompleteService = {
  /**
   * חיפוש פרטי לקוח לפי מספר טלפון
   * @param {string} phone - מספר הטלפון לחיפוש
   * @returns {Promise<{found: boolean, clientData?: object}>}
   */
  async findClientByPhone(phone) {
    try {
      console.log('🔍 מחפש פרטי לקוח למספר טלפון:', phone);
      
      if (!phone || phone.length < 10) {
        return { found: false };
      }

      // ניקוי מספר הטלפון - הסרת רווחים, מקפים וכדומה
      const cleanPhone = phone.replace(/[\s\-]/g, '');

      // חיפוש בקולקציית ההזמנות
      const ordersQuery = query(
        collection(db, 'orders'),
        where('phone', '==', cleanPhone)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        console.log('❌ לא נמצאו הזמנות עבור מספר זה');
        return { found: false };
      }

      // לקיחת ההזמנה האחרונה (הכי עדכנית)
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // מיון לפי תאריך יצירה (האחרונה ראשונה)
      orders.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      const latestOrder = orders[0];
      
      console.log('✅ נמצאה הזמנה:', {
        clientName: latestOrder.clientName,
        address: latestOrder.address,
        email: latestOrder.email
      });

      return {
        found: true,
        clientData: {
          clientName: latestOrder.clientName || '',
          address: latestOrder.address || '', 
          email: latestOrder.email || ''
        }
      };

    } catch (error) {
      console.error('❌ שגיאה בחיפוש פרטי לקוח:', error);
      return { found: false };
    }
  }
};