// src/components/BorrowingGuidelines.jsx
import React from 'react';

const BorrowingGuidelines = () => {
  const containerStyle = {
    maxWidth: '900px',
    margin: '20px auto',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    direction: 'rtl',
    lineHeight: '1.7'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '50px',
    padding: '30px 20px',
    backgroundColor: '#fafbfc',
    borderRadius: '6px',
    border: '3px solid #718096',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '12px'
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#4a5568',
    fontWeight: '400'
  };

  const sectionStyle = {
    marginBottom: '40px',
    padding: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '3px solid #a0aec0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
  };

  const mainProcessSectionStyle = {
    marginBottom: '40px',
    padding: '32px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '4px solid #2d3748',
    boxShadow: '0 6px 16px rgba(45, 55, 72, 0.15)'
  };

  const sectionTitleStyle = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const stepStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '24px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '2px solid #a0aec0',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)'
  };

  const stepNumberStyle = {
    backgroundColor: '#4299e1',
    color: 'white',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '16px',
    marginLeft: '20px',
    flexShrink: 0
  };

  const stepContentStyle = {
    flex: 1,
    fontSize: '16px',
    color: '#4a5568',
    lineHeight: '1.6'
  };

  const highlightBoxStyle = {
    backgroundColor: '#f7fafc',
    border: '3px solid #718096',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    textAlign: 'center',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)'
  };

  const warningBoxStyle = {
    backgroundColor: '#fffaf0',
    border: '3px solid #b7791f',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)'
  };

  const cardStyle = {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '2px solid #a0aec0',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)'
  };

  const iconStyle = {
    fontSize: '20px',
    marginLeft: '8px'
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
        borderRadius: '8px',
        padding: '32px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={sectionTitleStyle}>
          <span style={iconStyle}>🔄</span>
          התהליך המלא - איך זה עובד?
        </h2>

        <div style={stepStyle}>
          <div style={stepNumberStyle}>1</div>
          <div style={stepContentStyle}>
            <strong style={{ color: '#2d3748', fontSize: '17px' }}>הזמנה ורישום בלוח:</strong><br/>
            מתקשרים/מגיעים לגמ"ח בזמני הפתיחה ומשריינים תאריך לארוע. רושמים אתכם ביומן השמחות לפי סדר הרישום.
            <br/><strong>הזמנת רשימת ציוד:</strong> משריינים עם המתנדבות רשימה של הציוד הנדרש ומסכמים מתי לקחת.
          </div>
        </div>

        <div style={stepStyle}>
          <div style={stepNumberStyle}>2</div>
          <div style={stepContentStyle}>
            <strong style={{ color: '#2d3748', fontSize: '17px' }}>איסוף הציוד:</strong><br/>
            מגיעים לקחת את הציוד שהוזמן מראש. 
            <strong style={{ color: '#e53e3e' }}> חשוב להיצמד לרשימה</strong> - זה מקל על המתנדבות לתת שירות לכולם.
          </div>
        </div>

        <div style={stepStyle}>
          <div style={stepNumberStyle}>3</div>
          <div style={stepContentStyle}>
            <strong style={{ color: '#2d3748', fontSize: '17px' }}>החזרת הציוד:</strong><br/>
            לאחר הארוע מחזירים את הציוד. המתנדבות יבדקו את ההחזרה וידריכו איך להחזיר הכל למקומו.
          </div>
        </div>

        <div style={{
          ...highlightBoxStyle,
          backgroundColor: '#edf2f7',
          border: '3px solid #718096'
        }}>
          <p style={{ fontSize: '16px', margin: 0, fontWeight: '500', color: '#2d3748' }}>
            🏆 <strong>עדיפויות:</strong> ההשאלה היא לפי סדר הרישום - מי שנרשם ראשון לתאריך מסוים, משאיל ראשון!
          </p>
        </div>
      </div>

      {/* כללים חשובים - מקוצר */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          <span style={iconStyle}>📝</span>
          כללים חשובים לזכור
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          <div style={cardStyle}>
            <strong style={{ color: '#2d3748' }}>⏰ זמני פתיחה:</strong><br/>
            הגמ"ח פתוח רק בשעות המפורסמות. הטלפון זמין בשעות הפתיחה.<br/>
            <span style={{ color: '#4a5568', fontSize: '14px', fontStyle: 'italic' }}>
              המתנדבות עסוקות בנתינת שירות - הן עונות כשהן פנויות, אנא האזרו בסבלנות.
            </span>
          </div>
          
          <div style={cardStyle}>
            <strong style={{ color: '#2d3748' }}>📅 החזרה בזמן:</strong><br/>
            הקפידו להחזיר את הציוד ביום שנקבע מראש.
          </div>

          <div style={cardStyle}>
            <strong style={{ color: '#e53e3e' }}>🚗 איסור חמור:</strong><br/>
            אין לשמור חפצים ברכב לפני ואחרי האירוע!
          </div>

          <div style={cardStyle}>
            <strong style={{ color: '#2d3748' }}>📸 המלצה:</strong><br/>
            צלמו את החפצים שלוקחים כדי לזכור מה להחזיר.<br/>
            <span style={{ color: '#4a5568', fontSize: '14px', fontStyle: 'italic' }}>
              החפצים יקרים ומאוד עדינים - אנא שימרו עליהם כשלכם.
            </span>
          </div>
        </div>
      </div>

      {/* תרומות ונזקים - משולב */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div style={{
          ...highlightBoxStyle,
          backgroundColor: '#f7fafc',
          border: '3px solid #718096'
        }}>
          <h3 style={{ color: '#2d3748', marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
            <span style={iconStyle}>💝</span>
            תרומות
          </h3>
          <p style={{ fontSize: '15px', margin: 0, color: '#4a5568' }}>
            הגמ"ח מאפשר השאלה ללא תשלום. בכדי שנוכל להרחיב ולהעשיר אותו 
            נשמח מאוד לתרומתכם.
          </p>
        </div>

        <div style={warningBoxStyle}>
          <h3 style={{ color: '#2d3748', marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
            <span style={iconStyle}>🔧</span>
            במקרה של נזק
          </h3>
          <p style={{ fontSize: '15px', margin: 0, color: '#4a5568' }}>
            אם נגרם נזק בטעות - הפנו את תשומת ליבנו ונאמר כמה לשלם 
            בכדי שנוכל לקנות חדש.
          </p>
        </div>
      </div>

      {/* הוראות ניקוי - מקוצר */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>
          <span style={iconStyle}>🧽</span>
          הוראות ניקוי והחזרה
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧺</div>
            <strong style={{ color: '#2d3748', fontSize: '16px' }}>מפות</strong><br/>
            <span style={{ color: '#4a5568', fontSize: '14px' }}>
              נקיות, מקופלות ויבשות<br/>
              (מסיר כתמים לפני כביסה)<br/>
              <em>עדיף לייבש בשמש, אם לא - במייבש</em>
            </span>
          </div>

          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🕯️</div>
            <strong style={{ color: '#2d3748', fontSize: '16px' }}>מעמדי נרות</strong><br/>
            <span style={{ color: '#4a5568', fontSize: '14px' }}>נקיים משעווה</span>
          </div>

          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '24px'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>☕</div>
            <strong style={{ color: '#2d3748', fontSize: '16px' }}>ערכת קפה ומגשים</strong><br/>
            <span style={{ color: '#4a5568', fontSize: '14px' }}>חובה לשטוף ולנגב</span>
          </div>
        </div>
      </div>

      {/* סיום */}
      <div style={{
        ...highlightBoxStyle,
        backgroundColor: '#f7fafc',
        border: '3px solid #718096',
        marginTop: '40px'
      }}>
        <h3 style={{ color: '#2d3748', fontSize: '20px', marginBottom: '12px', fontWeight: '600' }}>
          מזל טוב, שפע ברכה ושמחה
        </h3>
        <p style={{ fontSize: '16px', fontStyle: 'italic', margin: 0, color: '#4a5568' }}>
          תודה על שיתוף הפעולה ועל שמירת הכללים
        </p>
      </div>
    </div>
  );
};

export default BorrowingGuidelines;