// src/components/ContactBubble.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Phone, X, MessageCircle } from 'lucide-react';
import { useUser } from '../UserContext';

const ContactBubble = () => {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [buttonContent, setButtonContent] = useState('phone');
  const [contentTransition, setContentTransition] = useState('fade-in');
  const bubbleRef = useRef(null);

  const phoneNumber1 = "054-257-5886"; // תיאום והגעה
  const phoneNumber1ForDialing = "0542575886";
  const phoneNumber2 = "054-4473-388"; // מנהלת הגמ"ח
  const phoneNumber2ForDialing = "0544473388";
  
  // תיקון פורמט מספר WhatsApp - הסרת רווחים ומקפים
  const whatsappNumber = "972542575886"; // פורמט נכון: קוד מדינה + מספר ללא 0 ברישה

  // פונקציה לסגירת הבועה כשלוחצים מחוץ לה
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target) && isExpanded) {
        handleClose();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // האזנה לפתיחת בועות אחרות כדי לסגור את הזו
  useEffect(() => {
    const handleOtherBubbleOpen = () => {
      if (isExpanded) {
        handleClose();
      }
    };

    // האזנה לאירועים מבועות אחרות
    window.addEventListener('hoursBubbleOpened', handleOtherBubbleOpen);
    window.addEventListener('navigationBubbleOpened', handleOtherBubbleOpen);

    return () => {
      window.removeEventListener('hoursBubbleOpened', handleOtherBubbleOpen);
      window.removeEventListener('navigationBubbleOpened', handleOtherBubbleOpen);
    };
  }, [isExpanded]);

  // הצגת הרכיב רק למשתמשים רגילים או למי שלא מחובר - AFTER all hooks
  if (user && user.role !== 'User') {
    return null;
  }

  const handlePhoneClick1 = () => {
    window.open(`tel:${phoneNumber1ForDialing}`, '_self');
  };

  const handlePhoneClick2 = () => {
    window.open(`tel:${phoneNumber2ForDialing}`, '_self');
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("שלום, אני מעוניין לקבל מידע נוסף על השירות");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleClose = () => {
    setIsClosing(true);

    setContentTransition('fade-out');
    setTimeout(() => {
      setButtonContent('phone');
      setContentTransition('fade-in');
    }, 150);

    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 250);
  };

  const handleToggle = () => {
    if (isExpanded) {
      handleClose();
    } else {
      // שידור אירוע שבועת הקשר נפתחת
      window.dispatchEvent(new CustomEvent('contactBubbleOpened'));
      
      setIsExpanded(true);

      setContentTransition('fade-out');
      setTimeout(() => {
        setButtonContent('close');
        setContentTransition('fade-in');
      }, 150);
    }
  };

  // CSS Styles כאובייקטים
  const styles = {
    contactBubble: {
      position: 'fixed',
      bottom: '160px', // הכי למעלה
      right: '20px', // צד ימין
      zIndex: 900, // נמוך מה-NavBar
      fontFamily: 'Assistant, Heebo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    },
    contactBubbleMobile: {
      position: 'fixed',
      bottom: '160px', // הכי למעלה גם במובייל
      right: '20px',
      left: 'auto',
      zIndex: 900, // נמוך מה-NavBar
      fontFamily: 'Assistant, Heebo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    },
    bubbleMain: {
      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      color: 'white',
      borderRadius: '50px',
      boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      fontWeight: '500',
      fontSize: '14px',
      overflow: 'hidden',
      position: 'relative',
      minWidth: '56px', // רוחב מינימלי
      minHeight: '56px', // גובה מינימלי
    },
    bubbleMainCollapsed: {
      width: '56px',
      height: '56px',
      padding: '0',
      justifyContent: 'center',
      borderRadius: '50%',
    },
    bubbleContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    bubbleContentFadeOut: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
    expandedMenu: {
      position: 'absolute',
      bottom: '70px',
      right: '70px', // רחוק מהכפתור
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      padding: '16px',
      minWidth: '260px',
      border: '1px solid #e5e7eb',
      animation: 'slideUp 0.3s ease',
    },
    expandedMenuClosing: {
      animation: 'slideDown 0.25s ease forwards',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      border: 'none',
      width: '100%',
      textAlign: 'right',
      background: 'none',
      color: '#374151',
      fontSize: '14px',
      marginBottom: '4px',
    },
    menuItemPhone: {
      color: '#2563eb',
    },
    menuItemPhone2: {
      color: '#7c3aed',
    },
    menuItemWhatsapp: {
      color: '#10b981',
    },
    menuHeader: {
      textAlign: 'center',
      marginBottom: '12px',
      color: '#1f2937',
      fontWeight: '600',
      fontSize: '16px',
    }
  };

  // בדיקה אם זה מובייל
  const isMobile = window.innerWidth <= 768;

  return (
    <>
      {/* CSS Animations */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes slideDown {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(10px) scale(0.95);
            }
          }

          @keyframes pulse {
            0% {
              box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
            }
            50% {
              box-shadow: 0 8px 25px rgba(37, 99, 235, 0.5);
            }
            100% {
              box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
            }
          }

          .contact-bubble-pulse {
            animation: pulse 2s infinite;
          }

          .contact-bubble-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(37, 99, 235, 0.4);
            background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          }

          .menu-item-hover:hover {
            background-color: #f3f4f6;
          }
        `}
      </style>

      <div 
        ref={bubbleRef}
        style={isMobile ? styles.contactBubbleMobile : styles.contactBubble}
      >
        {/* Expanded Menu */}
        {(isExpanded || isClosing) && (
          <div 
            style={{
              ...styles.expandedMenu,
              ...(isClosing ? styles.expandedMenuClosing : {})
            }}
            dir="rtl"
          >
            <div style={styles.menuHeader}>צור קשר</div>

            <button
              onClick={handlePhoneClick1}
              style={{...styles.menuItem, ...styles.menuItemPhone}}
              className="menu-item-hover"
            >
              <Phone size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>לתיאום והגעה</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{phoneNumber1}</div>
              </div>
            </button>

            <button
              onClick={handlePhoneClick2}
              style={{...styles.menuItem, ...styles.menuItemPhone2}}
              className="menu-item-hover"
            >
              <Phone size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>למנהלת הגמ"ח</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{phoneNumber2}</div>
              </div>
            </button>

            <button
              onClick={handleWhatsAppClick}
              style={{...styles.menuItem, ...styles.menuItemWhatsapp}}
              className="menu-item-hover"
            >
              <MessageCircle size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>WhatsApp</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>שלח הודעה מהירה</div>
              </div>
            </button>
          </div>
        )}

        {/* Main Bubble Button */}
        <button
          onClick={handleToggle}
          style={{
            ...styles.bubbleMain,
            ...(!isExpanded ? styles.bubbleMainCollapsed : {})
          }}
          className={`contact-bubble-hover ${!isExpanded ? 'contact-bubble-pulse' : ''}`}
          aria-label="צור קשר"
        >
          <div 
            style={{
              ...styles.bubbleContent,
              ...(contentTransition === 'fade-out' ? styles.bubbleContentFadeOut : {})
            }}
          >
            {buttonContent === 'close' ? (
              <>
                <X size={20} />
                <span>סגור</span> {/* תמיד יציג "סגור" כשבמצב close */}
              </>
            ) : (
              <Phone size={24} />
            )}
          </div>
        </button>
      </div>
    </>
  );
};

export default ContactBubble;