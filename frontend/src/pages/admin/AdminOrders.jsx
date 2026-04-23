import React, { useEffect, useState } from 'react';
import { Package, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('kitsune_orders') || '[]');
    setOrders(savedOrders.reverse());
  }, []);

  const filteredOrders = orders.filter(order => 
    order.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package color="#dc143c" /> Kelola Pesanan
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input 
              type="text" 
              placeholder="Cari invoice atau nama..." 
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
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid #333', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid #333' }}>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500', width: '25%' }}>Invoice / Tanggal</th>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500', width: '25%' }}>Pelanggan</th>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500', width: '15%' }}>Total Tagihan</th>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500', width: '20%' }}>Status</th>
              <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500', width: '15%' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, idx) => (
                <motion.tr 
                  key={order.invoiceId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ borderBottom: '1px solid #333' }}
                >
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{order.invoiceId}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{order.date}</div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{order.customer.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{order.customer.email}</div>
                  </td>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>
                    Rp {order.summary.total.toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ 
                      padding: '5px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      background: order.status === 'LUNAS' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(241, 196, 15, 0.1)',
                      color: order.status === 'LUNAS' ? '#2ecc71' : '#f39c12',
                      border: `1px solid ${order.status === 'LUNAS' ? '#2ecc71' : '#f1c40f'}`
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <button style={{ padding: '8px 12px', background: 'var(--accent-crimson)', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem' }}>Detail</button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
                  Tidak ada pesanan ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
