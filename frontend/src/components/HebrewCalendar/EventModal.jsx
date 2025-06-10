// src/components/EventModal.jsx
import React, { useEffect } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config'; // Adjust path as needed
import { Edit, Eye, Trash2, Calendar, Phone, Package } from 'lucide-react';

const EventModal = ({ 
  show, 
  selectedDate, 
  selectedEvents, 
  allItems, 
  setShowReport, 
  setShowItemsModal, 
  setEditItemModal, 
  fetchItemsAndOrders 
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

  const handleDeleteOrder = async (event) => {
    const orderId = event.id.split('-')[0];
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

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'השאלה':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'החזרה':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'השאלה פעילה':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'השאלה':
        return '📦';
      case 'החזרה':
        return '🔄';
      case 'השאלה פעילה':
        return '⏰';
      default:
        return '📋';
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
              {selectedEvents.length} אירוע{selectedEvents.length !== 1 ? 'ים' : ''}
            </div>
          </div>

          {/* Events List */}
          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 200px)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedEvents.map((event, index) => (
                <div key={event.id} style={{
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
                            {event.clientName}
                          </h4>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            border: '1px solid'
                          }} className={getEventTypeColor(event.type)}>
                            {getEventIcon(event.type)} {event.type}
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          fontSize: '0.875rem',
                          color: '#4b5563'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={16} />
                            <span>{event.phone}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={16} />
                            <span>
                              {new Date(event.pickupDate).toLocaleDateString('he-IL')} - {new Date(event.returnDate).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    {event.items && event.items.length > 0 && (
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
                            פריטים ({event.items.reduce((sum, item) => sum + (item.quantity || 1), 0)})
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          {event.items.slice(0, 3).map((item, idx) => (
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
                          {event.items.length > 3 && (
                            <div style={{
                              background: '#eff6ff',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              border: '1px solid #dbeafe'
                            }}>
                              +{event.items.length - 3} נוספים
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
                      gap: '0.75rem'
                    }}>
                      <button 
                        onClick={() => setEditItemModal({ 
                          open: true, 
                          eventId: event.id, 
                          items: event.items.map(i => ({ ...i })) 
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
                      
                      <button 
                        onClick={() => handleDeleteOrder(event)} 
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
                סה"כ {selectedEvents.reduce((sum, event) => sum + (event.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0), 0)} פריטים
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