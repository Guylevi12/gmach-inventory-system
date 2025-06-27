import React from 'react';

const BorrowingGuidelines = () => {
  // Check if mobile
  const isMobile = window.innerWidth <= 768;

  const containerStyle = {
    maxWidth: isMobile ? '100%' : '900px',
    width: '100%',
    margin: isMobile ? '0' : '20px auto',
    padding: isMobile ? '10px' : '40px',
    backgroundColor: '#ffffff',
    borderRadius: isMobile ? '0' : '8px',
    boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.08)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    direction: 'rtl',
    lineHeight: isMobile ? '1.6' : '1.7',
    boxSizing: 'border-box'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: isMobile ? '30px' : '50px',
    padding: isMobile ? '20px 15px' : '30px 20px',
    backgroundColor: '#fafbfc',
    borderRadius: '6px',
    border: '3px solid #718096',
    boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.12)'
  };

  const titleStyle = {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '8px',
    lineHeight: '1.2'
  };

  const subtitleStyle = {
    fontSize: 'clamp(14px, 3.5vw, 18px)',
    color: '#4a5568',
    fontWeight: '400',
    margin: '0'
  };

  const sectionStyle = {
    marginBottom: isMobile ? '25px' : '40px',
    padding: isMobile ? '20px 15px' : '32px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: isMobile ? '2px solid #a0aec0' : '3px solid #a0aec0',
    boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.08)' : '0 4px 12px rgba(0, 0, 0, 0.12)'
  };

  const sectionTitleStyle = {
    fontSize: 'clamp(18px, 4vw, 24px)',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  };

  const stepStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: isMobile ? '20px' : '24px',
    padding: isMobile ? '15px' : '24px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: isMobile ? '1px solid #e2e8f0' : '2px solid #a0aec0',
    boxShadow: isMobile ? '0 1px 4px rgba(0, 0, 0, 0.05)' : '0 3px 8px rgba(0, 0, 0, 0.1)',
    gap: isMobile ? '12px' : '20px'
  };

  const stepNumberStyle = {
    backgroundColor: '#4299e1',
    color: 'white',
    borderRadius: '50%',
    width: isMobile ? '32px' : '36px',
    height: isMobile ? '32px' : '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: isMobile ? '14px' : '16px',
    flexShrink: 0,
    minWidth: isMobile ? '32px' : '36px'
  };

  const stepContentStyle = {
    flex: 1,
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    color: '#4a5568',
    lineHeight: '1.5',
    minWidth: 0
  };

  const highlightBoxStyle = {
    backgroundColor: '#f7fafc',
    border: isMobile ? '2px solid #718096' : '3px solid #718096',
    borderRadius: '8px',
    padding: isMobile ? '15px' : '24px',
    marginBottom: isMobile ? '15px' : '20px',
    textAlign: 'center',
    boxShadow: isMobile ? 'none' : '0 3px 8px rgba(0, 0, 0, 0.1)'
  };

  const warningBoxStyle = {
    backgroundColor: '#fffaf0',
    border: isMobile ? '2px solid #b7791f' : '3px solid #b7791f',
    borderRadius: '8px',
    padding: isMobile ? '15px' : '24px',
    marginBottom: isMobile ? '15px' : '20px',
    boxShadow: isMobile ? 'none' : '0 3px 8px rgba(0, 0, 0, 0.1)'
  };

  const cardStyle = {
    padding: isMobile ? '15px' : '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: isMobile ? '1px solid #e2e8f0' : '2px solid #a0aec0',
    boxShadow: isMobile ? '0 1px 4px rgba(0, 0, 0, 0.05)' : '0 3px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: isMobile ? '15px' : '0'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '15px',
    width: '100%'
  };

  const mobileGridStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '100%'
  };

  const iconStyle = {
    fontSize: 'clamp(16px, 4vw, 20px)',
    marginLeft: '4px'
  };

  return (
    <div style={containerStyle}>
      {/* כותרת ראשית */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          <span style={iconStyle}>📋</span>
          נוהל השאלה
        </h1>
        <p style={subtitleStyle}>שואלים יקרים - אנא קראו בעיון את נוהל הגמ"ח</p>
      </div>

      {/* התהליך המלא - 3 שלבי השאלה */}
      <div style={{
        ...sectionStyle,
        backgroundColor: '#f8fafc',
        border: isMobile ? '1px solid #e2e8f0' : '4px solid #2d3748',
        boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.08)' : '0 6px 16px rgba(45, 55, 72, 0.15)'
      }}>
        <h2 style={sectionTitleStyle}>
          <span style={iconStyle}>🔄</span>
          התהליך המלא - איך זה עובד?
        </h2>

        <div style={stepStyle}>
          <div style={stepNumberStyle}>1</div>
          <div style={stepContentStyle}>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(15px, 3.5vw, 17px)' }}>הזמנה ורישום בלוח:</strong><br/>
            מתקשרים/מגיעים לגמ"ח בזמני הפתיחה ומשריינים תאריך לארוע. רושמים אתכם ביומן השמחות לפי סדר הרישום.
            <br/><strong>הזמנת רשימת ציוד:</strong> משריינים עם המתנדבות רשימה של הציוד הנדרש ומסכמים מתי לקחת.
          </div>
        </div>

        <div style={stepStyle}>
          <div style={stepNumberStyle}>2</div>
          <div style={stepContentStyle}>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(15px, 3.5vw, 17px)' }}>איסוף הציוד:</strong><br/>
            מגיעים לקחת את הציוד שהוזמן מראש. 
            <strong style={{ color: '#e53e3e' }}> חשוב להיצמד לרשימה</strong> - זה מקל על המתנדבות לתת שירות לכולם.
          </div>
        </div>

        <div style={stepStyle}>
          <div style={stepNumberStyle}>3</div>
          <div style={stepContentStyle}>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(15px, 3.5vw, 17px)' }}>החזרת הציוד:</strong><br/>
            לאחר הארוע מחזירים את הציוד. המתנדבות יבדקו את ההחזרה וידריכו איך להחזיר הכל למקומו.
          </div>
        </div>

        <div style={highlightBoxStyle}>
          <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', margin: 0, fontWeight: '500', color: '#2d3748' }}>
            🏆 <strong>עדיפויות:</strong> ההשאלה היא לפי סדר הרישום - מי שנרשם ראשון לתאריך מסוים, משאיל ראשון!
          </p>
        </div>
      </div>

      {/* כללים חשובים */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          <span style={iconStyle}>📝</span>
          כללים חשובים לזכור
        </h2>

        <div style={isMobile ? mobileGridStyle : gridStyle}>
          <div style={cardStyle}>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>⏰ זמני פתיחה:</strong><br/>
            הגמ"ח פתוח רק בשעות המפורסמות. הטלפון זמין בשעות הפתיחה.<br/>
            <span style={{ color: '#4a5568', fontSize: 'clamp(12px, 3vw, 14px)', fontStyle: 'italic' }}>
              המתנדבות עסוקות בנתינת שירות - הן עונות כשהן פנויות, אנא האזרו בסבלנות.
            </span>
          </div>
          
          <div style={cardStyle}>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>📅 החזרה בזמן:</strong><br/>
            הקפידו להחזיר את הציוד ביום שנקבע מראש.
          </div>

          <div style={cardStyle}>
            <strong style={{ color: '#e53e3e', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>🚗 איסור חמור:</strong><br/>
            אין לשמור חפצים ברכב לפני ואחרי האירוע!
          </div>

          <div style={cardStyle}>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>📸 המלצה:</strong><br/>
            צלמו את החפצים שלוקחים כדי לזכור מה להחזיר.<br/>
            <span style={{ color: '#4a5568', fontSize: 'clamp(12px, 3vw, 14px)', fontStyle: 'italic' }}>
              החפצים יקרים ומאוד עדינים - אנא שימרו עליהם כשלכם.
            </span>
          </div>
        </div>
      </div>

      {/* תרומות ונזקים */}
      <div style={isMobile ? mobileGridStyle : gridStyle}>
        <div style={highlightBoxStyle}>
          <h3 style={{ color: '#2d3748', marginBottom: '8px', fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600' }}>
            <span style={iconStyle}>💝</span>
            תרומות
          </h3>
          <p style={{ fontSize: 'clamp(13px, 3vw, 15px)', margin: 0, color: '#4a5568' }}>
            הגמ"ח מאפשר השאלה ללא תשלום. בכדי שנוכל להרחיב ולהעשיר אותו 
            נשמח מאוד לתרומתכם.
          </p>
        </div>

        <div style={warningBoxStyle}>
          <h3 style={{ color: '#2d3748', marginBottom: '8px', fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600' }}>
            <span style={iconStyle}>🔧</span>
            במקרה של נזק
          </h3>
          <p style={{ fontSize: 'clamp(13px, 3vw, 15px)', margin: 0, color: '#4a5568' }}>
            אם נגרם נזק בטעות - הפנו את תשומת ליבנו ונאמר כמה לשלם 
            בכדי שנוכל לקנות חדש.
          </p>
        </div>
      </div>

      {/* הוראות ניקוי */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          <span style={iconStyle}>🧽</span>
          הוראות ניקוי והחזרה
        </h2>

        <div style={isMobile ? mobileGridStyle : gridStyle}>
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '20px 15px'
          }}>
            <div style={{ fontSize: 'clamp(28px, 8vw, 36px)', marginBottom: '8px' }}>🧺</div>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>מפות</strong><br/>
            <span style={{ color: '#4a5568', fontSize: 'clamp(12px, 3vw, 14px)' }}>
              נקיות, מקופלות ויבשות<br/>
              (מסיר כתמים לפני כביסה)<br/>
              <em>עדיף לייבש בשמש, אם לא - במייבש</em>
            </span>
          </div>

          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '20px 15px'
          }}>
            <div style={{ fontSize: 'clamp(28px, 8vw, 36px)', marginBottom: '8px' }}>🕯️</div>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>מעמדי נרות</strong><br/>
            <span style={{ color: '#4a5568', fontSize: 'clamp(12px, 3vw, 14px)' }}>נקיים משעווה</span>
          </div>

          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '20px 15px'
          }}>
            <div style={{ fontSize: 'clamp(28px, 8vw, 36px)', marginBottom: '8px' }}>☕</div>
            <strong style={{ color: '#2d3748', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>ערכת קפה ומגשים</strong><br/>
            <span style={{ color: '#4a5568', fontSize: 'clamp(12px, 3vw, 14px)' }}>חובה לשטוף ולנגב</span>
          </div>
        </div>
      </div>

      {/* סיום */}
      <div style={{
        ...highlightBoxStyle,
        marginTop: isMobile ? '30px' : '40px'
      }}>
        <h3 style={{ color: '#2d3748', fontSize: 'clamp(18px, 4vw, 20px)', marginBottom: '8px', fontWeight: '600' }}>
          מזל טוב, שפע ברכה ושמחה
        </h3>
        <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontStyle: 'italic', margin: 0, color: '#4a5568' }}>
          תודה על שיתוף הפעולה ועל שמירת הכללים
        </p>
      </div>
    </div>
  );
};

export default BorrowingGuidelines;