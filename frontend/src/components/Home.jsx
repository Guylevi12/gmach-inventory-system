// src/components/Home.jsx
import React from 'react';
import { useUser } from '../UserContext';
import gemachImage from '../assets/images/GmachPic.jpeg';
import ContactBubble from './ContactBubble';
import HoursBubble from './HoursBubble';
import NavigationBubble from './NavigationBubble';

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
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
    image7,
    image9,
    image10,
    image11,
    image12
  ];

  return (
    <>
      {/* רקע כללי לכל האתר + גופנים */}
<></>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        {/* קונטיינר ראשי */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          
          {/* לוגו ומשפט הסבר - מידות מקצועיות על פי Golden Ratio */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="fade-in">
            <div style={{ marginBottom: '2.5rem' }}>
              <img 
                src={gemachImage}
                alt="לוגו שמחת זקנתי"
                style={{
                  margin: '0 auto',
                  height: 'clamp(280px, 35vw, 450px)', // גדל באופן משמעותי
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.15))',
                  borderRadius: '20px'
                }}
              />
            </div>
            
            <h1 style={{
              fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
              fontSize: 'clamp(32px, 6vw, 52px)', // גדל יותר
              fontWeight: '700',
              color: '#059669',
              marginBottom: '1.5rem',
              textShadow: '0 3px 6px rgba(0,0,0,0.12)',
              letterSpacing: '0.5px'
            }}>
              גמ"ח לעיצוב ארועים
            </h1>
            
            <p style={{
              fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
              fontSize: 'clamp(20px, 3.5vw, 28px)', // גדל יותר
              color: '#374151',
              maxWidth: '900px',
              margin: '0 auto',
              lineHeight: '1.7',
              fontWeight: '500'
            }}>
              מפות, אביזרים לקישוט שולחנות, מזנונים, פינות צילום ואווירה
            </p>
          </div>

          {/* גלריית תמונות פנורמה - 5-6 תמונות נראות בו זמנית */}
          <div style={{ marginBottom: '4rem' }} className="slide-in-left">
            <div style={{ position: 'relative', width: '100%', margin: '0 auto' }}>
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '20px',
                boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.8)',
                height: 'clamp(250px, 35vw, 400px)', // יותר נמוך ופחות גבוה
                maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
              }}>
                
                {/* קונטיינר התמונות הנעות */}
                <div 
                  style={{
                    display: 'flex',
                    height: '100%',
                    animation: 'panoramaSlide 40s linear infinite',
                    gap: '1rem'
                  }}
                >
                  {/* התמונות המקוריות */}
                  {galleryImages.concat(galleryImages).map((image, index) => (
                    <div 
                      key={`img-${index}`} 
                      style={{ 
                        flexShrink: 0,
                        width: 'clamp(200px, 18vw, 300px)', // רוחב של כל תמונה
                        height: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
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

                {/* אנימציית CSS */}
                <style>{`
                  @keyframes panoramaSlide {
                    0% {
                      transform: translateX(0);
                    }
                    100% {
                      transform: translateX(calc(-${galleryImages.length} * (clamp(200px, 18vw, 300px) + 1rem)));
                    }
                  }
                  
                  /* השהיה באנימציה בעת hover */
                  .panorama-container:hover .panorama-track {
                    animation-play-state: paused;
                  }
                `}</style>
              </div>
              
              {/* אינדיקטור "גלילה אוטומטית" */}
              <div style={{
                position: 'absolute',
                bottom: '-2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.9rem',
                color: '#6b7280',
                fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
                textAlign: 'center',
                opacity: 0.7
              }}>
              </div>
            </div>
          </div>

          {/* מפה - גודל מותאם ומקצועי */}
          <div className="fade-in">
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
              backdropFilter: 'blur(15px)',
              borderRadius: '20px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
              padding: '1.5rem',
              border: '1px solid rgba(255,255,255,0.6)',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <iframe
                src="https://www.google.com/maps?q=31.7889462,34.79986&output=embed"
                width="100%"
                height="350"
                style={{
                  borderRadius: '15px',
                  border: 'none'
                }}
                allowFullScreen=""
                loading="lazy"
                title='מיקום גמ"ח'
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      {/* הקומפוננטות החכמות */}
      <HoursBubble />
      <NavigationBubble />
      <ContactBubble />
    </>
  );
};

export default Home;