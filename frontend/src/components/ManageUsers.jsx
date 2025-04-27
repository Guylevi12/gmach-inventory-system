import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useUser } from '../UserContext';

const ManageUsers = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);

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
    }
  };

  if (!user || user.role !== 'MainAdmin') {
    return <p style={{ padding: '2rem', textAlign: 'center' }}>אין לך גישה לעמוד זה</p>;
  }

  return (
    <div style={styles.container}>
      <h2>ניהול משתמשים</h2>
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
          {users.map(u => (
            <tr key={u.id}>
              <td style={styles.td}>{u.username}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>{u.role}</td>
              <td style={styles.td}>
                {u.role !== 'MainAdmin' && (
                  u.role === 'User' ? (
                    <button
                      style={{ ...styles.button, ...styles.promoteBtn }}
                      onClick={() => updateRole(u.id, 'GmachAdmin')}
                    >
                      שדרג למנהל גמח
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsers;
