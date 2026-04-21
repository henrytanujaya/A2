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

import { CartProvider } from './contexts/CartContext';

import './index.css';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <SakuraBackground />
      {!isAuthPage && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}
      <main style={{ position: 'relative', zIndex: 10 }}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/manga" element={isLoggedIn ? <Manga /> : <Navigate to="/login" replace />} />
          <Route path="/merchandise" element={isLoggedIn ? <Merchandise /> : <Navigate to="/login" replace />} />
          <Route path="/custom" element={isLoggedIn ? <CustomApparel /> : <Navigate to="/login" replace />} />
          <Route path="/custom-3d" element={isLoggedIn ? <Custom3D /> : <Navigate to="/login" replace />} />
          <Route path="/cart" element={isLoggedIn ? <Cart /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}

export default App;
