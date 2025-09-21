// src/components/AvailabilityNotification.jsx - התראה צדדית עם dismissal מותאם אישית
import React, { useState, useEffect } from 'react';
import { Bell, Calendar, AlertCircle, X, Minimize2 } from 'lucide-react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { useUser } from '../UserContext';
import { useNavigate } from 'react-router-dom';

const AvailabilityNotification = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  // בדיקה האם זה מובייל
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ בדיקת dismissal ספציפי למשתמש (15 דקות במקום שעה)
  useEffect(() => {
    if (!user?.uid) return;

    const dismissKey = `conflicts_dismissed_${user.uid}`;
    const dismissTime = localStorage.getItem(dismissKey);

    if (dismissTime) {
      const minutesPassed = (Date.now() - parseInt(dismissTime)) / (1000 * 60);
      if (minutesPassed < 15) { // 15 דקות במקום שעה
        setUserDismissed(true);
      } else {
        // נקה אחרי 15 דקות
        localStorage.removeItem(dismissKey);
        setUserDismissed(false);
      }
    }
  }, [user?.uid]);

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

        // ✅ אם יש בעיות חדשות, הצג את ההתראה שוב למשתמש הזה
        if (problematicOrders.length > 0) {
          setIsMinimized(false);
          // אפס את ה-dismissal אם יש בעיות חדשות
          setUserDismissed(false);
        }
      },
      (error) => {
        console.error('❌ שגיאה במעקב בזמן אמת:', error);
        loadConflictsManually();
      }
    );

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

  // אם אין הרשאות או אין בעיות או המשתמש סגר - לא מציג כלום
  if (!canSeeNotifications || conflicts.length === 0 || !isVisible || userDismissed) {
    return null;
  }

  // ✅ פונקציה פשוטה לעבור להשאלות פתוחות
  const handleNavigateToCalendar = () => {
    navigate('/calendar');
  };

  // ✅ פונקציה לסגירת ההתראה - ספציפי למשתמש ל-15 דקות
  const handleClose = () => {
    if (user?.uid) {
      const dismissKey = `conflicts_dismissed_${user.uid}`;
      localStorage.setItem(dismissKey, Date.now().toString());
      console.log(`✅ משתמש ${user.uid} סגר את ההתראה ל-15 דקות`);
    }

    setIsVisible(false);
    setUserDismissed(true);
  };

  // פונקציה למזעור/הגדלת ההתראה
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
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

        @keyframes slideInMobile {
          from { 
            transform: translateY(-100%); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(147, 51, 234, 0.1); }
        }

        .notification-container {
          position: fixed;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          direction: rtl;
        }

        /* Desktop positioning */
        .notification-container.desktop {
          bottom: 100px;
          right: 20px;
          animation: slideIn 0.5s ease-out;
        }

        /* Mobile positioning - top center for better visibility */
        .notification-container.mobile {
          top: 70px;
          left: 10px;
          right: 10px;
          animation: slideInMobile 0.5s ease-out;
        }

        .notification-card {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          border: 2px solid #9333ea;
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(147, 51, 234, 0.2);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .notification-card.desktop {
          min-width: 280px;
          max-width: 350px;
          animation: pulse 3s ease-in-out infinite;
        }

        .notification-card.mobile {
          width: 100%;
          max-height: ${isMinimized ? '60px' : '80vh'};
          animation: ${isMinimized ? 'none' : 'pulse 3s ease-in-out infinite'};
        }

        .notification-header {
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: ${isMobile ? 'pointer' : 'default'};
          min-height: 60px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          padding: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          min-height: 32px;
        }

        .control-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .control-button:active {
          transform: scale(0.95);
        }

        .bell-icon {
          animation: bellRing 2s ease-in-out infinite;
        }

        .notification-body {
          background: rgba(248, 250, 252, 0.8);
          transition: all 0.3s ease-out;
          overflow-y: auto;
        }

        .notification-body.desktop {
          padding: 16px;
          max-height: 300px;
        }

        .notification-body.mobile {
          padding: ${isMinimized ? '0' : '16px'};
          max-height: ${isMinimized ? '0' : '60vh'};
          opacity: ${isMinimized ? '0' : '1'};
        }

        .notification-body.minimized {
          padding: 0;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
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

        .action-button {
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          margin-top: 12px;
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
        }

        .action-button:active {
          transform: translateY(0);
        }

        .instructions {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          font-size: 0.8rem;
          color: #92400e;
          line-height: 1.4;
        }

        /* Mobile backdrop */
        .mobile-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          z-index: 9999;
          opacity: ${isMinimized ? '0' : '1'};
          visibility: ${isMinimized ? 'hidden' : 'visible'};
          transition: all 0.3s ease;
        }

        /* Override for small screens */
        @media (max-width: 480px) {
          .notification-container.mobile {
            top: 60px;
            left: 5px;
            right: 5px;
          }
          
          .notification-header {
            padding: 10px 12px;
          }
          
          .control-button {
            padding: 6px;
            min-width: 28px;
            min-height: 28px;
          }
        }
      `}</style>

      {/* Mobile backdrop */}
      {isMobile && !isMinimized && (
        <div className="mobile-backdrop" onClick={handleMinimize} />
      )}

      <div className={`notification-container ${isMobile ? 'mobile' : 'desktop'}`}>
        <div className={`notification-card ${isMobile ? 'mobile' : 'desktop'}`}>
          {/* Header with controls */}
          <div
            className="notification-header"
            onClick={isMobile ? handleMinimize : undefined}
          >
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

            <div className="header-controls">
              {isMobile && (
                <button
                  className="control-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMinimize();
                  }}
                  title={isMinimized ? "הרחב" : "מזער"}
                >
                  <Minimize2 size={16} />
                </button>
              )}
              <button
                className="control-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                title="סגור התראה ל-15 דקות"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body - רשימת בעיות */}
          <div className={`notification-body ${isMobile ? 'mobile' : 'desktop'} ${isMinimized ? 'minimized' : ''}`}>
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
            <div className="instructions">
              💡 <strong>איך לפתור:</strong> עבור להשאלות פתוחות → מצא ימים עם בעיות זמינות (מסומנים בסגול) → לחץ על יום → לחץ "ערוך הזמנה" → התאם כמויות
            </div>

            {/* כפתור עבור להשאלות פתוחות */}
            <button
              className="action-button"
              onClick={handleNavigateToCalendar}
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