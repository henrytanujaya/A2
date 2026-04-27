import React, { useEffect, useState } from 'react';
import { Package, Search, Filter, Truck, Save, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import { useModal } from '../../contexts/ModalContext';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, processing (perlu resi), shipped, completed
  const { showModal } = useModal();

  // State for tracking input
  const [editTracking, setEditTracking] = useState({}); // { orderId: { courierCode, trackingNumber } }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/orders/all');
      if (res.data.success) {
        setOrders(res.data.data.reverse());
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
  }, []);

  const handleUpdateTracking = async (orderId) => {
    const data = editTracking[orderId];
    if (!data?.courierCode || !data?.trackingNumber) {
      showModal("Mohon isi kode kurir dan nomor resi.", "error");
      return;
    }

    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, null, {
        params: {
          courierCode: data.courierCode.toLowerCase(),
          trackingNumber: data.trackingNumber,
          status: 'Shipped' // Automatically move to Shipped when resi is added
        }
      });
      showModal("Nomor resi berhasil disimpan & status diubah ke SHIPPED!", "success");
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error("Update tracking error:", error);
      showModal("Gagal memperbarui nomor resi.", "error");
    }
  };

  const handleValidatePayment = async (orderId) => {
    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/status`, null, {
        params: {
          status: 'Processing'
        }
      });
      showModal("Pembayaran berhasil divalidasi!", "success");
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
        params: {
          status: 'Cancelled'
        }
      });
      showModal("Pesanan berhasil dibatalkan.", "success");
      fetchOrders();
    } catch (error) {
      console.error("Cancel order error:", error);
      showModal("Gagal membatalkan pesanan.", "error");
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId.toString().includes(searchTerm) ||
      (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'perlu_resi') {
      return matchesSearch && order.status === 'Processing' && (!order.trackingNumber || order.trackingNumber === 'null' || order.trackingNumber === '');
    }
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && order.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package color="#dc143c" /> Kelola Pesanan & Resi
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input 
              type="text" 
              placeholder="Cari ID Pesanan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 10px 10px 38px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid #333',
                color: '#fff',
                borderRadius: '8px',
                width: '250px'
              }}
            />
          </div>
          <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        {['all', 'Waiting_Verification', 'perlu_resi', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#fff' : '#888',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'all' ? 'Semua' : tab === 'Waiting_Verification' ? 'Validasi Pembayaran 💸' : tab === 'perlu_resi' ? 'Perlu Input Resi ⚠️' : tab.toUpperCase()}
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Order ID / Tgl</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Alamat Pengiriman</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Total</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Aksi / Input Resi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, idx) => (
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
                    <td style={{ padding: '15px 20px', maxWidth: '250px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.shippingAddress}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>Kurir: {order.courierName}</div>
                    </td>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>
                      Rp {order.finalAmount.toLocaleString('id-ID')}
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
                          'rgba(255,255,255,0.05)',
                        color: 
                          order.status === 'Waiting_Verification' ? '#f1c40f' :
                          order.status === 'Processing' ? '#3498db' : 
                          order.status === 'Shipped' ? '#9b59b6' : 
                          '#888'
                      }}>
                        {order.status === 'Waiting_Verification' ? 'WAITING VERIF' : order.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      {(order.status === 'Waiting_Verification' || order.status === 'Pending') ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleValidatePayment(order.orderId)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                          >
                            <CheckCircle size={16} /> {order.status === 'Pending' ? 'Simulasi Bayar (Dev)' : 'Validasi Pembayaran'}
                          </button>
                          <button 
                            onClick={() => handleCancelOrder(order.orderId)}
                            style={{ padding: '8px', background: 'rgba(220, 20, 60, 0.1)', color: '#dc143c', border: '1px solid #dc143c', borderRadius: '6px', cursor: 'pointer' }}
                            title="Batalkan Pesanan"
                          >
                            Batal
                          </button>
                        </div>
                      ) : order.status === 'Processing' && !order.trackingNumber ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            placeholder="Kode (jne/jnt)" 
                            value={editTracking[order.orderId]?.courierCode || ''}
                            onChange={(e) => setEditTracking(prev => ({ ...prev, [order.orderId]: { ...prev[order.orderId], courierCode: e.target.value } }))}
                            style={{ padding: '6px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px', width: '90px', fontSize: '0.8rem' }}
                          />
                          <input 
                            type="text" 
                            placeholder="No. Resi" 
                            value={editTracking[order.orderId]?.trackingNumber || ''}
                            onChange={(e) => setEditTracking(prev => ({ ...prev, [order.orderId]: { ...prev[order.orderId], trackingNumber: e.target.value } }))}
                            style={{ padding: '6px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px', width: '120px', fontSize: '0.8rem' }}
                          />
                          <button 
                            onClick={() => handleUpdateTracking(order.orderId)}
                            style={{ padding: '6px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            title="Simpan & Kirim"
                          >
                            <Save size={16} />
                          </button>
                        </div>
                      ) : order.trackingNumber ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2ecc71', fontSize: '0.85rem' }}>
                          <CheckCircle size={16} /> {order.courierCode?.toUpperCase()}: {order.trackingNumber}
                        </div>
                      ) : (
                        <span style={{ color: '#555', fontSize: '0.85rem' }}>N/A</span>
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
        )}
      </div>
    </div>
  );
}
