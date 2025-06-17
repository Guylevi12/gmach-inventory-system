// src/components/EditItemModal.jsx
import React, { useState, useEffect } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { Edit, Search, Plus, Minus, Trash2, Save } from 'lucide-react';

const EditItemModal = ({ show, data, setData, allItems, setShowReport, fetchItemsAndOrders, allEvents }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    pickupDate: '',
    returnDate: '',
    items: []
  });
  const [loading, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Track changes for unsaved warning
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);

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

  useEffect(() => {
    if (show && data.eventId) {
      const initialData = {
        clientName: '',
        phone: '',
        pickupDate: '',
        returnDate: '',
        items: [...(data.items || [])]
      };

      setFormData(initialData);
      setOriginalFormData(JSON.parse(JSON.stringify(initialData))); // Deep copy
      setHasUnsavedChanges(false);
    }
  }, [show, data]);

  // Check for changes
  useEffect(() => {
    if (!originalFormData) return;

    const currentDataString = JSON.stringify(formData);
    const originalDataString = JSON.stringify(originalFormData);
    const hasChanges = currentDataString !== originalDataString;

    if (hasChanges !== hasUnsavedChanges) {
      console.log('🔄 Changes detected:', hasChanges);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, originalFormData, hasUnsavedChanges]);

  if (!show) return null;
const updateItemQuantity = (itemName, newQuantity) => {
  const stockItem = allItems.find(i => i.name === itemName);
  const currentItem = formData.items.find(i => i.name === itemName);
  const currentQuantity = currentItem?.quantity || 0;

  if (newQuantity <= 0) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.name !== itemName)
    }));
    return;
  }

  if (newQuantity < currentQuantity) {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.name === itemName
          ? { ...item, quantity: newQuantity }
          : item
      )
    }));
    return;
  }

  const totalStock = stockItem?.quantity || 0;
  const currentOrderId = data?.eventId?.split('-')[0];
  let reservedInOtherOrders = 0;

  allEvents.forEach(event => {
    if (event.orderId !== currentOrderId && event.items) {
      event.items.forEach(it => {
        if (it.name === itemName) {
          reservedInOtherOrders += it.quantity || 0;
        }
      });
    }
  });

  const availableForThisOrder = totalStock - reservedInOtherOrders - currentQuantity;

  if (newQuantity - currentQuantity > availableForThisOrder) {
    alert(`אין מספיק מלאי ל-${itemName}. זמין: ${availableForThisOrder}, מבוקש: ${newQuantity}`);
    return;
  }
console.log("🧩 יצירת פריט מועשר:", {
  name: itemName,
  fromItem: stockItem?.ItemId ?? stockItem?.itemId,
  fromStock: stockItem?.id,
});


const enrichedItem = {
  name: itemName,
  quantity: newQuantity,
  ItemId: stockItem?.ItemId ?? stockItem?.itemId ?? stockItem?.id ?? null,
  itemId: stockItem?.ItemId ?? stockItem?.itemId ?? stockItem?.id ?? null,
  id: stockItem?.id ?? null,
  imageUrl: stockItem?.imageUrl ?? ''
};



setFormData(prev => ({
  ...prev,
  items: prev.items.some(i => i.name === itemName)
    ? prev.items.map(i =>
        i.name === itemName ? enrichedItem : i
      )
    : [...prev.items, enrichedItem]
}));

};





const addItem = (item) => {
  const existingItem = formData.items.find(i => i.name === item.name);
  const currentQuantity = existingItem?.quantity || 0;

  const stockItem = allItems.find(i => i.name === item.name);
  const totalStock = stockItem?.quantity || 0;
  const currentOrderId = data?.eventId?.split('-')[0];

  let reservedInOtherOrders = 0;
  allEvents.forEach(event => {
    if (event.orderId !== currentOrderId && event.items) {
      event.items.forEach(it => {
        if (it.name === item.name) {
          reservedInOtherOrders += it.quantity || 0;
        }
      });
    }
  });

  const available = totalStock - reservedInOtherOrders;
  if (available <= currentQuantity) {
    alert(`אין מספיק מלאי ל-${item.name}. זמין: ${available - currentQuantity}, מבוקש: ${currentQuantity + 1}`);
    return;
  }

  const enrichedItem = {
    name: item.name,
    quantity: currentQuantity + 1,
    ItemId: item.ItemId ?? item.itemId ?? item.id ?? null,
    itemId: item.ItemId ?? item.itemId ?? item.id ?? null,
    id: item.id ?? null,
    imageUrl: item.imageUrl ?? ''
  };

  if (!enrichedItem.ItemId) {
    alert(`שגיאה: לא ניתן להוסיף את הפריט "${item.name}" - מזהה מוצר חסר`);
    return;
  }

  setFormData(prev => ({
    ...prev,
    items: prev.items.some(i => i.name === item.name)
      ? prev.items.map(i => i.name === item.name ? enrichedItem : i)
      : [...prev.items, enrichedItem]
  }));
};




  const removeItem = (itemName) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.name !== itemName)
    }));
  };

const saveChanges = async () => {
  try {
    setSaving(true);
    const orderId = data.eventId?.split('-')[0];
    if (!orderId) throw new Error('שגיאה: לא נמצא מזהה הזמנה');

    const enrichedItems = formData.items.map(item => {
      const finalId = item.ItemId ?? item.itemId;
      if (!finalId) {
        throw new Error(`לא ניתן לשמור את ההזמנה: פריט "${item.name}" חסר מזהה מוצר (ItemId)`);
      }
      return {
        ...item,
        ItemId: finalId,
        itemId: finalId
      };
    });
    console.log("💾 פריטים שנשמרים:");
    formData.items.forEach(item => {
  console.log(`🔹 ${item.name} | ItemId: ${item.ItemId} | id: ${item.id}`);
    });

    await updateDoc(doc(db, 'orders', orderId), {
      items: enrichedItems,
      ...(formData.clientName && { clientName: formData.clientName }),
      ...(formData.phone && { phone: formData.phone }),
      ...(formData.pickupDate && { pickupDate: formData.pickupDate }),
      ...(formData.returnDate && { returnDate: formData.returnDate }),
    });

    await fetchItemsAndOrders();
    setHasUnsavedChanges(false);
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
    console.log('🚪 Attempting to close, hasUnsavedChanges:', hasUnsavedChanges);

    if (hasUnsavedChanges) {
      const shouldSave = window.confirm('יש לך שינויים שלא נשמרו. האם ברצונך לשמור את השינויים לפני הסגירה?');

      if (shouldSave) {
        saveChanges();
        return;
      } else {
        const shouldDiscard = window.confirm('האם אתה בטוח שברצונך לבטל את השינויים?');
        if (!shouldDiscard) {
          return; // Don't close
        }
      }
    }

    // Close the modal
    setData({ open: false, eventId: null, items: [] });
  };

  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('🎯 Backdrop clicked');
      handleClose();
    }
  };

  const getAvailableQuantity = (itemName) => {
    const stockItem = allItems.find(i => i.name === itemName);
    const totalStock = stockItem?.quantity || 0;
    const currentOrderId = data?.eventId?.split('-')[0];

    let reservedInOtherOrders = 0;
    allEvents.forEach(event => {
      if (event.orderId !== currentOrderId && event.items) {
        event.items.forEach(it => {
          if (it.name === itemName) {
            reservedInOtherOrders += it.quantity || 0;
          }
        });
      }
    });

    const available = totalStock - reservedInOtherOrders;
    return available >= 0 ? available : 0;
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
          align-items: center !important;
          justify-content: center !important;
          padding: 1rem !important;
          z-index: 99999 !important;
        }
        
        .edit-modal-content {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          width: 100% !important;
          max-width: 56rem !important;
          max-height: 90vh !important;
          overflow: hidden !important;
          position: relative !important;
          z-index: 100000 !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className="edit-modal-overlay"
        onClick={handleBackdropClick}
      >


        <div
          className="edit-modal-content"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: hasUnsavedChanges
              ? 'linear-gradient(to right, #dc2626, #b91c1c)'  // Red when changes
              : 'linear-gradient(to right, #2563eb, #1d4ed8)', // Blue when no changes
            color: 'white',
            padding: '1rem'
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
          </div>

          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 180px)'
          }}>
            {/* Current Items Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#1f2937'
              }}>
                פריטים נוכחיים בהזמנה
              </h4>
              {formData.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {formData.items.map((item, index) => {
                    const itemData = allItems.find(i => i.name === item.name);
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
                          gap: '0.75rem'
                        }}>
                          {itemData?.imageUrl && (
                            <img
                              src={itemData.imageUrl}
                              alt={item.name}
                              style={{
                                width: '3rem',
                                height: '3rem',
                                objectFit: 'cover',
                                borderRadius: '6px'
                              }}
                            />
                          )}
                          <div>
                            <div style={{
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>
                              {item.name}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>
                             מזהה: {itemData?.ItemId ?? itemData?.itemId ?? 'לא נמצא'}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <button
                            onClick={() => updateItemQuantity(item.name, item.quantity - 1)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '50%',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            disabled={loading}
                          >
                            <Minus size={16} />
                          </button>
                          <span style={{
                            width: '2rem',
                            textAlign: 'center',
                            fontWeight: '500'
                          }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQuantity(item.name, item.quantity + 1)}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              width: '2rem',
                              height: '2rem',
                              borderRadius: '50%',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            disabled={loading}
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeItem(item.name)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              marginRight: '0.5rem',
                              fontSize: '0.875rem'
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
                הוסף פריטים
              </h4>

              {/* Search */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={20}
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
                      padding: '0.75rem 3rem 0.75rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Available Items */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                maxHeight: '15rem',
                overflowY: 'auto'
              }}>
                {filteredItems.map((item, index) => {
                  const isInOrder = formData.items.some(i => i.name === item.name);
                  return (
                    <div
                      key={index}
                      onClick={() => !loading && addItem(item)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: isInOrder ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        background: isInOrder ? '#eff6ff' : 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              objectFit: 'cover',
                              borderRadius: '6px'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '500',
                            fontSize: '0.875rem',
                            color: '#1f2937'
                          }}>
                            {item.name}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            מזהה: {item.itemId}
                          </div>
                          {isInOrder && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              fontWeight: '500'
                            }}>
                              בהזמנה ({formData.items.find(i => i.name === item.name)?.quantity})
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#10b981',
                            fontWeight: '500'
                          }}>
                            זמין: {getAvailableQuantity(item.name)}
                          </div>
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
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: '#4b5563'
              }}>
                סה"כ פריטים: {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem'
              }}>
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
                    background: formData.items.length === 0 ? '#9ca3af' :
                      hasUnsavedChanges ? '#dc2626' : '#2563eb',
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