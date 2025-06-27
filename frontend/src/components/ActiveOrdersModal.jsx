import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { FaTimes, FaCalendarAlt, FaUser, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const ActiveOrdersModal = ({ item, onClose }) => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item) return;

    const fetchActiveOrders = async () => {
      setLoading(true);
      try {
        console.log('🔍 מחפש הזמנות פעילות עבור מוצר:', item.name, 'ID:', item.id);
        
        // שליפת כל ההזמנות הפעילות
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const openOrders = ordersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(order => order.status === 'open');

        console.log('📋 כל ההזמנות הפעילות:', openOrders.length);

        // סינון הזמנות שמכילות את המוצר הספציפי
        const ordersWithItem = openOrders.filter(order => {
          const hasItem = order.items?.some(orderItem => 
            orderItem.id === item.id || orderItem.ItemId === item.ItemId
          );
          return hasItem;
        });

        console.log('🎯 הזמנות שמכילות את המוצר:', ordersWithItem.length);

        // הכנת מידע מפורט על כל הזמנה
        const detailedOrders = ordersWithItem.map(order => {
          const itemInOrder = order.items.find(orderItem => 
            orderItem.id === item.id || orderItem.ItemId === item.ItemId
          );
          
          return {
            ...order,
            itemQuantity: itemInOrder?.quantity || 0
          };
        });

        // מיון לפי תאריך יצירה (החדשות ראשונות)
        detailedOrders.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setActiveOrders(detailedOrders);
      } catch (error) {
        console.error('❌ שגיאה בשליפת הזמנות פעילות:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();
  }, [item]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'לא צוין';
    
    let date;
    if (dateValue.seconds) {
      // Firestore timestamp
      date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'string') {
      // String date
      date = new Date(dateValue);
    } else {
      // Already a Date object
      date = dateValue;
    }
    
    if (isNaN(date.getTime())) {
      return 'תאריך לא תקין';
    }
    
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (!item) return null;

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1500,
        padding: '1rem'
      }}
      onClick={(e) => {
        // סגירה רק אם לוחצים על ה-overlay ולא על התוכן
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '95%',
          maxWidth: '800px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '0',
          direction: 'rtl',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px 12px 0 0',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            <FaTimes />
          </button>
          
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            textAlign: 'center',
            paddingRight: '3rem'
          }}>
            📋 הזמנות פעילות עבור "{item.name}"
          </h2>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            opacity: 0.9, 
            textAlign: 'center',
            fontSize: '0.95rem'
          }}>
            מזהה מוצר: {item.ItemId}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#666'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }} />
              טוען הזמנות פעילות...
            </div>
          ) : activeOrders.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#666'
            }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                color: '#ddd'
              }}>
                📄
              </div>
              <h3 style={{ 
                color: '#666',
                marginBottom: '0.5rem'
              }}>
                לא נמצאו הזמנות פעילות
              </h3>
              <p style={{ 
                color: '#999',
                margin: 0
              }}>
                המוצר הזה כרגע לא נמצא באף הזמנה פעילה
              </p>
            </div>
          ) : (
            <>
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                textAlign: 'center',
                border: '1px solid #e9ecef'
              }}>
                <p style={{ 
                  margin: 0, 
                  color: '#495057',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}>
                  📊 נמצא ב-{activeOrders.length} הזמנ{activeOrders.length === 1 ? 'ה' : 'ות'} פעיל{activeOrders.length === 1 ? 'ה' : 'ות'}
                  <br />
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    סה"כ כמות מושאלת: {activeOrders.reduce((sum, order) => sum + order.itemQuantity, 0)}
                  </span>
                </p>
              </div>

              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: window.innerWidth <= 768 ? '0 0.5rem' : '0'
              }}>
                {activeOrders.map((order, index) => (
                  <div 
                    key={order.id} 
                    style={{
                      border: '1px solid #e9ecef',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* מספר הזמנה - מותאם למובייל */}
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      background: '#667eea',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: window.innerWidth <= 768 ? '0.7rem' : '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      #{order.simpleId || order.id.slice(0, 6)}
                    </div>

                    {/* כמות במוצר - ממוקם מעל השם */}
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
                      <div style={{
                        background: '#28a745',
                        color: 'white',
                        padding: window.innerWidth <= 768 ? '0.3rem 0.6rem' : '0.4rem 0.8rem',
                        borderRadius: '15px',
                        fontSize: window.innerWidth <= 768 ? '0.7rem' : '0.8rem',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        maxWidth: window.innerWidth <= 768 ? '180px' : '220px',
                        margin: '0 auto', // ✅ מרכז את התיבה
                        display: 'inline-block' // ✅ גורם לתיבה להתכווץ לתוכן
                      }}>
                        {window.innerWidth <= 768 ? (
                          <>כמות: {order.itemQuantity}</>
                        ) : (
                          <>
                            מוצר: {item.name}
                            <br />
                            כמות: {order.itemQuantity}
                          </>
                        )}
                      </div>
                    </div>

                    {/* פרטי לקוח - ממורכז */}
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      <h4 style={{ 
                        margin: '0 0 0.75rem 0', 
                        color: '#333',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <FaUser color="#667eea" />
                        {order.clientName}
                      </h4>
                      
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#555'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaPhone color="#28a745" size={14} />
                          <span>{order.phone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaMapMarkerAlt color="#dc3545" size={14} />
                          <span>{order.address}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaUser color="#6c757d" size={14} />
                          <span>מתנדבת: {order.volunteerName}</span>
                        </div>
                      </div>
                    </div>

                    {/* תאריכים - ממורכז */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        color: '#495057'
                      }}>
                        <FaCalendarAlt color="#667eea" size={14} />
                        תאריכי השאלה
                      </div>
                      <div style={{ 
                        fontSize: '0.85rem',
                        color: '#6c757d',
                        lineHeight: '1.4'
                      }}>
                        <div>📤 לקיחה: {formatDate(order.pickupDate)}</div>
                        <div>🎉 אירוע: {formatDate(order.eventDate)}</div>
                        <div>📥 החזרה: {formatDate(order.returnDate)}</div>
                        {order.eventType && (
                          <div style={{ marginTop: '0.5rem', fontWeight: '500', color: '#495057' }}>
                            🎊 סוג אירוע: {order.eventType}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8f9fa',
          padding: '1rem 1.5rem',
          borderRadius: '0 0 12px 12px',
          borderTop: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            סגור
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ActiveOrdersModal;