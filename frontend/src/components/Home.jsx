// src/components/Home.jsx
import React from 'react';
import { useUser } from '../UserContext';
import gemachImage from '../assets/images/GmachPic.jpeg';

const Home = () => {
  const { user } = useUser();

  const containerStyle = {
    padding: '2rem',
    textAlign: 'center',
    direction: 'rtl',
    maxWidth: '1000px',
    margin: '0 auto',
  };


  const sectionTitle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '1rem',
  };

  const descriptionStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#333',
  };

  const mapWrapper = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2rem',
  };

  const mapStyle = {
    width: '100%',
    minHeight: '300px',
    aspectRatio: '16/9',
    border: '1px solid #ccc',
    borderRadius: '12px',
  };


  const contactBox = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '10px',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    fontSize: '15px',
    maxWidth: 'calc(100% - 40px)',
    wordWrap: 'break-word',
  };


  return (
    <div style={containerStyle}>
      <h2 style={sectionTitle}>ברוכים הבאים לגמ"ח שמחת זקנתי</h2>

<img
  src={gemachImage}
  alt='תמונה של גמ"ח'
  style={{
    width: '65%',
    height: 'auto',
    borderRadius: '12px',
    marginBottom: '2rem',
    maxWidth: '600px'
  }}
/>

      <div style={descriptionStyle}>
        פני פתחה את גמ"ח הציוד לשמחות ואירועים "שמחת זקנתי" לפני כ־10 שנים, לזכר סבה וסבתה – אברהם ואסתר ליבן ז"ל, ממקימי הקיבוץ. הגמ"ח החל לפעול מתוך ביתם ממש ולאחר מכן עבר למבנה שהוקצה ושופץ על ידי הקיבוץ.

        <br /><br />
        הגמ"ח מצריך תחזוקה מתמדת, התרמות, חידושים וסידור עם משתמשים רבים מהאזור. משתמשי הגמ"ח נהנים ממגוון ציוד עשיר, ויש להזמין כמה חודשים מראש.
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>📍 מיקום והגעה</h3>
        <div>
          <a href="https://maps.app.goo.gl/zHkUGZDnGVsUrBCB6" target="_blank" rel="noopener noreferrer">Google Maps</a> |{' '}
          <a href="https://waze.com/ul?ll=31.775887,34.703164" target="_blank" rel="noopener noreferrer">Waze</a>
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

      {/* תיבת התקשרות מוצגת רק כאשר אין משתמש או משתמש רגיל */}
      {(!user || user.role === 'User') && (
        <div style={contactBox}>
          📞 לתיאום ולהגעה: <a href="tel:0501234567" style={{ color: 'white', textDecoration: 'underline' }}>050-1234567</a>
        </div>
      )}
    </div>
  );
};

export default Home;
