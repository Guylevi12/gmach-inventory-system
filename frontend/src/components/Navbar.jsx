import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';

const Navbar = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login');
    } catch (error) {
      alert('שגיאה בהתנתקות: ' + error.message);
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

  return (
    <div style={navbarStyle}>
      <Link to="/" style={linkStyle}>דף הבית</Link>
      <Link to="/products" style={linkStyle}>קטלוג מוצרים</Link>
      <Link to="/login" style={linkStyle}>התחברות</Link>
      <Link to="/register" style={linkStyle}>הרשמה</Link>

      {user && (
        <div style={greetingStyle}>
          שלום {user.email}
          <button style={logoutButtonStyle} onClick={handleLogout}>התנתק</button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
