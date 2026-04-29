import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SakuraBackground from './components/SakuraBackground';

// Pages
import Home from './pages/Home';
import Manga from './pages/Manga';
import Merchandise from './pages/Merchandise';
import CustomApparel from './pages/CustomApparel';
import Custom3D from './pages/Custom3D';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UserOrders from './pages/UserOrders';
import Checkout from './pages/Checkout';
import InvoiceReceipt from './pages/InvoiceReceipt';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStock from './pages/admin/AdminStock';
import AdminOrders from './pages/admin/AdminOrders';
import SalesAudit from './pages/admin/SalesAudit';

import { CartProvider } from './contexts/CartContext';
import { ModalProvider } from './contexts/ModalContext';

import './index.css';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('accessToken');
  });
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');

  // Admin login check menggunakan adminAccessToken
  const isAdmin = !!localStorage.getItem('adminAccessToken');

  return (
    <>
      {!isAdminPage && <SakuraBackground />}
      {!isAuthPage && !isAdminPage && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}
      <main style={{ position: 'relative', zIndex: 10 }}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/manga" element={isLoggedIn ? <Manga /> : <Navigate to="/login" replace />} />
          <Route path="/merchandise" element={isLoggedIn ? <Merchandise /> : <Navigate to="/login" replace />} />
          <Route path="/custom" element={isLoggedIn ? <CustomApparel /> : <Navigate to="/login" replace />} />
          <Route path="/custom-3d" element={isLoggedIn ? <Custom3D /> : <Navigate to="/login" replace />} />
          <Route path="/cart" element={isLoggedIn ? <Cart /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/my-orders" element={isLoggedIn ? <UserOrders /> : <Navigate to="/login" replace />} />
          <Route path="/checkout" element={isLoggedIn ? <Checkout /> : <Navigate to="/login" replace />} />
          <Route path="/invoice" element={isLoggedIn ? <InvoiceReceipt /> : <Navigate to="/login" replace />} />
          <Route path="/invoice/:orderId" element={isLoggedIn ? <InvoiceReceipt /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/admin" element={isAdmin ? <AdminLayout setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" replace />}>
            <Route index element={<AdminDashboard />} />
            <Route path="stock" element={<AdminStock />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="audit" element={<SalesAudit />} />
          </Route>
        </Routes>
      </main>
      {!isAuthPage && !isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <ModalProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ModalProvider>
    </Router>
  );
}

export default App;
