// src/components/Request.jsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

const Request = () => {
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(null);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const docRef = doc(db, 'settings', 'onlineOrdering');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIsOrderingEnabled(docSnap.data().enabled);
        }
      } catch (err) {
        console.error("שגיאה בבדיקת זמינות הזמנות:", err);
        setIsOrderingEnabled(false);
      }
    };

    fetchSetting();
  }, []);

  if (isOrderingEnabled === null) {
    return <p style={{ textAlign: 'center' }}>טוען...</p>;
  }

  if (!isOrderingEnabled) {
    return <p style={{ textAlign: 'center', color: 'red' }}>הזמנות דרך האתר אינן זמינות כרגע. נא לפנות ישירות למנהל.</p>;
  }

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', marginTop: '3rem' }}>
      <h2 style={{ textAlign: 'center' }}>בקשת השאלה</h2>
      <form>
        <label>שם פרטי:</label>
        <input type="text" style={inputStyle} required />

        <label>מוצר שברצונך להשאיל:</label>
        <input type="text" style={inputStyle} required />

        <label>תאריך מבוקש:</label>
        <input type="date" style={inputStyle} required />

        <button type="submit" style={buttonStyle}>שלח בקשה</button>
      </form>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '1rem',
  border: '1px solid #ccc',
  borderRadius: '4px'
};

const buttonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 15px',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '100%',
  fontSize: '16px'
};

export default Request;
