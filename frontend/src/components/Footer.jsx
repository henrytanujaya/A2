import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="container footer-content" style={{ justifyContent: 'center', gap: '10vw' }}>
        <div className="footer-column">
          <h4 className="brand-font" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/src/assets/logo.png" alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }}/> KITSUNE NOIR
          </h4>
          <p style={{ color: 'var(--text-muted)', maxWidth: '300px', lineHeight: '1.6' }}>
            Platform premium E-Commerce manga dan merchandise otaku bernuansa Matsuri mistis.
          </p>
        </div>
        <div className="footer-column">
          <h4>Navigasi</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/manga">Manga</Link></li>
            <li><Link to="/merchandise">Merchandise</Link></li>
            <li><Link to="/custom">Custom Apparel</Link></li>
            <li><Link to="/custom-3d">3D Figure Studio</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
