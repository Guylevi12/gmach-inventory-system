import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { useUser } from '../UserContext';
import { Clock, CheckCircle, XCircle, Calendar, Package, User, Phone, MapPin, Eye, Trash2 } from 'lucide-react';

const MyOrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleting, setDeleting] = useState(null); // ID של ההזמנה שנמחקת

  // טעינת הזמנות המשתמש
  const fetchMyOrders = async () => {
    if (!user?.uid) {
      console.log('❌ אין משתמש מחובר:', user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 מחפש הזמנות עבור משתמש:', user.uid);
      
      // שליפת בקשות מ-orderRequests
      const requestsQuery = query(
        collection(db, 'orderRequests'),
        where('requestedBy', '==', user.uid)
      );
      
      console.log('📋 מבצע שאילתה ל-orderRequests...');
      const requestsSnap = await getDocs(requestsQuery);
      console.log('📊 נמצאו', requestsSnap.size, 'בקשות');
      
      const requestOrders = requestsSnap.docs.map(doc => {
        const data = { id: doc.id, type: 'request', ...doc.data() };
        console.log('📝 בקשה נמצאה:', data);
        return data;
      });

      console.log('✅ סה"כ בקשות שנמצאו:', requestOrders.length);

      // איחוד וסידור לפי תאריך
      const allOrders = [...requestOrders]
        .sort((a, b) => {
          const aTime = a.requestedAt?.seconds || a.createdAt?.seconds || 0;
          const bTime = b.requestedAt?.seconds || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      console.log('🎯 הזמנות סופיות:', allOrders);
      setOrders(allOrders);
    } catch (error) {
      console.error('❌ שגיאה בטעינת ההזמנות:', error);
      console.error('Stack trace:', error.stack);
    } finally {
      setLoading(false);
    }
  };

  // מחיקת הזמנה
  const deleteOrder = async (order) => {
    const statusText = getStatusInfo(order).text;
    
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ההזמנה?\n\nפרטים:\n• לקוח: ${order.clientName}\n• סטטוס: ${statusText}\n• תאריך: ${formatDate(order.pickupDate)}\n\nפעולה זו אינה ניתנת לביטול.`)) {
      return;
    }

    setDeleting(order.id);
    console.log('🗑️ מוחק הזמנה:', order.id);

    try {
      // מחיקה מ-orderRequests
      await deleteDoc(doc(db, 'orderRequests', order.id));
      
      console.log('✅ הזמנה נמחקה בהצלחה');
      
      // עדכון הרשימה המקומית
      setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
      
      // הודעת הצלחה
      alert('🗑️ ההזמנה נמחקה בהצלחה מהרשימה שלך');
      
    } catch (error) {
      console.error('❌ שגיאה במחיקת הזמנה:', error);
      alert(`שגיאה במחיקת ההזמנה: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    console.log('👤 משתמש השתנה:', user);
    if (user?.uid) {
      console.log('🚀 קורא לטעינת הזמנות...');
      fetchMyOrders();
    } else {
      console.log('⏳ מחכה למשתמש להיטען...');
      setLoading(false);
    }
  }, [user]);

  const getStatusInfo = (order) => {
    switch (order.status) {
      case 'pending':
        return {
          text: 'מחכה לאישור',
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: <Clock size={16} />
        };
      case 'approved':
        return {
          text: 'מאושר',
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: <CheckCircle size={16} />
        };
      case 'rejected':
        return {
          text: 'נדחה',
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: <XCircle size={16} />
        };
      default:
        return {
          text: 'לא ידוע',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: <Package size={16} />
        };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('he-IL');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        direction: 'rtl' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>טוען הזמנות...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      direction: 'rtl' 
    }}>
      {/* כותרת */}
      <div style={{
        background: 'linear-gradient(to right, #3b82f6, #1e40af)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
          📋 ההזמנות שלי
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0.5rem 0 0 0' }}>
          כל הבקשות וההזמנות שלך במקום אחד
        </p>
      </div>

      {/* סטטיסטיקות מהירות */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#fef3c7',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #fde68a'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
            {orders.filter(o => o.status === 'pending').length}
          </div>
          <div style={{ color: '#92400e', fontSize: '0.875rem' }}>מחכות לאישור</div>
        </div>
        
        <div style={{
          background: '#d1fae5',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #a7f3d0'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46' }}>
            {orders.filter(o => o.status === 'approved').length}
          </div>
          <div style={{ color: '#065f46', fontSize: '0.875rem' }}>מאושרות</div>
        </div>
        
        <div style={{
          background: '#fee2e2',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #fecaca'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b' }}>
            {orders.filter(o => o.status === 'rejected').length}
          </div>
          <div style={{ color: '#991b1b', fontSize: '0.875rem' }}>נדחו</div>
        </div>
        
        <div style={{
          background: '#eff6ff',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #dbeafe'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
            {orders.length}
          </div>
          <div style={{ color: '#1e40af', fontSize: '0.875rem' }}>סה"כ הזמנות</div>
        </div>
      </div>

      {/* רשימת הזמנות */}
      {orders.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Package size={64} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
            אין הזמנות עדיין
          </h3>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
            עדיין לא שלחת בקשות השאלה
          </p>
          <a 
            href="/request" 
            style={{
              display: 'inline-block',
              background: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            📝 צור בקשת השאלה ראשונה
          </a>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {orders.map(order => {
            const statusInfo = getStatusInfo(order);
            
            return (
              <div
                key={order.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                {/* כותרת ההזמנה */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      margin: 0,
                      color: '#1f2937'
                    }}>
                      {order.clientName}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0.25rem 0 0 0'
                    }}>
                      נשלח: {formatDateTime(order.requestedAt)}
                    </p>
                  </div>
                  <div style={{
                    background: statusInfo.bgColor,
                    color: statusInfo.color,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </div>
                </div>

                {/* פרטי ההזמנה */}
                <div style={{
                  display: 'grid',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem' }}>{order.phone}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem' }}>{order.address}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem' }}>
                      {formatDate(order.pickupDate)} → {formatDate(order.returnDate)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={16} style={{ color: '#6b7280' }} />
                    <span style={{ fontSize: '0.875rem' }}>
                      {order.items?.reduce((sum, item) => sum + item.quantity, 0)} פריטים
                    </span>
                  </div>

                  {/* סיבת דחייה אם קיימת */}
                  {order.status === 'rejected' && order.rejectionReason && (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        סיבת דחייה:
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
                        {order.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>

                {/* כפתורי פעולה */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <Eye size={16} />
                    הצג פרטים
                  </button>

                  <button
                    onClick={() => deleteOrder(order)}
                    disabled={deleting === order.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: deleting === order.id ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: deleting === order.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      opacity: deleting === order.id ? 0.6 : 1
                    }}
                  >
                    <Trash2 size={16} />
                    {deleting === order.id ? 'מוחק...' : 'מחק'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* מודל הצגת פרטים */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// קומפוננטה למודל פרטי ההזמנה
const OrderDetailsModal = ({ order, onClose }) => {
  const getStatusInfo = (order) => {
    switch (order.status) {
      case 'pending':
        return {
          text: 'מחכה לאישור',
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: <Clock size={20} />
        };
      case 'approved':
        return {
          text: 'מאושר',
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: <CheckCircle size={20} />
        };
      case 'rejected':
        return {
          text: 'נדחה',
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: <XCircle size={20} />
        };
      default:
        return {
          text: 'לא ידוע',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: <Package size={20} />
        };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const statusInfo = getStatusInfo(order);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 9999
    }} onClick={handleBackdropClick}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '42rem',
        maxHeight: '90vh',
        overflow: 'hidden',
        direction: 'rtl'
      }} onClick={(e) => e.stopPropagation()}>
        {/* כותרת */}
        <div style={{
          background: statusInfo.color,
          color: 'white',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {statusInfo.icon}
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                הזמנה - {order.clientName}
              </h2>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0 0', opacity: 0.9 }}>
                {statusInfo.text}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* תוכן */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
          {/* פרטי ההזמנה */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              פרטי ההזמנה
            </h3>
            <div style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>שם לקוח</span>
                <span style={{ fontWeight: 'bold' }}>{order.clientName}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>טלפון</span>
                <span style={{ fontWeight: 'bold' }}>{order.phone}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>כתובת</span>
                <span style={{ fontWeight: 'bold' }}>{order.address}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>אימייל</span>
                <span style={{ fontWeight: 'bold' }}>{order.email || 'לא צוין'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>סוג אירוע</span>
                <span style={{ fontWeight: 'bold' }}>{order.eventType}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>תאריכים</span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatDate(order.pickupDate)} → {formatDate(order.returnDate)}
                </span>
              </div>
            </div>
          </div>

          {/* פריטים */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              פריטים ({order.items?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {order.items?.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <img
                    src={item.imageUrl || '/no-image-available.png'}
                    alt={item.name}
                    style={{
                      width: '3rem',
                      height: '3rem',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '500', margin: 0, color: '#1f2937' }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                      מזהה: {item.ItemId}
                    </p>
                  </div>
                  <div style={{
                    background: '#3b82f6',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    ×{item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* סיבת דחייה */}
          {order.status === 'rejected' && order.rejectionReason && (
            <div style={{
              marginTop: '2rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#991b1b', margin: '0 0 0.5rem 0' }}>
                סיבת דחייה:
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
                {order.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* כפתור סגירה */}
        <div style={{
          background: '#f9fafb',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;