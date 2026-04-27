import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
import { CheckCircle, Printer, ShoppingBag, ArrowLeft, Clock, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useModal } from '../contexts/ModalContext';
import axiosInstance from '../api/axiosInstance';
import { Truck, MapPin, Package, Calendar } from 'lucide-react';

export default function InvoiceReceipt() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId: paramOrderId } = useParams(); // For direct access via URL
  const invoiceData = location.state?.invoiceData;
  const [invoice, setInvoice] = useState(invoiceData);
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const { clearCart } = useCart();
  const { showModal } = useModal();
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(!invoiceData && !!paramOrderId);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoice && paramOrderId) {
        setLoadingInvoice(true);
        try {
          const res = await axiosInstance.get(`/api/v1/orders/${paramOrderId}`);
          if (res.data.success) {
            const order = res.data.data;
            // Map OrderResponseDTO to the internal invoice structure used by this page
            const mappedInvoice = {
              orderId: order.orderId,
              invoiceId: `INV-${order.orderId}`,
              date: new Date(order.createdAt).toLocaleString('id-ID'),
              status: (order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Completed' || order.status === 'Paid') ? 'LUNAS' : 
                      order.status === 'Waiting_Verification' ? 'WAITING' : 'UNPAID',
              paymentMethod: (order.status === 'Pending' || order.status === 'Waiting_Verification') ? '-' : 'Xendit',
              paymentUrl: order.paymentUrl,
              courier: order.courierName,
              courierCode: order.courierCode,
              trackingNumber: order.trackingNumber,
              customer: {
                name: order.shippingAddress.split('\n')[0] || 'User',
                email: '-',
                address: order.shippingAddress
              },
              items: (order.items || []).map(item => ({
                name: item.productName,
                details: `Qty: ${item.quantity} x Rp ${item.unitPrice.toLocaleString('id-ID')}`,
                price: item.totalPrice
              })),
              summary: {
                subtotal: order.totalAmount,
                discount: order.discountCode ? (order.totalAmount - order.finalAmount + 25000) : 0, // Estimasi diskon
                shipping: 25000, // Idealnya ini juga dari backend
                ppn: (order.finalAmount - 25000) * 0.11, // Estimasi PPN
                total: order.finalAmount
              }
            };
            setInvoice(mappedInvoice);
          }
        } catch (error) {
          console.error("Failed to fetch invoice:", error);
        } finally {
          setLoadingInvoice(false);
        }
      }
    };
    fetchInvoiceDetails();
    
    // Auto-polling jika status masih UNPAID atau WAITING
    let pollInterval;
    if (invoice && (invoice.status === 'UNPAID' || invoice.status === 'WAITING')) {
      pollInterval = setInterval(async () => {
        console.log("[POLLING] Checking order status...");
        
        // Simpan status lama
        const oldStatus = invoice.status;
        
        // Ambil data terbaru
        const res = await axiosInstance.get(`/api/v1/orders/${paramOrderId}`);
        if (res.data.success) {
          const newOrder = res.data.data;
          const newStatus = (newOrder.status === 'Processing' || newOrder.status === 'Shipped' || newOrder.status === 'Completed' || newOrder.status === 'Paid') ? 'LUNAS' : 
                          newOrder.status === 'Waiting_Verification' ? 'WAITING' : 'UNPAID';
          
          // Jika status berubah, beri jeda 1 detik sebelum update UI
          if (newStatus !== oldStatus) {
            console.log("[POLLING] Status changed! Waiting 1s...");
            setTimeout(() => {
              fetchInvoiceDetails();
            }, 1000);
          }
        }
      }, 5000); // Cek setiap 5 detik
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paramOrderId, invoice?.status]);

  useEffect(() => {
    if (invoice?.status === 'LUNAS' && invoice?.trackingNumber && !trackingData) {
      fetchTracking();
    }
  }, [invoice, trackingData]);

  if (loadingInvoice) {
    return <div className="container" style={{ paddingTop: '150px', textAlign: 'center', color: '#fff' }}>Memuat Invoice...</div>;
  }

  if (!invoice) {
    return <Navigate to="/" replace />;
  }

  const isPaid = invoice.status === 'LUNAS';
  const isWaiting = invoice.status === 'WAITING';

  const handlePrint = () => {
    window.print();
  };

  const handlePayment = () => {
    if (invoice.paymentUrl) {
      window.location.href = invoice.paymentUrl;
    } else {
      showModal("Link pembayaran tidak ditemukan. Silakan hubungi admin.", "error");
    }
  };

  const fetchTracking = async () => {
    if (!invoice.trackingNumber || invoice.trackingNumber === "" || invoice.trackingNumber === "null") {
      showModal("Mohon maaf nomor resi belum ada, mohon ditunggu", "info");
      return;
    }

    setLoadingTracking(true);
    setShowTracking(true);
    try {
      const response = await axiosInstance.get(`/api/v1/tracking/${invoice.courierCode}/${invoice.trackingNumber}`);
      if (response.data.success) {
        setTrackingData(response.data.data.data);
      } else {
        showModal(response.data.message || "Gagal melacak paket. Pastikan nomor resi valid.", "error");
        setShowTracking(false);
      }
    } catch (error) {
      console.error("Tracking fetch error:", error);
      const errorMsg = error.response?.data?.message || "Terjadi kesalahan saat menghubungi server tracking.";
      showModal(errorMsg, "error");
      setShowTracking(false);
    } finally {
      setLoadingTracking(false);
    }
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
            ) : isWaiting ? (
              <div style={{ display: 'inline-block', marginTop: '10px', padding: '4px 10px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid #3498db', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                MENUNGGU VERIFIKASI
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
            {(isPaid || isWaiting) && (
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
              {invoice.trackingNumber && (
                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>
                  No. Resi: {invoice.trackingNumber} ({invoice.courierCode?.toUpperCase()})
                </p>
              )}
              <p style={{ margin: '5px 0 0 0' }}>Pesanan akan segera diproses dan dikirim ke alamat tujuan.</p>
            </>
          ) : isWaiting ? (
            <p style={{ margin: 0 }}>Pembayaran Anda sedang dalam verifikasi oleh Admin.</p>
          ) : (
            <p style={{ margin: 0 }}>Silakan selesaikan pembayaran agar pesanan dapat diproses.</p>
          )}
        </div>

      </motion.div>

      {/* Tracking Section */}
      {showTracking && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ width: '100%', maxWidth: '600px', marginTop: '20px', background: '#fff', borderRadius: '10px', padding: '25px', color: '#111', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Truck color="var(--accent-crimson)" /> Lacak Pesanan</h3>
            <button onClick={() => setShowTracking(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>&times;</button>
          </div>

          {loadingTracking ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div className="spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--accent-crimson)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Menghubungkan ke BinderByte...</p>
            </div>
          ) : trackingData ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(220, 20, 60, 0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Status:</strong> {trackingData.summary.status}</p>
                <p style={{ margin: 0 }}><strong>Kurir:</strong> {trackingData.summary.courier} ({trackingData.summary.service})</p>
              </div>

              <div style={{ position: 'relative', paddingLeft: '30px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '5px', bottom: '5px', width: '2px', background: '#eee' }}></div>
                {trackingData.history.map((h, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: '20px' }}>
                    <div style={{ position: 'absolute', left: '-27px', top: '0', width: '12px', height: '12px', borderRadius: '50%', background: i === 0 ? 'var(--accent-crimson)' : '#ccc', border: '3px solid #fff', boxShadow: '0 0 0 2px ' + (i === 0 ? 'rgba(220, 20, 60, 0.2)' : '#eee'), zIndex: 2 }}></div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 'bold', color: i === 0 ? 'var(--accent-crimson)' : '#333' }}>{h.date}</p>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>{h.desc}</p>
                    {h.location && <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {h.location}</p>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#888' }}>Data tidak ditemukan</p>
          )}
        </motion.div>
      )}

      {/* Payment or Action Buttons */}
      <div className="no-print" style={{ width: '100%', maxWidth: '600px', marginTop: '20px' }}>
        {!isPaid && !isWaiting ? (
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: '#a0a0b0', fontSize: '0.9rem', marginBottom: '15px' }}>
              Anda akan diarahkan ke halaman pembayaran aman <strong>Xendit</strong>. Mendukung Virtual Account, E-Wallet, QRIS, dan Gerai Retail.
            </p>
            <button 
              onClick={handlePayment}
              className="nav-btn primary"
              style={{ width: '100%', padding: '15px', fontSize: '1.1rem', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <CreditCard size={20} /> Bayar Sekarang (Xendit)
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
            {isPaid && (invoice.trackingNumber) && (
              <button 
                onClick={fetchTracking}
                className="nav-btn primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 25px', border: 'none', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', width: '100%', marginTop: '10px', justifyContent: 'center' }}
              >
                <Truck size={18} /> Lacak Paket (Real-time)
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--accent-crimson);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }
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
