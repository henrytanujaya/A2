import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Phone, Package, Edit2, Check, X, Clock, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../api/axiosInstance';
import { useModal } from '../contexts/ModalContext';

export default function Profile() {
  const { showModal } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', address: '' });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

  const fetchProfileAndOrders = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        axiosInstance.get('/api/v1/users/profile'),
        axiosInstance.get('/api/v1/orders')
      ]);

      if (profileRes.data.success) {
        setProfileData({
          name: profileRes.data.data.name || '',
          email: profileRes.data.data.email || '',
          phone: profileRes.data.data.phone || '',
          address: profileRes.data.data.address || ''
        });
      }

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch profile/orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndOrders();
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

  const fetchTracking = async (courier, awb, orderId) => {
    if (!awb || !courier) {
      showModal("Nomor resi belum tersedia untuk pesanan ini.", "error");
      return;
    }

    setLoadingTracking(true);
    setActiveTrackingOrderId(orderId);
    try {
      const response = await axiosInstance.get(`/api/v1/tracking/${courier}/${awb}`);
      if (response.data.success) {
        setTrackingData(response.data.data.data);
      } else {
        showModal(response.data.message || "Gagal melacak paket. Pastikan nomor resi valid.", "error");
        setActiveTrackingOrderId(null);
      }
    } catch (error) {
      console.error("Tracking error:", error);
      showModal("Terjadi kesalahan saat menghubungi server tracking.", "error");
      setActiveTrackingOrderId(null);
    } finally {
      setLoadingTracking(false);
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

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Left Column: Profile Info Form */}
        <div style={{ flex: '1 1 400px', background: 'var(--card-bg)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff2a5f, #ff7b9a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(255,42,95,0.4)' }}>
                <User size={30} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{profileData.name || 'Pengguna Baru'}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Member Kitsune Noir</p>
              </div>
            </div>
            
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="nav-btn primary" 
                style={{ padding: '8px 15px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #ff2a5f', color: '#ff2a5f' }}
              >
                <Edit2 size={16} /> Edit Data
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                <User size={16} color="#ff2a5f" /> Nama Lengkap
              </label>
              {isEditing ? (
                <input type="text" name="name" value={profileData.name} onChange={handleChange} placeholder="Masukkan nama..." style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px', fontSize: '1rem' }} />
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: profileData.name ? '#fff' : '#666', border: '1px solid transparent' }}>
                  {profileData.name || 'Belum diisi'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                <Mail size={16} color="#ff2a5f" /> Email
              </label>
              {isEditing ? (
                <input type="email" name="email" value={profileData.email} disabled style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid #333', color: '#888', borderRadius: '8px', fontSize: '1rem', cursor: 'not-allowed' }} />
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: profileData.email ? '#fff' : '#666', border: '1px solid transparent' }}>
                  {profileData.email || 'Belum diisi'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                <Phone size={16} color="#ff2a5f" /> Nomor Telepon
              </label>
              {isEditing ? (
                <input type="tel" name="phone" value={profileData.phone} onChange={handleChange} placeholder="Masukkan No. Telepon..." style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px', fontSize: '1rem' }} />
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: profileData.phone ? '#fff' : '#666', border: '1px solid transparent' }}>
                  {profileData.phone || 'Belum diisi'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                <MapPin size={16} color="#ff2a5f" /> Alamat Pengiriman
              </label>
              {isEditing ? (
                <textarea name="address" value={profileData.address} onChange={handleChange} placeholder="Masukkan alamat lengkap (termasuk kelurahan/kecamatan/kode pos)..." rows="3" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px', resize: 'vertical', fontSize: '1rem' }}></textarea>
              ) : (
                 <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: profileData.address ? '#fff' : '#666', border: '1px solid transparent', minHeight: '60px', whiteSpace: 'pre-line' }}>
                  {profileData.address || 'Belum diisi'}
                </div>
              )}
            </div>

            {isEditing && (
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button onClick={handleSave} className="nav-btn primary" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Check size={18} /> Simpan Data
                </button>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <X size={18} /> Batal
                </button>
              </div>
            )}
            
          </div>
        </div>

        {/* Right Column: Order History */}
        <div style={{ flex: '1 1 400px', background: 'var(--card-bg)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #333' }}>
            <Package size={24} color="#ff2a5f" /> 
            <h2 style={{ fontSize: '1.4rem' }}>Riwayat Pesanan</h2>
          </div>

          {orders.filter(o => o.status !== 'Pending').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px dashed #444' }}>
              <Package size={64} color="#444" style={{ marginBottom: '15px' }} />
              <h3 style={{ color: '#888', marginBottom: '10px' }}>Belum ada riwayat pesanan</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>Pesanan yang sudah dibayar akan muncul di sini untuk Anda lacak.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.filter(o => o.status !== 'Pending').map((order, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold' }}>Order #{order.orderId}</div>
                    <div style={{ color: '#ff2a5f', fontWeight: 'bold' }}>Rp {order.finalAmount.toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{new Date(order.createdAt).toLocaleString('id-ID')}</div>
                    <span style={{ padding: '4px 10px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{order.status.toUpperCase()}</span>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/invoice/${order.orderId}`)}
                    style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #ff2a5f', color: '#ff2a5f', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ff2a5f'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff2a5f'; }}
                  >
                    Lihat Detail & Lacak Resi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
