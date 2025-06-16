import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../UserContext';

const ManageUsers = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineOrdering, setOnlineOrdering] = useState(null); // NEW

  // שליפת משתמשים
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  // שליפת ההגדרה להזמנות דרך האתר
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

  // שינוי הרשאות משתמש
  const updateRole = async (userId, newRole) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole });
    setUsers(users.map(u =>
      u.id === userId ? { ...u, role: newRole } : u
    ));
  };

  // שינוי מצב הזמנות
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

  const styles = {
    container: {
      padding: '2rem',
      direction: 'rtl',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '1rem'
    },
    th: {
      border: '1px solid #ccc',
      padding: '10px',
      backgroundColor: '#f2f2f2',
    },
    td: {
      border: '1px solid #ccc',
      padding: '10px',
      textAlign: 'center'
    },
    button: {
      padding: '6px 12px',
      borderRadius: '5px',
      border: 'none',
      cursor: 'pointer',
    },
    promoteBtn: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    demoteBtn: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
    searchBox: {
      padding: '10px',
      width: '19.4%',
      borderRadius: '6px',
      border: '1px solid #ccc',
      fontSize: '1rem',
      marginBottom: '1rem'
    },
    toggleBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '1.5rem',
      backgroundColor: '#f9f9f9',
      padding: '10px 16px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      maxWidth: 'fit-content'
    },
    toggleSwitch: {
      width: '42px',
      height: '24px',
      borderRadius: '50px',
      backgroundColor: onlineOrdering ? '#4caf50' : '#e74c3c',
      position: 'relative',
      cursor: 'pointer',
      transition: '0.3s'
    },
    toggleCircle: {
      position: 'absolute',
      top: '3px',
      left: onlineOrdering ? '22px' : '3px',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: 'white',
      transition: '0.3s'
    }
  };

  if (!user || user.role !== 'MainAdmin') {
    return <p style={{ padding: '2rem', textAlign: 'center' }}>אין לך גישה לעמוד זה</p>;
  }

  const filteredUsers = users.filter(u =>
    u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <h2>ניהול משתמשים</h2>

      {/* מתג הזמנות דרך האתר */}
      {onlineOrdering !== null && (
        <div style={styles.toggleBox}>
          <span style={{ fontWeight: 'bold' }}>הזמנות דרך האתר:</span>
          <div style={styles.toggleSwitch} onClick={toggleOrdering}>
            <div style={styles.toggleCircle}></div>
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="חיפוש משתמש..."
        value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
        style={styles.searchBox}
        dir="rtl"
      />

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>שם משתמש</th>
            <th style={styles.th}>אימייל</th>
            <th style={styles.th}>הרשאה</th>
            <th style={styles.th}>פעולה</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>לא נמצאו משתמשים תואמים</td>
            </tr>
          ) : (
            filteredUsers.map(u => (
              <tr key={u.id}>
                <td style={styles.td}>{u.username}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>
                  {u.role === 'User' ? 'משתמש רגיל' :
                    u.role === 'GmachAdmin' ? 'מנהל גמ"ח' :
                      u.role === 'MainAdmin' ? 'מנהל ראשי' :
                        u.role}
                </td>
                <td style={styles.td}>
                  {u.role !== 'MainAdmin' && (
                    u.role === 'User' ? (
                      <button
                        style={{ ...styles.button, ...styles.promoteBtn }}
                        onClick={() => updateRole(u.id, 'GmachAdmin')}
                      >
                        שדרג למנהל גמ"ח
                      </button>
                    ) : (
                      <button
                        style={{ ...styles.button, ...styles.demoteBtn }}
                        onClick={() => updateRole(u.id, 'User')}
                      >
                        החזר למשתמש רגיל
                      </button>
                    )
                  )}
                  {u.role === 'MainAdmin' && '---'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsers;
