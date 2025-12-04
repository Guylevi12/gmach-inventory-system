// src/App.jsx - כולל מנגנון אוטומטי לריענון גרסה + מחלקות CSS לכל דף (ללא ContactBubble)
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { UserProvider } from './UserContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Login from './components/Login';
import Register from './components/Register';
import NewLoan from './components/NewLoan/NewLoan';
import RequestLoan from './components/RequestLoan';
import PendingRequests from './components/PendingRequests';
import MyOrders from './components/MyOrders';
import CalendarPage from './components/CalendarPage';
import ItemManager from './components/ItemManager';
import ManageUsers from './components/ManageUsers';
import Catalog from './components/Catalog';
import LoanHistory from './components/LoanHistory';
import DonationsPage from './components/DonationsPage';
import BorrowingGuidelines from './components/BorrowingGuidelines';
import AvailabilityNotification from './components/AvailabilityNotification';
import { checkAndSendAllEmails } from './services/emailService';
import './styles/global-background.css';
import AlertsManagement from './components/AlertsManagement';
import Gallery from './components/Gallery';

/* ✅ פונקציה שבודקת אם נפרסה גרסה חדשה ומרעננת את האתר אוטומטית */
function useAutoReloadOnVersionChange() {
  useEffect(() => {
    // Force cache-bust / reload when version changes (bump default when shipping fixes)
    const current = import.meta.env.VITE_APP_VERSION || "dev-2025-03-05";
    const last = localStorage.getItem("APP_VERSION");

    // אם המשתמש כבר טען גרסה קודמת והשונה - מרעננים
    if (last && last !== current) {
      console.log("🔄 גרסה חדשה זוהתה — מרענן את האתר...");
      window.location.reload(true);
    }

    // שומרים את הגרסה הנוכחית
    localStorage.setItem("APP_VERSION", current);
  }, []);
}

const App = () => {
  /* ✅ הוק הריענון האוטומטי */
  useAutoReloadOnVersionChange();

  // ✅ Auto-checking refs for email service
  const hasRunTodayRef = useRef(false);
  const intervalRef = useRef(null);
  const lastAutoCheckDateRef = useRef(null);

  // 🔵 ניהול מחלקות CSS לפי דף
  const location = useLocation();

  // 🔵 useEffect לניהול מחלקות CSS לפי עמוד
  useEffect(() => {
    document.body.classList.remove(
      'home-page', 'about-page', 'catalog-page', 'login-page',
      'register-page', 'donations-page', 'guidelines-page',
      'new-loan-page', 'calendar-page', 'orders-page',
      'history-page', 'manage-page', 'gallery-page'
    );

    switch (location.pathname) {
      case '/': document.body.classList.add('home-page'); break;
      case '/about': document.body.classList.add('about-page'); break;
      case '/catalog': document.body.classList.add('catalog-page'); break;
      case '/login': document.body.classList.add('login-page'); break;
      case '/register': document.body.classList.add('register-page'); break;
      case '/donations': document.body.classList.add('donations-page'); break;
      case '/borrowing-guidelines': document.body.classList.add('guidelines-page'); break;
      case '/new-loan': document.body.classList.add('new-loan-page'); break;
      case '/calendar': document.body.classList.add('calendar-page'); break;
      case '/my-orders':
      case '/requests': document.body.classList.add('orders-page'); break;
      case '/history': document.body.classList.add('history-page'); break;
      case '/gallery': document.body.classList.add('gallery-page'); break;
      case '/manage-product':
      case '/manage-users': document.body.classList.add('manage-page'); break;
      default: document.body.classList.add('other-page'); break;
    }

    console.log('🎨 דף נוכחי:', location.pathname, '- מחלקת CSS:', document.body.className);

    return () => {
      document.body.classList.remove(
        'home-page', 'about-page', 'catalog-page', 'login-page',
        'register-page', 'donations-page', 'guidelines-page',
        'new-loan-page', 'calendar-page', 'orders-page',
        'history-page', 'manage-page', 'gallery-page', 'other-page'
      );
    };
  }, [location.pathname]);

  // ✅ הפעלת בדיקות מייל אוטומטיות
  useEffect(() => {
    console.log('🚀 App: Setting up automatic email service...');
    setupAutomaticEmailChecking();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 App: Stopped automatic email service');
      }
    };
  }, []);

  // ✅ הגדרת הפונקציה של בדיקות המיילים
  const setupAutomaticEmailChecking = () => {
    const shouldAutoCheck = () => {
      const now = new Date();
      const today = now.toDateString();

      if (lastAutoCheckDateRef.current !== today) {
        hasRunTodayRef.current = false;
        lastAutoCheckDateRef.current = today;
        console.log('🔄 App: Reset daily auto-check tracking for', today);
      }

      if (hasRunTodayRef.current) {
        console.log('⏭️ App: Auto-check already completed today');
        return false;
      }

      const hour = now.getHours();
      if (hour < 8 || hour > 20) {
        console.log(`⏰ App: Outside business hours (${hour}:00), skipping auto-check`);
        return false;
      }

      return true;
    };

    const performAutoCheck = async () => {
      if (!shouldAutoCheck()) return;

      try {
        console.log('🤖 App: Performing automatic reminder check...');
        const emailResults = await checkAndSendAllEmails();

        if (emailResults.totalSent > 0) {
          console.log(`✅ App: ${emailResults.totalSent} reminder emails sent automatically`);
          if (typeof window !== 'undefined' && window.Notification) {
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            } else if (Notification.permission === 'granted') {
              new Notification('מערכת התזכורות', {
                body: `${emailResults.totalSent} תזכורות נשלחו אוטומטית`,
                icon: '/favicon.ico',
                tag: 'email-reminder'
              });
            }
          }
        } else {
          console.log('📭 App: No reminder emails to send today');
        }
        hasRunTodayRef.current = true;
      } catch (error) {
        console.error('❌ App: Error in automatic email check:', error);
      }
    };

    const initialTimeout = setTimeout(() => {
      console.log('🎯 App: Starting initial automatic email check...');
      performAutoCheck();
    }, 60000);

    intervalRef.current = setInterval(() => {
      console.log('🔄 App: Periodic automatic email check...');
      performAutoCheck();
    }, 3 * 60 * 60 * 1000);

    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
    };
  };

  return (
    <UserProvider>
      <Navbar />
      <Routes>
        <Route path="/alerts" element={<AlertsManagement />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/donations" element={<DonationsPage />} />
        <Route path="/borrowing-guidelines" element={<BorrowingGuidelines />} />
        <Route path="/request" element={<RequestLoan />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/requests" element={<PendingRequests />} />
        <Route path="/new-loan" element={<NewLoan />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/manage-product" element={<ItemManager />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/history" element={<LoanHistory />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>

      <AvailabilityNotification />
      {/* ContactBubble הוסר מכאן - עכשיו הוא רק בדף הבית */}
    </UserProvider>
  );
};

export default App;
