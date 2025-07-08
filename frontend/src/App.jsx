// src/App.jsx - מתוקן עם מחלקות CSS לכל דף
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
import ContactBubble from './components/ContactBubble';
import DonationsPage from './components/DonationsPage';
import BorrowingGuidelines from './components/BorrowingGuidelines';
import AvailabilityNotification from './components/AvailabilityNotification';
import { checkAndSendAllEmails } from './services/emailService';
import './styles/global-background.css';

const App = () => {
  // ✅ Auto-checking refs for email service
  const hasRunTodayRef = useRef(false);
  const intervalRef = useRef(null);
  const lastAutoCheckDateRef = useRef(null);
  
  // 🔵 ניהול מחלקות CSS לפי דף
  const location = useLocation();

  // 🔵 useEffect לניהול מחלקות CSS לפי עמוד
  useEffect(() => {
    // הסרת כל המחלקות הקיימות
    document.body.classList.remove(
      'home-page', 'about-page', 'catalog-page', 'login-page', 
      'register-page', 'donations-page', 'guidelines-page', 
      'new-loan-page', 'calendar-page', 'orders-page', 
      'history-page', 'manage-page'
    );
    
    // הוספת מחלקה בהתאם לדף הנוכחי
    switch(location.pathname) {
      case '/':
        document.body.classList.add('home-page');
        break;
      case '/about':
        document.body.classList.add('about-page');
        break;
      case '/catalog':
        document.body.classList.add('catalog-page');
        break;
      case '/login':
        document.body.classList.add('login-page');
        break;
      case '/register':
        document.body.classList.add('register-page');
        break;
      case '/donations':
        document.body.classList.add('donations-page');
        break;
      case '/borrowing-guidelines':
        document.body.classList.add('guidelines-page');
        break;
      case '/new-loan':
        document.body.classList.add('new-loan-page');
        break;
      case '/calendar':
        document.body.classList.add('calendar-page');
        break;
      case '/my-orders':
      case '/requests':
        document.body.classList.add('orders-page');
        break;
      case '/history':
        document.body.classList.add('history-page');
        break;
      case '/manage-product':
      case '/manage-users':
        document.body.classList.add('manage-page');
        break;
      default:
        // עבור דפים אחרים (כמו request), נוסיף נקודות
        document.body.classList.add('other-page');
        break;
    }
    
    console.log('🎨 דף נוכחי:', location.pathname, '- מחלקת CSS:', document.body.className);
    
    // ניקוי כשהקומפוננט נמחק
    return () => {
      document.body.classList.remove(
        'home-page', 'about-page', 'catalog-page', 'login-page', 
        'register-page', 'donations-page', 'guidelines-page', 
        'new-loan-page', 'calendar-page', 'orders-page', 
        'history-page', 'manage-page', 'other-page'
      );
    };
  }, [location.pathname]);

  // ✅ Set up automatic email checking on app startup
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

  // ✅ Set up automatic email checking (runs regardless of page)
  const setupAutomaticEmailChecking = () => {
    // Function to check if we should auto-send emails
    const shouldAutoCheck = () => {
      const now = new Date();
      const today = now.toDateString();

      // Reset daily flag if it's a new day
      if (lastAutoCheckDateRef.current !== today) {
        hasRunTodayRef.current = false;
        lastAutoCheckDateRef.current = today;
        console.log('🔄 App: Reset daily auto-check tracking for', today);
      }

      // Only auto-check once per day
      if (hasRunTodayRef.current) {
        console.log('⏭️ App: Auto-check already completed today');
        return false;
      }

      // Only check during business hours (8 AM - 8 PM)
      const hour = now.getHours();
      if (hour < 8 || hour > 20) {
        console.log(`⏰ App: Outside business hours (${hour}:00), skipping auto-check`);
        return false;
      }

      return true;
    };

    // Automatic email check function
    const performAutoCheck = async () => {
      if (!shouldAutoCheck()) {
        return;
      }

      try {
        console.log('🤖 App: Performing automatic reminder check...');

        const emailResults = await checkAndSendAllEmails();

        if (emailResults.totalSent > 0) {
          console.log(`✅ App: ${emailResults.totalSent} reminder emails sent automatically`);

          // Optional: Request notification permission and show notification
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

        // Mark that we've run today
        hasRunTodayRef.current = true;

      } catch (error) {
        console.error('❌ App: Error in automatic email check:', error);
      }
    };

    // Initial auto-check (wait 1 minute after app startup to ensure everything is loaded)
    const initialTimeout = setTimeout(() => {
      console.log('🎯 App: Starting initial automatic email check...');
      performAutoCheck();
    }, 60000); // 1 minute

    // Set up interval to check every 3 hours (but will only run once per day)
    intervalRef.current = setInterval(() => {
      console.log('🔄 App: Periodic automatic email check...');
      performAutoCheck();
    }, 3 * 60 * 60 * 1000); // 3 hours

    // Cleanup timeout on unmount
    return () => {
      if (initialTimeout) {
        clearTimeout(initialTimeout);
      }
    };
  };

  return (
    <UserProvider>
      <Navbar />
      <Routes>
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
      </Routes>

      <AvailabilityNotification />
      <ContactBubble />
    </UserProvider>
  );
};

export default App;