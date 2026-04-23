import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowRight, CreditCard } from 'lucide-react';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('kitsune_orders') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Filter by current user email and UNPAID status
    const myUnpaidOrders = savedOrders.filter(
      o => o.customer.email === currentUser.email && o.status === 'UNPAID'
    );
    
    // Reverse to show newest first
    setOrders(myUnpaidOrders.reverse());
  }, []);

  const handlePayNow = (invoiceData) => {
    navigate('/invoice', { state: { invoiceData } });
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px', minHeight: '80vh', position: 'relative', zIndex: 10 }}>
      <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Pesanan Saya</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
        Daftar tagihan yang belum Anda bayar. Segera selesaikan pembayaran agar pesanan dapat diproses.
      </p>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Package size={64} color="#555" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#888' }}>Tidak ada tagihan yang belum dibayar</h2>
          <button onClick={() => navigate('/manga')} className="nav-btn primary" style={{ marginTop: '20px' }}>Belanja Sekarang</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {orders.map((order, idx) => (
            <motion.div 
              key={order.invoiceId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(220, 20, 60, 0.3)', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 5px 0' }}>{order.invoiceId}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.date}</span>
                </div>
                <span style={{ padding: '4px 8px', background: 'rgba(241, 196, 15, 0.1)', color: '#f39c12', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>UNPAID</span>
              </div>
              
              <div style={{ marginBottom: '20px', flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>{order.items.length} Barang</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>Rp {order.summary.total.toLocaleString('id-ID')}</div>
              </div>

              <button 
                onClick={() => handlePayNow(order)}
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
