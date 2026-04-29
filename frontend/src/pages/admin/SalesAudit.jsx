import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, Loader2, DollarSign, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosInstance from '../../api/axiosInstance';
import { useModal } from '../../contexts/ModalContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function SalesAudit() {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState({ totalRevenue: 0, totalOrders: 0, transactions: [] });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { showModal } = useModal();

  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
    { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/audit/sales', {
        params: { month: selectedMonth, year: selectedYear }
      });
      if (res.data.success) {
        setAuditData({
          totalRevenue: res.data.data.totalRevenue || 0,
          totalOrders: res.data.data.totalOrders || 0,
          transactions: res.data.data.transactions || []
        });
      }
    } catch (error) {
      console.error("Failed to fetch audit data:", error);
      showModal("Gagal mengambil data audit.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [selectedMonth, selectedYear]);

  const exportToExcel = () => {
    if (auditData.transactions.length === 0) {
      showModal("Tidak ada data untuk diekspor.", "warning");
      return;
    }

    const worksheetData = auditData.transactions.map(t => ({
      "Order ID": `#${t.orderId}`,
      "Tanggal": new Date(t.createdAt).toLocaleDateString('id-ID'),
      "Status": t.status,
      "Metode Pembayaran": t.paymentMethod || '-',
      "Subtotal": t.totalAmount,
      "Diskon": t.discountCode || '-',
      "Total Akhir": t.finalAmount,
      "No Resi": t.trackingNumber || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Audit");

    // Add summary rows at the bottom
    XLSX.utils.sheet_add_aoa(worksheet, [
      [],
      ["RINGKASAN", ""],
      ["Total Transaksi", auditData.totalOrders],
      ["Total Pendapatan", auditData.totalRevenue]
    ], { origin: -1 });

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `Audit_Penjualan_${selectedMonth}_${selectedYear}.xlsx`);
    showModal("Laporan Excel berhasil diunduh!", "success");
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 color="#dc143c" /> Audit Penjualan
        </h1>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '10px', border: '1px solid #333' }}>
            <Calendar size={18} color="#888" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', outline: 'none' }}
            >
              {months.map(m => <option key={m.value} value={m.value} style={{ background: '#1a1a24' }}>{m.label}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer', outline: 'none' }}
            >
              {years.map(y => <option key={y} value={y} style={{ background: '#1a1a24' }}>{y}</option>)}
            </select>
          </div>

          <button 
            onClick={exportToExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#2ecc71', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.15), rgba(220, 20, 60, 0.05))', padding: '25px', borderRadius: '15px', border: '1px solid rgba(220, 20, 60, 0.3)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '10px' }}>Total Pendapatan</p>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>Rp {auditData.totalRevenue?.toLocaleString('id-ID')}</h2>
            </div>
            <div style={{ padding: '10px', background: 'rgba(220, 20, 60, 0.2)', borderRadius: '10px' }}>
              <DollarSign color="#dc143c" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(52, 152, 219, 0.05))', padding: '25px', borderRadius: '15px', border: '1px solid rgba(52, 152, 219, 0.3)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '10px' }}>Total Transaksi Sukses</p>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{auditData.totalOrders} Pesanan</h2>
            </div>
            <div style={{ padding: '10px', background: 'rgba(52, 152, 219, 0.2)', borderRadius: '10px' }}>
              <ShoppingBag color="#3498db" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid #333', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 className="spinner" size={40} color="var(--accent-crimson)" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '15px', color: '#888' }}>Menganalisa data penjualan...</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Order ID / Tgl</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Metode & Status</th>
                <th style={{ padding: '15px 20px', textAlign: 'left', color: '#a0a0b0', fontWeight: '500' }}>Diskon</th>
                <th style={{ padding: '15px 20px', textAlign: 'right', color: '#a0a0b0', fontWeight: '500' }}>Total Akhir</th>
              </tr>
            </thead>
            <tbody>
              {auditData.transactions.length > 0 ? (
                auditData.transactions.map((t) => (
                  <tr key={t.orderId} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ fontWeight: 'bold' }}>#{t.orderId}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(t.createdAt).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#ccc' }}>{t.paymentMethod || 'Lunas (Manual/Xendit)'}</div>
                      <div style={{ fontSize: '0.7rem', color: t.status === 'Completed' ? '#2ecc71' : '#3498db' }}>{t.status.toUpperCase()}</div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      {t.discountCode ? (
                        <span style={{ padding: '2px 8px', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', borderRadius: '4px', fontSize: '0.75rem' }}>{t.discountCode}</span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                      Rp {t.finalAmount?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
                    Tidak ada transaksi sukses pada periode ini.
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
