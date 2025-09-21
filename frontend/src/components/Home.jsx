// src/components/Home.jsx - Updated with AlertBanner
import React from 'react';
import { useUser } from '../UserContext';
import gemachImage from '../assets/images/GmachPic.jpeg';
import ContactBubble from './ContactBubble';
import HoursBubble from './HoursBubble';
import NavigationBubble from './NavigationBubble';
import AlertBanner from './AlertBanner'; // ✅ Add this import

// ייבוא כל התמונות שלך
import image1 from '../assets/images/1.jpg';
import image2 from '../assets/images/2.jpg';
import image3 from '../assets/images/3.jpg';
import image4 from '../assets/images/4.jpg';
import image5 from '../assets/images/5.jpg';
import image6 from '../assets/images/6.jpg';
import image7 from '../assets/images/7.jpg';
import image9 from '../assets/images/9.jpg';
import image10 from '../assets/images/10.jpg';
import image11 from '../assets/images/11.jpg';
import image12 from '../assets/images/12.jpg';

const Home = () => {
  const { user } = useUser();

  // מערך התמונות עם כל 12 התמונות שלך
  const galleryImages = [
    image1, image2, image3, image4, image5, image6,
    image7, image9, image10, image11, image12
  ];

  return (
    <>
      {/* ✅ Add AlertBanner at the very top */}
      <AlertBanner />

      <div style={{
        minHeight: '100vh',
        background: 'transparent',
        width: '100%',
        overflowX: 'hidden'
      }}>
        {/* קונטיינר ראשי */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>

          {/* לוגו ומשפט הסבר - מותאם למובייל */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            padding: '0 0.5rem'
          }} className="fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
              <img
                src={gemachImage}
                alt="לוגו שמחת זקנתי"
                style={{
                  margin: '0 auto',
                  height: 'clamp(250px, 35vw, 450px)',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.15))',
                  borderRadius: '20px'
                }}
              />
            </div>

            <h1 style={{
              fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
              fontSize: 'clamp(28px, 6vw, 52px)',
              fontWeight: '700',
              color: '#059669',
              marginBottom: '1.5rem',
              textShadow: '0 3px 6px rgba(0,0,0,0.12)',
              letterSpacing: '0.5px',
              lineHeight: '1.2',
              padding: '0 0.5rem'
            }}>
              גמ"ח לעיצוב ארועים
            </h1>

            <p style={{
              fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
              fontSize: 'clamp(18px, 3.5vw, 28px)',
              color: '#374151',
              maxWidth: '900px',
              margin: '0 auto',
              lineHeight: '1.7',
              fontWeight: '500',
              padding: '0 1rem'
            }}>
              מפות, אביזרים לקישוט שולחנות, מזנונים, פינות צילום ואווירה
            </p>
          </div>

          {/* גלריית תמונות מותאמת למובייל */}
          <div style={{
            marginBottom: '4rem',
            width: '100%',
            overflowX: 'hidden'
          }} className="slide-in-left">
            <div style={{
              position: 'relative',
              width: '100%',
              margin: '0 auto',
              padding: '0 0.5rem'
            }}>
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '15px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.8)',
                height: 'clamp(250px, 35vw, 400px)',
                width: '100%',
                maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)'
              }}>

                {/* קונטיינר התמונות הנעות */}
                <div
                  style={{
                    display: 'flex',
                    height: '100%',
                    animation: 'panoramaSlide 45s linear infinite',
                    gap: 'clamp(8px, 2vw, 16px)',
                    willChange: 'transform'
                  }}
                >
                  {/* התמונות המקוריות */}
                  {galleryImages.concat(galleryImages).map((image, index) => (
                    <div
                      key={`img-${index}`}
                      style={{
                        flexShrink: 0,
                        width: 'clamp(180px, 18vw, 300px)',
                        height: '100%',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <img
                        src={image}
                        alt={`תמונה ${(index % galleryImages.length) + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* מפה מותאמת למובייל */}
          <div className="fade-in" style={{
            padding: '0 0.5rem',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              border: '1px solid rgba(255,255,255,0.6)',
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto',
              boxSizing: 'border-box'
            }}>
              <iframe
                src="https://www.google.com/maps?q=31.7889462,34.79986&output=embed"
                width="100%"
                height="350"
                style={{
                  borderRadius: '15px',
                  border: 'none',
                  width: '100%',
                  display: 'block'
                }}
                allowFullScreen=""
                loading="lazy"
                title='מיקום גמ"ח'
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* CSS מותאם למובייל */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          overflow-x: hidden;
        }
        
        @keyframes panoramaSlide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-${galleryImages.length} * (clamp(180px, 18vw, 300px) + clamp(8px, 2vw, 16px))));
          }
        }
        
        /* אנימציות כניסה מותאמות למובייל */
        .fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        .slide-in-left {
          animation: slideInLeft 1.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        /* מיטוב למכשירים קטנים */
        @media (max-width: 480px) {
          .panorama-container {
            height: 180px !important;
          }
          
          iframe {
            height: 220px !important;
          }
        }
        
        /* מיטוב למכשירים בינוניים */
        @media (min-width: 481px) and (max-width: 768px) {
          .panorama-container {
            height: 250px !important;
          }
          
          iframe {
            height: 280px !important;
          }
        }
        
        /* מיטוב לטאבלטים */
        @media (min-width: 769px) and (max-width: 1024px) {
          .panorama-container {
            height: 300px !important;
          }
          
          iframe {
            height: 320px !important;
          }
        }
        
        /* הסתרת גלילה אופקית */
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }
      `}</style>

      {/* הקומפוננטות החכמות */}
      <HoursBubble />
      <NavigationBubble />
      <ContactBubble />
    </>
  );
};

export default Home;