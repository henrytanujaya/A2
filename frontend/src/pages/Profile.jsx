import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Phone, Package, Edit2, Check, X, Clock, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../api/axiosInstance';
import { useModal } from '../contexts/ModalContext';

export default function Profile() {
  const { showModal } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/v1/users/profile');

      if (response.data.success) {
        setProfileData({
          name: response.data.data.name || '',
          email: response.data.data.email || '',
          phone: response.data.data.phone || '',
          address: response.data.data.address || ''
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address
      };
      
      const response = await axiosInstance.put('/api/v1/users/profile', payload);
      if (response.data.success) {
        // update local storage just in case
        const savedUser = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({ ...savedUser, ...payload }));
        
        showModal('Profil berhasil diperbarui!', 'success');
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      showModal('Gagal memperbarui profil.', 'error');
    }
  };

  if (loading) {
    return <div className="container" style={{ paddingTop: '100px', minHeight: '80vh', textAlign: 'center' }}>Loading profile...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px', minHeight: '80vh', position: 'relative', zIndex: 10 }}>
      {/* Page Header */}
      <div className="container" style={{ marginBottom: '40px', padding: 0 }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px', color: '#fff' }}>Profil Pengguna</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Atur informasi dan alamat pengiriman Anda dengan lengkap sebelum melanjutkan pesanan keranjang Anda.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        
        {/* Profile Info Form */}
        <div style={{ width: '100%', maxWidth: '600px', background: 'var(--card-bg)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff2a5f, #ff7b9a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(255,42,95,0.4)' }}>
                <User size={35} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '5px' }}>{profileData.name || 'Pengguna Baru'}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Member Kitsune Noir</p>
              </div>
            </div>
            
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="nav-btn primary" 
                style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #ff2a5f', color: '#ff2a5f' }}
              >
                <Edit2 size={16} /> Edit Data
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem' }}>
                <User size={18} color="#ff2a5f" /> Nama Lengkap
              </label>
              {isEditing ? (
                <input type="text" name="name" value={profileData.name} onChange={handleChange} placeholder="Masukkan nama..." style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '10px', fontSize: '1rem' }} />
              ) : (
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: profileData.name ? '#fff' : '#666', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {profileData.name || 'Belum diisi'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem' }}>
                <Mail size={18} color="#ff2a5f" /> Email
              </label>
              {isEditing ? (
                <input type="email" name="email" value={profileData.email} disabled style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.1)', border: '1px solid #333', color: '#888', borderRadius: '10px', fontSize: '1rem', cursor: 'not-allowed' }} />
              ) : (
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: profileData.email ? '#fff' : '#666', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {profileData.email || 'Belum diisi'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem' }}>
                <Phone size={18} color="#ff2a5f" /> Nomor Telepon
              </label>
              {isEditing ? (
                <input type="tel" name="phone" value={profileData.phone} onChange={handleChange} placeholder="Masukkan No. Telepon..." style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '10px', fontSize: '1rem' }} />
              ) : (
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: profileData.phone ? '#fff' : '#666', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {profileData.phone || 'Belum diisi'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem' }}>
                <MapPin size={18} color="#ff2a5f" /> Alamat Pengiriman
              </label>
              {isEditing ? (
                <textarea name="address" value={profileData.address} onChange={handleChange} placeholder="Masukkan alamat lengkap (termasuk kelurahan/kecamatan/kode pos)..." rows="4" style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '10px', resize: 'vertical', fontSize: '1rem' }}></textarea>
              ) : (
                 <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: profileData.address ? '#fff' : '#666', border: '1px solid rgba(255,255,255,0.05)', minHeight: '80px', whiteSpace: 'pre-line' }}>
                  {profileData.address || 'Belum diisi'}
                </div>
              )}
            </div>

            {isEditing && (
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button onClick={handleSave} className="nav-btn primary" style={{ flex: 1, padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
                  <Check size={18} /> Simpan Data
                </button>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <X size={18} /> Batal
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
