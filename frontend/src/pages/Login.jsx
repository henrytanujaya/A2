import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email tidak boleh kosong";
    if (!password) newErrors.password = "Password tidak boleh kosong";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Hardcoded Access
    if (email === 'a@gmail.com' && password === '12345') {
      setErrors({});
      setIsLoggedIn(true);
      navigate('/');
      return;
    }

    // Mock Authentication Logic
    const savedUserData = localStorage.getItem('kitsuneMockUser');
    if (savedUserData) {
      const savedUser = JSON.parse(savedUserData);
      if (savedUser.email === email && savedUser.password === password) {
        setErrors({});
        setIsLoggedIn(true);
        navigate('/');
        return;
      }
    }

    // Jika tidak ada data atau tidak cocok
    setErrors({ email: "Email atau password salah", password: "Email atau password salah" });
  };

  return (
    <section className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        className="form-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'rgba(26, 26, 36, 0.8)',
          backdropFilter: 'blur(10px)',
          padding: '40px',
          borderRadius: '15px',
          border: '1px solid rgba(220, 20, 60, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          maxWidth: '400px',
          width: '100%',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px' }}>
          <img src="/src/assets/logo.png" alt="Kitsune Noir Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '5px' }} />
          <span className="brand-font" style={{ fontSize: '1.8rem', textAlign: 'center', color: '#fff' }}>KITSUNE NOIR</span>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.2rem', color: '#dc143c', fontWeight: '500' }}>Login to your account</h2>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda" 
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: `1px solid ${errors.email ? '#dc143c' : '#333'}`,
                background: '#111',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && <small style={{ color: '#dc143c', marginTop: '5px', display: 'block' }}>{errors.email}</small>}
          </div>
          
          <div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0' }}>Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password Anda" 
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 15px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.password ? '#dc143c' : '#333'}`,
                  background: '#111',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '38px',
                  background: 'none',
                  border: 'none',
                  color: '#a0a0b0',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <small style={{ color: '#dc143c', marginTop: '5px', display: 'block' }}>{errors.password}</small>}
          </div>

          <button 
            type="button"
            onClick={handleLogin}
            className="nav-btn primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px', display: 'flex', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            Sign In
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#a0a0b0' }}>
          Don't have an account? <Link to="/register" style={{ color: '#dc143c', textDecoration: 'none' }}>Register</Link>
        </p>
      </motion.div>
    </section>
  );
}
