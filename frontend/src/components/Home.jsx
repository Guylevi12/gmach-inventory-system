// src/components/Home.jsx
import React from 'react';
import { useUser } from '../UserContext';
import gemachImage from '../assets/images/GmachPic.jpeg';

const Home = () => {
  const { user } = useUser();

  const containerStyle = {
    position: 'relative',
    padding: '2rem',
    textAlign: 'center',
    direction: 'rtl',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: '"Assistant", "Heebo", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    zIndex: 1,
  };

  const sectionTitle = {
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: '800',
    marginBottom: '1.5rem',
    color: '#1a365d',
    fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    letterSpacing: '0.5px',
  };

  const descriptionStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    fontSize: 'clamp(17px, 2.5vw, 22px)',
    lineHeight: '1.6',
    color: '#2d3748',
    textAlign: 'justify',
    fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
    fontWeight: '500',
    textShadow: '0 1px 2px rgba(0,0,0,0.05)',
  };

  const mapWrapper = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2rem',
    padding: '0 1rem',
  };

  const mapStyle = {
    width: '100%',
    maxWidth: '600px',
    minHeight: '250px',
    aspectRatio: '16/10',
    border: '3px solid #e2e8f0',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  const locationSectionStyle = {
    marginTop: '2.5rem',
    fontSize: 'clamp(20px, 3vw, 26px)',
    fontWeight: '700',
    color: '#1a365d',
    fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
  };

  const linksStyle = {
    marginTop: '0.8rem',
    fontSize: 'clamp(16px, 2vw, 20px)',
    fontWeight: '600',
  };

  // תיבת זמני פתיחה
  const openingHoursBox = {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'white',
    color: '#1f2937',
    padding: '24px',
    borderRadius: '16px',
    fontWeight: '600',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    border: '3px solid #e5e7eb',
    zIndex: 1000,
    fontSize: '16px',
    maxWidth: 'calc(50% - 40px)',
    minWidth: '300px',
    fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
  };

  return (
    <>
      {/* גופנים */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700;800&family=Heebo:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div style={containerStyle}>
        <h2 style={sectionTitle}>ברוכים הבאים לגמ"ח שמחת זקנתי</h2>

        <img
          src={gemachImage}
          alt='תמונה של גמ"ח'
          style={{
            width: '65%',
            height: 'auto',
            borderRadius: '16px',
            marginBottom: '2rem',
            maxWidth: '600px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            border: '3px solid #e2e8f0',
          }}
        />

        <div style={descriptionStyle}>
          גמ"ח שמחת זקנתי הוא גמ"ח ארועים הפועל משנת 2013.
          <br />
          הגמ"ח מציע השאלת ציוד לאירועים, כולל מפות קטיפה במגוון צבעים, עיצובי שולחן, עיצובים למזנונים ועוד.
          <br />
          הגמ"ח הוקם לעילוי נשמת סבה וסבתה של ענבר, יוזמת ומנהלת הגמ"ח, אברהם ואסתר ליבן ז"ל, ממקימי קיבוץ חפץ חיים.
          <br />
          הגמ"ח משרת את תושבי המועצה האזורית נחל שורק כמו גם יישובים מרוחקים יותר כמו אלומה, אשדוד, ניצן, מזכרת בתיה, יבנה ועוד.
          <br />
          הגמ"ח זוכה לתמיכה קבועה של הנהלת קיבוץ חפץ חיים והמועצה האזורית נחל שורק שרואים בגמ"ח יוזמה ברוכה של חסד ועזרה לזולת ובעלת חשיבות קהילתית מרובה.
          <br />
          הגמ"ח מופעל ע"י צוות מתנדבות מסור, דורש תחזוקה שוטפת- ניקוי, סידור, רכישת ציוד וחידוש המלאי באופן קבוע.
          <br />
          הגמ"ח משרת עשרות ארועים מידי חודש, ונשען על תרומות המשתמשים בלבד. נשמח אם תהיו שותפים.
          <br />
          פרטים בדף התרומות.
          <br />
          <strong style={{ fontSize: '1.1em'}}>נתראה בשמחות!</strong>
        </div>

        <div style={locationSectionStyle}>
          <h3>📍 מיקום והגעה</h3>
          <div style={{ 
            fontSize: 'clamp(18px, 2.8vw, 24px)', 
            fontWeight: '600', 
            color: '#4a5568', 
            marginTop: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            קיבוץ חפץ חיים
          </div>
          <div style={linksStyle}>
            <a 
              href="https://maps.app.goo.gl/zHkUGZDnGVsUrBCB6" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#2b6cb0', 
                textDecoration: 'none',
                borderBottom: '2px solid transparent',
                transition: 'border-bottom 0.3s ease'
              }}
            >
              Google Maps
            </a> |{' '}
            <a 
              href="https://waze.com/ul?ll=31.775887,34.703164" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#2b6cb0', 
                textDecoration: 'none',
                borderBottom: '2px solid transparent',
                transition: 'border-bottom 0.3s ease'
              }}
            >
              Waze
            </a>
          </div>
        </div>

        <div style={mapWrapper}>
          <iframe
            src="https://www.google.com/maps?q=31.7889462,34.79986&output=embed"
            width="100%"
            height="100%"
            style={mapStyle}
            allowFullScreen=""
            loading="lazy"
            title='מיקום גמ"ח'
          ></iframe>
        </div>

        {/* תיבת זמני פתיחה - מוצגת לכולם */}
        <div style={openingHoursBox}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '800', 
            marginBottom: '14px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            🕐 שעות פתיחה
          </div>
          
          <div style={{ lineHeight: '1.7' }}>
            <div style={{ 
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <div style={{ fontWeight: '700', color: '#374151', marginBottom: '6px', fontSize: '16px' }}>
                ימים רגילים
              </div>
              <div style={{ color: '#6b7280', fontSize: '15px', marginBottom: '4px' }}>
                ראשון, רביעי, חמישי
              </div>
              <div style={{ fontWeight: '700', color: '#059669', fontSize: '16px' }}>
                21:00 - 20:30
              </div>
            </div>
            
            <div>
              <div style={{ fontWeight: '700', color: '#374151', marginBottom: '6px', fontSize: '16px' }}>
                מוצאי שבת
              </div>
              <div style={{ fontSize: '15px', marginBottom: '4px' }}>
                <span style={{fontWeight: '700' }}>קיץ:</span>
                <span style={{ color: '#059669', fontWeight: '700', marginRight: '10px' }}>21:30 - 21:00</span>
              </div>
              <div style={{ fontSize: '15px' }}>
                <span style={{fontWeight: '700' }}>חורף:</span>
                <span style={{ color: '#059669', fontWeight: '700', marginRight: '10px' }}>20:30 - 20:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS נוסף למובייל */}
      <style>{`
        @media (max-width: 768px) {
          [style*="position: fixed"][style*="bottom: 20px"] {
            position: static !important;
            margin: 1rem auto !important;
            maxWidth: 100% !important;
            minWidth: auto !important;
            display: block !important;
          }
        }
      `}</style>
    </>
  );
};

export default Home;