import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle, Printer, ShoppingBag, ArrowLeft, Clock, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useModal } from '../contexts/ModalContext';

export default function InvoiceReceipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceData = location.state?.invoiceData;
  const [invoice, setInvoice] = useState(invoiceData);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const { clearCart } = useCart();
  const { showModal } = useModal();

  if (!invoice) {
    return <Navigate to="/" replace />;
  }

  const isPaid = invoice.status === 'LUNAS';

  const handlePrint = () => {
    window.print();
  };

  const handlePayment = () => {
    showModal(`Pembayaran sebesar Rp ${invoice.summary.total.toLocaleString('id-ID')} menggunakan ${paymentMethod} berhasil diproses!`, 'success', () => {
      setInvoice(prev => ({ ...prev, status: 'LUNAS', paymentMethod }));
      
      // Update global orders
      const savedOrders = JSON.parse(localStorage.getItem('kitsune_orders') || '[]');
      const updatedOrders = savedOrders.map(o => 
        o.invoiceId === invoice.invoiceId ? { ...o, status: 'LUNAS', paymentMethod } : o
      );
      localStorage.setItem('kitsune_orders', JSON.stringify(updatedOrders));

      clearCart();
    });
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px', minHeight: '80vh', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Invoice Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          background: '#ffffff', // Off-white/paper look
          color: '#111', 
          width: '100%', 
          maxWidth: '600px', 
          borderRadius: '10px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="invoice-card" // Useful for CSS print media query
      >
        {/* Top Accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: 'var(--accent-crimson)' }}></div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #ccc', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-crimson)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle color="#fff" size={24} />
              </div>
              <h2 className="brand-font" style={{ fontSize: '1.5rem', color: '#111', margin: 0 }}>KITSUNE NOIR</h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>E-Commerce Manga & Merchandise</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: '0 0 5px 0', color: 'var(--accent-crimson)' }}>INVOICE</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>{invoice.invoiceId}</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{invoice.date}</p>
            {isPaid ? (
              <div style={{ display: 'inline-block', marginTop: '10px', padding: '4px 10px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid #2ecc71', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                LUNAS
              </div>
            ) : (
              <div style={{ display: 'inline-block', marginTop: '10px', padding: '4px 10px', background: 'rgba(241, 196, 15, 0.1)', color: '#f39c12', border: '1px solid #f1c40f', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                BELUM DIBAYAR
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>Informasi Pengiriman</h4>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1rem' }}>{invoice.customer.name}</p>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>{invoice.customer.email}</p>
          <p style={{ margin: '0', fontSize: '0.9rem', color: '#555', whiteSpace: 'pre-line' }}>{invoice.customer.address}</p>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '0.9rem', color: '#666' }}>Deskripsi Produk</th>
                <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '0.9rem', color: '#666' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 0', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#777', whiteSpace: 'pre-line' }}>{item.details}</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '15px 0', verticalAlign: 'top', fontWeight: 'bold' }}>
                    Rp {item.price.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '2px dashed #ccc', paddingBottom: '20px', marginBottom: '20px' }}>
          <div style={{ width: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}>
              <span>Subtotal Produk</span>
              <span>Rp {invoice.summary.subtotal.toLocaleString('id-ID')}</span>
            </div>
            {invoice.summary.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#2ecc71' }}>
                <span>Diskon</span>
                <span>- Rp {invoice.summary.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#555' }}>
              <span>Ongkos Kirim ({invoice.courier})</span>
              <span>Rp {invoice.summary.shipping.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', color: '#555' }}>
              <span>PPN (11%)</span>
              <span>Rp {invoice.summary.ppn.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>
              <span>Total Akhir</span>
              <span>Rp {invoice.summary.total.toLocaleString('id-ID')}</span>
            </div>
            {isPaid && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem', color: '#777' }}>
                <span>Metode Pembayaran</span>
                <span style={{ fontWeight: 'bold' }}>{invoice.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Thanks */}
        <div style={{ textAlign: 'center', color: '#777', fontSize: '0.85rem' }}>
          {isPaid ? (
            <>
              <p style={{ margin: '0 0 5px 0' }}>Terima kasih atas pesanan Anda!</p>
              <p style={{ margin: 0 }}>Pesanan akan segera diproses dan dikirim ke alamat tujuan.</p>
            </>
          ) : (
            <p style={{ margin: 0 }}>Silakan selesaikan pembayaran agar pesanan dapat diproses.</p>
          )}
        </div>

      </motion.div>

      {/* Payment or Action Buttons */}
      <div className="no-print" style={{ width: '100%', maxWidth: '600px', marginTop: '20px' }}>
        {!isPaid ? (
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={20} color="#dc143c" /> Pilih Metode Pembayaran</h3>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', borderRadius: '8px', marginBottom: '20px' }}>
              <option value="QRIS">QRIS</option>
              <option value="BCA">Transfer BCA</option>
              <option value="MANDIRI">Transfer Mandiri</option>
              <option value="GOPAY">GoPay</option>
            </select>
            <button 
              onClick={handlePayment}
              className="nav-btn primary"
              style={{ width: '100%', padding: '15px', fontSize: '1.1rem', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Bayar Sekarang
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', background: 'transparent', border: '1px solid #fff', color: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#111'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
            >
              <Printer size={18} /> Cetak Bukti (PDF)
            </button>
            <button 
              onClick={() => navigate('/manga')}
              className="nav-btn primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold' }}
            >
              <ShoppingBag size={18} /> Belanja Lagi
            </button>
            <button 
              onClick={() => navigate('/profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <ArrowLeft size={18} /> Ke Profil
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-card, .invoice-card * {
            visibility: visible;
          }
          .invoice-card {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            box-shadow: none;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
