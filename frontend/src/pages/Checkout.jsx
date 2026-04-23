import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useModal } from '../contexts/ModalContext';
import { MapPin, CreditCard, User, Mail, Truck } from 'lucide-react';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    courier: 'JNE'
  });
  const [voucher, setVoucher] = useState('');
  const [discount, setDiscount] = useState(0);

  const total = cart.reduce((acc, item) => acc + item.price, 0);
  const ppn = total * 0.11;
  const shippingCost = 25000;
  const grandTotal = total - discount + ppn + shippingCost;

  const handleApplyVoucher = () => {
    if (voucher.toUpperCase() === 'OTAKU10') {
      const discAmount = total * 0.1;
      setDiscount(discAmount);
      showModal("Voucher berhasil digunakan! Diskon 10% diterapkan.", 'success');
    } else {
      setDiscount(0);
      showModal("Kode voucher tidak valid.", 'error');
    }
  };

  useEffect(() => {
    // Tarik data user dari localStorage
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setFormData(prev => ({
        ...prev,
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        address: parsedUser.address || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!formData.address) {
      showModal("Harap isi alamat pengiriman", 'error');
      return;
    }
    if (cart.length === 0) {
      showModal("Keranjang belanja kosong", 'error');
      return;
    }

    const invoiceData = {
      invoiceId: `INV/${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}/KTN-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toLocaleString('id-ID'),
      customer: {
        name: formData.name,
        email: formData.email,
        address: formData.address
      },
      items: [...cart],
      summary: {
        subtotal: total,
        discount: discount,
        ppn: ppn,
        shipping: shippingCost,
        total: grandTotal
      },
      paymentMethod: null,
      courier: formData.courier,
      status: 'UNPAID'
    };

    // Save to global orders
    const savedOrders = JSON.parse(localStorage.getItem('kitsune_orders') || '[]');
    savedOrders.push(invoiceData);
    localStorage.setItem('kitsune_orders', JSON.stringify(savedOrders));

    navigate('/invoice', { state: { invoiceData } });
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '100px', minHeight: '80vh', textAlign: 'center' }}>
        <h2>Keranjang Kosong</h2>
        <button onClick={() => navigate('/manga')} className="nav-btn primary" style={{ marginTop: '20px' }}>Belanja Sekarang</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px', minHeight: '80vh', position: 'relative', zIndex: 10 }}>
      <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>Checkout</h1>
      
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Form Area */}
        <div style={{ flex: '1 1 600px' }}>
          <form onSubmit={handleCheckout} style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} color="#dc143c" /> Informasi Pembeli</h2>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0', fontSize: '0.9rem' }}>Nama Lengkap</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#888', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0', fontSize: '0.9rem' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#888', borderRadius: '8px' }} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', marginTop: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} color="#dc143c" /> Alamat Pengiriman</h2>
            <div style={{ marginBottom: '20px' }}>
              <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="Masukkan alamat lengkap pengiriman..." rows="4" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px', resize: 'vertical' }}></textarea>
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', marginTop: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={20} color="#dc143c" /> Ekspedisi Pengiriman</h2>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0', fontSize: '0.9rem' }}>Pilih Kurir</label>
                <select name="courier" value={formData.courier} onChange={handleChange} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px' }}>
                  <option value="JNE">JNE Reguler</option>
                  <option value="JNT">J&T Express</option>
                  <option value="SICEPAT">SiCepat Halu</option>
                </select>
              </div>
            </div>

            <button type="submit" className="nav-btn primary" style={{ width: '100%', padding: '15px', fontSize: '1.1rem', marginTop: '20px', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={20} /> Buat Tagihan
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div style={{ flex: '1 1 350px' }}>
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Ringkasan Pesanan</h2>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 1, paddingRight: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'pre-line' }}>{item.details}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Rp {item.price.toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)' }}>
              <span>Subtotal Produk</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#2ecc71' }}>
                <span>Diskon Voucher</span>
                <span>- Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)' }}>
              <span>Ongkos Kirim</span>
              <span>Rp {shippingCost.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--text-muted)' }}>
              <span>PPN (11%)</span>
              <span>Rp {ppn.toLocaleString('id-ID')}</span>
            </div>
            
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', marginBottom: '15px' }} />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0', fontSize: '0.9rem' }}>Kode Voucher</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="Contoh: OTAKU10" style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px' }} />
                <button type="button" onClick={handleApplyVoucher} style={{ padding: '10px 15px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Terapkan</button>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>
              <span>Total Pembayaran</span>
              <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
