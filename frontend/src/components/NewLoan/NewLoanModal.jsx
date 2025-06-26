import React, { useState, useEffect } from 'react';
import BarcodeScanner from "../BarcodeScanner";
import { getItemByItemId } from '@/services/firebase/itemsService';
import ScanResultModal from './ScanResultModal';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

// רכיב Pagination
const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  className = ""
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const isMobile = window.innerWidth <= 768;
  
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const maxVisible = isMobile ? 5 : 7;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    const pages = [];
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`pagination-container ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      margin: '1.5rem 0',
      direction: 'rtl'
    }}>
      <div style={{
        fontSize: isMobile ? '0.875rem' : '1rem',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        מציג {startItem}-{endItem} מתוך {totalItems} מוצרים
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.25rem' : '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            background: currentPage === 1 ? '#f9fafb' : 'white',
            color: currentPage === 1 ? '#9ca3af' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronRight size={isMobile ? 16 : 20} />
        </button>

        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <div key={`dots-${index}`} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                color: '#9ca3af'
              }}>
                <MoreHorizontal size={isMobile ? 16 : 20} />
              </div>
            );
          }

          const isActive = page === currentPage;
          
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                border: isActive ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '8px',
                background: isActive ? '#3b82f6' : 'white',
                color: isActive ? 'white' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 'bold' : 'normal',
                fontSize: isMobile ? '14px' : '16px'
              }}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '36px' : '40px',
            height: isMobile ? '36px' : '40px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            background: currentPage === totalPages ? '#f9fafb' : 'white',
            color: currentPage === totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronLeft size={isMobile ? 16 : 20} />
        </button>
      </div>
    </div>
  );
};

const NewLoanModal = ({
  showCatalogPopup,
  setShowCatalogPopup,
  searchTerm,
  setSearchTerm,
  availableItems,
  toggleSelectItem,
  changeQty,
  form,
  loadingItems,
  setAvailableItems,
  hideBarcodeScanner = false  // ✅ פרמטר חדש להסתרת הסורק
}) => {
  const [scanning, setScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  // Local state to track temporary selections
  const [localItems, setLocalItems] = useState([]);
  
  // ✅ הוספת state לפגינציה
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ✅ הגדרת כמות פריטים בעמוד לפי גודל מסך - מאוזן ונוח
  const itemsPerPage = isMobile ? 6 : 10;

  // ✅ מעקב אחר שינויי גודל מסך
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // איפוס לעמוד ראשון כאשר מתחלף מצב המסך
        setCurrentPage(1);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // ✅ איפוס עמוד כאשר משתנה החיפוש
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Initialize local state when modal opens or availableItems changes
  useEffect(() => {
    if (showCatalogPopup) {
      console.log('🔍 Modal נפתח, מאתחל local state עם פריטים:', availableItems.length);
      setLocalItems([...availableItems]);
    }
  }, [showCatalogPopup, availableItems]);

  if (!showCatalogPopup) return null;

  const handleScanSuccess = async (decodedText) => {
    console.log('📱 ברקוד נסרק:', decodedText);
    
    try {
      const item = await getItemByItemId(decodedText);
      console.log('🔍 פריט נמצא במאגר:', item);

      // חיפוש הפריט ב-availableItems (הרשימה המקורית) במקום ב-localItems
      const itemInAvailableList = availableItems.find(it => it.ItemId === item.ItemId || it.id === item.id);
      console.log('🔍 מחפש פריט ברשימה זמינה:', itemInAvailableList);

      if (!itemInAvailableList) {
        console.log('❌ הפריט לא נמצא ברשימת הפריטים הזמינים לתקופה זו');
        alert("הפריט לא זמין לתקופת ההזמנה שלך");
        setScanning(false);
        return;
      }

      // בדיקה האם הפריט כבר נבחר ב-localItems
      const alreadySelected = localItems.some(it => 
        (it.ItemId === item.ItemId || it.id === item.id) && it.selected
      );
      
      if (alreadySelected) {
        console.log('⚠️ המוצר כבר נבחר ברשימה');
        alert("המוצר כבר נבחר ברשימה");
        setScanning(false);
        return;
      }

      if (itemInAvailableList.quantity > 0) {
        console.log('✅ המוצר זמין, פותח מודל אישור');
        // נשתמש בפריט מהרשימה הזמינה (שיש לו את כל הנתונים הנדרשים)
        setScannedItem(itemInAvailableList);
        setScanning(false);
        // 🔥 לא סוגרים את המודל כאן!
      } else {
        console.log('❌ המוצר לא זמין במלאי לתקופה זו');
        alert("המוצר לא זמין במלאי לתקופה זו");
        setScanning(false);
      }
    } catch (err) {
      console.error('❌ שגיאה באיתור הפריט:', err);
      alert(err.message);
      setScanning(false);
    }
  };

  // Local toggle function that only affects local state
  const toggleSelectItemLocal = (itemId) => {
    console.log('🔄 משנה בחירה עבור פריט:', itemId);
    setLocalItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, selected: !item.selected, selectedQty: !item.selected ? 1 : 0 }
          : item
      )
    );
  };

  // Local quantity change handler
  const handleQuantityChangeLocal = (item, inputValue) => {
    let qty = parseInt(inputValue) || 0;

    // Ensure quantity doesn't exceed available amount
    if (qty > item.quantity) {
      qty = item.quantity;
    }

    // Ensure quantity is not negative
    if (qty < 0) {
      qty = 0;
    }

    console.log('🔢 משנה כמות עבור', item.name, 'לכמות:', qty);
    setLocalItems(prev =>
      prev.map(it =>
        it.id === item.id
          ? { ...it, selectedQty: qty, selected: qty > 0 }
          : it
      )
    );
  };

  // Apply local changes to actual state (called on confirm)
  const applyChanges = () => {
    console.log('💾 מחיל שינויים על state הראשי...');
    localItems.forEach(localItem => {
      const originalItem = availableItems.find(ai => ai.id === localItem.id);
      if (originalItem) {
        if (localItem.selected !== originalItem.selected) {
          toggleSelectItem(localItem.id);
        }
        if (localItem.selectedQty !== originalItem.selectedQty) {
          changeQty(localItem.id, localItem.selectedQty);
        }
      }
    });
  };

  // Handle confirm - apply changes and close modal
  const handleConfirm = () => {
    console.log('✅ מאשר בחירות ומחיל שינויים...');
    applyChanges();
    setShowCatalogPopup(false);
  };

  // Handle cancel or outside click - just close without applying changes
  const handleCancel = (source = 'unknown') => {
    console.log('❌ מבטל בחירות וסוגר מודל - מקור:', source);
    setShowCatalogPopup(false);
  };

  // Handle outside click on overlay
  const handleOverlayClick = (e) => {
    // וודא שהקליק הוא בדיוק על ה-overlay ולא על ילדיו
    if (e.target === e.currentTarget) {
      console.log('🖱️ קליק על overlay - סוגר מודל');
      handleCancel('overlay-click');
    } else {
      console.log('🖱️ קליק בתוך המודל - לא סוגר');
    }
  };

  // ✅ חישוב פריטים מסוננים
  const filteredItems = localItems.filter(it => 
    it.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ חישוב פריטים לתצוגה בעמוד הנוכחי
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  console.log('📊 סטטיסטיקות פריטים:', {
    totalItems: localItems.length,
    filteredItems: filteredItems.length,
    currentPageItems: currentItems.length,
    currentPage,
    itemsPerPage
  });

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1rem'
        }}>
          {/* כפתור סריקת ברקוד - מוצג רק אם לא מוסתר */}
          {!hideBarcodeScanner && (
            <button
              style={{ width: '180px' }}
              className="btn btn-gray"
              onClick={() => {
                console.log('📱 פותח סורק ברקוד...');
                setScanning(true);
              }}
            >
              סריקת ברקוד
            </button>
          )}
          
          <input
            type="text"
            placeholder="חיפוש מוצר..."
            value={searchTerm}
            onChange={(e) => {
              console.log('🔍 חיפוש משתנה ל:', e.target.value);
              setSearchTerm(e.target.value);
            }}
            style={{
              padding: '8px', border: '1px solid #ccc',
              borderRadius: '6px', 
              width: hideBarcodeScanner ? '100%' : '60%'  // ✅ רוחב מלא אם אין כפתור סריקה
            }}
          />
        </div>

        <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
          מוצרים זמינים ({form.pickupDate} → {form.returnDate})
        </h3>

        {/* ✅ תצוגת סטטיסטיקות חיפוש */}
        {searchTerm && (
          <div style={{
            background: '#f0f9ff',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #0ea5e9',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
              🔍 נמצאו {filteredItems.length} מוצרים עבור "{searchTerm}"
            </p>
          </div>
        )}

        {loadingItems ? (
          <p style={{ textAlign: 'center' }}>טוען מוצרים…</p>
        ) : (
          <>
            <div className="modal-grid">
              {currentItems.length === 0 ? (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  {searchTerm ? 
                    `לא נמצאו מוצרים לחיפוש "${searchTerm}"` : 
                    'לא נמצאו מוצרים זמינים'
                  }
                </div>
              ) : (
                currentItems.map(item => (
                  <div key={item.id} className={`item-card ${item.selected ? 'selected' : ''}`}>
                    <img
                      src={item.imageUrl || '/no-image-available.png'}
                      alt={item.name}
                      className="item-image"
                    />
                    <h4>{item.name}</h4>
                    <p>זמין: {item.quantity}</p>
                    <p>מזהה מוצר: {item.ItemId}</p>

                    <div style={{ margin: '0.5rem 0' }}>
                      <label style={{ marginBottom: '0.3rem', display: 'block' }}>כמות:</label>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <button
                          onClick={() => handleQuantityChangeLocal(item, Math.max(0, item.selectedQty - 1))}
                          disabled={item.selectedQty <= 0}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            border: '1px solid #ccc',
                            backgroundColor: item.selectedQty <= 0 ? '#f5f5f5' : '#fff',
                            cursor: item.selectedQty <= 0 ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: item.selectedQty <= 0 ? '#ccc' : '#333'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={item.selectedQty}
                          onChange={e => handleQuantityChangeLocal(item, e.target.value)}
                          onBlur={e => {
                            // Additional validation on blur to ensure the value is within bounds
                            const value = parseInt(e.target.value) || 0;
                            if (value > item.quantity) {
                              handleQuantityChangeLocal(item, item.quantity);
                            }
                          }}
                          style={{
                            width: '50px',
                            height: '30px',
                            padding: '5px',
                            textAlign: 'center',
                            borderRadius: '6px',
                            border: item.selectedQty > item.quantity ? '2px solid red' : '1px solid #ccc',
                            backgroundColor: item.selectedQty > 0 ? '#e3f2fd' : '#fff',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            // Hide the number input spinners completely
                            appearance: 'textfield',
                            MozAppearance: 'textfield'
                          }}
                        />
                        <button
                          onClick={() => handleQuantityChangeLocal(item, Math.min(item.quantity, item.selectedQty + 1))}
                          disabled={item.selectedQty >= item.quantity}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            border: '1px solid #ccc',
                            backgroundColor: item.selectedQty >= item.quantity ? '#f5f5f5' : '#fff',
                            cursor: item.selectedQty >= item.quantity ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: item.selectedQty >= item.quantity ? '#ccc' : '#333'
                          }}
                        >
                          +
                        </button>
                      </div>
                      {item.selectedQty > item.quantity && (
                        <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          מקסימום: {item.quantity}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleSelectItemLocal(item.id)}
                      className={`btn ${item.selected ? 'btn-red' : 'btn-blue'}`}
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                      {item.selected ? '❌ הסר מוצר' : '🛒 בחר מוצר'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ✅ Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        <div className="modal-actions">
          <button className="btn btn-blue" onClick={() => {
            console.log('✅ לחיצה על כפתור אישור');
            handleConfirm();
          }}>✔️ אישור</button>
          <button className="btn btn-gray" onClick={() => {
            console.log('❌ לחיצה על כפתור ביטול');
            handleCancel('cancel-button');
          }}>❌ ביטול</button>
        </div>
      </div>

      {/* סורק ברקוד - מוצג רק אם לא מוסתר */}
      {!hideBarcodeScanner && scanning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,  // גבוה יותר מהמודל הראשי
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }} onClick={(e) => {
          console.log('📱 קליק על רקע הסורק');
          e.stopPropagation();
        }}>
          <BarcodeScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => {
              console.log('📱 סורק ברקוד נסגר');
              setScanning(false);
            }}
          />
        </div>
      )}

      {/* מודל תוצאת סריקה - מוצג רק אם לא מוסתר */}
      {!hideBarcodeScanner && scannedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10001,  // גבוה יותר מהסורק
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }} onClick={(e) => {
          console.log('📦 קליק על רקע מודל תוצאת סריקה');
          e.stopPropagation();
        }}>
          <ScanResultModal
            item={scannedItem}
            onCancel={() => {
              console.log('❌ מבטל תוצאת סריקה');
              setScannedItem(null);
              setScanning(false); // 🔧 מוודאים שגם הסריקה מופסקת
              // 🔥 לא סוגרים את המודל הראשי!
            }}
            onConfirm={(qty) => {
              console.log('✅ מאשר הוספת פריט מסריקה:', scannedItem.name, 'כמות:', qty);
              
              // מעדכנים את הפריט ב-localItems
              setLocalItems(prev => {
                const updated = prev.map(item => {
                  // מוצאים את הפריט לפי ID או ItemId
                  if (item.id === scannedItem.id || item.ItemId === scannedItem.ItemId) {
                    console.log('📝 מעדכן פריט ב-localItems:', item.name, 'כמות חדשה:', qty);
                    return { ...item, selected: true, selectedQty: qty };
                  }
                  return item;
                });
                
                console.log('📊 localItems אחרי עדכון:', updated.filter(i => i.selected));
                return updated;
              });
              
              // מנקים את המודל של תוצאת הסריקה
              setScannedItem(null);
              
              // 🔥 לא סוגרים את המודל הראשי - נשאיר אותו פתוח להמשך עבודה!
              console.log('🎯 פריט נוסף בהצלחה מסריקה, המודל נשאר פתוח להמשך בחירה');
              
              // נוודא שהעמוד הנוכחי מציג את הפריט שנוסף
              const itemIndex = localItems.findIndex(item => 
                item.id === scannedItem.id || item.ItemId === scannedItem.ItemId
              );
              if (itemIndex >= 0) {
                const requiredPage = Math.ceil((itemIndex + 1) / itemsPerPage);
                console.log('📄 מעבר לעמוד', requiredPage, 'כדי להציג את הפריט שנוסף');
                setCurrentPage(requiredPage);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NewLoanModal;