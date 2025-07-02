// src/components/HoursBubble.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Clock, X } from 'lucide-react';
import { useUser } from '../UserContext';

const HoursBubble = () => {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [buttonContent, setButtonContent] = useState('clock');
  const [contentTransition, setContentTransition] = useState('fade-in');
  const bubbleRef = useRef(null);

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
    window.addEventListener('contactBubbleOpened', handleOtherBubbleOpen);
    window.addEventListener('navigationBubbleOpened', handleOtherBubbleOpen);

    return () => {
      window.removeEventListener('contactBubbleOpened', handleOtherBubbleOpen);
      window.removeEventListener('navigationBubbleOpened', handleOtherBubbleOpen);
    };
  }, [isExpanded]);

  const handleClose = () => {
    setIsClosing(true);

    setContentTransition('fade-out');
    setTimeout(() => {
      setButtonContent('clock');
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
      // שידור אירוע שבועת השעות נפתחת
      window.dispatchEvent(new CustomEvent('hoursBubbleOpened'));
      
      setIsExpanded(true);

      setContentTransition('fade-out');
      setTimeout(() => {
        setButtonContent('close');
        setContentTransition('fade-in');
      }, 150);
    }
  };

  // הצגת הרכיב רק למשתמשים רגילים או למי שלא מחובר - AFTER all hooks
  if (user && user.role !== 'User') {
    return null;
  }

  // CSS Styles כאובייקטים
  const styles = {
    hoursBubble: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 900, // נמוך מה-NavBar שהוא בדרך כלל 1000+
      fontFamily: 'Assistant, Heebo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    },
    bubbleMain: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      borderRadius: '50px',
      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '16px 24px',
      fontWeight: '600',
      fontSize: '16px',
      overflow: 'hidden',
      position: 'relative',
      whiteSpace: 'nowrap',
      minWidth: '160px',
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
      right: '130px', // הזזתי עוד יותר שמאלה מ-70px ל-100px
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
      padding: '24px',
      minWidth: '320px',
      border: '3px solid #e5e7eb',
      color: '#1f2937',
      textAlign: 'center',
      zIndex: 901, // קצת יותר גבוה מהכפתור אבל עדיין נמוך מNavBar
    },
    expandedMenuClosing: {
      animation: 'slideDown 0.25s ease forwards',
    },
    menuHeader: {
      textAlign: 'center',
      marginBottom: '16px',
      color: '#1f2937',
      fontWeight: '800',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
    },
    hoursContent: {
      lineHeight: '1.7',
      textAlign: 'center',
    },
    hoursSection: {
      marginBottom: '12px',
      paddingBottom: '12px',
      borderBottom: '2px solid #e5e7eb',
    },
    hoursSectionLast: {
      marginBottom: '0',
      paddingBottom: '0',
      borderBottom: 'none',
    },
    hoursTitle: {
      fontWeight: '700',
      color: '#374151',
      marginBottom: '6px',
      fontSize: '16px',
    },
    hoursDays: {
      color: '#6b7280',
      fontSize: '15px',
      marginBottom: '4px',
    },
    hoursTime: {
      fontWeight: '700',
      color: '#059669',
      fontSize: '16px',
    },
    hoursTimeDetail: {
      fontSize: '15px',
      marginBottom: '4px',
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
              box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
            }
            50% {
              box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
            }
            100% {
              box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
            }
          }

          .hours-bubble-pulse {
            animation: pulse 2s infinite;
          }

          .hours-bubble-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
          }

          .expanded-menu-animation {
            animation: slideUp 0.3s ease;
          }

          @media (max-width: 768px) {
            .hours-bubble-mobile {
              bottom: 20px !important;
              right: 20px !important;
            }
            
            .expanded-menu-hours-mobile {
              width: 300px !important;
              right: 120px !important; /* גם במובייל יותר שמאלה */
              bottom: 65px !important;
              padding: 20px !important;
              border-radius: 12px !important;
              min-width: 280px !important;
            }
            
            .bubble-main-hours-mobile {
              padding: 12px 18px !important;
              font-size: 14px !important;
              min-height: 48px !important;
            }
          }
        `}
      </style>

      <div ref={bubbleRef} style={styles.hoursBubble} className={isMobile ? "hours-bubble-mobile" : ""}>
        {/* Expanded Menu */}
        {(isExpanded || isClosing) && (
          <div 
            style={{
              ...styles.expandedMenu,
              ...(isClosing ? styles.expandedMenuClosing : {})
            }}
            className={`expanded-menu-animation ${isMobile ? 'expanded-menu-hours-mobile' : ''}`}
            dir="rtl"
          >
            <div style={styles.menuHeader}>
              🕐 שעות פתיחה
            </div>

            <div style={styles.hoursContent}>
              <div style={{...styles.hoursSection}}>
                <div style={styles.hoursTitle}>ימים רגילים</div>
                <div style={styles.hoursDays}>ראשון, רביעי, חמישי</div>
                <div style={styles.hoursTime}>20:30 - 21:00</div>
              </div>
              
              <div style={{...styles.hoursSection, ...styles.hoursSectionLast}}>
                <div style={styles.hoursTitle}>מוצאי שבת</div>
                <div style={styles.hoursTimeDetail}>
                  <span style={{fontWeight: '700' }}>קיץ:</span>
                  <span style={{ color: '#059669', fontWeight: '700', marginRight: '10px' }}>21:00 - 21:30</span>
                </div>
                <div style={styles.hoursTimeDetail}>
                  <span style={{fontWeight: '700' }}>חורף:</span>
                  <span style={{ color: '#059669', fontWeight: '700', marginRight: '10px' }}>20:00 - 20:30</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Bubble Button */}
        <button
          onClick={handleToggle}
          style={styles.bubbleMain}
          className={`hours-bubble-hover ${isMobile ? 'bubble-main-hours-mobile' : ''} ${!isExpanded ? 'hours-bubble-pulse' : ''}`}
          aria-label="שעות פתיחה"
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
                {isExpanded && <span>סגור</span>}
              </>
            ) : (
              <>
                <Clock size={20} />
                <span>שעות פתיחה</span>
              </>
            )}
          </div>
        </button>
      </div>
    </>
  );
};

export default HoursBubble;