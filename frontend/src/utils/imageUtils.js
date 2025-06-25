// src/utils/imageUtils.js - פונקציות עזר לניהול תמונות

/**
 * המרת מוצר למבנה תמונות חדש (תואם לאחור)
 * @param {Object} item - המוצר מהמסד
 * @returns {Object} מוצר עם מערך תמונות
 */
export const normalizeItemImages = (item) => {
  // אם כבר יש מערך תמונות - מחזיר כמו שזה
  if (item.images && Array.isArray(item.images)) {
    return {
      ...item,
      images: item.images.filter(url => url && url.trim()), // מסנן URLs ריקים
      primaryImage: item.images[0] || null
    };
  }
  
  // אם יש imageUrl בודד - הופך למערך
  if (item.imageUrl && item.imageUrl.trim()) {
    return {
      ...item,
      images: [item.imageUrl],
      primaryImage: item.imageUrl
    };
  }
  
  // אם אין תמונה כלל
  return {
    ...item,
    images: [],
    primaryImage: null
  };
};

/**
 * קבלת התמונה הראשונה של מוצר (לתאימות לאחור)
 * @param {Object} item - המוצר
 * @returns {string|null} URL של התמונה הראשונה
 */
export const getPrimaryImage = (item) => {
  const normalized = normalizeItemImages(item);
  return normalized.primaryImage;
};

/**
 * קבלת כל התמונות של מוצר
 * @param {Object} item - המוצר
 * @returns {Array} מערך URLs של תמונות
 */
export const getAllImages = (item) => {
  const normalized = normalizeItemImages(item);
  return normalized.images;
};

/**
 * בדיקה אם למוצר יש מספר תמונות
 * @param {Object} item - המוצר
 * @returns {boolean}
 */
export const hasMultipleImages = (item) => {
  const images = getAllImages(item);
  return images.length > 1;
};

/**
 * הוספת תמונה למוצר קיים
 * @param {Object} item - המוצר הקיים
 * @param {string} newImageUrl - URL של התמונה החדשה
 * @returns {Object} המוצר המעודכן
 */
export const addImageToItem = (item, newImageUrl) => {
  if (!newImageUrl || !newImageUrl.trim()) return item;
  
  const normalized = normalizeItemImages(item);
  const updatedImages = [...normalized.images, newImageUrl];
  
  return {
    ...item,
    images: updatedImages,
    imageUrl: updatedImages[0], // שמירת תאימות לאחור
    primaryImage: updatedImages[0]
  };
};

/**
 * הסרת תמונה ממוצר
 * @param {Object} item - המוצר
 * @param {number} imageIndex - אינדקס התמונה להסרה
 * @returns {Object} המוצר המעודכן
 */
export const removeImageFromItem = (item, imageIndex) => {
  const normalized = normalizeItemImages(item);
  const updatedImages = normalized.images.filter((_, index) => index !== imageIndex);
  
  return {
    ...item,
    images: updatedImages,
    imageUrl: updatedImages[0] || null, // שמירת תאימות לאחור
    primaryImage: updatedImages[0] || null
  };
};

/**
 * עדכון סדר התמונות
 * @param {Object} item - המוצר
 * @param {Array} newImagesOrder - מערך URLs בסדר החדש
 * @returns {Object} המוצר המעודכן
 */
export const reorderItemImages = (item, newImagesOrder) => {
  const filteredImages = newImagesOrder.filter(url => url && url.trim());
  
  return {
    ...item,
    images: filteredImages,
    imageUrl: filteredImages[0] || null, // שמירת תאימות לאחור
    primaryImage: filteredImages[0] || null
  };
};

/**
 * המרת מוצר למבנה שמירה ב-Firestore
 * @param {Object} item - המוצר עם המבנה החדש
 * @returns {Object} אובייקט לשמירה במסד הנתונים
 */
export const prepareItemForSave = (item) => {
  const normalized = normalizeItemImages(item);
  
  return {
    ...item,
    images: normalized.images, // המערך החדש
    imageUrl: normalized.primaryImage, // שמירת תאימות לאחור
    // הסרת שדות זמניים
    primaryImage: undefined
  };
};

/**
 * Migration script לעדכון מוצרים קיימים במסד הנתונים
 * @param {Object} db - Firestore database instance
 * @param {Function} updateDoc - Firestore updateDoc function
 * @param {Function} doc - Firestore doc function
 */
export const migrateExistingItems = async (db, updateDoc, doc, getDocs, collection) => {
  try {
    console.log('🔄 מתחיל migration של מוצרים קיימים...');
    
    const itemsSnap = await getDocs(collection(db, 'items'));
    const itemsToUpdate = [];
    
    itemsSnap.docs.forEach(docSnap => {
      const item = docSnap.data();
      
      // אם כבר יש מערך תמונות - דילוג
      if (item.images && Array.isArray(item.images)) {
        return;
      }
      
      // אם יש imageUrl בודד - המרה למערך
      if (item.imageUrl && item.imageUrl.trim()) {
        itemsToUpdate.push({
          id: docSnap.id,
          images: [item.imageUrl]
        });
      }
    });
    
    console.log(`📊 נמצאו ${itemsToUpdate.length} מוצרים לעדכון`);
    
    // עדכון בבאצ'ים קטנים
    for (const itemUpdate of itemsToUpdate) {
      await updateDoc(doc(db, 'items', itemUpdate.id), {
        images: itemUpdate.images
      });
      console.log(`✅ עודכן מוצר: ${itemUpdate.id}`);
    }
    
    console.log('🎉 Migration הושלם בהצלחה!');
    return { success: true, updatedCount: itemsToUpdate.length };
    
  } catch (error) {
    console.error('❌ שגיאה ב-migration:', error);
    return { success: false, error: error.message };
  }
};