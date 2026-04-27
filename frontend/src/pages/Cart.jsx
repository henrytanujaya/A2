import React from 'react';
import { useCart } from '../contexts/CartContext';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { cart, removeFromCart } = useCart();

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px', minHeight: '80vh', position: 'relative', zIndex: 10 }}>
      <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>Keranjang Belanja</h1>
      
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: 'var(--card-bg)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ShoppingBag size={64} color="#666" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: 'var(--text-muted)' }}>Keranjangmu masih kosong</h2>
          <Link to="/" className="nav-btn primary" style={{ display: 'inline-block', marginTop: '20px' }}>Mulai Berbelanja</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* Item List */}
          <div style={{ flex: '1 1 600px' }}>
            {cart.map((item) => (
              <div key={item.cartId} style={{ 
                display: 'flex', gap: '20px', background: 'var(--card-bg)', padding: '20px', 
                borderRadius: '10px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.1)', alignItems: 'center'
              }}>
                {/* Image Handle */}
                <div style={{ width: '100px', height: '100px', background: '#111', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #333' }}>
                  {(item.imageUrl || item.image) ? (
                     <img src={item.imageUrl || item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                     <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '10px', textAlign: 'center', padding: '5px' }}>
                        OTAKU PREMIUM
                     </div>
                  )}
                </div>
                
                {/* Details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{item.name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                    {item.details}
                  </div>
                  <div style={{ color: 'var(--accent-crimson)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Rp {item.price.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Remove Act */}
                <button 
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid #ff4444', 
                           padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', transition: 'all 0.2s ease' }}
                  title="Hapus Item"
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ff4444'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div style={{ flex: '1 1 300px', height: 'fit-content', background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Ringkasan Belanja</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: 'var(--text-muted)' }}>
              <span>Total Item:</span>
              <span>{cart.length} Barang</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total Harga:</span>
              <span style={{ color: 'var(--accent-crimson)' }}>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
            <Link to="/checkout" className="nav-btn primary" style={{ display: 'block', width: '100%', padding: '15px', fontSize: '1.1rem', textAlign: 'center', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
              Checkout Sekarang
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
