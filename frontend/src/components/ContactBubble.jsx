// src/components/ContactBubble.jsx
import React, { useState } from 'react';
import { Phone, X, MessageCircle } from 'lucide-react';

const ContactBubble = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const phoneNumber = "123-456-7890"; // Replace with your actual phone number
  const whatsappNumber = "1234567890"; // Replace with WhatsApp number (no dashes)

  const handlePhoneClick = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("שלום, אני מעוניין לקבל מידע נוסף על השירות");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
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
          transition: all 0.3s ease;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          font-weight: 500;
          font-size: 14px;
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
        }

        .expanded-menu {
          position: absolute;
          bottom: 70px;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          padding: 16px;
          min-width: 240px;
          border: 1px solid #e5e7eb;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        }

        .menu-item:hover {
          background-color: #f3f4f6;
        }

        .menu-item.phone {
          color: #2563eb;
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
            bottom: 15px;
            right: 15px;
          }
          
          .expanded-menu {
            min-width: 200px;
            right: -50px;
          }
          
          .bubble-main {
            padding: 10px 16px;
            font-size: 13px;
          }
        }
      `}</style>

      <div className="contact-bubble">
        {/* Expanded Menu */}
        {isExpanded && (
          <div className="expanded-menu" dir="rtl">
            <div className="menu-header">צור קשר</div>
            
            <button
              onClick={handlePhoneClick}
              className="menu-item phone"
            >
              <Phone size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>התקשר אלינו</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{phoneNumber}</div>
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
          onClick={() => setIsExpanded(!isExpanded)}
          className={`bubble-main ${!isExpanded ? 'collapsed pulse' : ''}`}
          aria-label="צור קשר"
        >
          {isExpanded ? (
            <>
              <X size={20} />
              <span>סגור</span>
            </>
          ) : (
            <Phone size={24} />
          )}
        </button>
      </div>
    </>
  );
};

export default ContactBubble;