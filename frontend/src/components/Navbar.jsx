// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase-config';
import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineOrdering, setOnlineOrdering] = useState(null);
  const [isMobile, setIsMobile] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // הגדרת listener לזמן אמת
    const docRef = doc(db, 'settings', 'onlineOrdering');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setOnlineOrdering(docSnap.data().enabled);
      }
    }, (err) => {
      console.error("שגיאה בקבלת עדכונים בזמן אמת:", err);
    });

    return () => unsubscribe(); // ניקוי ה-listener כשהקומפוננט נמחק
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setShowLogoutConfirm(false);
      navigate('/login');
    } catch (error) {
      alert('שגיאה בהתנתקות: ' + error.message);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'MainAdmin': return 'מנהל ראשי';
      case 'GmachAdmin': return 'מנהל גמח';
      default: return 'משתמש';
    }
  };

  if (isMobile === null) return null; // חכה לחישוב ראשוני בטוח

  const navbarStyle = {
    backgroundColor: '#f2f2f2',
    padding: '10px 0',
    direction: 'rtl',
    borderBottom: '1px solid #ccc',
    position: 'relative',
    zIndex: 1000
  };

  const linkStyle = {
    padding: '12px 16px',
    textDecoration: 'none',
    color: '#0056b3',
    fontWeight: '500',
    fontSize: '16px',
    display: 'block'
  };

  const greetingStyle = {
    position: 'absolute',
    top: '10px',
    left: isMobile ? '20px' : 'auto',
    right: isMobile ? 'auto' : '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 'bold',
    color: '#333',
  };

  const logoutButtonStyle = {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999
  };

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    right: menuOpen ? 0 : '-70%',
    height: '100%',
    width: '70%',
    backgroundColor: '#fff',
    boxShadow: '0 0 12px rgba(0,0,0,0.25)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'right 0.3s ease',
    zIndex: 1000
  };

  const desktopMenuStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    padding: '10px 0'
  };

  // סגנונות עבור דיאלוג אישור התנתקות
  const confirmOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000
  };

  const confirmDialogStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    textAlign: 'center',
    maxWidth: '300px',
    width: '90%'
  };

  const confirmButtonStyle = {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '0 5px',
    fontSize: '14px'
  };

  const cancelButtonStyle = {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '0 5px',
    fontSize: '14px'
  };

  return (
    <>
      <div style={navbarStyle}>
        {/* ☰ כפתור המבורגר – רק במובייל */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 1rem'
            }}
          >
            ☰
          </button>
        )}

        {/* תפריט בדסקטופ */}
        {!isMobile && (
          <div style={desktopMenuStyle}>
            <Link to="/" style={linkStyle}>דף הבית</Link>
            <Link to="/catalog" style={linkStyle}>קטלוג מוצרים</Link>
            {user?.role === 'User' && (
              <>
                {/* "ההזמנות שלי" תמיד זמין למשתמש רגיל */}
                <Link to="/my-orders" style={linkStyle}>ההזמנות שלי</Link>
                {/* "בקשת השאלה" רק אם הזמנות דרך האתר מופעלות */}
                {onlineOrdering && (
                  <Link to="/request" style={linkStyle}>בקשת השאלה</Link>
                )}
              </>
            )}
            {(user?.role === 'GmachAdmin' || user?.role === 'MainAdmin') && (
              <>
                <Link to="/new-loan" style={linkStyle}>הזמנה חדשה</Link>
                {/* רק אם הזמנות דרך האתר מופעלות */}
                {onlineOrdering && (
                  <Link to="/requests" style={linkStyle}>בקשות להזמנה</Link>
                )}
                <Link to="/Calendar" style={linkStyle}>השאלות פתוחות</Link>
                <Link to="/history" style={linkStyle}>היסטוריית השאלות</Link>
                <Link to="/manage-product" style={linkStyle}>ניהול מוצרים</Link>
              </>
            )}
            {user?.role === 'MainAdmin' && (
              <Link to="/manage-users" style={linkStyle}>ניהול משתמשים</Link>
            )}
            {!user && (
              <>
                <Link to="/login" style={linkStyle}>התחברות</Link>
                <Link to="/register" style={linkStyle}>הרשמה</Link>
              </>
            )}
          </div>
        )}

        {/* תפריט מובייל – Slide-in */}
        {menuOpen && isMobile && (
          <>
            <div style={overlayStyle} onClick={handleCloseMenu}></div>
            <div style={sidebarStyle}>
              <Link to="/" style={linkStyle} onClick={handleCloseMenu}>דף הבית</Link>
              <Link to="/catalog" style={linkStyle} onClick={handleCloseMenu}>קטלוג מוצרים</Link>

              {user?.role === 'User' && (
                <>
                  {/* "ההזמנות שלי" תמיד זמין למשתמש רגיל */}
                  <Link to="/my-orders" style={linkStyle} onClick={handleCloseMenu}>ההזמנות שלי</Link>
                  {/* "בקשת השאלה" רק אם הזמנות דרך האתר מופעלות */}
                  {onlineOrdering && (
                    <Link to="/request" style={linkStyle} onClick={handleCloseMenu}>בקשת השאלה</Link>
                  )}
                </>
              )}
              {(user?.role === 'GmachAdmin' || user?.role === 'MainAdmin') && (
                <>
                  <Link to="/new-loan" style={linkStyle} onClick={handleCloseMenu}>הזמנה חדשה</Link>
                  {/* רק אם הזמנות דרך האתר מופעלות */}
                  {onlineOrdering && (
                    <Link to="/requests" style={linkStyle} onClick={handleCloseMenu}>בקשות להזמנה</Link>
                  )}
                  <Link to="/Calendar" style={linkStyle} onClick={handleCloseMenu}>השאלות פתוחות</Link>
                  <Link to="/history" style={linkStyle} onClick={handleCloseMenu}>היסטוריית השאלות</Link>
                  <Link to="/manage-product" style={linkStyle} onClick={handleCloseMenu}>ניהול מוצרים</Link>
                </>
              )}
              {user?.role === 'MainAdmin' && (
                <Link to="/manage-users" style={linkStyle} onClick={handleCloseMenu}>ניהול משתמשים</Link>
              )}
              {!user && (
                <>
                  <Link to="/login" style={linkStyle} onClick={handleCloseMenu}>התחברות</Link>
                  <Link to="/register" style={linkStyle} onClick={handleCloseMenu}>הרשמה</Link>
                </>
              )}
            </div>
          </>
        )}

        {/* ברכה והתנתקות */}
        {user && (
          <div style={greetingStyle}>
            שלום {user.username} ({getRoleLabel(user.role)})
            <button style={logoutButtonStyle} onClick={handleLogoutClick}>התנתק</button>
          </div>
        )}
      </div>

      {/* דיאלוג אישור התנתקות */}
      {showLogoutConfirm && (
        <div style={confirmOverlayStyle}>
          <div style={confirmDialogStyle}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>אישור התנתקות</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>האם אתה בטוח שברצונך להתנתק?</p>
            <div>
              <button style={confirmButtonStyle} onClick={handleLogoutConfirm}>
                כן, התנתק
              </button>
              <button style={cancelButtonStyle} onClick={handleLogoutCancel}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;