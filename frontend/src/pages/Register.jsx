import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useModal } from '../contexts/ModalContext';

export default function Register() {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePassword = (pass) => {
    // 8-16 karakter, minimal 1 huruf besar
    const regex = /^(?=.*[A-Z]).{8,16}$/;
    return regex.test(pass);
  };

  const handleRegister = async () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Nama pengguna tidak boleh kosong";

    if (!email.trim()) {
      newErrors.email = "Email tidak boleh kosong";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!password) {
      newErrors.password = "Password tidak boleh kosong";
    } else if (!validatePassword(password)) {
      newErrors.password = "Password harus 8-16 karakter dan mengandung minimal 1 huruf besar";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak boleh kosong";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await axiosInstance.post('/api/v1/auth/register', {
        name: username,
        email,
        password
      });

      if (response.data.success) {
        showModal("Registrasi Berhasil! Silakan login untuk melanjutkan.", 'success', () => {
          setErrors({});
          navigate('/login');
        });
      }
    } catch (error) {
      console.error("Register Error:", error);
      const message = error.response?.data?.message || "Registrasi gagal. Email mungkin sudah terdaftar.";
      setErrors({ email: message });
    }
  };

  return (
    <section className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
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
        <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.2rem', color: '#dc143c', fontWeight: '500' }}>Create an account</h2>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan nama pengguna Anda"
              style={{
                width: '100%',
                padding: '12px 15px',
                borderRadius: '8px',
                border: `1px solid ${errors.username ? '#dc143c' : '#333'}`,
                background: '#111',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {errors.username && <small style={{ color: '#dc143c', display: 'block', marginTop: '5px' }}>{errors.username}</small>}
          </div>

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
            {errors.email && <small style={{ color: '#dc143c', display: 'block', marginTop: '5px' }}>{errors.email}</small>}
          </div>

          <div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0' }}>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Optional: clear error eagerly if format matches to give realtime feedback
                  if (errors.password && validatePassword(e.target.value)) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
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
            {errors.password ? (
              <small style={{ color: '#dc143c', display: 'block', marginTop: '6px' }}>{errors.password}</small>
            ) : (
              <small style={{ display: 'block', color: '#888', marginTop: '6px', fontSize: '0.8rem' }}>
                * Masukkan minimal 8 karakter, dengan minimal 1 huruf besar, 1 huruf kecil, dan 1 simbol
              </small>
            )}
          </div>

          <div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0' }}>Confirmation Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan ulang password Anda"
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 15px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.confirmPassword ? '#dc143c' : '#333'}`,
                  background: '#111',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && <small style={{ color: '#dc143c', display: 'block', marginTop: '6px' }}>{errors.confirmPassword}</small>}
          </div>

          <button
            type="button"
            onClick={handleRegister}
            className="nav-btn primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px', display: 'flex', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
          >
            Sign Up
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#a0a0b0' }}>
          Already have an account? <Link to="/login" style={{ color: '#dc143c', textDecoration: 'none' }}>Login</Link>
        </p>
      </motion.div>
    </section>
  );
}
