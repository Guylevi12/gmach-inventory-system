import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(true); // ברירת מחדל

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: userData.username,
            role: userData.role
          });
        }
      } else {
        setUser(null);
      }
    });

    // טוען את ההגדרה של onlineOrdering
    const fetchOnlineOrderingStatus = async () => {
      const settingDoc = await getDoc(doc(db, 'settings', 'onlineOrdering'));
      if (settingDoc.exists()) {
        const data = settingDoc.data();
        setOnlineOrderingEnabled(data.enabled === true);
      }
    };

    fetchOnlineOrderingStatus();
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, onlineOrderingEnabled, setOnlineOrderingEnabled }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
