import React, { useState } from 'react';
import { Heart, Smartphone, Banknote, Copy, Check } from 'lucide-react';

const DonationsPage = () => {
  const [copiedText, setCopiedText] = useState('');
  const bitNumber = "054-4773388";

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleBitClick = () => {
    const cleanNumber = bitNumber.replace(/-/g, '');
    copyToClipboard(cleanNumber, 'bit-app');
    
    setTimeout(() => {
      const userConfirmed = confirm('המספר הועתק! 📋\n\n📱 הנחיות לתרומה בביט:\n1. פתח את אפליקציית ביט\n2. לחץ על "העבר כסף"\n3. בחר "למספר טלפון"\n4. הדבק את המספר (או הקלד: ' + bitNumber + ')\n5. הכנס סכום לתרומה\n6. אשר את התרומה 💚\n\nלחץ "אישור" כדי לפתוח את ביט עכשיו');
      
      if (userConfirmed) {
        try {
          window.location.href = 'bit://';
        } catch (error) {
          window.open('https://bit.co.il/', '_blank');
        }
      }
    }, 500);
  };

  const handlePayBoxClick = () => {
    const cleanNumber = bitNumber.replace(/-/g, '');
    copyToClipboard(cleanNumber, 'paybox-app');
    
    setTimeout(() => {
      alert('המספר הועתק! 📋\n\n📱 הנחיות לתרומה בפייבוקס:\n1. פתח את אפליקציית פייבוקס\n2. לחץ על "שלח כסף"\n3. בחר "למספר טלפון"\n4. הדבק את המספר (או הקלד: ' + bitNumber + ')\n5. הכנס סכום לתרומה\n6. אשר את התרומה 💜\n\nהמספר כבר הועתק ומוכן להדבקה!');
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      padding: '2rem 1rem',
      direction: 'rtl'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #20b2aa 0%, #48d1cc 100%)',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            fontSize: '4rem',
          }}>
          
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 1rem 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            תרומות לגמ"ח
          </h1>
          <p style={{
            fontSize: '1.2rem',
            opacity: '0.95',
            margin: 0,
            fontWeight: '700'
          }}>
            עזרו לנו להמשיך לעזור לכם
          </p>
        </div>

        {/* Main Content */}
        <div style={{ padding: '3rem 2rem' }}>
          
          {/* Introduction */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '2rem',
            borderRadius: '15px',
            marginBottom: '3rem',
            border: '2px solid #e9ecef'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#2c3e50',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              🏠 הגמ"ח נשען על תרומות בלבד
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: '#495057',
              textAlign: 'center',
              margin: 0
            }}>
              עם החזרת הציוד נשמח לתרומתכם על מנת שנוכל להמשיך להחזיק ולחדש את הציוד בגמ"ח לטובת כולנו.
            </p>
          </div>

          {/* Donation Methods */}
          <h3 style={{
            fontSize: '2rem',
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#2c3e50'
          }}>
            🎯 אפשרויות לתרומה
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            
            {/* Bit/PayBox Payment */}
            <div style={{
              backgroundColor: '#fff',
              border: '3px solid #1d4ed8',
              borderRadius: '15px',
              padding: '2rem',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(29, 78, 216, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(29, 78, 216, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(29, 78, 216, 0.2)';
            }}>
              <Smartphone size={48} color="#1d4ed8" style={{ marginBottom: '1rem' }} />
              <h4 style={{
                fontSize: '1.3rem',
                color: '#1d4ed8',
                marginBottom: '1rem',
                fontWeight: '700'
              }}>
                ביט / פייבוקס
              </h4>
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                marginBottom: '1rem'
              }}>
                <p style={{
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  color: '#1d4ed8',
                  margin: '0 0 0.5rem 0'
                }}>
                  {bitNumber}
                </p>
                <button
                  onClick={() => copyToClipboard(bitNumber, 'bit')}
                  style={{
                    background: '#1d4ed8',
                    border: '2px solid #1d4ed8',
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    margin: '0 auto 10px auto',
                    fontWeight: '600'
                  }}
                >
                  {copiedText === 'bit' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedText === 'bit' ? 'הועתק!' : 'העתק מספר'}
                </button>
              </div>
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center'
              }}>
                <button style={{
                  background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '25px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                onClick={handleBitClick}>
                  🤍 ביט
                </button>
                <button style={{
                  background: 'linear-gradient(135deg, #0a84ff 0%, #005cbf 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '25px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                onClick={handlePayBoxClick}>
                  🤍 פייבוקס
                </button>
              </div>
            </div>

            {/* Cash Donation */}
            <div style={{
              backgroundColor: '#fff',
              border: '2px solid #27ae60',
              borderRadius: '15px',
              padding: '2rem',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(39, 174, 96, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(39, 174, 96, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(39, 174, 96, 0.1)';
            }}>
              <Banknote size={48} color="#27ae60" style={{ marginBottom: '1rem' }} />
              <h4 style={{
                fontSize: '1.3rem',
                color: '#27ae60',
                marginBottom: '1rem',
                fontWeight: '600'
              }}>
                תרומה במזומן
              </h4>
              <p style={{
                color: '#7f8c8d',
                marginBottom: '1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                lineHeight: '1.4'
              }}>
                למתנדבות הגמ"ח בעת החזרת הציוד
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  💰 בעת החזרה
                </div>
              </div>
            </div>
          </div>

          {/* Thank You Section */}
          <div style={{
            background: 'linear-gradient(135deg, #20b2aa 0%, #48d1cc 100%)',
            padding: '2.5rem',
            borderRadius: '20px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 10px 30px rgba(32, 178, 170, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
             תודה מראש
            </h3>
            <p style={{
              fontSize: '1.2rem',
              marginBottom: '1rem',
              opacity: '0.95'
            }}>
              התרומה שלכם עוזרת לנו להמשיך לספק שירות איכותי לקהילה
            </p>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              🎉 נתראה בשמחות!
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @media (max-width: 768px) {
          h1 {
            font-size: 2rem !important;
          }
          
          h3 {
            font-size: 1.5rem !important;
          }
          
          .donation-cards {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DonationsPage;