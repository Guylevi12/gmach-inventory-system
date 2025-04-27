import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/firebase/firebase-config';
import { doc, setDoc } from 'firebase/firestore';

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isPasswordValid = (pwd) => {
    return pwd.length >= 8 && /[a-zA-Z]/.test(pwd);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setErrorMsg('הסיסמה חייבת להכיל לפחות 8 תווים ולפחות אות אחת באנגלית A-Z / a-z');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // שמירת פרטי המשתמש עם שם משתמש ו-role ברירת מחדל
      await setDoc(doc(db, 'users', user.uid), {
        email,
        username,
        role: 'User'
      });

      await sendEmailVerification(user);
      alert('נרשמת בהצלחה! נשלח אליך מייל לאימות.');
    } catch (error) {
      setErrorMsg(error.message);
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
      <form onSubmit={handleRegister} style={styles.form}>
        <h2 style={styles.title}>הרשמה</h2>
        <input
          type="text"
          placeholder="שם משתמש"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        <button type="submit" style={styles.button}>הרשם</button>
      </form>
    </div>
  );
};

export default Register;
