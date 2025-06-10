import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ManageUsers from './components/ManageUsers';
import NewLoan from './components/NewLoan';
import Request from './components/Request';
import ItemManager from './components/ItemManager';
import Catalog from './components/Catalog';
import ItemDetails from './components/ItemDetails';
import CalendarPage from './components/CalendarPage'; 
import Dashboard from './components/Dashboard';
import ContactBubble from './components/contactBubble';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/new-loan" element={<NewLoan />} />
        <Route path="/request" element={<Request />} />
        <Route path="/manage-product" element={<ItemManager />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<ItemDetails />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <ContactBubble/>
    </>
  );
}

export default App;