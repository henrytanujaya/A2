import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const cartContext = useCart();
  const cart = cartContext ? cartContext.cart : [];
  const location = useLocation();
  const currentPath = location.pathname;

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
              <Link to="/profile" className={currentPath === '/profile' ? "nav-btn primary" : "nav-link"} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={18} /> Profil
              </Link>
              <button 
                onClick={() => setIsLoggedIn(false)} 
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
