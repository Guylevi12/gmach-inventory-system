// src/services/closedDatesService.js - תיקון מערכת ימים סגורים
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';

/**
 * שירות לניהול ימים סגורים במערכת הגמ"ח - גרסה מתוקנת
 */
export const closedDatesService = {
  
  /**
   * שליפת כל הימים הסגורים
   * @returns {Promise<Array>} רשימת תאריכים סגורים
   */
  async getClosedDates() {
    try {
      const snapshot = await getDocs(collection(db, 'closedDates'));
      const closedDates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📅 נטענו ימים סגורים:', closedDates.map(d => ({ id: d.id, date: d.date })));
      return closedDates;
    } catch (error) {
      console.error('❌ שגיאה בשליפת ימים סגורים:', error);
      return [];
    }
  },

  /**
   * הוספת יום סגור עם תיקון timezone
   * @param {string} date - תאריך בפורמט YYYY-MM-DD
   * @param {string} userId - מזהה המשתמש שסוגר את היום
   * @param {string} reason - סיבת הסגירה (אופציונלי)
   * @returns {Promise<boolean>} האם הפעולה הצליחה
   */
  async addClosedDate(date, userId, reason = 'יום סגור') {
    try {
      // וידוא שהתאריך בפורמט נכון
      const formattedDate = this.formatDateToString(date);
      
      if (!formattedDate) {
        console.error('❌ תאריך לא תקין:', date);
        return false;
      }

      console.log(`🔒 מוסיף יום סגור: ${formattedDate} (מקורי: ${date})`);
      
      const dateDoc = doc(db, 'closedDates', formattedDate);
      await setDoc(dateDoc, {
        date: formattedDate,
        reason: reason,
        createdBy: userId,
        createdAt: serverTimestamp()
      });
      
      console.log('✅ יום סגור נוסף בהצלחה:', formattedDate);
      return true;
    } catch (error) {
      console.error('❌ שגיאה בהוספת יום סגור:', error);
      return false;
    }
  },

  /**
   * הסרת יום סגור עם תיקון timezone
   * @param {string} date - תאריך בפורמט YYYY-MM-DD
   * @returns {Promise<boolean>} האם הפעולה הצליחה
   */
  async removeClosedDate(date) {
    try {
      const formattedDate = this.formatDateToString(date);
      
      if (!formattedDate) {
        console.error('❌ תאריך לא תקין:', date);
        return false;
      }

      console.log(`🗑️ מסיר יום סגור: ${formattedDate} (מקורי: ${date})`);
      
      const dateDoc = doc(db, 'closedDates', formattedDate);
      await deleteDoc(dateDoc);
      
      console.log('✅ יום סגור הוסר בהצלחה:', formattedDate);
      return true;
    } catch (error) {
      console.error('❌ שגיאה בהסרת יום סגור:', error);
      return false;
    }
  },

  /**
   * בדיקה האם תאריך סגור - גרסה מתוקנת
   * @param {string|Date} date - התאריך לבדיקה
   * @param {Array} closedDates - רשימת הימים הסגורים (אופציונלי)
   * @returns {boolean} האם התאריך סגור
   */
  isDateClosed(date, closedDates = null) {
    try {
      const dateStr = this.formatDateToString(date);
      
      if (!dateStr) {
        console.warn('⚠️ תאריך לא תקין בבדיקת סגירה:', date);
        return false;
      }
      
      if (closedDates && Array.isArray(closedDates)) {
        const isClosed = closedDates.some(closedDate => {
          const closedDateStr = closedDate.date || closedDate.id;
          const match = closedDateStr === dateStr;
          if (match) {
            console.log(`🔒 נמצא יום סגור: ${closedDateStr} === ${dateStr}`);
          }
          return match;
        });
        
        console.log(`🔍 בודק תאריך ${dateStr} - סגור: ${isClosed}`);
        return isClosed;
      }
      
      console.log(`🔍 בודק תאריך ${dateStr} - אין רשימה סגורים`);
      return false;
    } catch (error) {
      console.error('❌ שגיאה בבדיקת תאריך סגור:', error);
      return false;
    }
  },

  /**
   * המרת תאריך לפורמט YYYY-MM-DD - גרסה מתוקנת לזמן מקומי
   * @param {string|Date} date - התאריך להמרה
   * @returns {string} תאריך בפורמט YYYY-MM-DD
   */
  formatDateToString(date) {
    try {
      let targetDate;
      
      if (typeof date === 'string') {
        // אם זה כבר מחרוזת בפורמט נכון, החזר כמו שזה
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log(`📅 תאריך כבר בפורמט נכון: ${date}`);
          return date;
        }
        // אם זה מחרוזת אחרת, המר לתאריך
        targetDate = new Date(date + 'T00:00:00'); // הוספת זמן מקומי
      } else if (date instanceof Date) {
        targetDate = new Date(date);
      } else {
        console.warn('⚠️ תאריך לא תקין:', date);
        return '';
      }
      
      if (isNaN(targetDate.getTime())) {
        console.warn('⚠️ תאריך לא תקין אחרי המרה:', date);
        return '';
      }
      
      // שימוש בפונקציות מקומיות למניעת בעיות timezone
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      
      const result = `${year}-${month}-${day}`;
      console.log(`📅 המרת תאריך: ${date} → ${result}`);
      return result;
      
    } catch (error) {
      console.error('❌ שגיאה בהמרת תאריך:', error, date);
      return '';
    }
  },

  /**
   * בדיקת תקינות תאריך לסגירה
   * @param {string} date - התאריך לבדיקה
   * @param {Array} existingEvents - אירועים קיימים באותו תאריך
   * @returns {Object} תוצאת הבדיקה
   */
  canCloseDateValidation(date, existingEvents = []) {
    const today = new Date().toISOString().split('T')[0];
    const formattedDate = this.formatDateToString(date);
    
    // לא ניתן לסגור תאריכים בעבר
    if (formattedDate < today) {
      return {
        valid: false,
        reason: 'לא ניתן לסגור תאריכים בעבר'
      };
    }

    // לא ניתן לסגור תאריך עם אירועים קיימים
    if (existingEvents && existingEvents.length > 0) {
      // סנן רק אירועים שאינם "השאלה פעילה"
      const realEvents = existingEvents.filter(e => e.type !== 'השאלה פעילה');
      if (realEvents.length > 0) {
        return {
          valid: false,
          reason: 'קיימים אירועים בתאריך זה'
        };
      }
    }

    return {
      valid: true,
      reason: 'ניתן לסגירה'
    };
  },

  /**
   * הוספת מספר ימים סגורים בבת אחת - גרסה מתוקנת
   * @param {Array<string>} dates - רשימת תאריכים לסגירה
   * @param {string} userId - מזהה המשתמש
   * @param {string} reason - סיבת הסגירה
   * @returns {Promise<Object>} תוצאות הפעולה
   */
  async addMultipleClosedDates(dates, userId, reason = 'ימים סגורים') {
    const results = {
      success: [],
      failed: []
    };

    console.log('📅 מתחיל להוסיף ימים סגורים:', dates);

    for (const date of dates) {
      try {
        const success = await this.addClosedDate(date, userId, reason);
        if (success) {
          results.success.push(date);
        } else {
          results.failed.push(date);
        }
      } catch (error) {
        console.error(`❌ שגיאה בסגירת ${date}:`, error);
        results.failed.push(date);
      }
    }

    console.log('📊 תוצאות סגירת ימים:', results);
    return results;
  },

  // הפונקציה הוסרה - לא נחוצה יותר

  /**
   * בדיקה מתקדמת של תאריכים סגורים מול הזמנות
   * @param {string} pickupDate - תאריך לקיחה
   * @param {string} returnDate - תאריך החזרה
   * @param {Array} closedDates - רשימת ימים סגורים
   * @returns {Object} תוצאת הבדיקה
   */
  validateOrderDates(pickupDate, returnDate, closedDates) {
    const errors = {};
    
    // בדוק רק תאריכי לקיחה והחזרה (לא תאריך האירוע)
    if (pickupDate && this.isDateClosed(pickupDate, closedDates)) {
      errors.pickupDate = '🔒 תאריך לקיחת המוצרים חל ביום סגור';
    }
    
    if (returnDate && this.isDateClosed(returnDate, closedDates)) {
      errors.returnDate = '🔒 תאריך החזרת המוצרים חל ביום סגור';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};