// src/components/ReturnInspectionModal.jsx - מותאם למובייל
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { CheckCircle, XCircle, Package, Save, AlertTriangle } from 'lucide-react';

const ReturnInspectionModal = ({ 
  show, 
  order, 
  onClose, 
  onCompleteInspection,
  allItems = [],
  updateItemQuantities
}) => {
  const [itemInspections, setItemInspections] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize item inspections when modal opens
  useEffect(() => {
    if (show && order?.items) {
      const initialInspections = order.items.map(item => ({
        itemId: item.id || item.itemId,
        name: item.name,
        quantityExpected: item.quantity || 1,
        quantityReturned: item.quantity || 1, // Default to all returned
        isFullyReturned: true,
        condition: 'good', // 'good', 'damaged', 'lost'
        damageDescription: '',
        repairCost: 0,
        notes: ''
      }));
      setItemInspections(initialInspections);
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
        
        // Auto-calculate if fully returned based on quantities
        if (field === 'quantityReturned') {
          updated.isFullyReturned = value >= item.quantityExpected;
          // If not fully returned, mark as lost
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
  };

  const handleCompleteInspection = async () => {
    // Show confirmation dialog like in the image
    const totalExpected = itemInspections.reduce((sum, item) => sum + item.quantityExpected, 0);
    const totalReturned = itemInspections.reduce((sum, item) => sum + item.quantityReturned, 0);
    const damagedItems = itemInspections.filter(item => item.condition === 'damaged').length;
    const lostItems = itemInspections.filter(item => item.condition === 'lost').length;
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

      // Calculate summary
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

      // Update item quantities in stock based on what was actually returned
      for (const inspection of itemInspections) {
        const stockItem = allItems.find(item => 
          item.id === inspection.itemId || 
          item.name === inspection.name
        );
        
        if (stockItem) {
          // Calculate items to remove from stock
          let itemsToRemoveFromStock = 0;
          
          // Items that didn't return at all (lost)
          const itemsNotReturned = inspection.quantityExpected - inspection.quantityReturned;
          
          // Items that returned but are damaged (unusable)
          const damagedItems = inspection.condition === 'damaged' ? inspection.quantityReturned : 0;
          
          // Total items to remove = items that didn't return + items that returned damaged
          itemsToRemoveFromStock = itemsNotReturned + damagedItems;
          
          const newStockQuantity = stockItem.quantity - itemsToRemoveFromStock;
          const finalQuantity = Math.max(0, newStockQuantity);
          
          console.log(`עדכון מלאי - ${stockItem.name}:`, {
            originalStock: stockItem.quantity,
            expectedReturn: inspection.quantityExpected,
            quantityReturned: inspection.quantityReturned,
            condition: inspection.condition,
            itemsNotReturned: itemsNotReturned,
            damagedItems: damagedItems,
            totalToRemove: itemsToRemoveFromStock,
            newStock: finalQuantity
          });
          
          // Only update if there are items to remove from stock
          if (itemsToRemoveFromStock > 0) {
            await updateDoc(doc(db, 'items', stockItem.id), {
              quantity: finalQuantity,
              lastUpdated: serverTimestamp()
            });
          }
        }
      }

      // Complete the inspection
      await onCompleteInspection(order.id, itemInspections, summary);
      
      // Refresh item data if function provided
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

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'good': return '#10b981';
      case 'damaged': return '#f59e0b';
      case 'lost': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'good': return 'תקין';
      case 'damaged': return 'פגום';
      case 'lost': return 'אבד/לא הוחזר';
      default: return 'לא נבדק';
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
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
          </div>

          {/* Content */}
          <div style={{
            padding: '1rem',
            overflowY: 'auto',
            flex: 1
          }}>
           
            {/* Items Inspection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {itemInspections.map((item, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1rem',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {/* Item Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                    </div>
                  </div>

                  {/* Status indicator */}
                  {item.quantityReturned < item.quantityExpected && (
                    <div style={{
                      marginTop: '0.75rem',
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
              ))}
            </div>
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
                בדיקת החזרה תעביר את ההזמנה להיסטוריה
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
                  disabled={saving}
                  style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: saving ? 0.6 : 1,
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