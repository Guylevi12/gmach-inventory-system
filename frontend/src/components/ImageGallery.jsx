// src/components/ImageGallery.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllImages, hasMultipleImages } from '../utils/imageUtils';

const ImageGallery = ({ 
  item, 
  width = '100%', 
  height = '200px',
  showNavigation = true,
  className = '',
  style = {},
  borderRadius = '8px'
}) => {
  const images = getAllImages(item);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isManagementPage, setIsManagementPage] = useState(false);

  // זיהוי מובייל ועמוד ניהול
  useEffect(() => {
    const checkEnvironment = () => {
      const mobile = window.innerWidth <= 768;
      const managementPage = window.location.pathname.includes('/management') || 
                           document.querySelector('.product-card-mobile') !== null ||
                           className.includes('management') ||
                           style.managementMode === true;
      
      setIsMobile(mobile);
      setIsManagementPage(managementPage);
    };
    
    checkEnvironment();
    window.addEventListener('resize', checkEnvironment);
    return () => window.removeEventListener('resize', checkEnvironment);
  }, [className, style]);

  // החלטה אם להציג ניווט
  const shouldShowNavigation = () => {
    // אם זה מובייל ועמוד ניהול - הסתר ניווט
    if (isMobile && isManagementPage) return false;
    return showNavigation;
  };
  
  // אם אין תמונות - תמונת default
  if (images.length === 0) {
    return (
      <div style={{
        width,
        height,
        borderRadius,
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        ...style
      }} className={className}>
        <img
          src="/no-image-available.png"
          alt="אין תמונה זמינה"
          style={{
            maxWidth: '80%',
            maxHeight: '80%',
            objectFit: 'contain',
            opacity: 0.5
          }}
        />
      </div>
    );
  }

  // אם יש תמונה אחת - תצוגה פשוטה
  if (images.length === 1) {
    return (
      <div style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        ...style
      }} className={className}>
        <img
          src={images[0]}
          alt={item.name || 'תמונת מוצר'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: 'white'
          }}
        />
      </div>
    );
  }

  // גלריה עם מספר תמונות
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <div style={{
      width,
      height,
      borderRadius,
      overflow: 'hidden',
      position: 'relative',
      background: '#f3f4f6',
      ...style
    }} className={className}>
      {/* התמונה הנוכחית */}
      <img
        src={images[currentImageIndex]}
        alt={`${item.name || 'מוצר'} - תמונה ${currentImageIndex + 1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transition: 'opacity 0.3s ease',
          background: 'white'
        }}
      />

      {/* חצים לניווט - עיצוב מחודש למובייל ניהול */}
      {images.length > 1 && (
        <>
          {isMobile && isManagementPage ? (
            // חץ יחיד למטה התמונה במובייל ניהול
            <button
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: '8px',
                bottom: '8px', // למטה במקום באמצע
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              aria-label="תמונה הבאה"
            >
              ›
            </button>
          ) : (
            // עיצוב רגיל לקטלוג ודסקטופ
            <>
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute',
                  left: '2px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
                aria-label="תמונה קודמת"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={nextImage}
                style={{
                  position: 'absolute',
                  right: '2px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
                aria-label="תמונה הבאה"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </>
      )}

      {/* אינדיקטורים (נקודות) - רק אם לא מובייל ניהול */}
      {!(isMobile && isManagementPage) && images.length > 1 && images.length <= 5 && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 10
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                background: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              aria-label={`תמונה ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* מונה תמונות - רק אם לא מובייל ניהול */}
      {!(isMobile && isManagementPage) && images.length > 5 && (
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10
        }}>
          {currentImageIndex + 1} / {images.length}
        </div>
      )}

      {/* סוויפ למובייל בעמוד ניהול */}
      {isMobile && isManagementPage && images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 5
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            e.currentTarget.startX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            if (!e.currentTarget.startX) return;
            
            const diffX = e.currentTarget.startX - touch.clientX;
            
            if (Math.abs(diffX) > 50) { // סוויפ של 50px לפחות
              if (diffX > 0) {
                nextImage(); // סוויפ שמאלה = תמונה הבאה
              } else {
                prevImage(); // סוויפ ימינה = תמונה קודמת
              }
            }
          }}
        />
      )}

      {/* מחוון דיסקרטי למובייל ניהול - רק אם יש יותר מתמונה אחת */}
      {isMobile && isManagementPage && images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '1px 4px',
          borderRadius: '4px',
          fontSize: '8px',
          zIndex: 10
        }}>
          {currentImageIndex + 1}/{images.length}
        </div>
      )}

      {/* קיבורד navigation */}
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') nextImage();
          if (e.key === 'ArrowLeft') prevImage();
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          outline: 'none'
        }}
        aria-label="גלריית תמונות - השתמש בחצים לניווט"
      />
    </div>
  );
};

export default ImageGallery;