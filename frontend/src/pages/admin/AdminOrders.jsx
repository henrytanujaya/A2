import React, { useEffect, useState } from 'react';
import { Package, Search, Filter, Truck, Save, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import { useModal } from '../../contexts/ModalContext';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('id'); // id, tracking, status
  const [activeTab, setActiveTab] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const pageSize = 10;

  // Modal Input Nomor Resi
  const [resiModal, setResiModal] = useState({ open: false, orderId: null, courierName: '' });
  const [resiInput, setResiInput] = useState('');
  const [automating, setAutomating] = useState(null); // Track which order is being automated

  const { showModal } = useModal();

  const handleShipWithResi = async () => {
    if (!resiInput.trim()) {
      showModal("Nomor resi tidak boleh kosong!", "error");
      return;
    }
    const { orderId } = resiModal;
    setResiModal({ open: false, orderId: null, courierName: '' });
    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, null, {
        params: { status: 'Shipped', trackingNumber: resiInput.trim() }
      });
      showModal(`🚚 Pesanan berhasil dikirim! Resi: ${resiInput.trim()}`, "success");
      setResiInput('');
      fetchOrders();
    } catch (error) {
      console.error("Ship order error:", error);
      showModal("Gagal mengirim pesanan.", "error");
    }
  };

  const searchTypeOptions = [
    { value: 'id', label: 'ID Pesanan' },
    { value: 'tracking', label: 'Nomor Resi' },
    { value: 'status', label: 'Status' }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/orders/paged', {
        params: {
          tab: activeTab,
          type: searchType,
          term: searchTerm,
          page: currentPage,
          size: pageSize
        }
      });
      if (res.data.success) {
        setOrders(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
        setTotalItems(res.data.data.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      showModal("Gagal mengambil data pesanan.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 5000);
    return () => clearInterval(interval);
  }, [activeTab, searchType, currentPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, searchType]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(0);
    fetchOrders();
  };

  const handleValidatePayment = async (orderId) => {
    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, null, {
        params: { status: 'Processing' }
      });
      showModal("Pembayaran divalidasi!", "success");
      fetchOrders();
    } catch (error) {
      console.error("Validation error:", error);
      showModal("Gagal memvalidasi.", "error");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Batalkan pesanan?")) return;
    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, null, {
        params: { status: 'Cancelled' }
      });
      showModal("Dibatalkan.", "success");
      fetchOrders();
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const handleDelivered = async (orderId) => {
    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, null, {
        params: { status: 'Delivered' }
      });
      showModal("Pesanan ditandai sebagai Sampai di Tujuan!", "success");
      fetchOrders();
    } catch (error) {
      console.error("Delivery status error:", error);
      showModal("Gagal memperbarui status pengiriman.", "error");
    }
  };

  const handleAutomateShipping = async (orderId) => {
    setAutomating(orderId);
    try {
      const res = await axiosInstance.post(`/api/v1/admin/orders/${orderId}/automate-shipping`);
      if (res.data.success) {
        showModal(`🚚 Resi Otomatis Berhasil Dibuat: ${res.data.data.trackingNumber}`, "success");
        fetchOrders();
      }
    } catch (error) {
      console.error("Automation error:", error);
      showModal("Gagal menjalankan otomasi logistik.", "error");
    } finally {
      setAutomating(null);
    }
  };

  const handleShowProof = (proofs, type) => {
    const safeProofs = proofs || [];
    const relevantProofs = safeProofs.filter(p => type === 'all' || p.proofType === type);
    if (relevantProofs.length === 0) {
      showModal(`Tidak ada bukti ${type === 'XENDIT_PAYMENT' ? 'pembayaran' : 'pengiriman'} ditemukan.`, 'info');
      return;
    }
    
    const proofText = relevantProofs.map(p => 
      `• [${p.createdAt}] ${p.description}\n  Ref: ${p.externalReference}`
    ).join('\n\n');
    
    showModal(`Detail Bukti:\n\n${proofText}`, 'info');
  };

  return (
    <div style={{ padding: '20px' }} onClick={() => setShowDropdown(false)}>

      {/* ── Modal Input Nomor Resi ── */}
      {resiModal.open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#1a1a24', border: '1px solid #333', borderRadius: '16px',
            padding: '30px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Truck size={20} color="#3498db" /> Input Nomor Resi
            </h3>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
              Pesanan #{resiModal.orderId} &bull; {resiModal.courierName}
            </p>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a0a0b0', marginBottom: '8px' }}>
              Nomor Resi (Waybill)
            </label>
            <input
              id="resi-input"
              type="text"
              autoFocus
              value={resiInput}
              onChange={(e) => setResiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShipWithResi()}
              placeholder="Contoh: JNE123456789ID"
              style={{
                width: '100%', padding: '12px', background: 'rgba(0,0,0,0.4)',
                border: '1px solid #444', color: '#fff', borderRadius: '8px',
                fontSize: '0.95rem', outline: 'none', marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleShipWithResi}
                style={{
                  flex: 1, padding: '12px', background: '#3498db', color: '#fff',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '0.9rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Truck size={16} /> Kirim Pesanan
              </button>
              <button
                onClick={() => { setResiModal({ open: false, orderId: null, courierName: '' }); setResiInput(''); }}
                style={{
                  padding: '12px 20px', background: 'rgba(255,255,255,0.07)',
                  color: '#ccc', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer'
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package color="#dc143c" /> Kelola Pesanan & Resi
        </h1>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Custom Dropdown */}
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  padding: '10px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333',
                  color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '8px', minWidth: '130px', justifyContent: 'space-between'
                }}
              >
                {searchTypeOptions.find(opt => opt.value === searchType)?.label}
                <motion.div animate={{ rotate: showDropdown ? 180 : 0 }}>
                  <Filter size={14} color="#888" />
                </motion.div>
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                      background: '#1a1a24', border: '1px solid #333', borderRadius: '8px',
                      width: '100%', overflow: 'hidden', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                  >
                    {searchTypeOptions.map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => { setSearchType(opt.value); setShowDropdown(false); setCurrentPage(0); }}
                        style={{
                          padding: '10px 15px', cursor: 'pointer', fontSize: '0.9rem',
                          background: searchType === opt.value ? 'rgba(220, 20, 60, 0.2)' : 'transparent',
                          color: searchType === opt.value ? 'var(--accent-crimson)' : '#ccc'
                        }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 10px 10px 38px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333',
                  color: '#fff', borderRadius: '8px', width: '200px', outline: 'none'
                }}
              />
            </div>
          </div>
          
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--accent-crimson)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Search size={16} /> Cari
          </button>
          <button type="button" onClick={() => { setSearchTerm(''); setCurrentPage(0); fetchOrders(); }} style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
            Reset
          </button>
        </form>
      </div>

      {/* Admin Tabs - Custom Color Coded sesuai permintaan user */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px', overflowX: 'auto' }}>
        {[
          { id: 'all', label: 'SEMUA', color: '#f1c40f', badge: false }, // Kuning
          { id: 'Waiting_Verification', label: 'VALIDASI BAYAR 💸', color: '#2ecc71', badge: orders.some(o => o.status === 'Waiting_Verification') }, // Hijau
          { id: 'Processing', label: 'PROCESSING', color: '#3498db', badge: false }, // Biru
          { id: 'Shipped', label: 'SHIPPED', color: '#fff', badge: orders.some(o => o.status === 'Shipped' && o.trackingHistory?.some(h => h.description?.toLowerCase().includes("sampai"))) }, // Putih
          { id: 'Completed', label: 'COMPLETED', color: '#e67e22', badge: false }, // Oranye
          { id: 'Cancelled', label: 'CANCELLED', color: '#555', badge: false }, // Hitam
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCurrentPage(0); }}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: activeTab === tab.id ? `2px solid ${tab.color}` : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              background: activeTab === tab.id ? `${tab.color}20` : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? tab.color : '#888',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            {tab.badge && (
              <span style={{ 
                width: '8px', 
                height: '8px', 
                background: '#dc143c', 
                borderRadius: '50%', 
                display: 'inline-block',
                boxShadow: '0 0 10px #dc143c'
              }}></span>
            )}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid #333', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spinner" size={40} color="var(--accent-crimson)" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '15px', color: '#888' }}>Memuat data pesanan...</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Order ID / Tgl</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Alamat & Info Pembayaran</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Total</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Status</th>
                  <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <motion.tr
                      key={order.orderId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ borderBottom: '1px solid #222' }}
                    >
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ fontWeight: 'bold' }}>#{order.orderId}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '15px 20px', maxWidth: '300px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>
                          {order.shippingAddress}
                        </div>
                        {/* BUKTI PEMBAYARAN XENDIT */}
                        {order.status === 'Waiting_Verification' && (
                          <div style={{ padding: '8px', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '6px', border: '1px dashed rgba(46, 204, 113, 0.3)', marginTop: '5px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#2ecc71', fontWeight: 'bold', marginBottom: '2px' }}>BUKTI XENDIT LUNAS:</div>
                            <div style={{ fontSize: '0.65rem', color: '#888' }}>Ref: <span style={{ color: '#aaa' }}>{order.paymentInvoiceId || 'N/A'}</span></div>
                            <div style={{ fontSize: '0.65rem', color: '#888' }}>Metode: <span style={{ color: '#aaa' }}>{order.paymentMethod || 'E-Wallet/VA'}</span></div>
                          </div>
                        )}
                        {order.status !== 'Waiting_Verification' && (
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>
                            <div>Kurir: {order.courierName}</div>
                            {order.trackingNumber && (
                              <div style={{ color: '#3498db', fontWeight: 'bold', marginTop: '2px' }}>Resi: {order.trackingNumber}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '15px 20px', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>
                        Rp {order.finalAmount?.toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background:
                            order.status === 'Waiting_Verification' ? 'rgba(241, 196, 15, 0.1)' :
                            order.status === 'Processing' ? 'rgba(52, 152, 219, 0.1)' :
                            order.status === 'Shipped' ? 'rgba(155, 89, 182, 0.1)' :
                            order.status === 'Cancelled' ? 'rgba(231, 76, 60, 0.1)' :
                            'rgba(255,255,255,0.05)',
                          color:
                            order.status === 'Waiting_Verification' ? '#f1c40f' :
                            order.status === 'Processing' ? '#3498db' :
                            order.status === 'Shipped' ? '#9b59b6' :
                            order.status === 'Cancelled' ? '#e74c3c' :
                            '#888'
                        }}>
                          {order.status === 'Waiting_Verification' ? 'TERBAYAR (CEK)' : order.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        {(order.status === 'Waiting_Verification' || order.status === 'Pending') ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleValidatePayment(order.orderId)}
                              title="Validasi pembayaran — ubah ke Processing"
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                            >
                              <CheckCircle size={16} /> {order.status === 'Pending' ? 'Simulasi Bayar (Dev)' : '✅ Terima & Proses'}
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.orderId)}
                              style={{ padding: '8px', background: 'rgba(220, 20, 60, 0.1)', color: '#dc143c', border: '1px solid #dc143c', borderRadius: '6px', cursor: 'pointer' }}
                              title="Batalkan Pesanan"
                            >
                              Batal
                            </button>
                            {order.paymentProofs?.some(p => p.proofType === 'XENDIT_PAYMENT') && (
                              <button 
                                onClick={() => handleShowProof(order.paymentProofs, 'XENDIT_PAYMENT')}
                                style={{ padding: '8px 12px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid #2ecc71', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                              >
                                Bukti Bayar
                              </button>
                            )}
                          </div>
                        ) : order.status === 'Processing' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle size={16} color="#2ecc71" />
                              <span style={{ fontSize: '0.8rem', color: '#2ecc71', fontWeight: 'bold' }}>TRANSAKSI DITERIMA</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#888' }}>Sedang dikemas. Masukkan resi untuk mengirim.</div>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleAutomateShipping(order.orderId)}
                                disabled={automating === order.orderId}
                                style={{ 
                                  flex: 1, display: 'flex', alignItems: 'center', gap: '8px', 
                                  padding: '8px 14px', background: '#9b59b6', color: '#fff', 
                                  border: 'none', borderRadius: '6px', cursor: automating === order.orderId ? 'not-allowed' : 'pointer', 
                                  fontWeight: 'bold', fontSize: '0.8rem' 
                                }}
                              >
                                {automating === order.orderId ? <Loader2 size={16} className="spinner" /> : <Truck size={16} />}
                                {automating === order.orderId ? 'Memproses...' : 'Kirim Otomatis (Resi)'}
                              </button>

                              <button
                                onClick={() => {
                                  setResiInput('');
                                  setResiModal({ open: true, orderId: order.orderId, courierName: order.courierName || 'Kurir' });
                                }}
                                style={{ padding: '8px 12px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid #3498db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                                title="Input Resi Manual"
                              >
                                Manual
                              </button>
                            </div>
                            
                            <button
                              onClick={() => handleCancelOrder(order.orderId)}
                              style={{ padding: '7px 12px', background: 'rgba(220, 20, 60, 0.08)', color: '#dc143c', border: '1px solid #dc143c', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Batalkan
                            </button>
                          </div>
                        ) : order.status === 'Shipped' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9b59b6', fontSize: '0.85rem' }}>
                              <Truck size={16} color="#9b59b6" />
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#9b59b6' }}>DALAM PENGIRIMAN</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Resi: {order.trackingNumber || '-'}</div>
                              </div>
                            </div>

                            {/* Tombol Delivered (Sampai) */}
                            {order.status === 'Shipped' && (
                              <button
                                onClick={() => handleDelivered(order.orderId)}
                                style={{ padding: '8px 12px', background: 'var(--accent-crimson)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '5px' }}
                              >
                                Tandai Sampai (Delivered)
                              </button>
                            )}

                            {/* Tombol Konfirmasi Audit Otomatis jika sudah sampai */}
                            {(order.status === 'Shipped' || order.status === 'Delivered') && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Konfirmasi bahwa pesanan ini benar-benar selesai untuk keperluan audit toko?")) return;
                                  try {
                                    await axiosInstance.patch(`/api/v1/orders/${order.orderId}/status`, null, {
                                      params: { status: 'Completed' }
                                    });
                                    showModal("Pesanan berhasil diselesaikan dan dicatat untuk audit!", "success");
                                    fetchOrders();
                                  } catch (err) {
                                    console.error(err);
                                    showModal("Gagal melakukan konfirmasi audit.", "error");
                                  }
                                }}
                                style={{ padding: '8px 12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                              >
                                Selesaikan Pesanan (Audit)
                              </button>
                            )}
                             {/* Tombol Bukti */}
                             <div style={{ display: 'flex', gap: '5px' }}>
                               {order.paymentProofs?.some(p => p.proofType === 'XENDIT_PAYMENT') && (
                                 <button 
                                   onClick={() => handleShowProof(order.paymentProofs, 'XENDIT_PAYMENT')}
                                   style={{ padding: '6px 10px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid #2ecc71', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                 >
                                   Bukti Xendit
                                 </button>
                               )}
                               {order.paymentProofs?.some(p => p.proofType === 'SHIPPING_RECEIPT') && (
                                 <button 
                                   onClick={() => handleShowProof(order.paymentProofs, 'SHIPPING_RECEIPT')}
                                   style={{ padding: '6px 10px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid #3498db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                 >
                                   Bukti Pengiriman
                                 </button>
                               )}
                             </div>
                           </div>
                         ) : (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ color: '#888', fontSize: '0.85rem' }}>Pesanan {order.status}</span>
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {(order.paymentProofs || []).some(p => p.proofType === 'XENDIT_PAYMENT') && (
                                  <button 
                                    onClick={() => handleShowProof(order.paymentProofs, 'XENDIT_PAYMENT')}
                                    style={{ padding: '6px 10px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid #2ecc71', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                  >
                                    Bukti Xendit
                                  </button>
                                )}
                                {(order.paymentProofs || []).some(p => p.proofType === 'SHIPPING_RECEIPT') && (
                                  <button 
                                    onClick={() => handleShowProof(order.paymentProofs, 'SHIPPING_RECEIPT')}
                                    style={{ padding: '6px 10px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid #3498db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                  >
                                    Bukti Pengiriman
                                  </button>
                                )}
                                {(!order.paymentProofs || order.paymentProofs.length === 0) && (
                                  <button 
                                    onClick={() => handleShowProof(order.paymentProofs, 'all')}
                                    style={{ padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', color: '#ccc', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                  >
                                    Lihat Semua Bukti (Audit)
                                  </button>
                                )}
                              </div>
                           </div>
                         )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
                      Tidak ada pesanan yang sesuai filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid #333' }}>
                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                  Menampilkan <span style={{ color: '#fff' }}>{orders.length}</span> dari <span style={{ color: '#fff' }}>{totalItems}</span> pesanan
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage === 0 ? '#444' : '#fff', borderRadius: '6px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                    Halaman {currentPage + 1} dari {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages - 1}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{ padding: '8px 15px', background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage === totalPages - 1 ? '#444' : '#fff', borderRadius: '6px', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
