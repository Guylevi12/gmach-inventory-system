// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../UserContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase-config';
import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Bell } from 'lucide-react';

const Navbar = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
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

    return () => unsubscribe();
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

  // פונקציה לבדיקה אם הקישור פעיל
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // פונקציה ליצירת סגנון קישור עם הדגשה
  const getLinkStyle = (path) => ({
    ...linkStyle,
    backgroundColor: isActiveLink(path) ? '#0056b3' : 'transparent',
    color: isActiveLink(path) ? 'white' : '#0056b3',
    borderRadius: isActiveLink(path) ? '6px' : '0',
    fontWeight: isActiveLink(path) ? '600' : '500',
    transition: 'all 0.3s ease'
  });

  // פונקציה לבדיקה אם להציג כפתור תרומות
  const shouldShowDonations = () => {
    return !user || user.role === 'User';
  };

  // פונקציה לבדיקה אם להציג דף אודות
  const shouldShowAbout = () => {
    // הצג "אודות" רק למשתמשים רגילים או לא מחוברים
    return !user || user.role === 'User';
  };

  if (isMobile === null) return null;

  const navbarStyle = {
    backgroundColor: 'white', // תמיד לבן אטום
    // הסר את backdropFilter גם מכאן
    padding: '10px 0',
    direction: 'rtl',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
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
    backgroundColor: '#ffffff', // לבן מלא ללא שקיפות
    background: '#ffffff', // גם את זה
    backgroundImage: 'none', // בטל תמונות רקע
    // הסר את backdropFilter לגמרי - זה הגורם לשקיפות!
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
      {/* CSS חזק לתיקון התפריט המובייל */}
      <style>
        {`
          .mobile-sidebar-force-white {
            background: white !important;
            background-color: white !important;
            background-image: none !important;
            backdrop-filter: none !important;
          }
        `}
      </style>
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
            <Link to="/" style={getLinkStyle('/')}>דף הבית</Link>
            {/* הוספת "אודות" רק למשתמשים רגילים/לא מחוברים */}
            {shouldShowAbout() && (
              <Link to="/about" style={getLinkStyle('/about')}>אודות</Link>
            )}
            <Link to="/catalog" style={getLinkStyle('/catalog')}>קטלוג מוצרים</Link>
            {/* נוהל השאלה רק אם לא מחובר */}
            {!user && (
              <Link to="/borrowing-guidelines" style={getLinkStyle('/borrowing-guidelines')}>נוהל השאלה</Link>
            )}
            {user?.role === 'User' && (
              <>
                {/* "ההזמנות שלי" תמיד זמין למשתמש רגיל */}
                <Link to="/my-orders" style={getLinkStyle('/my-orders')}>ההזמנות שלי</Link>
                {/* "בקשת השאלה" רק אם הזמנות דרך האתר מופעלות */}
                {onlineOrdering && (
                  <Link to="/request" style={getLinkStyle('/request')}>בקשת השאלה</Link>
                )}
                {/* נוהל השאלה למשתמש רגיל - אחד לפני אחרון */}
                <Link to="/borrowing-guidelines" style={getLinkStyle('/borrowing-guidelines')}>נוהל השאלה</Link>
              </>
            )}
            {(user?.role === 'GmachAdmin' || user?.role === 'MainAdmin') && (
              <>
                <Link to="/new-loan" style={getLinkStyle('/new-loan')}>הזמנה חדשה</Link>
                {/* רק אם הזמנות דרך האתר מופעלות */}
                {onlineOrdering && (
                  <Link to="/requests" style={getLinkStyle('/requests')}>בקשות להזמנה</Link>
                )}
                <Link to="/Calendar" style={getLinkStyle('/Calendar')}>השאלות פתוחות</Link>
                <Link to="/history" style={getLinkStyle('/history')}>היסטוריית השאלות</Link>
              </>
            )}
            {/* ניהול מוצרים רק למנהל ראשי */}
            {user?.role === 'MainAdmin' && (
              <>
                <Link to="/manage-product" style={getLinkStyle('/manage-product')}>ניהול מוצרים</Link>
                <Link to="/manage-users" style={getLinkStyle('/manage-users')}>ניהול משתמשים</Link>
                <Link to="/alerts" style={getLinkStyle('/alerts')}>ניהול התראות</Link>
              </>
            )}
            {/* נוהל השאלה למנהלים - בסוף */}
            {(user?.role === 'GmachAdmin' || user?.role === 'MainAdmin') && (
              <Link to="/borrowing-guidelines" style={getLinkStyle('/borrowing-guidelines')}>נוהל השאלה</Link>
            )}
            {/* הכפתור "לתרומות" רק למשתמש רגיל או לא מחובר */}
            {shouldShowDonations() && (
              <Link to="/donations" style={getLinkStyle('/donations')}>לתרומות</Link>
            )}
            {!user && (
              <>
                <Link to="/login" style={{
                  ...getLinkStyle('/login'),
                  marginRight: '20px',
                  backgroundColor: '#2b6cb0',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}>התחברות</Link>
                <Link to="/register" style={{
                  ...getLinkStyle('/register'),
                  backgroundColor: 'transparent',
                  color: '#2b6cb0',
                  border: '2px solid #2b6cb0',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}>הרשמה</Link>
              </>
            )}
            <Link to="/gallery" style={{ ...getLinkStyle('/gallery'), order: 999 }}>גלריה</Link>
          </div>
        )}

        {/* תפריט מובייל – Slide-in */}
        {menuOpen && isMobile && (
          <>
            <div style={overlayStyle} onClick={handleCloseMenu}></div>
            <div style={sidebarStyle} className="mobile-sidebar-force-white">
              <Link to="/" style={getLinkStyle('/')} onClick={handleCloseMenu}>דף הבית</Link>
              {/* הוספת "אודות" רק למשתמשים רגילים/לא מחוברים */}
              {shouldShowAbout() && (
                <Link to="/about" style={getLinkStyle('/about')} onClick={handleCloseMenu}>אודות</Link>
              )}
              <Link to="/catalog" style={getLinkStyle('/catalog')} onClick={handleCloseMenu}>קטלוג מוצרים</Link>
              {/* נוהל השאלה רק אם לא מחובר */}
              {!user && (
                <Link to="/borrowing-guidelines" style={getLinkStyle('/borrowing-guidelines')} onClick={handleCloseMenu}>נוהל השאלה</Link>
              )}

              {user?.role === 'User' && (
                <>
                  {/* "ההזמנות שלי" תמיד זמין למשתמש רגיל */}
                  <Link to="/my-orders" style={getLinkStyle('/my-orders')} onClick={handleCloseMenu}>ההזמנות שלי</Link>
                  {/* "בקשת השאלה" רק אם הזמנות דרך האתר מופעלות */}
                  {onlineOrdering && (
                    <Link to="/request" style={getLinkStyle('/request')} onClick={handleCloseMenu}>בקשת השאלה</Link>
                  )}
                  {/* נוהל השאלה למשתמש רגיל - אחד לפני אחרון */}
                  <Link to="/borrowing-guidelines" style={getLinkStyle('/borrowing-guidelines')} onClick={handleCloseMenu}>נוהל השאלה</Link>
                </>
              )}
              {(user?.role === 'GmachAdmin' || user?.role === 'MainAdmin') && (
                <>
                  <Link to="/new-loan" style={getLinkStyle('/new-loan')} onClick={handleCloseMenu}>הזמנה חדשה</Link>
                  {/* רק אם הזמנות דרך האתר מופעלות */}
                  {onlineOrdering && (
                    <Link to="/requests" style={getLinkStyle('/requests')} onClick={handleCloseMenu}>בקשות להזמנה</Link>
                  )}
                  <Link to="/Calendar" style={getLinkStyle('/Calendar')} onClick={handleCloseMenu}>השאלות פתוחות</Link>
                  <Link to="/history" style={getLinkStyle('/history')} onClick={handleCloseMenu}>היסטוריית השאלות</Link>
                </>
              )}
              {/* ניהול מוצרים רק למנהל ראשי */}
              {user?.role === 'MainAdmin' && (
                <>
                  <Link to="/manage-product" style={getLinkStyle('/manage-product')} onClick={handleCloseMenu}>ניהול מוצרים</Link>
                  <Link to="/manage-users" style={getLinkStyle('/manage-users')} onClick={handleCloseMenu}>ניהול משתמשים</Link>
                  <Link to="/alerts" style={getLinkStyle('/alerts')} onClick={handleCloseMenu}>ניהול התראות</Link>
                </>
              )}
              {/* נוהל השאלה למנהלים - בסוף */}
              {(user?.role === 'GmachAdmin' || user?.role === 'MainAdmin') && (
                <Link to="/borrowing-guidelines" style={getLinkStyle('/borrowing-guidelines')} onClick={handleCloseMenu}>נוהל השאלה</Link>
              )}
              {/* הכפתור "לתרומות" רק למשתמש רגיל או לא מחובר */}
              {shouldShowDonations() && (
                <Link to="/donations" style={getLinkStyle('/donations')} onClick={handleCloseMenu}>לתרומות</Link>
              )}
              {!user && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                  <Link to="/login" style={{
                    ...getLinkStyle('/login'),
                    backgroundColor: '#2b6cb0',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }} onClick={handleCloseMenu}>התחברות</Link>
                  <Link to="/register" style={{
                    ...getLinkStyle('/register'),
                    backgroundColor: 'transparent',
                    color: '#2b6cb0',
                    border: '2px solid #2b6cb0',
                    borderRadius: '6px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }} onClick={handleCloseMenu}>הרשמה</Link>
                </div>
              )}
              <Link to="/gallery" style={{ ...getLinkStyle('/gallery'), order: 999 }} onClick={handleCloseMenu}>גלריה</Link>
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