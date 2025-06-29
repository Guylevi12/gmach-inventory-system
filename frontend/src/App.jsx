// src/App.jsx - גרסה מתוקנת עם נוהל השאלה
import React from 'react';
import { Routes, Route } from 'react-router-dom'; // הסרנו BrowserRouter מכאן
import { UserProvider } from './UserContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import NewLoan from './components/NewLoan/NewLoan'; // נתיב מתוקן
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
import BorrowingGuidelines from './components/BorrowingGuidelines'; // הקומפוננט החדש

const App = () => {
  return (
    <UserProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/donations" element={<DonationsPage />} />
        
        {/* נתיב חדש לנוהל השאלה - זמין לכל המשתמשים */}
        <Route path="/borrowing-guidelines" element={<BorrowingGuidelines />} />

        {/* רוט חדש לבקשת השאלה */}
        <Route path="/request" element={<RequestLoan />} />

        {/* רוט חדש להזמנות שלי */}
        <Route path="/my-orders" element={<MyOrders />} />

        {/* רוט חדש לבקשות להזמנה למנהלים */}
        <Route path="/requests" element={<PendingRequests />} />

        <Route path="/new-loan" element={<NewLoan />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/manage-product" element={<ItemManager />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/history" element={<LoanHistory />} />
      </Routes>
      <ContactBubble />
    </UserProvider>
  );
};

export default App;