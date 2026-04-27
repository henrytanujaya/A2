import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight, CreditCard, Loader2, Truck, AlertTriangle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useModal } from '../contexts/ModalContext';

export default function UserOrders() {
  const [activeTab, setActiveTab] = useState('unpaid');
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [waitingOrders, setWaitingOrders] = useState([]);
  const [shippingOrders, setShippingOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevStatuses, setPrevStatuses] = useState({}); // Untuk deteksi perubahan status
  const navigate = useNavigate();
  const { showModal } = useModal();

  useEffect(() => {
    const fetchOrders = async (isPolling = false) => {
      if (!isPolling) setLoading(true);
      try {
        const res = await axiosInstance.get('/api/v1/orders');
        if (res.data.success) {
          const allOrders = res.data.data;
          
          setPrevStatuses(prev => {
            // Deteksi Perubahan Status (Real-time Popup)
            allOrders.forEach(order => {
               const oldStatus = prev[order.orderId];
               if (oldStatus && oldStatus !== order.status) {
                  if (order.status === 'Shipped' || order.status === 'Processing') {
                     showModal(`Hore! Pesanan INV-${order.orderId} telah dikonfirmasi Admin dan sedang disiapkan.`, 'success');
                  } else if (order.status === 'STOCK_CONFLICT') {
                     showModal(`Perhatian: Pesanan INV-${order.orderId} memiliki kendala stok. Harap hubungi Admin untuk penyesuaian.`, 'error');
                  }
               }
            });

            // Update Map Status baru
            const newStatusMap = {};
            allOrders.forEach(o => newStatusMap[o.orderId] = o.status);
            return newStatusMap;
          });

          // Filter Kategorisasi
          const unpaid = allOrders.filter(o => o.status === 'Pending').reverse();
          const waiting = allOrders.filter(o => o.status === 'Waiting_Verification' || o.status === 'STOCK_CONFLICT').reverse();
          const shipping = allOrders.filter(o => o.status === 'Processing' || o.status === 'Shipped').reverse();
          const rejected = allOrders.filter(o => o.status === 'Cancelled').reverse();
          const completed = allOrders.filter(o => o.status === 'Completed' || o.status === 'Paid').reverse();
          
          setUnpaidOrders(unpaid);
          setWaitingOrders(waiting);
          setShippingOrders(shipping);
          setRejectedOrders(rejected);
          setCompletedOrders(completed);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        if (!isPolling) setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 5000);
    return () => clearInterval(interval);
  }, []); // Kosongkan dependency array agar tidak loop

  const handleViewInvoice = (orderId) => {
    navigate(`/invoice/${orderId}`);
  };

  const currentOrders = 
    activeTab === 'unpaid' ? unpaidOrders : 
    activeTab === 'waiting' ? waitingOrders : 
    activeTab === 'shipping' ? shippingOrders : 
    activeTab === 'rejected' ? rejectedOrders : completedOrders;

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px', minHeight: '80vh', position: 'relative', zIndex: 10 }}>
      <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Pesanan Saya</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
        Pantau status pembayaran dan pengiriman pesanan Anda di sini.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '12px', width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'unpaid', label: 'Belum Bayar', count: unpaidOrders.length },
          { id: 'waiting', label: 'Menunggu Konfirmasi', count: waitingOrders.length },
          { id: 'shipping', label: 'Dikirim', count: shippingOrders.length },
          { id: 'completed', label: 'Selesai', count: completedOrders.length },
          { id: 'rejected', label: 'Ditolak', count: rejectedOrders.length },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              background: activeTab === tab.id ? 'var(--accent-crimson)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#888',
              fontSize: '0.85rem'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Loader2 size={40} className="spinner" color="var(--accent-crimson)" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '15px', color: 'var(--text-muted)' }}>Memuat pesanan...</p>
        </div>
      ) : currentOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Package size={64} color="#555" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#888' }}>Tidak ada pesanan di kategori ini</h2>
          <button onClick={() => navigate('/manga')} className="nav-btn primary" style={{ marginTop: '20px' }}>Belanja Sekarang</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {currentOrders.map((order, idx) => (
            <motion.div 
              key={order.orderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 5px 0' }}>INV-{order.orderId}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <span style={{ 
                  padding: '4px 8px', 
                  background: 
                    activeTab === 'unpaid' ? 'rgba(241, 196, 15, 0.1)' : 
                    order.status === 'STOCK_CONFLICT' ? 'rgba(231, 76, 60, 0.1)' :
                    activeTab === 'waiting' ? 'rgba(52, 152, 219, 0.1)' : 
                    activeTab === 'rejected' ? 'rgba(231, 76, 60, 0.1)' : 
                    'rgba(46, 204, 113, 0.1)', 
                  color: 
                    activeTab === 'unpaid' ? '#f39c12' : 
                    order.status === 'STOCK_CONFLICT' ? '#e74c3c' :
                    activeTab === 'waiting' ? '#3498db' : 
                    activeTab === 'rejected' ? '#e74c3c' : 
                    '#2ecc71', 
                  borderRadius: '4px', 
                  fontSize: '0.7rem', 
                  fontWeight: 'bold' 
                }}>
                  {activeTab === 'unpaid' ? 'BELUM BAYAR' : 
                   order.status === 'STOCK_CONFLICT' ? 'KONFLIK STOK ⚠️' :
                   activeTab === 'waiting' ? 'MENUNGGU KONFIRMASI' : 
                   activeTab === 'rejected' ? 'DITOLAK' : 
                   order.status.toUpperCase()}
                </span>
              </div>
              
              <div style={{ marginBottom: '20px', flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                   <Truck size={14} /> {order.courierName}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>
                  Rp {order.finalAmount.toLocaleString('id-ID')}
                </div>
                {order.trackingNumber && (
                   <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '10px' }}>
                     Resi: <span style={{ color: '#fff' }}>{order.trackingNumber}</span>
                   </div>
                )}
              </div>
 
              <button 
                onClick={() => handleViewInvoice(order.orderId)}
                className="nav-btn primary"
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px', 
                  width: '100%', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  background: activeTab === 'unpaid' ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.1)'
                }}
              >
                {activeTab === 'unpaid' ? (
                  <> <CreditCard size={18} /> Bayar Sekarang <ArrowRight size={18} /> </>
                ) : order.status === 'STOCK_CONFLICT' ? (
                  <> <Package size={18} /> Resolusi Konflik Stok </>
                ) : activeTab === 'waiting' ? (
                  <> <Package size={18} /> Lihat Bukti & Detail </>
                ) : activeTab === 'rejected' ? (
                  <> <Package size={18} /> Lihat Detail Pembatalan </>
                ) : (
                  <> <Package size={18} /> Detail & Lacak Paket </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
