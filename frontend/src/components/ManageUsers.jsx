import React, { useEffect, useState } from 'react';
import { db } from '@/firebase/firebase-config';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useUser } from '../UserContext';

const ManageUsers = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineOrdering, setOnlineOrdering] = useState(null);

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

  // עיצוב מותאם למובייל
  const styles = {
    container: {
      padding: '1rem',
      direction: 'rtl',
      maxWidth: '100%',
      overflow: 'hidden'
    },
    header: {
      fontSize: '1.8rem',
      marginBottom: '2rem',
      textAlign: 'center',
      color: '#333',
      fontWeight: '600'
    },
    toggleBox: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px',
      marginBottom: '2rem',
      backgroundColor: '#f8f9fa',
      padding: '16px 24px',
      borderRadius: '15px',
      border: '2px solid #e9ecef',
      maxWidth: '400px',
      margin: '0 auto 2rem auto',
      boxSizing: 'border-box',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    toggleSwitch: {
      width: '50px',
      height: '28px',
      borderRadius: '50px',
      backgroundColor: onlineOrdering ? '#4caf50' : '#e74c3c',
      position: 'relative',
      cursor: 'pointer',
      transition: '0.3s',
      flexShrink: 0
    },
    toggleCircle: {
      position: 'absolute',
      top: '3px',
      left: onlineOrdering ? '25px' : '3px',
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      backgroundColor: 'white',
      transition: '0.3s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    searchBox: {
      padding: '12px 16px',
      width: '100%',
      maxWidth: '500px',
      borderRadius: '10px',
      border: '2px solid #ddd',
      fontSize: '16px', // מונע זום במובייל
      marginBottom: '2rem',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      display: 'block',
      margin: '0 auto 2rem auto'
    },
    tableContainer: {
      overflowX: 'auto',
      marginTop: '1rem',
      borderRadius: '12px',
      border: '1px solid #ddd',
      maxWidth: '1200px',
      margin: '0 auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '600px', // רוחב מינימלי לטבלה
      backgroundColor: 'white'
    },
    th: {
      border: '1px solid #ddd',
      padding: '12px 8px',
      backgroundColor: '#f8f9fa',
      fontWeight: '600',
      fontSize: '0.9rem',
      textAlign: 'center',
      whiteSpace: 'nowrap'
    },
    td: {
      border: '1px solid #ddd',
      padding: '12px 8px',
      textAlign: 'center',
      fontSize: '0.85rem',
      verticalAlign: 'middle'
    },
    button: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      minWidth: '100px',
      transition: 'opacity 0.2s ease'
    },
    promoteBtn: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    demoteBtn: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
    // סטיילים מיוחדים למובייל
    mobileCard: {
      display: 'none' // יוצג רק במובייל
    },
    '@media (max-width: 768px)': {
      table: {
        display: 'none' // מסתיר טבלה במובייל
      },
      mobileCard: {
        display: 'block'
      }
    }
  };

  if (!user || user.role !== 'MainAdmin') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', direction: 'rtl' }}>
        <p>אין לך גישה לעמוד זה</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // קומפוננט כרטיס למובייל
  const MobileUserCard = ({ user: u }) => (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '0.5rem'
      }}>
        <h4 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>
          {u.username}
        </h4>
        <span style={{
          backgroundColor: u.role === 'MainAdmin' ? '#6f42c1' : 
                          u.role === 'GmachAdmin' ? '#17a2b8' : '#6c757d',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: '500'
        }}>
          {u.role === 'User' ? 'משתמש רגיל' :
           u.role === 'GmachAdmin' ? 'מנהל גמ"ח' :
           u.role === 'MainAdmin' ? 'מנהל ראשי' : u.role}
        </span>
      </div>
      
      <p style={{ 
        margin: '0.5rem 0', 
        color: '#666', 
        fontSize: '0.9rem',
        wordBreak: 'break-all'
      }}>
        📧 {u.email}
      </p>
      
      {u.role !== 'MainAdmin' && (
        <div style={{ marginTop: '1rem' }}>
          {u.role === 'User' ? (
            <button
              style={{
                ...styles.button,
                ...styles.promoteBtn,
                width: '100%'
              }}
              onClick={() => updateRole(u.id, 'GmachAdmin')}
            >
              שדרג למנהל גמ"ח
            </button>
          ) : (
            <button
              style={{
                ...styles.button,
                ...styles.demoteBtn,
                width: '100%'
              }}
              onClick={() => updateRole(u.id, 'User')}
            >
              החזר למשתמש רגיל
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* CSS מותאם למובייל */}
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-table {
              display: none !important;
            }
            .mobile-cards {
              display: block !important;
            }
            .container-mobile {
              padding: 1rem !important;
            }
            .header-mobile {
              font-size: 1.5rem !important;
              margin-bottom: 1.5rem !important;
            }
            .toggle-mobile {
              max-width: 100% !important;
              margin: 0 0 1.5rem 0 !important;
              padding: 12px 16px !important;
            }
            .search-mobile {
              margin: 0 0 1.5rem 0 !important;
              max-width: 100% !important;
            }
          }
          
          @media (min-width: 769px) {
            .desktop-table {
              display: table !important;
            }
            .mobile-cards {
              display: none !important;
            }
            .container-desktop {
              padding: 2rem !important;
              max-width: 1400px !important;
              margin: 0 auto !important;
            }
          }
          
          input:focus {
            border-color: #1976d2 !important;
            box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1) !important;
          }
          
          button:hover {
            opacity: 0.9;
          }
          
          button:active {
            transform: translateY(1px);
          }
        `}
      </style>

      <div style={styles.container} className="container-mobile container-desktop">
        <h2 style={styles.header} className="header-mobile">ניהול משתמשים</h2>

        {/* מתג הזמנות דרך האתר */}
        {onlineOrdering !== null && (
          <div style={styles.toggleBox} className="toggle-mobile">
            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              הזמנות דרך האתר:
            </span>
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
          className="search-mobile"
          dir="rtl"
        />

        {/* טבלה לדסקטופ */}
        <div style={styles.tableContainer} className="desktop-table">
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
                  <td colSpan="4" style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#666'
                  }}>
                    לא נמצאו משתמשים תואמים
                  </td>
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
                      {u.role === 'MainAdmin' && (
                        <span style={{ color: '#999', fontSize: '0.8rem' }}>
                          ---
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* כרטיסים למובייל */}
        <div className="mobile-cards" style={{ display: 'none' }}>
          {filteredUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #ddd'
            }}>
              לא נמצאו משתמשים תואמים
            </div>
          ) : (
            filteredUsers.map(u => (
              <MobileUserCard key={u.id} user={u} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ManageUsers;