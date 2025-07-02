import React from 'react';

const About = () => {
  return (
    <>
      {/* רקע עם אותו עיצוב */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700;800&family=Heebo:wght@400;500;600;700;800&display=swap');
        
        body {
          background: linear-gradient(135deg, #fef7f7 0%, #fdf4f4 50%, #fcf1f1 100%);
          background-attachment: fixed;
          min-height: 100vh;
          position: relative;
        }
        
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 15% 25%, rgba(34, 197, 94, 0.03) 2px, transparent 2px),
            radial-gradient(circle at 65% 75%, rgba(20, 184, 166, 0.04) 1.5px, transparent 1.5px),
            radial-gradient(circle at 85% 15%, rgba(34, 197, 94, 0.025) 1px, transparent 1px),
            radial-gradient(circle at 25% 85%, rgba(20, 184, 166, 0.03) 1.5px, transparent 1.5px),
            radial-gradient(circle at 45% 35%, rgba(34, 197, 94, 0.02) 1px, transparent 1px),
            radial-gradient(circle at 75% 45%, rgba(20, 184, 166, 0.025) 1px, transparent 1px);
          background-size: 80px 80px, 60px 60px, 45px 45px, 70px 70px, 35px 35px, 55px 55px;
          background-position: 0 0, 30px 40px, 15px 25px, 40px 50px, 20px 10px, 50px 30px;
          z-index: -1;
          pointer-events: none;
        }
        
        .fade-in {
          animation: fadeIn 1s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
                  הגמ"ח הוקם <strong style={{ color: '#8b5cf6' }}>לעילוי נשמת סבה וסבתה של ענבר, יוזמת ומנהלת הגמ"ח, אברהם ואסתר ליבן ז"ל</strong>, ממקימי קיבוץ חפץ חיים.
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
                  הגמ"ח משרת <strong style={{ color: '#8b5cf6' }}>עשרות ארועים מידי חודש</strong>, ונשען על תרומות המשתמשים בלבד. נשמח אם תהיו שותפים.
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

          {/* כרטיסיות מידע נוסף - ממורכזות ומותאמות מובייל */}
          <div className="fade-in">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(1rem, 3vw, 2rem)',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              
              <div style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.5)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎊</div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.8rem',
                  fontFamily: '"Assistant", "Heebo", system-ui, sans-serif'
                }}>
                  מגוון רחב
                </h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  margin: 0,
                  fontFamily: '"Assistant", "Heebo", system-ui, sans-serif'
                }}>
                  מפות, עיצובים ואביזרים לכל סוג אירוע
                </p>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.5)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.8rem',
                  fontFamily: '"Assistant", "Heebo", system-ui, sans-serif'
                }}>
                  מתנדבות
                </h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  margin: 0,
                  fontFamily: '"Assistant", "Heebo", system-ui, sans-serif'
                }}>
                  צוות מסור ואוהב העוסק בגמ"ח בהתנדבות
                </p>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.5)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏡</div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.8rem',
                  fontFamily: '"Assistant", "Heebo", system-ui, sans-serif'
                }}>
                  קהילתי
                </h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  margin: 0,
                  fontFamily: '"Assistant", "Heebo", system-ui, sans-serif'
                }}>
                  משרת קהילות רבות באזור ומחוצה לו
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;