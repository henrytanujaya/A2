import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axiosInstance from '../api/axiosInstance';

export default function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const cartContext = useCart();
  const cart = cartContext ? cartContext.cart : [];
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/v1/auth/logout');
    } catch (err) {
      console.warn('[LOGOUT] Backend logout gagal, tetap lanjut logout lokal:', err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="brand-logo" style={{ textDecoration: 'none' }}>
          <img src="/src/assets/logo.png" alt="Kitsune Noir Logo" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
          <span className="brand-font">KITSUNE <br/> NOIR</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={currentPath === '/' ? "nav-btn primary" : "nav-link"}>Home</Link>
          <Link to="/manga" className={currentPath === '/manga' ? "nav-btn primary" : "nav-link"}>Manga</Link>
          <Link to="/merchandise" className={currentPath === '/merchandise' ? "nav-btn primary" : "nav-link"}>Merchandise</Link>
          <Link to="/custom" className={currentPath === '/custom' ? "nav-btn primary" : "nav-link"}>Custom Apparel</Link>
          <Link to="/custom-3d" className={currentPath === '/custom-3d' ? "nav-btn primary" : "nav-link"}>3D Figure</Link>
          <Link to="/cart" className={currentPath === '/cart' ? "nav-btn primary" : "nav-link"} style={{display: 'flex', alignItems: 'center', gap: '8px', position: 'relative'}}>
            <ShoppingCart size={18} /> Cart
            {cart.length > 0 && (
              <span style={{
                position: 'absolute', top: '-10px', right: '-15px', background: 'var(--accent-crimson)', 
                color: 'white', border: '2px solid var(--card-bg)', borderRadius: '50%', 
                padding: '2px 5px', fontSize: '10px', fontWeight: 'bold'
              }}>
                {cart.length}
              </span>
            )}
          </Link>
          {isLoggedIn ? (
            <div style={{ paddingLeft: '15px', borderLeft: '1px solid #333', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link to="/my-orders" className={currentPath === '/my-orders' ? "nav-btn primary" : "nav-link"} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                Pesanan Saya
              </Link>
              <Link to="/profile" className={currentPath === '/profile' ? "nav-btn primary" : "nav-link"} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={18} /> Profil
              </Link>
              <button 
                onClick={handleLogout} 
                className="nav-btn primary" 
                style={{ cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ paddingLeft: '15px', borderLeft: '1px solid #333', display: 'flex', gap: '10px' }}>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-btn primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

