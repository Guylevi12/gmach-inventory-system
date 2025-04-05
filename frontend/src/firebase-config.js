// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2okbjcvN3V4Qpd4deo59qZZNNRBIWX58",
  authDomain: "gmach-inventory-system.firebaseapp.com",
  projectId: "gmach-inventory-system",
  storageBucket: "gmach-inventory-system.firebasestorage.app",
  messagingSenderId: "687472851540",
  appId: "1:687472851540:web:f846506cccaaefc1e74bc1",
  measurementId: "G-ZM8S3K7E2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;