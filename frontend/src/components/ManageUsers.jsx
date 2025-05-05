import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useUser } from '../UserContext';

const ManageUsers = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  const updateRole = async (userId, newRole) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole });
    setUsers(users.map(u =>
      u.id === userId ? { ...u, role: newRole } : u
    ));
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
    }
  };

  if (!user || user.role !== 'MainAdmin') {
    return <p style={{ padding: '2rem', textAlign: 'center' }}>אין לך גישה לעמוד זה</p>;
  }

  // מסנן את המשתמשים לפי מה שמכניסים בתיבת חיפוש
  const filteredUsers = users.filter(u =>
    u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <h2>ניהול משתמשים</h2>

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
