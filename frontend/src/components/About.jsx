import React from 'react';

const About = () => {
  return (
    <>
      {/* רקע עם אותו עיצוב */}
<></>

      <div style={{ minHeight: '100vh', background: 'transparent', padding: '2rem 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
          
          {/* כותרת */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="fade-in">
            <h1 style={{
              fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: '800',
              color: '#059669',
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '0.5px'
            }}>
              אודות גמ"ח שמחת זקנתי
            </h1>
          </div>

          {/* תוכן ראשי */}
          <div className="fade-in" style={{ marginBottom: '3rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
              padding: 'clamp(1.5rem, 4vw, 3rem)',
              border: '1px solid rgba(255,255,255,0.5)',
              margin: '0 auto'
            }}>
              <div style={{
                fontFamily: '"Assistant", "Heebo", system-ui, sans-serif',
                fontSize: 'clamp(16px, 2.2vw, 20px)',
                lineHeight: '1.8',
                color: '#374151',
                textAlign: 'justify',
                direction: 'rtl'
              }}>
                <p style={{ marginBottom: '1.5rem' }}>
                  <strong style={{ color: '#059669', fontSize: '1.1em' }}>גמ"ח שמחת זקנתי הוא גמ"ח ארועים הפועל משנת 2013.</strong> 
                  הגמ"ח מציע השאלת ציוד לאירועים, כולל מפות קטיפה במגוון צבעים, עיצובי שולחן, עיצובים למזנונים ועוד.
                </p>

                <p style={{ marginBottom: '1.5rem' }}>
                  הגמ"ח הוקם <strong style={{ color: '#c2185b' }}>לעילוי נשמת סבה וסבתה של ענבר, יוזמת ומנהלת הגמ"ח, אברהם ואסתר ליבן ז"ל</strong>, ממקימי קיבוץ חפץ חיים.
                </p>

                <p style={{ marginBottom: '1.5rem' }}>
                  הגמ"ח משרת את תושבי המועצה האזורית נחל שורק כמו גם יישובים מרוחקים יותר כמו <strong>אלומה, אשדוד, ניצן, מזכרת בתיה, יבנה ועוד</strong>.
                </p>

                <p style={{ marginBottom: '1.5rem' }}>
                  הגמ"ח זוכה לתמיכה קבועה של הנהלת קיבוץ חפץ חיים והמועצה האזורית נחל שורק שרואים בגמ"ח <strong style={{ color: '#059669' }}>יוזמה ברוכה של חסד ועזרה לזולת ובעלת חשיבות קהילתית מרובה</strong>.
                </p>

                <p style={{ marginBottom: '1.5rem' }}>
                  הגמ"ח מופעל ע"י <strong>צוות מתנדבות מסור</strong>, דורש תחזוקה שוטפת- ניקוי, סידור, רכישת ציוד וחידוש המלאי באופן קבוע.
                </p>

                <p style={{ marginBottom: '1.5rem' }}>
                  הגמ"ח משרת <strong style={{ color: '#c2185b' }}>עשרות ארועים מידי חודש</strong>, ונשען על תרומות המשתמשים בלבד. נשמח אם תהיו שותפים.
                </p>

                <p style={{ marginBottom: '1.5rem' }}>
                  פרטים בדף התרומות.
                </p>

                <div style={{
                  textAlign: 'center',
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(139, 92, 246, 0.1))',
                  borderRadius: '12px',
                  border: '1px solid rgba(5, 150, 105, 0.2)'
                }}>
                  <p style={{
                    fontSize: 'clamp(18px, 3vw, 24px)',
                    fontWeight: '700',
                    color: '#059669',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    margin: 0
                  }}>
                    🎉 נתראה בשמחות! 🎉
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default About;