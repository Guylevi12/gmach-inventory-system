// src/components/ItemsModal.jsx
import React, { useEffect } from 'react';
import { Package, X } from 'lucide-react';

const ItemsModal = ({ show, setShow, selectedEvents, allItems }) => {
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

  const items = selectedEvents?.[0]?.items || [];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShow(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        .items-modal-overlay {
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
        
        .items-modal-content {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          width: 100% !important;
          max-width: 28rem !important;
          max-height: 90vh !important;
          overflow: hidden !important;
          position: relative !important;
          z-index: 100000 !important;
        }
      `}</style>
      
      <div 
        className="items-modal-overlay"
        onClick={handleBackdropClick}
      >
        <div 
          className="items-modal-content" 
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(to right, #059669, #047857)',
            color: 'white',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Package size={24} />
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  רשימת מוצרים
                </h2>
              </div>
              <button 
                onClick={() => setShow(false)} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ 
              marginTop: '0.5rem', 
              color: '#a7f3d0'
            }}>
              {items.length} פריט{items.length !== 1 ? 'ים' : ''} בהזמנה
            </div>
          </div>

          {/* Items List */}
          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 180px)'
          }}>
            {items.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {items.map((item, idx) => {
                  const itemData = allItems.find(i => i.name === item.name);
                  return (
                    <div key={idx} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: '#f9fafb'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            style={{
                              width: '4rem',
                              height: '4rem',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '2px solid #e5e7eb'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            marginBottom: '0.25rem'
                          }}>
                            {item.name}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontSize: '0.875rem',
                            color: '#6b7280'
                          }}>
                            <span>
                              <strong>כמות:</strong> {item.quantity}
                            </span>
                            <span>
                              <strong>מזהה מוצר:</strong> 
                              <code style={{
                                background: '#f3f4f6',
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                marginRight: '0.25rem'
                              }}>
                                {item.itemId || 'לא נמצא'}
                              </code>
                            </span>
                          </div>
                        </div>
                        <div style={{
                          background: '#2563eb',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}>
                          ×{item.quantity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <Package size={48} style={{ 
                  color: '#d1d5db',
                  marginBottom: '1rem'
                }} />
                <p>אין פריטים בהזמנה זו</p>
              </div>
            )}
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
                סה"כ כמות: {items.reduce((sum, item) => sum + (item.quantity || 1), 0)}
              </div>
              <button 
                onClick={() => setShow(false)}
                style={{
                  background: '#059669',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
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

export default ItemsModal;