// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase-config';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const Navbar = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [onlineOrdering, setOnlineOrdering] = useState(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login');
    } catch (error) {
      alert('שגיאה בהתנתקות: ' + error.message);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'MainAdmin': return 'מנהל ראשי';
      case 'GmachAdmin': return 'מנהל גמח';
      default: return 'משתמש';
    }
  };

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const docRef = doc(db, 'settings', 'onlineOrdering');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOnlineOrdering(docSnap.data().enabled);
        }
      } catch (err) {
        console.error("שגיאה בטעינת ההגדרה:", err);
      }
    };
    fetchSetting();
  }, []);

  const toggleOrdering = async () => {
    try {
      const newValue = !onlineOrdering;
      await updateDoc(doc(db, 'settings', 'onlineOrdering'), {
        enabled: newValue
      });
      setOnlineOrdering(newValue);
    } catch (err) {
      alert("שגיאה בעדכון ההגדרה: " + err.message);
    }
  };

  const navbarStyle = {
    backgroundColor: '#f2f2f2',
    padding: '10px 0',
    textAlign: 'center',
    direction: 'rtl',
    borderBottom: '1px solid #ccc',
    position: 'relative',
  };

  const linkStyle = {
    margin: '0 20px',
    textDecoration: 'none',
    color: 'blue',
    fontWeight: 'normal',
    fontSize: '16px',
  };

  const greetingStyle = {
    position: 'absolute',
    right: '20px',
    top: '10px',
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

  const toggleContainerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    marginRight: '20px',
    verticalAlign: 'middle',
    userSelect: 'none',
    direction: 'ltr',
    position: 'absolute',
    left: '20px',
    top: '10px',
    cursor: 'pointer'
  };

  const toggleSwitchStyle = {
    width: '42px',
    height: '24px',
    borderRadius: '50px',
    backgroundColor: onlineOrdering ? '#4caf50' : '#e74c3c',
    position: 'relative',
    transition: '0.3s',
  };

  const toggleCircleStyle = {
    position: 'absolute',
    top: '3px',
    left: onlineOrdering ? '22px' : '3px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transition: '0.3s',
  };

  return (
    <div style={navbarStyle}>
      <Link to="/" style={linkStyle}>דף הבית</Link>
      <Link to="/catalog" style={linkStyle}>קטלוג מוצרים</Link>

      {/* משתמש רגיל (רק אם ההגדרה פעילה) */}
      {user?.role === 'User' && onlineOrdering && (
        <>
          <Link to="/my-orders" style={linkStyle}>ההזמנות שלי</Link>
          <Link to="/request" style={linkStyle}>בקשת השאלה</Link>
        </>
      )}

      {/* מנהל גמח ומעלה */}
      {(user?.role === 'GmachAdmin' || user?.role === 'MainAdmin') && (
        <>
          <Link to="/new-loan" style={linkStyle}>הזמנה חדשה</Link>
          <Link to="/requests" style={linkStyle}>בקשות להזמנה</Link>
          <Link to="/Calendar" style={linkStyle}>השאלות פתוחות</Link>
          <Link to="/history" style={linkStyle}>היסטוריית השאלות</Link>
          <Link to="/manage-product" style={linkStyle}>ניהול מוצרים</Link>
        </>
      )}

      {/* MainAdmin בלבד */}
      {user?.role === 'MainAdmin' && (
        <Link to="/manage-users" style={linkStyle}>ניהול משתמשים</Link>
      )}

      {!user && (
        <>
          <Link to="/login" style={linkStyle}>התחברות</Link>
          <Link to="/register" style={linkStyle}>הרשמה</Link>
        </>
      )}

      {user && (
        <div style={greetingStyle}>
          שלום {user.username} ({getRoleLabel(user.role)})
          <button style={logoutButtonStyle} onClick={handleLogout}>התנתק</button>
        </div>
      )}

      {/* מתג - רק למנהל ראשי */}
      {user?.role === 'MainAdmin' && onlineOrdering !== null && (
        <div style={toggleContainerStyle} onClick={toggleOrdering}>
          <span>הזמנות דרך האתר:</span>
          <div style={toggleSwitchStyle}>
            <div style={toggleCircleStyle}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;