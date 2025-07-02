// src/components/NavigationBubble.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Navigation, X, Map, Car } from 'lucide-react';
import { useUser } from '../UserContext';

const NavigationBubble = () => {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [buttonContent, setButtonContent] = useState('navigation');
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
    window.addEventListener('hoursBubbleOpened', handleOtherBubbleOpen);

    return () => {
      window.removeEventListener('contactBubbleOpened', handleOtherBubbleOpen);
      window.removeEventListener('navigationBubbleOpened', handleOtherBubbleOpen);
    };
  }, [isExpanded]);

  const handleGoogleMapsClick = () => {
    window.open('https://maps.app.goo.gl/zHkUGZDnGVsUrBCB6', '_blank');
  };

  const handleWazeClick = () => {
    window.open('https://waze.com/ul?ll=31.775887,34.703164', '_blank');
  };

  const handleClose = () => {
    setIsClosing(true);

    setContentTransition('fade-out');
    setTimeout(() => {
      setButtonContent('navigation');
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
      // שידור אירוע שבועת הניווט נפתחת
      window.dispatchEvent(new CustomEvent('navigationBubbleOpened'));
      
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
    navigationBubble: {
      position: 'fixed',
      bottom: '90px', // מעל שעות הפתיחה
      right: '20px', // צד ימין
      zIndex: 900, // נמוך מה-NavBar
      fontFamily: 'Assistant, Heebo, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    },
    bubbleMain: {
      background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
      color: 'white',
      borderRadius: '50px',
      boxShadow: '0 8px 25px rgba(124, 58, 237, 0.3)',
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
      minWidth: '120px',
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
      right: '70px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
      padding: '16px',
      minWidth: '260px',
      border: '3px solid #e5e7eb',
      color: '#1f2937',
      zIndex: 901, // קצת יותר גבוה מהכפתור אבל עדיין נמוך מNavBar
    },
    expandedMenuClosing: {
      animation: 'slideDown 0.25s ease forwards',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      width: '100%',
      textAlign: 'right',
      background: 'none',
      color: 'white',
      fontSize: '14px',
      marginBottom: '8px',
      fontWeight: '600',
      textDecoration: 'none',
    },
    menuItemGoogleMaps: {
      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
    },
    menuItemWaze: {
      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
      boxShadow: '0 6px 20px rgba(245, 158, 11, 0.3)',
    },
    locationInfo: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      color: '#374151',
      padding: '12px 16px',
      borderRadius: '15px',
      fontSize: '12px',
      fontWeight: '600',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      textAlign: 'center',
      marginTop: '8px',
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
              box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
            }
            50% {
              box-shadow: 0 8px 25px rgba(124, 58, 237, 0.5);
            }
            100% {
              box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
            }
          }

          .navigation-bubble-pulse {
            animation: pulse 2s infinite;
          }

          .navigation-bubble-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(124, 58, 237, 0.4);
            background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%);
          }

          .menu-item-google-hover:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
          }

          .menu-item-waze-hover:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
          }

          .expanded-menu-navigation {
            animation: slideUp 0.3s ease;
          }

          @media (max-width: 768px) {
            .navigation-bubble-mobile {
              bottom: 90px !important;
              right: 20px !important;
            }
            
            .expanded-menu-mobile {
              width: 240px !important;
              right: 70px !important;
              bottom: 65px !important;
              padding: 14px !important;
              border-radius: 12px !important;
              min-width: 240px !important;
            }
            
            .bubble-main-mobile {
              padding: 12px 18px !important;
              font-size: 14px !important;
              min-height: 48px !important;
            }
          }
        `}
      </style>

      <div 
        ref={bubbleRef}
        style={styles.navigationBubble}
        className={isMobile ? "navigation-bubble-mobile" : ""}
      >
        {/* Expanded Menu */}
        {(isExpanded || isClosing) && (
          <div 
            style={{
              ...styles.expandedMenu,
              ...(isClosing ? styles.expandedMenuClosing : {})
            }}
            className={`expanded-menu-navigation ${isMobile ? 'expanded-menu-mobile' : ''}`}
            dir="rtl"
          >
            
            <button
              onClick={handleGoogleMapsClick}
              style={{...styles.menuItem, ...styles.menuItemGoogleMaps}}
              className="menu-item-google-hover"
            >
              <Map size={20} />
              <span>🗺️ Google Maps</span>
            </button>

            <button
              onClick={handleWazeClick}
              style={{...styles.menuItem, ...styles.menuItemWaze}}
              className="menu-item-waze-hover"
            >
              <Car size={20} />
              <span>🚗 Waze</span>
            </button>

            <div style={styles.locationInfo}>
              <strong>קיבוץ חפץ חיים</strong>
            </div>
          </div>
        )}

        {/* Main Bubble Button */}
        <button
          onClick={handleToggle}
          style={styles.bubbleMain}
          className={`navigation-bubble-hover ${isMobile ? 'bubble-main-mobile' : ''} ${!isExpanded ? 'navigation-bubble-pulse' : ''}`}
          aria-label="ניווט"
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
                <Navigation size={20} />
                <span>ניווט</span>
              </>
            )}
          </div>
        </button>
      </div>
    </>
  );
};

export default NavigationBubble;