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

  // הצגת הרכיב רק למשתמשים רגילים או למי שלא מחובר
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
      setIsExpanded(true);

      setContentTransition('fade-out');
      setTimeout(() => {
        setButtonContent('close');
        setContentTransition('fade-in');
      }, 150);
    }
  };

  return (
    <>
      <style jsx>{`
        .contact-bubble {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .bubble-main {
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: white;
          border-radius: 50px;
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          font-weight: 500;
          font-size: 14px;
          overflow: hidden;
          position: relative;
        }

        .bubble-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(37, 99, 235, 0.4);
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
        }

        .bubble-main.collapsed {
          width: 56px;
          height: 56px;
          padding: 0;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bubble-content {
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bubble-content.fade-out {
          opacity: 0;
          transform: scale(0.8);
        }

        .bubble-content.fade-in {
          opacity: 1;
          transform: scale(1);
        }

        .expanded-menu {
          position: absolute;
          bottom: 70px;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          padding: 16px;
          min-width: 260px;
          border: 1px solid #e5e7eb;
          animation: slideUp 0.3s ease;
        }

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

        .expanded-menu.closing {
          animation: slideDown 0.25s ease forwards;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
          width: 100%;
          text-align: right;
          background: none;
          color: #374151;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .menu-item:hover {
          background-color: #f3f4f6;
        }

        .menu-item.phone {
          color: #2563eb;
        }

        .menu-item.phone2 {
          color: #7c3aed;
        }

        .menu-item.whatsapp {
          color: #10b981;
        }

        .menu-header {
          text-align: center;
          margin-bottom: 12px;
          color: #1f2937;
          font-weight: 600;
          font-size: 16px;
        }

        .pulse {
          animation: pulse 2s infinite;
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

        @media (max-width: 768px) {
          .contact-bubble {
            bottom: 80px;
            right: 15px;
          }
          
          .expanded-menu {
            width: 240px;
            right: 10px;
            bottom: 65px;
            padding: 14px;
            border-radius: 10px;
          }
          
          .bubble-main {
            padding: 12px 18px;
            font-size: 14px;
            min-height: 48px;
          }
          
          .bubble-main.collapsed {
            width: 56px;
            height: 56px;
            padding: 0;
          }
          
          .menu-item {
            padding: 12px;
            font-size: 14px;
            min-height: 50px;
          }
          
          .menu-header {
            font-size: 16px;
            margin-bottom: 12px;
          }
        }
      `}</style>

      <div className="contact-bubble" ref={bubbleRef}>
        {/* Expanded Menu */}
        {(isExpanded || isClosing) && (
          <div className={`expanded-menu ${isClosing ? 'closing' : ''}`} dir="rtl">
            <div className="menu-header">צור קשר</div>

            <button
              onClick={handlePhoneClick1}
              className="menu-item phone"
            >
              <Phone size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>לתיאום והגעה</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{phoneNumber1}</div>
              </div>
            </button>

            <button
              onClick={handlePhoneClick2}
              className="menu-item phone2"
            >
              <Phone size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>למנהלת הגמ"ח</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{phoneNumber2}</div>
              </div>
            </button>

            <button
              onClick={handleWhatsAppClick}
              className="menu-item whatsapp"
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
          className={`bubble-main ${!isExpanded ? 'collapsed pulse' : ''}`}
          aria-label="צור קשר"
        >
          <div className={`bubble-content ${contentTransition}`}>
            {buttonContent === 'close' ? (
              <>
                <X size={20} />
                <span>סגור</span>
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