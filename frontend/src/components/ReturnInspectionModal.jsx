// src/components/ReturnInspectionModal.jsx - עם מערכת אישור פריטים - תיקון מלא
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { CheckCircle, XCircle, Package, Save, AlertTriangle, Check } from 'lucide-react';

const ReturnInspectionModal = ({
  show,
  order,
  onClose,
  onCompleteInspection,
  allItems = [],
  updateItemQuantities
}) => {
  const [itemInspections, setItemInspections] = useState([]);
  const [confirmedItems, setConfirmedItems] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize item inspections when modal opens
  useEffect(() => {
    if (show && order?.items) {
      const initialInspections = order.items.map(item => ({
        itemId: item.id || item.itemId,
        name: item.name,
        quantityExpected: item.quantity || 1,
        quantityReturned: item.quantity || 1,
        isFullyReturned: true,
        condition: 'good',
        damageDescription: '',
        repairCost: 0,
        notes: ''
      }));
      setItemInspections(initialInspections);
      setConfirmedItems(new Set());
      setNotes('');
    }
  }, [show, order]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show || !order) return null;

  const updateItemInspection = (index, field, value) => {
    setItemInspections(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };

        if (field === 'quantityReturned') {
          updated.isFullyReturned = value >= item.quantityExpected;
          if (value < item.quantityExpected) {
            updated.condition = 'lost';
          } else if (updated.condition === 'lost') {
            updated.condition = 'good';
          }
        }

        return updated;
      }
      return item;
    }));

    // אם שונתה הכמות, הסר מרשימת המאושרים
    if (field === 'quantityReturned') {
      setConfirmedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // פונקציה לאישור פריט
  const confirmItem = (index) => {
    setConfirmedItems(prev => new Set([...prev, index]));
  };

  // בדיקה האם כל הפריטים אושרו
  const allItemsConfirmed = () => {
    return itemInspections.length > 0 && confirmedItems.size === itemInspections.length;
  };

  const handleCompleteInspection = async () => {
    if (!allItemsConfirmed()) {
      alert('יש לאשר את כל הפריטים לפני השלמת הבדיקה');
      return;
    }

    const totalExpected = itemInspections.reduce((sum, item) => sum + item.quantityExpected, 0);
    const totalReturned = itemInspections.reduce((sum, item) => sum + item.quantityReturned, 0);
    const returnPercentage = Math.round((totalReturned / totalExpected) * 100);

    const confirmMessage = `האם אתה בטוח שברצונך לסיים את בדיקת ההחזרה?

סיכום:
• פריטים שהושאלו: ${totalExpected}/${totalExpected}
• פריטים שחזרו: ${totalReturned}/${totalExpected}
• אחוז החזרה: ${returnPercentage}%

ההזמנה תעבור לאיסוף ההזמנות הסגורות.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSaving(true);

      const totalItemsExpected = itemInspections.reduce((sum, item) => sum + item.quantityExpected, 0);
      const totalItemsReturned = itemInspections.reduce((sum, item) => sum + item.quantityReturned, 0);
      const totalDamages = itemInspections.filter(item => item.condition === 'damaged').length;
      const totalRepairCost = itemInspections.reduce((sum, item) => sum + (item.repairCost || 0), 0);

      const summary = {
        totalItemsExpected,
        totalItemsReturned,
        totalDamages,
        totalRepairCost,
        managerNotes: notes,
        customerNotified: false,
        customerAgreedToCharges: false
      };

      for (const inspection of itemInspections) {
        const stockItem = allItems.find(item =>
          item.id === inspection.itemId ||
          item.name === inspection.name
        );

        if (stockItem) {
          let itemsToRemoveFromStock = 0;
          const itemsNotReturned = inspection.quantityExpected - inspection.quantityReturned;
          const damagedItems = inspection.condition === 'damaged' ? inspection.quantityReturned : 0;
          itemsToRemoveFromStock = itemsNotReturned + damagedItems;

          const newStockQuantity = stockItem.quantity - itemsToRemoveFromStock;
          const finalQuantity = Math.max(0, newStockQuantity);

          if (itemsToRemoveFromStock > 0) {
            await updateDoc(doc(db, 'items', stockItem.id), {
              quantity: finalQuantity,
              lastUpdated: serverTimestamp()
            });
          }
        }
      }

      await onCompleteInspection(order.id, itemInspections, summary);

      if (updateItemQuantities) {
        await updateItemQuantities();
      }

      onClose();

    } catch (error) {
      console.error('Error completing return inspection:', error);
      alert('שגיאה בהשלמת בדיקת החזרה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (window.confirm('האם אתה בטוח שברצונך לסגור את חלון בדיקת החזרה?')) {
        onClose();
      }
    }
  };

  return (
    <>
      <style jsx global>{`
        .return-inspection-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
          padding: 0.5rem !important;
          z-index: 99999 !important;
          overflow-x: hidden !important;
          padding-top: 1rem !important;
        }
        
        .return-inspection-content {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          width: 100% !important;
          max-width: 56rem !important;
          max-height: 96vh !important;
          overflow: hidden !important;
          position: relative !important;
          z-index: 100000 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .item-container {
          border: 1px solid #e5e7eb;
          borderRadius: 12px;
          padding: 1rem;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        @media (max-width: 768px) {
          .return-inspection-overlay {
            padding: 0.25rem !important;
            padding-top: 0.5rem !important;
          }
          
          .return-inspection-content {
            max-height: 98vh !important;
            border-radius: 8px !important;
          }
          
          .footer-mobile {
            flex-direction: column !important;
            gap: 0.5rem !important;
            align-items: stretch !important;
          }
          
          .footer-mobile button {
            width: 100% !important;
          }
          
          .footer-mobile .summary-text {
            text-align: center !important;
            margin-bottom: 0.5rem !important;
          }

          .item-container {
            padding: 1rem !important;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div
        className="return-inspection-overlay"
        onClick={handleBackdropClick}
      >
        <div
          className="return-inspection-content"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(to right, #fb923c, #f97316)',
            color: 'white',
            padding: '1rem',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle size={24} />
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    בדיקת החזרת מוצרים
                  </h2>
                  <div style={{
                    fontSize: '0.875rem',
                    marginTop: '0.25rem',
                    opacity: 0.9
                  }}>
                    לקוח: {order.clientName} • {order.phone}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            {/* אינדיקטור התקדמות */}
            <div style={{
              marginTop: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem'
              }}>
                <span>התקדמות הבדיקה</span>
                <span style={{ fontWeight: 'bold' }}>
                  {confirmedItems.size}/{itemInspections.length} פריטים אושרו
                </span>
              </div>
              <div style={{
                marginTop: '0.5rem',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                height: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#10b981',
                  height: '100%',
                  width: `${itemInspections.length > 0 ? (confirmedItems.size / itemInspections.length) * 100 : 0}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{
            padding: '1rem',
            overflowY: 'auto',
            flex: 1
          }}>

            {/* Items Inspection - רק פריטים שעוד לא אושרו */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {itemInspections.map((item, index) => {
                const isConfirmed = confirmedItems.has(index);
                
                // אם הפריט אושר - לא להציג אותו כאן
                if (isConfirmed) return null;
                
                return (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1rem',
                    background: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}>
                    {/* הסרתי את הכפתור הנפרד - עכשיו הוא חלק מהכמויות */}

                    {/* תוכן המוצר */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* פרטי המוצר */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <img
                          src={order.items.find(orderItem => orderItem.id === item.itemId)?.imageUrl || '/no-image-available.png'}
                          alt={item.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 style={{
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            margin: 0,
                            color: '#1f2937'
                          }}>
                            {item.name}
                          </h4>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            מזהה: {item.ItemId || order.items.find(orderItem => orderItem.id === item.itemId)?.ItemId || item.itemId}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            כמות מוזמנת: {item.quantityExpected}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151'
                        }}>
                          כמות שחזרה:
                        </span>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <button
                            onClick={() => {
                              const newValue = Math.max(0, item.quantityReturned - 1);
                              updateItemInspection(index, 'quantityReturned', newValue);
                            }}
                            disabled={item.quantityReturned <= 0}
                            style={{
                              background: item.quantityReturned <= 0 ? '#d1d5db' : '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '36px',
                              height: '36px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              cursor: item.quantityReturned <= 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: item.quantityReturned <= 0 ? 0.6 : 1
                            }}
                          >
                            -
                          </button>
                          <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            minWidth: '40px',
                            textAlign: 'center',
                            color: '#1f2937'
                          }}>
                            {item.quantityReturned}
                          </span>
                          <button
                            onClick={() => {
                              const newValue = Math.min(item.quantityExpected, item.quantityReturned + 1);
                              updateItemInspection(index, 'quantityReturned', newValue);
                            }}
                            disabled={item.quantityReturned >= item.quantityExpected}
                            style={{
                              background: item.quantityReturned >= item.quantityExpected ? '#d1d5db' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '36px',
                              height: '36px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              cursor: item.quantityReturned >= item.quantityExpected ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: item.quantityReturned >= item.quantityExpected ? 0.6 : 1
                            }}
                          >
                            +
                          </button>
                          
                          {/* ✅ כפתור "בוצע" ליד הכפתורים */}
                          <button
                            onClick={() => confirmItem(index)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginRight: '1rem'
                            }}
                          >
                            <Check size={16} />
                            בוצע
                          </button>
                        </div>
                      </div>

                      {/* Status indicator */}
                      {item.quantityReturned < item.quantityExpected && (
                        <div style={{
                          padding: '0.5rem',
                          background: '#fef3c7',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.875rem',
                            color: '#92400e',
                            fontWeight: '500'
                          }}>
                            ⚠️ חסרים {item.quantityExpected - item.quantityReturned} פריטים
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checklist של פריטים מאושרים */}
            {confirmedItems.size > 0 && (
              <div style={{
                marginTop: '2rem',
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#0369a1',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={20} />
                  פריטים שאושרו ({confirmedItems.size}/{itemInspections.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Array.from(confirmedItems).map(index => {
                    const item = itemInspections[index];
                    return (
                      <div key={index} style={{
                        background: 'white',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                          {item.name}
                        </span>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: '#059669',
                          fontWeight: '500'
                        }}>
                          כמות שחזרה: {item.quantityReturned}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            background: '#f9fafb',
            padding: '1rem',
            borderTop: '1px solid #e5e7eb',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }} className="footer-mobile">
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }} className="summary-text">
                {allItemsConfirmed() ? 
                  'כל הפריטים אושרו - ניתן להשלים את הבדיקה' : 
                  `יש לאשר את כל הפריטים (${confirmedItems.size}/${itemInspections.length})`
                }
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem'
              }} className="footer-mobile">
                <button
                  onClick={onClose}
                  disabled={saving}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  ביטול
                </button>
                <button
                  onClick={handleCompleteInspection}
                  disabled={saving || !allItemsConfirmed()}
                  style={{
                    background: !allItemsConfirmed() ? '#9ca3af' : '#f59e0b',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: saving || !allItemsConfirmed() ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: saving || !allItemsConfirmed() ? 0.6 : 1,
                    justifyContent: 'center'
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      מעבד...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      השלם בדיקת החזרה
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReturnInspectionModal;