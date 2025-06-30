// src/components/AvailabilityNotification.jsx - התראה צדדית פשוטה ללא X
import React, { useState, useEffect } from 'react';
import { Bell, Calendar, AlertCircle } from 'lucide-react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { useUser } from '../UserContext';
import { useNavigate } from 'react-router-dom';

const AvailabilityNotification = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // בדיקה האם המשתמש רשאי לראות התראות
  const canSeeNotifications = user && (user.role === 'MainAdmin' || user.role === 'GmachAdmin');

  // טעינת הזמנות עם בעיות זמינות - ✅ בזמן אמת!
  useEffect(() => {
    if (!canSeeNotifications) {
      setConflicts([]);
      setIsVisible(false);
      return;
    }

    console.log('🔔 מתחיל מעקב בזמן אמת אחרי בעיות זמינות...');

    // ✅ מאזין בזמן אמת לשינויים בהזמנות
    const unsubscribe = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const problematicOrders = [];

        snapshot.docs.forEach(doc => {
          const order = doc.data();
          if (order.status === 'open' && 
              order.availabilityStatus === 'CONFLICT' && 
              order.availabilityConflicts && 
              order.availabilityConflicts.length > 0) {
            
            problematicOrders.push({
              id: doc.id,
              clientName: order.clientName,
              phone: order.phone,
              pickupDate: order.pickupDate,
              returnDate: order.returnDate,
              conflicts: order.availabilityConflicts
            });
          }
        });

        console.log(`🔔 עדכון בזמן אמת: נמצאו ${problematicOrders.length} הזמנות עם בעיות זמינות`);
        
        setConflicts(problematicOrders);
        setIsVisible(problematicOrders.length > 0);
      },
      (error) => {
        console.error('❌ שגיאה במעקב בזמן אמת:', error);
        // ✅ אם יש שגיאה, חזור לבדיקה ידנית
        loadConflictsManually();
      }
    );

    // ✅ ניקוי המאזין כשהקומפוננט נמחק
    return () => {
      console.log('🔔 מפסיק מעקב בזמן אמת');
      unsubscribe();
    };
  }, [canSeeNotifications]);

  // ✅ פונקציה לבדיקה ידנית (גיבוי במקרה של שגיאה)
  const loadConflictsManually = async () => {
    try {
      console.log('🔄 בדיקה ידנית לבעיות זמינות...');
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const problematicOrders = [];

      ordersSnap.docs.forEach(doc => {
        const order = doc.data();
        if (order.status === 'open' && 
            order.availabilityStatus === 'CONFLICT' && 
            order.availabilityConflicts && 
            order.availabilityConflicts.length > 0) {
          
          problematicOrders.push({
            id: doc.id,
            clientName: order.clientName,
            phone: order.phone,
            pickupDate: order.pickupDate,
            returnDate: order.returnDate,
            conflicts: order.availabilityConflicts
          });
        }
      });

      setConflicts(problematicOrders);
      setIsVisible(problematicOrders.length > 0);
    } catch (error) {
      console.error('❌ שגיאה בבדיקה ידנית:', error);
    }
  };

  // אם אין הרשאות או אין בעיות - לא מציג כלום
  if (!canSeeNotifications || conflicts.length === 0 || !isVisible) {
    return null;
  }

  // ✅ פונקציה פשוטה לעבור להשאלות פתוחות
  const handleNavigateToCalendar = () => {
    navigate('/calendar');
  };

  return (
    <>
      <style jsx>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
          20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }

        @keyframes slideIn {
          from { 
            transform: translateX(100%); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(147, 51, 234, 0.1); }
        }

        .notification-container {
          position: fixed;
          bottom: 100px;
          right: 20px;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          direction: rtl;
          animation: slideIn 0.5s ease-out;
        }

        .notification-card {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          border: 2px solid #9333ea;
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.2);
          overflow: hidden;
          min-width: 280px;
          max-width: 350px;
          animation: pulse 3s ease-in-out infinite;
        }

        .notification-header {
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: default;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .bell-icon {
          animation: bellRing 2s ease-in-out infinite;
        }

        .notification-body {
          padding: 16px;
          background: rgba(248, 250, 252, 0.8);
          max-height: 300px;
          overflow-y: auto;
          transition: max-height 0.3s ease-out;
        }

        .conflict-item {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
          border-right: 4px solid #9333ea;
        }

        .conflict-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.1);
        }

        .conflict-item:last-child {
          margin-bottom: 0;
        }

        .client-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .date-info {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .conflicts-summary {
          font-size: 0.8rem;
          color: #7c3aed;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .notification-container {
            bottom: 80px;
            right: 10px;
            left: 10px;
          }
          
          .notification-card {
            min-width: auto;
            max-width: none;
          }
        }
      `}</style>

      <div className="notification-container">
        <div className="notification-card">
          {/* Header - ✅ ללא כפתור X */}
          <div className="notification-header">
            <div className="header-content">
              <Bell size={20} className="bell-icon" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                  🔔 יש לך {conflicts.length} הזמנ{conflicts.length === 1 ? 'ה' : 'ות'}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  {conflicts.length === 1 ? 'שדורשת' : 'שדורשות'} עדכון זמינות
                </div>
              </div>
            </div>
          </div>

          {/* Body - רשימת בעיות - ✅ תמיד מוצגת */}
          <div className="notification-body">
            {conflicts.map((order, index) => (
              <div 
                key={order.id}
                className="conflict-item"
                title="פרטי ההזמנה הבעייתית"
              >
                <div className="client-name">
                  <AlertCircle size={14} style={{ color: '#9333ea' }} />
                  {order.clientName}
                </div>
                
                <div className="date-info">
                  <Calendar size={12} />
                  {new Date(order.pickupDate).toLocaleDateString('he-IL')} - {new Date(order.returnDate).toLocaleDateString('he-IL')}
                </div>
                
                <div className="conflicts-summary">
                  {order.conflicts.length} פריט{order.conflicts.length === 1 ? '' : 'ים'} עם בעיות זמינות
                </div>
              </div>
            ))}
            
            {/* הוראות לפתרון */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '12px',
              fontSize: '0.8rem',
              color: '#92400e'
            }}>
              💡 <strong>איך לפתור:</strong> עבור להשאלות פתוחות → מצא ימים עם בעיות זמינות (מסומנים בסגול) → לחץ על יום → לחץ "ערוך הזמנה" → התאם כמויות
            </div>

            {/* ✅ כפתור עבור להשאלות פתוחות */}
            <button
              onClick={handleNavigateToCalendar}
              style={{
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                marginTop: '12px',
                boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <Calendar size={16} />
              עבור להשאלות פתוחות
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AvailabilityNotification;