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
  const pageSize = 25;

  const { showModal } = useModal();

  const searchTypeOptions = [
    { value: 'id', label: 'ID Pesanan' },
    { value: 'tracking', label: 'Nomor Resi' },
    { value: 'status', label: 'Status' }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Menggunakan endpoint paged untuk server-side pagination & filtering
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

  // Fetch orders whenever filters or page change
  useEffect(() => {
    fetchOrders();
  }, [activeTab, searchType, currentPage]);

  // Reset page saat tab atau tipe cari berubah
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
      showModal("Pembayaran berhasil divalidasi dan pesanan diproses!", "success");
      fetchOrders();
    } catch (error) {
      console.error("Validation error:", error);
      showModal("Gagal memvalidasi pembayaran.", "error");
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, null, {
        params: { status: 'Cancelled' }
      });
      showModal("Pesanan berhasil dibatalkan.", "success");
      fetchOrders();
    } catch (error) {
      console.error("Cancel order error:", error);
      showModal("Gagal membatalkan pesanan.", "error");
    }
  };

  return (
    <div style={{ padding: '20px' }} onClick={() => setShowDropdown(false)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package color="#dc143c" /> Kelola Pesanan & Resi
        </h1>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Premium Custom Dropdown dari Upstream */}
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  padding: '10px 15px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '130px',
                  justifyContent: 'space-between'
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '8px',
                      background: '#1a1a24',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      width: '100%',
                      overflow: 'hidden',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                  >
                    {searchTypeOptions.map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setSearchType(opt.value);
                          setShowDropdown(false);
                          setCurrentPage(0);
                        }}
                        style={{
                          padding: '10px 15px',
                          cursor: 'pointer',
                          background: searchType === opt.value ? 'rgba(220, 20, 60, 0.2)' : 'transparent',
                          color: searchType === opt.value ? 'var(--accent-crimson)' : '#ccc',
                          transition: 'background 0.2s',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.target.style.background = searchType === opt.value ? 'rgba(220, 20, 60, 0.2)' : 'transparent'}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                placeholder={`Cari...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '10px 10px 10px 38px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #333',
                  color: '#fff',
                  borderRadius: '8px',
                  width: '200px',
                  outline: 'none'
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

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px', overflowX: 'auto' }}>
        {['all', 'Waiting_Verification', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(0); }}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#fff' : '#888',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab === 'all' ? 'Semua' : tab === 'Waiting_Verification' ? 'Validasi Pembayaran 💸' : tab.toUpperCase()}
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
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>Kurir: {order.courierName}</div>
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
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                            >
                              <CheckCircle size={16} /> {order.status === 'Pending' ? 'Simulasi Bayar (Dev)' : 'Proses & Kirim Pesanan'}
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.orderId)}
                              style={{ padding: '8px', background: 'rgba(220, 20, 60, 0.1)', color: '#dc143c', border: '1px solid #dc143c', borderRadius: '6px', cursor: 'pointer' }}
                              title="Batalkan Pesanan"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (order.status === 'Processing' || order.status === 'Shipped') ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2ecc71', fontSize: '0.85rem' }}>
                              <Truck size={16} color="#3498db" />
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#3498db' }}>{order.status === 'Processing' ? 'SEDANG DIPROSES' : 'DALAM PENGIRIMAN'}</div>
                                <div style={{ fontSize: '0.7rem', color: '#888' }}>Resi: {order.trackingNumber || 'Auto-Generated'}</div>
                              </div>
                            </div>

                            {/* Tombol Konfirmasi Audit Otomatis jika sudah sampai */}
                            {order.status === 'Shipped' && order.trackingHistory?.some(h => h.description?.toLowerCase().includes("sampai di tujuan")) && (
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Konfirmasi bahwa barang sudah sampai di tujuan untuk audit toko?")) return;
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
                                Konfirmasi Selesai (Audit)
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#555', fontSize: '0.85rem' }}>Pesanan {order.status}</span>
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
