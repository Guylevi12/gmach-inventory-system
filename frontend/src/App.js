// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import { UserProvider } from './UserContext';
import ManageUsers from './components/ManageUsers';
import NewLoan from './components/NewLoan';
import Request from './components/Request';
import ItemManager from './components/ItemManager';

function App() {
  return (
    <UserProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/manage-users" element={<ManageUsers />} />
          <Route path="/new-loan" element={<NewLoan />} />
          <Route path="/request" element={<Request />} />
          <Route path="/manage-product" element={<ItemManager />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
