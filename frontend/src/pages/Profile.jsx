import React, { useState } from 'react';
import { User, Mail, MapPin, Phone, Package, Edit2, Check, X } from 'lucide-react';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Dummy order history, initially empty
  const [orders] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Simulasi penyimpanan
    setIsEditing(false);
  };

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
                <input type="email" name="email" value={profileData.email} onChange={handleChange} placeholder="Masukkan email..." style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px', fontSize: '1rem' }} />
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
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#777'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = '#555'; }}>
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

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px dashed #444' }}>
              <Package size={64} color="#444" style={{ marginBottom: '15px' }} />
              <h3 style={{ color: '#888', marginBottom: '10px' }}>Belum ada pesanan</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>Pakaian kustom eksklusif dan koleksi manga Anda akan tercatat di sini setelah melakukan pembayaran.</p>
            </div>
          ) : (
            <div>
              {/* Space for future orders mapped listing */}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
