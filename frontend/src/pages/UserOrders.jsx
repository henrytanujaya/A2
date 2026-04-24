import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingOrders = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/v1/orders');
        if (res.data.success) {
          // Filter only Pending status from backend
          const pending = res.data.data.filter(o => o.status === 'Pending');
          setOrders(pending.reverse());
        }
      } catch (error) {
        console.error("Failed to fetch pending orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingOrders();
  }, []);

  const handlePayNow = (orderId) => {
    navigate(`/invoice/${orderId}`);
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px', minHeight: '80vh', position: 'relative', zIndex: 10 }}>
      <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Pesanan Saya</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
        Daftar tagihan yang belum Anda bayar. Segera selesaikan pembayaran agar pesanan dapat diproses.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Loader2 size={40} className="spinner" color="var(--accent-crimson)" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '15px', color: 'var(--text-muted)' }}>Memuat pesanan...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Package size={64} color="#555" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#888' }}>Tidak ada tagihan yang belum dibayar</h2>
          <button onClick={() => navigate('/manga')} className="nav-btn primary" style={{ marginTop: '20px' }}>Belanja Sekarang</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {orders.map((order, idx) => (
            <motion.div 
              key={order.orderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(220, 20, 60, 0.3)', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 5px 0' }}>INV-{order.orderId}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <span style={{ padding: '4px 8px', background: 'rgba(241, 196, 15, 0.1)', color: '#f39c12', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>UNPAID</span>
              </div>
              
              <div style={{ marginBottom: '20px', flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>{order.courierName}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>Rp {order.finalAmount.toLocaleString('id-ID')}</div>
              </div>
 
              <button 
                onClick={() => handlePayNow(order.orderId)}
                className="nav-btn primary"
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', width: '100%', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                <CreditCard size={18} /> Bayar Tagihan <ArrowRight size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
