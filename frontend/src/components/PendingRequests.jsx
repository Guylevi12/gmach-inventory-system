import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { useUser } from '../UserContext';
import { CheckCircle, XCircle, Eye, Calendar, User, Phone, MapPin, Package, Clock } from 'lucide-react';

const PendingRequests = () => {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(null);

  // טעינת בקשות ממתינות
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const requestsSnap = await getDocs(collection(db, 'orderRequests'));
      const pendingRequests = requestsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(request => request.status === 'pending')
        .sort((a, b) => {
          // מיין לפי תאריך בקשה (החדשות ראשונות)
          const aTime = a.requestedAt?.seconds || 0;
          const bTime = b.requestedAt?.seconds || 0;
          return bTime - aTime;
        });

      setRequests(pendingRequests);
    } catch (error) {
      console.error('שגיאה בטעינת בקשות:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // אישור בקשה - המרה להזמנה רגילה
  const approveRequest = async (request) => {
    if (!window.confirm(`האם אתה בטוח שברצונך לאשר את הבקשה של ${request.clientName}?`)) {
      return;
    }

    setProcessing(request.id);
    console.log('🚀 מתחיל אישור בקשה:', request);
    
    try {
      // קודם נבדוק שוב זמינות (למקרה שמשהו השתנה)
      console.log('📦 טוען נתוני מלאי והזמנות...');
      const itemsSnap = await getDocs(collection(db, 'items'));
      const ordersSnap = await getDocs(collection(db, 'orders'));
      
      const parseDate = (d) => {
        if (!d) return null;
        if (d.toDate) return d.toDate();
        if (typeof d === 'string') return new Date(d);
        return d;
      };

      const pickupStart = parseDate(request.pickupDate);
      const pickupEnd = parseDate(request.returnDate);

      // בדיקת הזמנות חופפות
      const overlappingOrders = ordersSnap.docs.map(doc => doc.data()).filter(order => {
        const orderStart = parseDate(order.pickupDate);
        const orderEnd = parseDate(order.returnDate);
        return (
          order.status === 'open' &&
          orderStart && orderEnd && pickupStart && pickupEnd &&
          orderEnd >= pickupStart &&
          orderStart <= pickupEnd
        );
      });

      // חישוב פריטים שמורים
      const reserved = {};
      overlappingOrders.forEach(order => {
        order.items?.forEach(item => {
          reserved[item.id] = (reserved[item.id] || 0) + item.quantity;
        });
      });

      // בדיקה שכל הפריטים בבקשה עדיין זמינים
      const itemsData = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('🔍 בודק זמינות פריטים...', request.items);
      
      let allAvailable = true;
      let unavailableItems = [];

      for (const requestItem of request.items) {
        console.log(`🔎 בודק פריט: ${requestItem.name}`, requestItem);
        
        const stockItem = itemsData.find(item => item.id === requestItem.id);
        if (!stockItem) {
          console.log(`❌ פריט לא נמצא במלאי: ${requestItem.name}`);
          allAvailable = false;
          unavailableItems.push(`${requestItem.name} (לא נמצא במלאי)`);
          continue;
        }

        const availableQty = (stockItem.quantity || 0) - (reserved[requestItem.id] || 0);
        console.log(`📊 ${requestItem.name}: מלאי=${stockItem.quantity}, שמור=${reserved[requestItem.id] || 0}, זמין=${availableQty}, נדרש=${requestItem.quantity}`);
        
        if (requestItem.quantity > availableQty) {
          allAvailable = false;
          unavailableItems.push(`${requestItem.name} (זמין: ${availableQty}, נדרש: ${requestItem.quantity})`);
        }
      }

      if (!allAvailable) {
        console.log('❌ לא כל הפריטים זמינים:', unavailableItems);
        alert(`לא ניתן לאשר את הבקשה - פריטים לא זמינים:\n${unavailableItems.join('\n')}`);
        setProcessing(null);
        return;
      }

      console.log('✅ כל הפריטים זמינים, ממשיך ליצירת הזמנה...');

      // יצירת מזהה הזמנה חדש
      console.log('🔢 יוצר מזהה הזמנה חדש...');
      const ordersQuery = await getDocs(collection(db, 'orders'));
      const existingIds = ordersQuery.docs.map(d => d.data().simpleId).filter(id => typeof id === 'number');
      const nextSimpleId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      console.log('🎯 מזהה הזמנה חדש:', nextSimpleId);

      // יצירת הזמנה חדשה
      console.log('📝 יוצר הזמנה חדשה...');
      console.log('👤 פרטי משתמש:', user);
      
      const newOrder = {
        clientName: request.clientName,
        address: request.address,
        phone: request.phone,
        email: request.email,
        eventType: request.eventType,
        pickupDate: request.pickupDate,
        eventDate: request.eventDate,
        returnDate: request.returnDate,
        items: request.items,
        simpleId: nextSimpleId,
        status: 'open',
        volunteerName: `מאושר ע"י ${user?.username || user?.email || 'מנהל'}`, // תיקון: עם fallback
        createdAt: serverTimestamp(),
        approvedBy: user?.uid || 'unknown',
        approvedByUsername: user?.username || user?.email || 'מנהל', // תיקון: עם fallback
        approvedAt: serverTimestamp(),
        orderId: null // יתמלא אוטומטית
      };

      console.log('💾 שומר הזמנה חדשה:', newOrder);

      // שמירת ההזמנה החדשה
      const docRef = await addDoc(collection(db, 'orders'), newOrder);
      console.log('✅ הזמנה נשמרה עם ID:', docRef.id);
      
      await updateDoc(docRef, { orderId: docRef.id });
      console.log('🔄 עדכון orderId הושלם');

      // עדכון סטטוס הבקשה לאושרה
      console.log('📋 מעדכן סטטוס בקשה לאושרה...');
      await updateDoc(doc(db, 'orderRequests', request.id), {
        status: 'approved',
        approvedBy: user?.uid || 'unknown',
        approvedByUsername: user?.username || user?.email || 'מנהל', // תיקון: עם fallback
        approvedAt: serverTimestamp(),
        orderId: docRef.id
      });

      console.log('🎉 תהליך האישור הושלם בהצלחה!');
      alert(`✅ הבקשה אושרה בהצלחה! מספר הזמנה: ${nextSimpleId}`);
      
      // טעינה מחדש של הבקשות
      await fetchPendingRequests();
      
    } catch (error) {
      console.error('❌ שגיאה באישור הבקשה:', error);
      console.error('Stack trace:', error.stack);
      alert(`שגיאה באישור הבקשה: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  // דחיית בקשה
  const rejectRequest = async (request) => {
    const reason = prompt(`מדוע אתה דוחה את הבקשה של ${request.clientName}?\n(ההודעה הזו תישלח ללקוח)`);
    
    if (reason === null) return; // בוטל
    
    setProcessing(request.id);
    console.log('🚫 מתחיל דחיית בקשה:', request.id, 'סיבה:', reason);
    
    try {
      // עדכון סטטוס הבקשה לנדחתה
      console.log('📝 מעדכן סטטוס בקשה לנדחתה...');
      console.log('👤 פרטי משתמש:', user);
      
      await updateDoc(doc(db, 'orderRequests', request.id), {
        status: 'rejected',
        rejectedBy: user?.uid || 'unknown',
        rejectedByUsername: user?.username || user?.email || 'מנהל', // תיקון: עם fallback
        rejectedAt: serverTimestamp(),
        rejectionReason: reason
      });

      console.log('✅ בקשה נדחתה בהצלחה');
      alert(`❌ הבקשה נדחתה. הלקוח יקבל הודעה.`);
      
      // טעינה מחדש של הבקשות
      await fetchPendingRequests();
      
    } catch (error) {
      console.error('❌ שגיאה בדחיית הבקשה:', error);
      console.error('Stack trace:', error.stack);
      alert(`שגיאה בדחיית הבקשה: ${error.message}`);
    } finally {
      setProcessing(null);
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
          <p>טוען בקשות...</p>
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
        background: 'linear-gradient(to right, #20b2aa, #48d1cc)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
          📋 בקשות להזמנה
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0.5rem 0 0 0' }}>
          בקשות ממתינות לאישור מנהלים
        </p>
      </div>

      {/* רשימת בקשות */}
      {requests.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Package size={64} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
            אין בקשות ממתינות
          </h3>
          <p style={{ color: '#9ca3af' }}>
            כל הבקשות עובדו או שאין בקשות חדשות
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {requests.map(request => (
            <div
              key={request.id}
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
              {/* כותרת הבקשה */}
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
                    {request.clientName}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0.25rem 0 0 0'
                  }}>
                    נשלח: {formatDateTime(request.requestedAt)}
                  </p>
                </div>
                <div style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  ממתין
                </div>
              </div>

              {/* פרטי הבקשה */}
              <div style={{
                display: 'grid',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.875rem' }}>
                    מבקש: {request.requestedByUsername}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.875rem' }}>{request.phone}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.875rem' }}>{request.address}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.875rem' }}>
                    {formatDate(request.pickupDate)} → {formatDate(request.returnDate)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={16} style={{ color: '#6b7280' }} />
                  <span style={{ fontSize: '0.875rem' }}>
                    {request.items?.reduce((sum, item) => sum + item.quantity, 0)} פריטים
                  </span>
                </div>
              </div>

              {/* כפתורי פעולה */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setSelectedRequest(request)}
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
                  onClick={() => approveRequest(request)}
                  disabled={processing === request.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: processing === request.id ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: processing === request.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <CheckCircle size={16} />
                  {processing === request.id ? 'מעבד...' : 'אשר'}
                </button>

                <button
                  onClick={() => rejectRequest(request)}
                  disabled={processing === request.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: processing === request.id ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: processing === request.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <XCircle size={16} />
                  דחה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* מודל הצגת פרטים */}
      {selectedRequest && (
        <RequestDetailsModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)}
          onApprove={() => {
            setSelectedRequest(null);
            approveRequest(selectedRequest);
          }}
          onReject={() => {
            setSelectedRequest(null);
            rejectRequest(selectedRequest);
          }}
          processing={processing === selectedRequest.id}
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

// קומפוננטה למודל פרטי הבקשה
const RequestDetailsModal = ({ request, onClose, onApprove, onReject, processing }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

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
          background: '#1f2937',
          color: 'white',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            פרטי בקשה - {request.clientName}
          </h2>
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
          {/* פרטי לקוח */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              פרטי הלקוח
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
                <span style={{ fontWeight: 'bold' }}>{request.clientName}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>טלפון</span>
                <span style={{ fontWeight: 'bold' }}>{request.phone}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>כתובת</span>
                <span style={{ fontWeight: 'bold' }}>{request.address}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>אימייל</span>
                <span style={{ fontWeight: 'bold' }}>{request.email || 'לא צוין'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>סוג אירוע</span>
                <span style={{ fontWeight: 'bold' }}>{request.eventType}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>תאריכים</span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatDate(request.pickupDate)} → {formatDate(request.returnDate)}
                </span>
              </div>
            </div>
          </div>

          {/* פריטים */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              פריטים מבוקשים ({request.items?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {request.items?.map((item, index) => (
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
        </div>

        {/* כפתורים */}
        <div style={{
          background: '#f9fafb',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={onApprove}
            disabled={processing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: processing ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            <CheckCircle size={20} />
            {processing ? 'מעבד...' : 'אשר בקשה'}
          </button>

          <button
            onClick={onReject}
            disabled={processing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: processing ? '#9ca3af' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            <XCircle size={20} />
            דחה בקשה
          </button>

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

export default PendingRequests;