import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar      from './components/Navbar';
import Home        from './components/Home';
import Login       from './components/Login';
import Register    from './components/Register';
import ManageUsers from './components/ManageUsers';
import NewLoan     from './components/NewLoan';
import OpenLoans   from './components/OpenLoans';  // ייבוא הקומפוננטה החדשה
import Request     from './components/Request';
import ItemManager from './components/ItemManager';
import Catalog     from './components/Catalog';
import ItemDetails from './components/ItemDetails';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/manage-users"   element={<ManageUsers />} />
        <Route path="/new-loan"       element={<NewLoan />} />
        <Route path="/open-loans"     element={<OpenLoans />} /> 
        <Route path="/request"        element={<Request />} />
        <Route path="/open-loans"     element={<OpenLoans />} />
        <Route path="/manage-product" element={<ItemManager />} />
        <Route path="/catalog"        element={<Catalog />} />
        <Route path="/catalog/:id"    element={<ItemDetails />} />
      </Routes>
    </>
  );
}

export default App;
