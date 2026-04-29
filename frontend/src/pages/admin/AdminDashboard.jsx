import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import { useModal } from '../../contexts/ModalContext';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModal();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/admin/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        showModal("Gagal mengambil data dashboard", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [showModal]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="spinner" size={40} color="var(--accent-crimson)" />
      </div>
    );
  }

  const stats = [
    { title: 'Total Costumer', value: data?.totalCustomer || 0, icon: <Users size={24} color="#3498db" />, bg: 'rgba(52, 152, 219, 0.1)' },
    { title: 'Total Pesanan', value: data?.totalOrder || 0, icon: <ShoppingBag size={24} color="#2ecc71" />, bg: 'rgba(46, 204, 113, 0.1)' },
    { title: 'Pendapatan', value: `Rp ${data?.revenue?.toLocaleString('id-ID') || 0}`, icon: <DollarSign size={24} color="#f1c40f" />, bg: 'rgba(241, 196, 15, 0.1)' },
    { title: 'Peringatan Stok', value: `${data?.stockWarning || 0} Item`, icon: <AlertTriangle size={24} color="#e74c3c" />, bg: 'rgba(231, 76, 60, 0.1)' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '20px' }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#fff' }}>Dashboard Ringkasan</h1>
      <p style={{ color: '#a0a0b0', marginBottom: '30px' }}>Selamat datang di panel kendali admin.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            background: 'rgba(26, 26, 36, 0.8)',
            border: '1px solid rgba(220, 20, 60, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '50px', height: '50px',
              borderRadius: '10px', background: stat.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {stat.icon}
            </div>
            <div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#a0a0b0', fontWeight: 'normal' }}>{stat.title}</h3>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'rgba(26, 26, 36, 0.8)',
        border: '1px solid rgba(220, 20, 60, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '300px'
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#fff' }}>Aktivitas Terbaru</h2>
        {data?.recentActivities?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Waktu</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Tipe</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivities.map((act, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '15px 20px', color: '#ccc', fontSize: '0.85rem' }}>
                    {new Date(act.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: act.type === 'ORDER' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(241, 196, 15, 0.1)',
                      color: act.type === 'ORDER' ? '#3498db' : '#f1c40f'
                    }}>
                      {act.type}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', color: '#fff', fontSize: '0.9rem' }}>
                    {act.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: '#a0a0b0', textAlign: 'center', marginTop: '100px' }}>
            Belum ada aktivitas.
          </div>
        )}
      </div>
    </motion.div>
  );
}
