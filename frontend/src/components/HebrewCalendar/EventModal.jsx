// src/components/EventModal.jsx
import React, { useEffect } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { Edit, Eye, Trash2, Calendar, Phone, Package, ClipboardCheck } from 'lucide-react';

const EventModal = ({ 
  show, 
  selectedDate, 
  selectedEvents, 
  allItems, 
  setShowReport, 
  setShowItemsModal, 
  setEditItemModal, 
  fetchItemsAndOrders,
  onStartReturnInspection
}) => {
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

  if (!show) return null;

  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };

  const groupEventsByOrder = (events) => {
    const grouped = new Map();
    
    events.forEach(event => {
      if (!grouped.has(event.orderId)) {
        grouped.set(event.orderId, {
          orderId: event.orderId,
          clientName: event.clientName,
          phone: event.phone,
          items: event.items,
          pickupDate: event.pickupDate,
          returnDate: event.returnDate,
          events: []
        });
      }
      grouped.get(event.orderId).events.push(event);
    });
    
    return Array.from(grouped.values());
  };

  const groupedEvents = groupEventsByOrder(selectedEvents);

  const handleDeleteOrder = async (orderId) => {
    if (orderId && window.confirm('האם אתה בטוח שברצונך למחוק את ההזמנה?')) {
      try {
        await deleteOrder(orderId);
        await fetchItemsAndOrders();
        setShowReport(false);
        alert("ההזמנה נמחקה בהצלחה.");
      } catch (err) {
        console.error(err);
        alert("מחיקה נכשלה. נסה שוב.");
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowReport(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        .modal-overlay {
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
        
        .modal-content {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          width: 100% !important;
          max-width: 32rem !important;
          max-height: 90vh !important;
          overflow: hidden !important;
          position: relative !important;
          z-index: 100000 !important;
        }
        
        @media (min-width: 768px) {
          .modal-content {
            max-width: 42rem !important;
          }
        }
      `}</style>
      
      <div 
        className="modal-overlay"
        onClick={handleBackdropClick}
      >
        <div 
          className="modal-content" 
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
            color: 'white',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={24} />
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  אירועים ליום {selectedDate?.toLocaleDateString('he-IL')}
                </h3>
              </div>
              <button 
                onClick={() => setShowReport(false)} 
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
            <div style={{ 
              marginTop: '0.5rem', 
              color: '#bfdbfe'
            }}>
              {groupedEvents.length} הזמנ{groupedEvents.length !== 1 ? 'ות' : 'ה'}
            </div>
          </div>

          {/* Events List */}
          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 200px)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groupedEvents.map((orderGroup, index) => (
                <div key={orderGroup.orderId} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Event Header */}
                  <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <h4 style={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {orderGroup.clientName}
                          </h4>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            background: '#3b82f6',
                            color: 'white'
                          }}>
                            הזמנה #{index + 1}
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          fontSize: '0.875rem',
                          color: '#4b5563',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={16} />
                            <span>{orderGroup.phone}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={16} />
                            <span>
                              {new Date(orderGroup.pickupDate).toLocaleDateString('he-IL')} - {new Date(orderGroup.returnDate).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                        </div>

                        {/* Event Timeline */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.75rem'
                        }}>
                          {orderGroup.events.map((event, eventIndex) => (
                            <div key={eventIndex} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              background: event.type === 'השאלה' ? '#10b981' : 
                                         event.type === 'החזרה' ? '#f59e0b' : '#3b82f6',
                              color: 'white'
                            }}>
                              <span>{event.icon}</span>
                              <span>{event.description}</span>
                              {event.isMultiDay && (
                                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                                  (יום {event.dayNumber}/{event.totalDays})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    {orderGroup.items && orderGroup.items.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <Package size={16} style={{ color: '#6b7280' }} />
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#374151'
                          }}>
                            פריטים ({orderGroup.items.reduce((sum, item) => sum + (item.quantity || 1), 0)})
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          {orderGroup.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} style={{
                              background: '#f9fafb',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              color: '#4b5563',
                              border: '1px solid #e5e7eb'
                            }}>
                              {item.name} {item.quantity > 1 ? `(×${item.quantity})` : ''}
                            </div>
                          ))}
                          {orderGroup.items.length > 3 && (
                            <div style={{
                              background: '#eff6ff',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              border: '1px solid #dbeafe'
                            }}>
                              +{orderGroup.items.length - 3} נוספים
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    padding: '1rem',
                    background: '#f9fafb'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      {orderGroup.events.some(e => e.icon === '📦') && (
                        <button 
                          onClick={() => setEditItemModal({ 
                            open: true, 
                            eventId: `${orderGroup.orderId}-edit`, 
                            items: orderGroup.items.map(i => ({ ...i })) 
                          })} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#2563eb',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Edit size={16} />
                          ערוך הזמנה
                        </button>
                      )}

                      <button 
                        onClick={() => setShowItemsModal(true)} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#059669',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Eye size={16} />
                        הצג פרטים
                      </button>

                      {orderGroup.events.some(e => e.icon === '📦') && (
                        <button 
                          onClick={() => handleDeleteOrder(orderGroup.orderId)} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#dc2626',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Trash2 size={16} />
                          מחק
                        </button>
                      )}

                      {onStartReturnInspection && orderGroup.events.some(e => e.type === 'החזרה') && (
                        <button 
                          onClick={() => onStartReturnInspection(orderGroup.orderId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f59e0b',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          <ClipboardCheck size={16} />
                          בדיקת החזרה
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                סה"כ {groupedEvents.reduce((sum, orderGroup) => sum + (orderGroup.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0), 0)} פריטים
              </div>
              <button 
                onClick={() => setShowReport(false)} 
                style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventModal;