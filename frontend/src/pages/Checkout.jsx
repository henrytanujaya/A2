import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useModal } from '../contexts/ModalContext';
import { MapPin, CreditCard, User, Mail, Truck, Loader2, ChevronDown, CheckCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

// Origin toko: Cilincing, Kalibaru, Jakarta Utara (ID Biteship)
const SHOP_ORIGIN_ID = "IDNP6IDNC150IDND881IDZ14110";

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    courier: 'jne'
  });
  
  // Shipping States
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [voucher, setVoucher] = useState('');
  const [discount, setDiscount] = useState(0);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const totalWeight = cart.reduce((acc, item) => acc + ((item.weight || 500) * (item.quantity || 1)), 0);
  const ppn = subtotal * 0.11;
  const shippingFee = selectedOption ? selectedOption.price : 0;
  const grandTotal = subtotal - discount + ppn + shippingFee;

  useEffect(() => {
    // User Data
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

  // Handle City Search (Debounced Autocomplete Biteship)
  useEffect(() => {
    if (citySearch.length >= 3) {
      const delayDebounceFn = setTimeout(async () => {
        setLoadingCities(true);
        try {
          const res = await axiosInstance.get(`/api/v1/shipping/areas?query=${citySearch}`);
          if (res.data.success) {
            setFilteredCities(res.data.data.areas || []);
          }
        } catch (error) {
          console.error("Fetch areas error:", error);
          setFilteredCities([]);
        } finally {
          setLoadingCities(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setFilteredCities([]);
    }
  }, [citySearch]);

  // Fetch Shipping Costs when city or courier changes
  useEffect(() => {
    if (selectedCity && formData.courier) {
      fetchShippingCosts();
    }
  }, [selectedCity, formData.courier]);

  const fetchShippingCosts = async () => {
    setLoadingShipping(true);
    setSelectedOption(null);
    try {
      const res = await axiosInstance.get('/api/v1/shipping/cost', {
        params: {
          destination: selectedCity.id,
          weight: totalWeight,
          courier: formData.courier.toLowerCase()
        }
      });
      if (res.data.success && res.data.data?.couriers) {
        setShippingOptions(res.data.data.couriers);
        if (res.data.data.couriers.length > 0) {
          setSelectedOption(res.data.data.couriers[0]);
        }
      } else {
        setShippingOptions([]);
      }
    } catch (error) {
      console.error("Fetch costs error:", error);
      showModal("Gagal menghitung ongkir untuk kurir ini.", "error");
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleApplyVoucher = () => {
    if (voucher.toUpperCase() === 'OTAKU10') {
      setDiscount(subtotal * 0.1);
      showModal("Voucher berhasil digunakan! Diskon 10% diterapkan.", 'success');
    } else {
      setDiscount(0);
      showModal("Kode voucher tidak valid.", 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!formData.address || !selectedCity) {
      showModal("Harap isi alamat lengkap dan pilih kota.", 'error');
      return;
    }
    if (!selectedOption) {
      showModal("Harap pilih layanan pengiriman.", 'error');
      return;
    }

    try {
      const orderItems = cart.map(item => ({
        productId: item.productId || null,
        customOrderId: item.customOrderId || null,
        quantity: item.quantity || 1
      }));

      const fullAddress = `${formData.address}, ${selectedCity.name}`;

      const orderRes = await axiosInstance.post('/api/v1/orders', {
        items: orderItems,
        shippingAddress: fullAddress,
        courierName: `${(selectedOption.courierName || formData.courier).toUpperCase()} - ${selectedOption.serviceName}`,
        courierCode: formData.courier.toLowerCase()
      });
      const orderData = orderRes.data.data;

      await clearCart();

      const paymentRes = await axiosInstance.post('/api/v1/payments/token', {
        orderId: orderData.orderId,
        paymentMethod: 'Bank Transfer'
      });

      const paymentData = paymentRes.data.data;

      const invoiceData = {
        invoiceId: `INV-${orderData.orderId}`,
        orderId: orderData.orderId,
        date: new Date().toLocaleString('id-ID'),
        customer: { name: formData.name, email: formData.email, address: fullAddress },
        items: [...cart],
        summary: { subtotal, ppn, shipping: shippingFee, total: grandTotal },
<<<<<<< Updated upstream
        paymentMethod: 'Xendit (VA, E-Wallet, Retail)',
        courier: `${formData.courier.toUpperCase()} - ${selectedOption.serviceName}`,
=======
        paymentMethod: 'Bank Transfer',
        courier: `${formData.courier.toUpperCase()} - ${selectedOption.service}`,
>>>>>>> Stashed changes
        status: 'UNPAID',
        paymentUrl: paymentData.paymentUrl
      };

      showModal('Order berhasil dibuat! Mengalihkan ke daftar pesanan...', 'success', () => {
        navigate('/my-orders');
      });

    } catch (error) {
      console.error('Checkout error:', error);
      showModal('Gagal membuat pesanan.', 'error');
    }
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
                <input type="text" name="name" value={formData.name} required disabled style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#888', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0', fontSize: '0.9rem' }}>Email</label>
                <input type="email" name="email" value={formData.email} required disabled style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#888', borderRadius: '8px' }} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', marginTop: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} color="#dc143c" /> Alamat Pengiriman</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              
              {/* City Selector */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0', fontSize: '0.9rem' }}>Pilih Kota</label>
                <div 
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  style={{ 
                    padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: selectedCity ? '#fff' : '#888', 
                    borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                  }}
                >
                  {selectedCity ? selectedCity.name : 'Cari Kota...'}
                  <ChevronDown size={18} />
                </div>
                
                <AnimatePresence>
                  {showCityDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      style={{ 
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, 
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', 
                        marginTop: '5px', maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
                      }}
                    >
                      <input 
                        type="text" autoFocus placeholder="Ketik min. 3 huruf nama kota/kecamatan..." 
                        value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff' }}
                      />
                      {citySearch.length < 3 ? (
                        <div style={{ padding: '12px', color: '#555', fontSize: '0.85rem', textAlign: 'center' }}>✏️ Ketik minimal 3 huruf untuk mencari kota...</div>
                      ) : loadingCities ? (
                        <div style={{ padding: '10px', textAlign: 'center' }}><Loader2 className="spinner" size={16} /></div>
                      ) : filteredCities.length === 0 ? (
                        <div style={{ padding: '12px', color: '#555', fontSize: '0.85rem', textAlign: 'center' }}>Kota tidak ditemukan. Coba kata kunci lain.</div>
                      ) : (
                        filteredCities.map(city => (
                          <div 
                            key={city.id} 
                            onClick={() => { setSelectedCity(city); setShowCityDropdown(false); setCitySearch(''); }}
                            style={{ padding: '10px', cursor: 'pointer', transition: '0.2s', background: selectedCity?.id === city.id ? '#333' : 'transparent', fontSize: '0.875rem', lineHeight: '1.4' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                            onMouseLeave={(e) => e.currentTarget.style.background = selectedCity?.id === city.id ? '#333' : 'transparent'}
                          >
                            {city.name}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="Masukkan nama jalan, nomor rumah, RT/RW..." rows="3" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px', resize: 'vertical' }}></textarea>
            </div>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', marginTop: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={20} color="#dc143c" /> Opsi Pengiriman</h2>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a0a0b0', fontSize: '0.9rem' }}>Pilih Kurir</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['jne', 'sicepat'].map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, courier: c }))}
                      style={{ 
                        flex: '1 1 120px', padding: '12px', borderRadius: '8px', border: formData.courier === c ? '1px solid #dc143c' : '1px solid #333',
                        background: formData.courier === c ? 'rgba(220, 20, 60, 0.1)' : 'rgba(0,0,0,0.2)',
                        color: formData.courier === c ? '#dc143c' : '#888', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                      }}
                    >
                      {c === 'jne' ? 'JNE Express' : 'SiCepat Ekspres'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shipping Services List */}
            <div style={{ marginBottom: '20px' }}>
              {loadingShipping ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                  <Loader2 className="spinner" size={24} color="#dc143c" />
                  <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>Menghitung ongkir...</p>
                </div>
              ) : selectedCity ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {shippingOptions.length > 0 ? shippingOptions.map((opt, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedOption(opt)}
                      style={{ 
                        padding: '15px', borderRadius: '10px',
                        border: selectedOption?.serviceCode === opt.serviceCode && selectedOption?.courierCode === opt.courierCode ? '1px solid #2ecc71' : '1px solid #333',
                        background: 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{opt.serviceName} <span style={{ color: '#888', fontWeight: 'normal', fontSize: '0.85rem' }}>({opt.courierName})</span></div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '3px' }}>Estimasi: {opt.estimatedDay} hari kerja</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold' }}>Rp {opt.price.toLocaleString('id-ID')}</span>
                        {selectedOption?.serviceCode === opt.serviceCode && selectedOption?.courierCode === opt.courierCode && <CheckCircle size={18} color="#2ecc71" />}
                      </div>
                    </div>
                  )) : (
                    <div style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center' }}>Silakan pilih kurir untuk melihat biaya ongkir.</div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#888', fontSize: '0.8rem', fontStyle: 'italic' }}>* Pilih kota tujuan terlebih dahulu untuk melihat ongkir.</div>
              )}
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
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')} ({(item.weight || 500) * item.quantity}g)</div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Rp {(item.price * (item.quantity || 1)).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)' }}>
              <span>Total Berat</span>
              <span>{(totalWeight/1000).toFixed(1)} Kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)' }}>
              <span>Subtotal Produk</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#2ecc71' }}>
                <span>Diskon Voucher</span>
                <span>- Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)' }}>
              <span>Ongkos Kirim</span>
              <span>{shippingFee > 0 ? `Rp ${shippingFee.toLocaleString('id-ID')}` : 'Pilih layanan'}</span>
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
