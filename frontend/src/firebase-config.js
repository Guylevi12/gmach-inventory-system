import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD2okbjcvN3V4Qpd4deo59qZZNNRBIWX58",
  authDomain: "gmach-inventory-system.firebaseapp.com",
  projectId: "gmach-inventory-system",
  storageBucket: "gmach-inventory-system.appspot.com",
  messagingSenderId: "687472851540",
  appId: "1:687472851540:web:f846506cccaaefc1e74bc1",
  measurementId: "G-ZM8S3K7E2V"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth };
export default app;
