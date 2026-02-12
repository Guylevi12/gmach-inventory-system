// src/services/availabilityChecker.js - מנגנון בדיקת זמינות חוזרת
import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

/**
 * בודק את כל ההזמנות הפעילות ומוצא אלו שיש להן בעיות זמינות
 */
export class AvailabilityChecker {
  
  /**
   * הפונקציה הראשית - בודקת זמינות לכל ההזמנות הפעילות
   */
  static async checkAllActiveOrders() {
    try {
      console.log('🔍 מתחיל בדיקת זמינות לכל ההזמנות הפעילות...');
      
      // שלב 1: שליפת כל הנתונים
      const [orders, items] = await Promise.all([
        this.getAllActiveOrders(),
        this.getAllItems()
      ]);
      
      console.log(`📊 נמצאו ${orders.length} הזמנות פעילות ו-${items.length} פריטים במלאי`);
      
      // שלב 2: בדיקת זמינות לכל הזמנה
      const problematicOrders = [];
      const availabilityResults = [];

      for (const order of orders) {
        const conflicts = await this.checkOrderAvailability(order, orders, items);
        availabilityResults.push({ order, conflicts });
        if (conflicts.length > 0) {
          problematicOrders.push({
            order,
            conflicts
          });
        }
      }
      
      console.log(`⚠️ נמצאו ${problematicOrders.length} הזמנות עם בעיות זמינות`);
      
      // שלב 3: עדכון סטטוס ההזמנות הבעייתיות
      const syncSummary = await this.syncOrdersAvailabilityStatus(availabilityResults);
      
      return {
        success: true,
        totalOrders: orders.length,
        problematicOrders: problematicOrders.length,
        resolvedOrders: syncSummary.resolvedOrders,
        updatedOrders: syncSummary.updatedOrders,
        conflicts: problematicOrders
      };
      
    } catch (error) {
      console.error('❌ שגיאה בבדיקת זמינות:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * שליפת כל ההזמנות הפעילות
   */
  static async getAllActiveOrders() {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    return ordersSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(order => order.status === 'open')
      .sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate)); // מיון לפי תאריך
  }
  
  /**
   * שליפת כל הפריטים הפעילים
   */
  static async getAllItems() {
    const itemsSnap = await getDocs(collection(db, 'items'));
    return itemsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.isDeleted !== true);
  }
  
  /**
   * בודק זמינות עבור הזמנה ספציפית
   */
  static async checkOrderAvailability(currentOrder, allOrders, allItems) {
    const conflicts = [];
    
    if (!currentOrder.items || !currentOrder.pickupDate || !currentOrder.returnDate) {
      return conflicts;
    }
    
    const currentPickup = new Date(currentOrder.pickupDate);
    const currentReturn = new Date(currentOrder.returnDate);
    
    // בדיקה לכל פריט בהזמנה הנוכחית
    for (const orderItem of currentOrder.items) {
      const stockItem = allItems.find(item => 
        item.id === orderItem.id || item.name === orderItem.name
      );
      
      if (!stockItem) {
        conflicts.push({
          itemName: orderItem.name,
          itemId: orderItem.ItemId || orderItem.itemId,
          requested: orderItem.quantity,
          available: 0,
          issue: 'ITEM_NOT_FOUND',
          message: 'הפריט לא נמצא במלאי'
        });
        continue;
      }
      
      // חישוב כמות זמינה לתקופת ההזמנה
      const availableQuantity = this.calculateAvailableQuantity(
        stockItem,
        currentOrder,
        allOrders,
        currentPickup,
        currentReturn
      );
      
      if (orderItem.quantity > availableQuantity) {
        conflicts.push({
          itemName: orderItem.name,
          itemId: stockItem.ItemId,
          requested: orderItem.quantity,
          available: availableQuantity,
          totalStock: stockItem.quantity,
          issue: 'INSUFFICIENT_STOCK',
          message: `מבוקש: ${orderItem.quantity}, זמין: ${availableQuantity}`
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * מחשב כמות זמינה לפריט בתקופה מסוימת
   */
  static calculateAvailableQuantity(stockItem, currentOrder, allOrders, pickupDate, returnDate) {
    const totalStock = stockItem.quantity || 0;
    let reservedQuantity = 0;
    
    // מעבר על כל ההזמנות האחרות שחופפות לתקופה
    for (const otherOrder of allOrders) {
      // דילוג על ההזמנה הנוכחית
      if (otherOrder.id === currentOrder.id) continue;
      
      if (!otherOrder.pickupDate || !otherOrder.returnDate || !otherOrder.items) continue;
      
      const otherPickup = new Date(otherOrder.pickupDate);
      const otherReturn = new Date(otherOrder.returnDate);
      
      // בדיקת חפיפה בתאריכים
      const hasDateOverlap = otherReturn >= pickupDate && otherPickup <= returnDate;
      
      if (hasDateOverlap) {
        // חיפוש הפריט בהזמנה האחרת
        const itemInOtherOrder = otherOrder.items.find(item => 
          item.id === stockItem.id || item.name === stockItem.name
        );
        
        if (itemInOtherOrder) {
          reservedQuantity += itemInOtherOrder.quantity || 0;
        }
      }
    }
    
    return Math.max(0, totalStock - reservedQuantity);
  }
  
  /**
   * מעדכן הזמנות עם בעיות זמינות
   */
  static async updateOrdersWithConflicts(problematicOrders) {
    const updates = [];
    
    for (const { order, conflicts } of problematicOrders) {
      try {
        // הוספת שדה שמסמן שיש בעיית זמינות
        const updateData = {
          availabilityStatus: 'CONFLICT',
          availabilityConflicts: conflicts,
          conflictDetectedAt: new Date().toISOString(),
          needsAttention: true,
          lastAvailabilityCheck: serverTimestamp()
        };
        
        updates.push(
          updateDoc(doc(db, 'orders', order.id), updateData)
        );
        
        console.log(`⚠️ עודכנה הזמנה ${order.simpleId || order.id} עם ${conflicts.length} בעיות זמינות`);
        
      } catch (error) {
        console.error(`❌ שגיאה בעדכון הזמנה ${order.id}:`, error);
      }
    }
    
    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`✅ עודכנו ${updates.length} הזמנות עם בעיות זמינות`);
    }
  }

  /**
   * מסנכרן סטטוס זמינות לכל ההזמנות הפעילות:
   * הזמנות עם בעיה יסומנו CONFLICT, והזמנות שתוקנו ינוקו ל-OK.
   */
  static async syncOrdersAvailabilityStatus(availabilityResults) {
    const updates = [];
    let resolvedOrders = 0;

    for (const { order, conflicts } of availabilityResults) {
      const hasConflicts = conflicts.length > 0;

      if (hasConflicts) {
        updates.push(
          updateDoc(doc(db, 'orders', order.id), {
            availabilityStatus: 'CONFLICT',
            availabilityConflicts: conflicts,
            conflictDetectedAt: new Date().toISOString(),
            needsAttention: true,
            lastAvailabilityCheck: serverTimestamp()
          })
        );
        continue;
      }

      const hadConflictBefore =
        order.availabilityStatus === 'CONFLICT' ||
        (order.availabilityConflicts && order.availabilityConflicts.length > 0) ||
        order.needsAttention === true;

      if (hadConflictBefore) {
        resolvedOrders += 1;
        updates.push(
          updateDoc(doc(db, 'orders', order.id), {
            availabilityStatus: 'OK',
            availabilityConflicts: [],
            needsAttention: false,
            lastAvailabilityCheck: serverTimestamp()
          })
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return {
      resolvedOrders,
      updatedOrders: updates.length
    };
  }
  
  /**
   * מנקה סטטוס זמינות מהזמנה (קוראים לזה כשההזמנה תוקנה)
   */
  static async clearAvailabilityConflict(orderId) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        availabilityStatus: 'OK',
        availabilityConflicts: [],
        needsAttention: false,
        lastAvailabilityCheck: serverTimestamp()
      });
      console.log(`✅ נוקה סטטוס זמינות מהזמנה ${orderId}`);
    } catch (error) {
      console.error(`❌ שגיאה בניקוי סטטוס זמינות:`, error);
    }
  }
  
  /**
   * פונקציה שתרוץ אחרי כל סגירת הזמנה
   */
  static async runAfterOrderClosure(closedOrderId) {
    console.log(`🔄 מריץ בדיקת זמינות אחרי סגירת הזמנה ${closedOrderId}`);
    
    const result = await this.checkAllActiveOrders();
    
    if (result.success && result.problematicOrders > 0) {
      console.log(`🚨 נמצאו ${result.problematicOrders} הזמנות שדורשות עדכון אחרי סגירת ההזמנה`);
      
      // כאן ניתן להוסיף התראה למשתמש
      return {
        shouldShowAlert: true,
        message: `נמצאו ${result.problematicOrders} הזמנות עתידיות שדורשות עדכון בגלל שינויי מלאי`,
        conflicts: result.conflicts
      };
    }
    
    return { shouldShowAlert: false };
  }
  
  /**
   * בדיקה מהירה האם הזמנה מסוימת יש בה בעיות
   */
  static async quickCheckOrder(orderId) {
    try {
      const [orders, items] = await Promise.all([
        this.getAllActiveOrders(),
        this.getAllItems()
      ]);
      
      const order = orders.find(o => o.id === orderId);
      if (!order) return { hasConflicts: false };
      
      const conflicts = await this.checkOrderAvailability(order, orders, items);
      
      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };
      
    } catch (error) {
      console.error('❌ שגיאה בבדיקה מהירה:', error);
      return { hasConflicts: false, error: error.message };
    }
  }
}

/**
 * פונקציית עזר לשימוש בקומפוננטים
 */
export const useAvailabilityChecker = () => {
  return {
    checkAllOrders: AvailabilityChecker.checkAllActiveOrders,
    runAfterClosure: AvailabilityChecker.runAfterOrderClosure,
    quickCheck: AvailabilityChecker.quickCheckOrder,
    clearConflict: AvailabilityChecker.clearAvailabilityConflict
  };
};
