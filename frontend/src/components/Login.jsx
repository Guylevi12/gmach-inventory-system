import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase-config';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useUser } from '../UserContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handlePasswordReset = async () => {
    if (!identifier || !identifier.includes('@')) {
      setErrorMsg('יש להזין אימייל תקין לשחזור סיסמה');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, identifier);
      setErrorMsg('קישור לאיפוס סיסמה נשלח לאימייל');
    } catch (error) {
      setErrorMsg('שגיאה בשליחת קישור לאיפוס סיסמה: ' + error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let emailToUse = identifier;

    // אם המשתמש כתב שם משתמש במקום אימייל
    if (!identifier.includes('@')) {
      try {
        const q = query(collection(db, 'users'), where('username', '==', identifier));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          emailToUse = snapshot.docs[0].data().email;
        } else {
          setErrorMsg('שם משתמש לא נמצא');
          return;
        }
      } catch (error) {
        setErrorMsg('שגיאה באחזור אימייל לפי שם משתמש');
        return;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setErrorMsg('נא לאמת את כתובת האימייל לפני ההתחברות');
        return;
      }

      // שליפת username ו־role מ־Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUser({
          uid: user.uid,
          email: user.email,
          username: userData.username,
          role: userData.role
        });
        navigate('/');
      } else {
        setErrorMsg('לא נמצאו נתוני משתמש במסד הנתונים');
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setErrorMsg('סיסמה שגויה');
          break;
        case 'auth/user-not-found':
          setErrorMsg('המשתמש לא נמצא');
          break;
        default:
          setErrorMsg('שגיאה: ' + error.message);
      }
    }
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80vh',
      backgroundColor: '#f2f2f2',
    },
    form: {
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      width: '300px',
    },
    title: {
      textAlign: 'center',
      marginBottom: '1.5rem',
      color: '#333',
    },
    input: {
      marginBottom: '1rem',
      padding: '0.8rem',
      fontSize: '1rem',
      borderRadius: '6px',
      border: '1px solid #ccc',
    },
    button: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '0.8rem',
      fontSize: '1rem',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    error: {
      color: 'red',
      marginBottom: '1rem',
      fontSize: '0.9rem',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.title}>התחברות</h2>
        <input
          type="text"
          placeholder="שם משתמש או אימייל"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        {errorMsg && <div style={styles.error}>{errorMsg}</div>}
        <button type="submit" style={styles.button}>התחבר</button>

        <button
          type="button"
          onClick={handlePasswordReset}
          style={{
            marginTop: '0.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}>
          שכחת סיסמה?
        </button>

      </form>
    </div>
  );
};

export default Login;
