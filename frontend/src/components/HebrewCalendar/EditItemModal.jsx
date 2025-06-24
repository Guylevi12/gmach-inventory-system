// src/components/EditItemModal.jsx - DATE-AWARE AVAILABILITY - מותאם למובייל
import React, { useState, useEffect } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { Edit, Search, Plus, Minus, Save, AlertTriangle } from 'lucide-react';

const EditItemModal = ({ show, data, setData, allItems, setShowReport, fetchItemsAndOrders, allEvents }) => {
  const [formData, setFormData] = useState({
    items: []
  });
  const [loading, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderDates, setOrderDates] = useState({ pickupDate: null, returnDate: null });

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

  // Initialize form data and get order dates
  useEffect(() => {
    if (show && data.eventId && allEvents.length > 0) {
      console.log('🚀 Initializing edit modal');
      
      // Find this order's events to get the dates
      const currentOrderId = data.eventId.split('-')[0];
      const orderEvents = allEvents.filter(event => event.orderId === currentOrderId);
      
      if (orderEvents.length > 0) {
        const firstEvent = orderEvents[0];
        setOrderDates({
          pickupDate: new Date(firstEvent.pickupDate),
          returnDate: new Date(firstEvent.returnDate)
        });
        
        console.log('📅 Order dates:', {
          pickup: firstEvent.pickupDate,
          return: firstEvent.returnDate
        });
      }
      
      setFormData({
        items: [...(data.items || [])]
      });
    }
  }, [show, data, allEvents]);

  if (!show) return null;

  // CORE FUNCTION: Calculate how many items are available for this order's date range
  const getAvailableQuantityForDates = (itemName) => {
    const stockItem = allItems.find(i => i.name === itemName);
    if (!stockItem) {
      console.warn(`❌ Stock not found for ${itemName}`);
      return 0;
    }

    const totalStock = stockItem.quantity || 0;
    const currentOrderId = data.eventId?.split('-')[0];

    if (!orderDates.pickupDate || !orderDates.returnDate) {
      console.warn(`⚠️ Missing pickup/return dates for current order.`);
      return totalStock;
    }

    console.log(`🔎 Checking "${itemName}" availability from ${orderDates.pickupDate.toDateString()} to ${orderDates.returnDate.toDateString()}`);
    console.log(`📦 Total stock from database: ${totalStock}`);

    let maxReservedDuringPeriod = 0;
    const seenOrders = new Set();

    allEvents.forEach(event => {
      if (event.orderId === currentOrderId) return;
      if (seenOrders.has(`${event.orderId}-${itemName}`)) return;

      const eventPickup = new Date(event.pickupDate);
      const eventReturn = new Date(event.returnDate);

      const overlaps =
        eventPickup <= orderDates.returnDate &&
        eventReturn >= orderDates.pickupDate;

      if (overlaps && event.items) {
        const matchingItem = event.items.find(i => i.name === itemName);
        if (matchingItem) {
          console.log(`➡️ Overlapping Order ID: ${event.orderId}`);
          console.log(`    Dates: ${eventPickup.toDateString()} - ${eventReturn.toDateString()}`);
          console.log(`    Reserved: ${matchingItem.quantity}`);
          maxReservedDuringPeriod += matchingItem.quantity || 0;
          seenOrders.add(`${event.orderId}-${itemName}`);
        }
      }
    });

    const currentQuantityInOrder = formData.items.find(i => i.name === itemName)?.quantity || 0;
    const available = totalStock - maxReservedDuringPeriod - currentQuantityInOrder;

    console.log(`✅ Available: ${available} = ${totalStock} - ${maxReservedDuringPeriod} - ${currentQuantityInOrder} (already in order)`);

    return Math.max(0, available);
  };

  // Add item with availability check
  const addItem = (item) => {
    console.log('➕ Trying to add item:', item.name);

    const availableQuantity = getAvailableQuantityForDates(item.name);

    if (availableQuantity <= 0) {
      alert(`❌ לא ניתן להוסיף מ-${item.name}. זמין: ${availableQuantity}`);
      return;
    }

    const existingItemIndex = formData.items.findIndex(i => i.name === item.name);

    if (existingItemIndex >= 0) {
      const newItems = [...formData.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + 1
      };
      setFormData({ ...formData, items: newItems });
    } else {
      const newItem = {
        name: item.name,
        quantity: 1,
        ItemId: item.ItemId || item.itemId || item.id,
        itemId: item.ItemId || item.itemId || item.id,
        id: item.id,
        imageUrl: item.imageUrl || ''
      };
      setFormData({
        ...formData,
        items: [...formData.items, newItem]
      });
    }
  };
  
  // Update item quantity with availability check
  const updateItemQuantity = (itemName, newQuantity) => {
    console.log(`🔄 Updating ${itemName} to quantity: ${newQuantity}`);

    if (newQuantity <= 0) {
      setFormData({
        ...formData,
        items: formData.items.filter(item => item.name !== itemName)
      });
      return;
    }

    const currentQuantityInOrder = formData.items.find(i => i.name === itemName)?.quantity || 0;
    const correctedAvailable = getAvailableQuantityForDates(itemName) + currentQuantityInOrder;

    if (newQuantity > correctedAvailable) {
      alert(`❌ לא ניתן להזמין ${newQuantity} מ-${itemName}. זמין: ${correctedAvailable}`);
      return;
    }

    const newItems = formData.items.map(item =>
      item.name === itemName
        ? { ...item, quantity: newQuantity }
        : item
    );

    setFormData({ ...formData, items: newItems });
  };

  // Remove item completely
  const removeItem = (itemName) => {
    console.log('🗑️ Removing item:', itemName);
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.name !== itemName)
    });
  };

  // Save changes to database
  const saveChanges = async () => {
    try {
      setSaving(true);
      const orderId = data.eventId?.split('-')[0];
      if (!orderId) throw new Error('שגיאה: לא נמצא מזהה הזמנה');

      console.log('💾 Saving items:', formData.items);

      // Ensure all items have proper IDs
      const itemsToSave = formData.items.map(item => ({
        ...item,
        ItemId: item.ItemId || item.itemId || item.id,
        itemId: item.ItemId || item.itemId || item.id
      }));

      await updateDoc(doc(db, 'orders', orderId), {
        items: itemsToSave
      });

      await fetchItemsAndOrders();
      setData({ open: false, eventId: null, items: [] });
      setShowReport(false);
      alert("🎉 השינויים נשמרו בהצלחה!");
    } catch (error) {
      console.error("❌ שגיאה בשמירה:", error);
      alert(error.message || "שמירה נכשלה. נסה שוב.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setData({ open: false, eventId: null, items: [] });
  };

  // Filter available items for search
  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <>
      <style jsx global>{`
        .edit-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
          padding: 0.5rem !important;
          z-index: 99999 !important;
          overflow-x: hidden !important;
          padding-top: 1rem !important;
        }
        
        .edit-modal-content {
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
          .edit-modal-overlay {
            padding: 0.25rem !important;
            padding-top: 0.5rem !important;
          }
          
          .edit-modal-content {
            max-height: 98vh !important;
            border-radius: 8px !important;
          }
          
          .modal-footer-mobile {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
          
          .modal-footer-mobile button {
            width: 100% !important;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="edit-modal-overlay" onClick={handleBackdropClick}>
        <div className="edit-modal-content" dir="rtl" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div style={{
            background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
            color: 'white',
            padding: '1rem',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={24} />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  עריכת הזמנה
                </h3>
              </div>
              <button
                onClick={handleClose}
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
            
            {/* Show order dates */}
            {orderDates.pickupDate && orderDates.returnDate && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: '#bfdbfe'
              }}>
                📅 תאריכי ההזמנה: {orderDates.pickupDate.toLocaleDateString('he-IL')} - {orderDates.returnDate.toLocaleDateString('he-IL')}
              </div>
            )}
          </div>

          <div style={{
            padding: '1rem',
            overflowY: 'auto',
            flex: 1
          }}>
            
            {/* Current Items Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>
                פריטים נוכחיים בהזמנה ({formData.items.length})
              </h4>
              
              {formData.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {formData.items.map((item, index) => {
                    const itemData = allItems.find(i => i.name === item.name);
                    const availableQuantity = getAvailableQuantityForDates(item.name);
                    const maxPossible = availableQuantity + item.quantity; // Current quantity + what's available
                    
                    return (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f9fafb',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          flex: 1,
                          minWidth: 0
                        }}>
                          {itemData?.imageUrl && (
                            <img
                              src={itemData.imageUrl}
                              alt={item.name}
                              style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                flexShrink: 0
                              }}
                            />
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontWeight: '500',
                              color: '#1f2937',
                              fontSize: '0.9rem'
                            }}>
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              מזהה: {itemData?.ItemId || itemData?.itemId || 'לא נמצא'}
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#059669',
                              fontWeight: '500'
                            }}>
                              מקסימום: {maxPossible}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          flexShrink: 0
                        }}>
                          <button
                            onClick={() => updateItemQuantity(item.name, item.quantity - 1)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              width: '1.8rem',
                              height: '1.8rem',
                              borderRadius: '50%',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            disabled={loading}
                          >
                            <Minus size={12} />
                          </button>
                          
                          <span style={{
                            width: '1.5rem',
                            textAlign: 'center',
                            fontWeight: '500',
                            fontSize: '0.9rem'
                          }}>
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => updateItemQuantity(item.name, item.quantity + 1)}
                            style={{
                              background: item.quantity >= maxPossible ? '#9ca3af' : '#10b981',
                              color: 'white',
                              width: '1.8rem',
                              height: '1.8rem',
                              borderRadius: '50%',
                              border: 'none',
                              cursor: item.quantity >= maxPossible ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            disabled={loading || item.quantity >= maxPossible}
                          >
                            <Plus size={12} />
                          </button>
                          
                          <button
                            onClick={() => removeItem(item.name)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              marginRight: '0.3rem',
                              fontSize: '0.75rem'
                            }}
                            disabled={loading}
                          >
                            הסר
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  color: '#6b7280'
                }}>
                  אין פריטים בהזמנה
                </div>
              )}
            </div>

            {/* Add Items Section */}
            <div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>
                הוסף פריטים מהמלאי
              </h4>

              {/* Search */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="חפש פריט..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.8rem 0.75rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box'
                    }}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Available Items */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
                maxHeight: '10rem',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}>
                {filteredItems.map((item, index) => {
                  const isInOrder = formData.items.some(i => i.name === item.name);
                  const quantityInOrder = isInOrder ? formData.items.find(i => i.name === item.name)?.quantity : 0;
                  const availableQuantity = getAvailableQuantityForDates(item.name);
                  const canAdd = quantityInOrder < (availableQuantity + quantityInOrder);
                  
                  return (
                    <div
                      key={index}
                      onClick={() => !loading && canAdd && addItem(item)}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: isInOrder ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        background: isInOrder ? '#eff6ff' : 'white',
                        cursor: loading || !canAdd ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: loading || !canAdd ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{
                              width: '2rem',
                              height: '2rem',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: '500',
                            fontSize: '0.8rem',
                            color: '#1f2937',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.name}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: '#6b7280'
                          }}>
                            מזהה: {item.itemId || item.ItemId}
                          </div>
                          <div style={{
                            fontSize: '0.65rem',
                            color: availableQuantity > 0 ? '#059669' : '#dc2626',
                            fontWeight: '500'
                          }}>
                            זמין: {availableQuantity}
                          </div>
                          {isInOrder && (
                            <div style={{
                              fontSize: '0.65rem',
                              color: '#2563eb',
                              fontWeight: '500'
                            }}>
                              בהזמנה: {quantityInOrder}
                            </div>
                          )}
                        
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            }} className="modal-footer-mobile">
              <div style={{
                fontSize: '0.875rem',
                color: '#4b5563'
              }}>
                סה"כ פריטים: {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem'
              }} className="modal-footer-mobile">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  ביטול
                </button>
                <button
                  onClick={saveChanges}
                  disabled={loading || formData.items.length === 0}
                  style={{
                    background: formData.items.length === 0 ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: formData.items.length === 0 || loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      שמור שינויים
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

export default EditItemModal;