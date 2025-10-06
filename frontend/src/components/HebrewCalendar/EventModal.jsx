// src/components/EventModal.jsx - עם הגבלות על כפתור האימייל + הזמנות שלא הוחזרו
import React, { useState, useEffect } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebase-config';
import { Edit, Eye, Trash2, Calendar, Phone, Package, ClipboardCheck, Bell, Mail } from 'lucide-react';
import { sendManualPickupEmail } from '@/services/emailService';

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
  const [sendingEmail, setSendingEmail] = useState(null);
  const [sentEmails, setSentEmails] = useState(new Set());

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

  // ✅ פונקציה לבדיקת הזמנות שלא הוחזרו בזמן
  const getOverdueInfo = (orderGroup) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const returnDate = new Date(orderGroup.returnDate);
    returnDate.setHours(0, 0, 0, 0);

    const isOverdue = today > returnDate;
    const overdueDays = isOverdue ? Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)) : 0;

    return { isOverdue, overdueDays };
  };

  // ✅ פונקציות מערכת האימיילים - מעודכנות עם הגבלות

  // בדיקה האם היום הוא יום האיסוף (הכפתור יופיע רק ביום האיסוף)
  const isPickupDateToday = (orderGroup) => {
    const pickupDate = new Date(orderGroup.pickupDate);
    const today = new Date();

    // אפס שעות לשני התאריכים לבדיקה מדויקת
    pickupDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return pickupDate.getTime() === today.getTime();
  };

  // בדיקה האם הקבוצה הזו מכילה אירוע איסוף (ולא רק החזרה)
  const hasPickupEvent = (orderGroup) => {
    return orderGroup.events.some(event => event.type === 'השאלה');
  };

  // בדיקה האם האימייל כבר נשלח (מהמסד נתונים או מהסשן הנוכחי)
  const isEmailAlreadySent = (orderGroup) => {
    // בדיקה אם נשלח במסד הנתונים
    const alreadySentInDB = orderGroup.manualEmailSent === true;
    // בדיקה אם נשלח בסשן הנוכחי
    const sentInCurrentSession = sentEmails.has(orderGroup.orderId);

    return alreadySentInDB || sentInCurrentSession;
  };

  // בדיקה האם ניתן לשלוח אימייל (יום האיסוף + לא נשלח עדיין + יש אימייל + יש אירוע איסוף)
  const canSendEmail = (orderGroup) => {
    return orderGroup.email &&
      isPickupDateToday(orderGroup) &&
      hasPickupEvent(orderGroup) &&
      !isEmailAlreadySent(orderGroup);
  };

  // פונקציה לשליחת אימייל עם עדכון מסד הנתונים
  const handleSendEmail = async (orderGroup) => {
    if (!canSendEmail(orderGroup)) {
      return;
    }

    setSendingEmail(orderGroup.orderId);

    try {
      console.log('🚀 Sending manual pickup email for order:', orderGroup.orderId);

      const result = await sendManualPickupEmail({
        email: orderGroup.email,
        clientName: orderGroup.clientName,
        phone: orderGroup.phone,
        items: orderGroup.items || [],
        pickupDate: orderGroup.pickupDate,
        returnDate: orderGroup.returnDate,
        eventType: orderGroup.eventType || 'כללי',
        pickupLocation: orderGroup.pickupLocation || 'מיקום לפי תיאום',
        specialInstructions: orderGroup.specialInstructions || 'אין הוראות מיוחדות'
      }, orderGroup.orderId);

      console.log('📧 Email send result:', result);

      if (result.success) {
        // סמן כנשלח בסשן הנוכחי מיידית
        setSentEmails(prev => new Set([...prev, orderGroup.orderId]));

        console.log('✅ Email sent successfully, refreshing data...');

        // רענן את הנתונים כדי לקבל את העדכון ממסד הנתונים
        if (fetchItemsAndOrders) {
          await fetchItemsAndOrders();
        }

        alert('✅ אימייל נשלח בהצלחה!');
      } else {
        throw new Error(result.error || 'Unknown error');
      }

    } catch (error) {
      console.error('❌ שגיאה בשליחת אימייל:', error);
      alert(`❌ שגיאה בשליחת האימייל: ${error.message}`);
    } finally {
      setSendingEmail(null);
    }
  };

  // קבלת טקסט הכפתור בהתאם למצב
  const getEmailButtonText = (orderGroup) => {
    if (sendingEmail === orderGroup.orderId) {
      return 'שולח...';
    }

    if (isEmailAlreadySent(orderGroup)) {
      return 'נשלח ✓';
    }

    if (!isPickupDateToday(orderGroup)) {
      return 'זמין ביום האיסוף';
    }

    return 'שלח אימייל איסוף';
  };

  // קבלת טקסט הטולטיפ בהתאם למצב
  const getEmailButtonTooltip = (orderGroup) => {
    if (!orderGroup.email) {
      return 'אין כתובת אימייל עבור הזמנה זו';
    }

    if (!hasPickupEvent(orderGroup)) {
      return 'כפתור האימייל זמין רק בימי איסוף (לא החזרה)';
    }

    if (isEmailAlreadySent(orderGroup)) {
      return 'אימייל כבר נשלח עבור הזמנה זו';
    }

    if (!isPickupDateToday(orderGroup)) {
      const pickupDate = new Date(orderGroup.pickupDate).toLocaleDateString('he-IL');
      return `הכפתור יהיה זמין ביום האיסוף: ${pickupDate}`;
    }

    return 'שלח אימייל אישור איסוף ללקוח';
  };

  const groupEventsByOrder = (events) => {
    const grouped = new Map();

    events.forEach(event => {
      if (!grouped.has(event.orderId)) {
        grouped.set(event.orderId, {
          orderId: event.orderId,
          clientName: event.clientName,
          phone: event.phone,
          email: event.email,
          items: event.items,
          pickupDate: event.pickupDate,
          returnDate: event.returnDate,
          manualEmailSent: event.manualEmailSent || false,
          // ✅ הוספת מידע על בעיות זמינות
          availabilityStatus: event.availabilityStatus,
          availabilityConflicts: event.availabilityConflicts || [],
          needsAttention: event.needsAttention,
          events: []
        });
      }
      grouped.get(event.orderId).events.push(event);
    });

    return Array.from(grouped.values());
  };

  const groupedEvents = groupEventsByOrder(selectedEvents);

  // ✅ בדיקה האם יש הזמנות עם בעיות זמינות
  const hasAvailabilityIssues = groupedEvents.some(orderGroup =>
    orderGroup.availabilityStatus === 'CONFLICT' && orderGroup.availabilityConflicts.length > 0
  );

  // ✅ בדיקה האם יש הזמנות שלא הוחזרו בזמן
  const hasOverdueOrders = groupedEvents.some(orderGroup => {
    const { isOverdue } = getOverdueInfo(orderGroup);
    return isOverdue;
  });

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
        
        .availability-warning {
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%) !important;
          border: 2px solid #9333ea !important;
          border-radius: 8px !important;
          padding: 1rem !important;
          margin-bottom: 1rem !important;
          animation: warningPulse 2s ease-in-out infinite !important;
        }
        
        @keyframes warningPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(147, 51, 234, 0.1); }
        }

        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
          20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
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
          {/* ✅ Header - עדכון עם עדיפות להזמנות שלא הוחזרו */}
          <div style={{
            background: hasOverdueOrders
              ? 'linear-gradient(to right, #dc2626, #b91c1c)' // Red for overdue
              : hasAvailabilityIssues
                ? 'linear-gradient(to right, #9333ea, #7c3aed)' // Purple for conflicts
                : 'linear-gradient(to right, #2563eb, #1d4ed8)', // Blue for normal
            color: 'white',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {hasOverdueOrders ? (
                  <span style={{ fontSize: '24px' }}>🚨</span>
                ) : hasAvailabilityIssues ? (
                  <Bell size={24} style={{ animation: 'bellRing 2s infinite' }} />
                ) : (
                  <Calendar size={24} />
                )}
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  {hasOverdueOrders ? '🚨 הזמנות שלא הוחזרו בזמן' :
                    hasAvailabilityIssues ? '🔔 אירועים עם בעיות זמינות' :
                      `אירועים ליום ${selectedDate?.toLocaleDateString('he-IL')}`}
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
              color: hasOverdueOrders ? '#fecaca' : hasAvailabilityIssues ? '#e9d5ff' : '#bfdbfe'
            }}>
              {groupedEvents.length} הזמנ{groupedEvents.length !== 1 ? 'ות' : 'ה'}
              {hasOverdueOrders && ' • 🚨 דורש טיפול דחוף'}
              {hasAvailabilityIssues && !hasOverdueOrders && ' • נדרש עדכון דחוף'}
            </div>
          </div>

          {/* ✅ התראת בעיות זמינות כללית */}
          {hasAvailabilityIssues && !hasOverdueOrders && (
            <div className="availability-warning">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <Bell size={20} style={{ color: '#9333ea' }} />
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#581c87'
                }}>
                  בעיות זמינות זוהו!
                </h4>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4c1d95',
                margin: '0 0 0.75rem 0',
                lineHeight: '1.4'
              }}>
                חלק מההזמנות בתאריך זה דורשות עדכון בגלל שינויים במלאי.
                לחץ על "ערוך הזמנה" להתאמת הכמויות.
              </p>
              <div style={{
                background: 'rgba(243, 232, 255, 0.7)',
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#4c1d95'
              }}>
                💡 הזמנות בעייתיות מסומנות בסגול למטה
              </div>
            </div>
          )}

          {/* Events List */}
          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 200px)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groupedEvents.map((orderGroup, index) => {
                const hasConflicts = orderGroup.availabilityStatus === 'CONFLICT' && orderGroup.availabilityConflicts.length > 0;
                const { isOverdue, overdueDays } = getOverdueInfo(orderGroup);

                return (
                  <div key={orderGroup.orderId} style={{
                    border: isOverdue
                      ? '2px solid #dc2626'
                      : hasConflicts
                        ? '2px solid #9333ea'
                        : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: isOverdue
                      ? '#fef2f2'
                      : hasConflicts
                        ? '#faf5ff'
                        : 'white',
                    boxShadow: isOverdue
                      ? '0 4px 12px rgba(220, 38, 38, 0.15)'
                      : hasConflicts
                        ? '0 4px 12px rgba(147, 51, 234, 0.15)'
                        : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}>

                    {/* ✅ התראת הזמנות שלא הוחזרו - עדיפות ראשונה */}
                    {isOverdue && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        padding: '0.75rem',
                        borderBottom: '1px solid #f87171',
                        borderTopLeftRadius: '6px',
                        borderTopRightRadius: '6px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontSize: '18px' }}>🚨</span>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#dc2626'
                          }}>
                            הזמנה שלא הוחזרה בזמן!
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                          איחור של {overdueDays} יום{overdueDays > 1 ? 'ים' : ''} •
                          תאריך החזרה: {new Date(orderGroup.returnDate).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                    )}

                    {/* ✅ התראת בעיות זמינות ספציפית להזמנה - רק אם לא שלא הוחזרה */}
                    {hasConflicts && !isOverdue && (
                      <div style={{
                        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                        padding: '0.75rem',
                        borderBottom: '1px solid #c084fc',
                        borderTopLeftRadius: '6px',
                        borderTopRightRadius: '6px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <Bell size={16} style={{ color: '#9333ea' }} />
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#581c87'
                          }}>
                            בעיות זמינות בהזמנה זו:
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#4c1d95' }}>
                          {orderGroup.availabilityConflicts.map((conflict, idx) => (
                            <div key={idx} style={{ marginBottom: '0.25rem' }}>
                              • <strong>{conflict.itemName}:</strong> {conflict.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Event Header */}
                    <div style={{
                      padding: '1rem',
                      borderBottom: hasConflicts || isOverdue ? 'none' : '1px solid #f3f4f6'
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
                              color: isOverdue ? '#dc2626' : hasConflicts ? '#581c87' : '#1f2937',
                              margin: 0
                            }}>
                              {orderGroup.clientName}
                            </h4>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              background: isOverdue ? '#dc2626' : hasConflicts ? '#9333ea' : '#3b82f6',
                              color: 'white'
                            }}>
                              {isOverdue ? `🚨 איחור ${overdueDays} יום` :
                                hasConflicts ? '🔔 בעיות זמינות' :
                                  `הזמנה #${index + 1}`}
                            </span>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontSize: '0.875rem',
                            color: isOverdue ? '#b91c1c' : hasConflicts ? '#4c1d95' : '#4b5563',
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
                                background: isOverdue
                                  ? '#dc2626'
                                  : hasConflicts
                                    ? '#9333ea'
                                    : event.type === 'השאלה' ? '#10b981' :
                                      event.type === 'החזרה' ? '#f59e0b' : '#3b82f6',
                                color: 'white',
                                border: (isOverdue || hasConflicts) ? '1px solid rgba(255,255,255,0.3)' : 'none'
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
                            <Package size={16} style={{ color: isOverdue ? '#dc2626' : hasConflicts ? '#9333ea' : '#6b7280' }} />
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: isOverdue ? '#dc2626' : hasConflicts ? '#581c87' : '#374151'
                            }}>
                              פריטים ({orderGroup.items.reduce((sum, item) => sum + (item.quantity || 1), 0)})
                            </span>
                          </div>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            {orderGroup.items.slice(0, 3).map((item, idx) => {
                              // בדיקה האם הפריט הזה בעייתי
                              const isProblematic = hasConflicts && orderGroup.availabilityConflicts.some(
                                conflict => conflict.itemName === item.name
                              );

                              return (
                                <div key={idx} style={{
                                  background: isOverdue ? '#fee2e2' : isProblematic ? '#f3e8ff' : '#f9fafb',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  color: isOverdue ? '#dc2626' : isProblematic ? '#581c87' : '#4b5563',
                                  border: isOverdue ? '1px solid #f87171' : isProblematic ? '1px solid #c084fc' : '1px solid #e5e7eb',
                                  fontWeight: (isOverdue || isProblematic) ? 'bold' : 'normal'
                                }}>
                                  {isOverdue ? '🚨 ' : isProblematic ? '🔔 ' : ''}
                                  {item.name} {item.quantity > 1 ? `(×${item.quantity})` : ''}
                                </div>
                              );
                            })}
                            {orderGroup.items.length > 3 && (
                              <div style={{
                                background: isOverdue ? '#fee2e2' : hasConflicts ? '#f3e8ff' : '#eff6ff',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                color: isOverdue ? '#dc2626' : hasConflicts ? '#581c87' : '#2563eb',
                                border: isOverdue ? '1px solid #f87171' : hasConflicts ? '1px solid #c084fc' : '1px solid #dbeafe'
                              }}>
                                +{orderGroup.items.length - 3} נוספים
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - עדיפות לפעולות דחופות */}
                    <div style={{
                      padding: '1rem',
                      background: isOverdue ? '#fef2f2' : hasConflicts ? '#faf5ff' : '#f9fafb'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>

                        {/* ✅ כפתור דחוף לסגירת הזמנות שלא הוחזרו */}
                        {isOverdue && onStartReturnInspection && (
                          <button
                            onClick={() => onStartReturnInspection(orderGroup.orderId)}
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
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                              animation: 'pulse 2s infinite'
                            }}
                          >
                            <ClipboardCheck size={16} />
                            סגור הזמנה - דחוף!
                          </button>
                        )}

                        {/* ✅ כפתור שליחת אימייל - עם הגבלות חדשות */}
                        {orderGroup.email && isPickupDateToday(orderGroup) && hasPickupEvent(orderGroup) && (
                          <button
                            onClick={() => handleSendEmail(orderGroup)}
                            disabled={
                              sendingEmail === orderGroup.orderId ||
                              isEmailAlreadySent(orderGroup)
                            }
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              background:
                                sendingEmail === orderGroup.orderId ? '#f59e0b' :
                                  isEmailAlreadySent(orderGroup) ? '#22c55e' :
                                    '#7c3aed',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor:
                                sendingEmail === orderGroup.orderId ||
                                  isEmailAlreadySent(orderGroup) ? 'not-allowed' : 'pointer',
                              fontSize: '0.875rem',
                              opacity: isEmailAlreadySent(orderGroup) ? 0.8 : 1,
                              fontWeight: isEmailAlreadySent(orderGroup) ? 'bold' : 'normal'
                            }}
                            title={getEmailButtonTooltip(orderGroup)}
                          >
                            {sendingEmail === orderGroup.orderId ? (
                              <>
                                <div style={{
                                  width: '1rem',
                                  height: '1rem',
                                  border: '2px solid #ffffff',
                                  borderTop: '2px solid transparent',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite'
                                }}></div>
                                שולח...
                              </>
                            ) : (
                              <>
                                <Mail size={16} />
                                {getEmailButtonText(orderGroup)}
                              </>
                            )}
                          </button>
                        )}

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
                              background: isOverdue ? '#dc2626' : hasConflicts ? '#9333ea' : '#2563eb',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: (isOverdue || hasConflicts) ? 'bold' : 'normal',
                              boxShadow: (isOverdue || hasConflicts) ? '0 4px 12px rgba(147, 51, 234, 0.25)' : 'none',
                              animation: (isOverdue || hasConflicts) ? 'pulse 2s infinite' : 'none'
                            }}
                          >
                            <Edit size={16} />
                            {isOverdue ? 'ערוך הזמנה - דחוף!' :
                              hasConflicts ? 'ערוך הזמנה - דחוף!' :
                                'ערוך הזמנה'}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const orderEvents = selectedEvents.filter(e => e.orderId === orderGroup.orderId);
                            setShowItemsModal(orderEvents);
                          }}
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

                        {onStartReturnInspection && orderGroup.events.some(e => e.type === 'החזרה') && !isOverdue && (
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
                );
              })}
            </div>
          </div>

          {/* Footer */}
<div style={{
  background: hasOverdueOrders ? '#fef2f2' : hasAvailabilityIssues ? '#faf5ff' : '#f9fafb',
  padding: '1rem 1.5rem',
  borderTop: hasOverdueOrders ? '1px solid #f87171' : hasAvailabilityIssues ? '1px solid #d8b4fe' : '1px solid #e5e7eb'
}}>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: hasOverdueOrders ? '#dc2626' : hasAvailabilityIssues ? '#581c87' : '#4b5563'
              }}>
                סה"כ {groupedEvents.reduce((sum, orderGroup) => sum + (orderGroup.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0), 0)} פריטים
                {hasOverdueOrders && ' • 🚨 יש הזמנות שלא הוחזרו'}
                {hasAvailabilityIssues && !hasOverdueOrders && ' • 🔔 יש בעיות זמינות'}
              </div>
              <button
                onClick={() => setShowReport(false)}
                style={{
                  background: hasOverdueOrders ? '#dc2626' : hasAvailabilityIssues ? '#9333ea' : '#2563eb',
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