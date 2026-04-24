import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import axiosInstance from '../api/axiosInstance';

export default function Merchandise() {
  const { addToCart } = useCart();
  const [merchProducts, setMerchProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMerch = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/products');
        if (response.data.success) {
          const allProducts = response.data.data;
          // Filter anything that is not Manga or Bluray, mostly ActionFigure or Outfit
          const merch = allProducts.filter(p => p.category === 'ActionFigure' || p.category === 'Outfit');
          setMerchProducts(merch);
        }
      } catch (err) {
        console.error('Failed to fetch merchandise', err);
        setError('Gagal memuat data merchandise. Pastikan server backend aktif.');
      } finally {
        setLoading(false);
      }
    };
    fetchMerch();
  }, []);

  return (
    <div className="page-container manga-page" style={{ paddingTop: '100px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Page Header */}
      <div className="container" style={{ marginBottom: '40px' }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Merchandise & Action Figure</h1>
        <p style={{ color: 'var(--text-muted)' }}>Pilih merchandise terbaikmu: dari Custom Pakaian hingga 3D Action Figure berkualitas tinggi.</p>
      </div>

      <div className="container">
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading merchandise...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(220,20,60,0.1)', borderRadius: '12px', border: '1px dashed rgba(220,20,60,0.3)' }}>
            <p style={{ color: '#dc143c', marginBottom: '10px', fontWeight: 'bold' }}>⚠️ Koneksi Gagal</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
          </div>
        ) : (
          <div style={{ marginBottom: '50px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px' }}>
            {merchProducts.length === 0 && <div style={{ color: '#ccc' }}>Belum ada merchandise saat ini.</div>}
            
            {merchProducts.map((pkg, index) => (
              <motion.div 
                className="product-card" 
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{ display: 'flex', flexDirection: 'row', width: 'calc(50% - 15px)', minWidth: '450px', alignItems: 'stretch' }}
              >
                <div style={{ width: '220px', flexShrink: 0, overflow: 'hidden' }}>
                  <img src={pkg.imageUrl} alt={pkg.name} className="product-image" style={{ height: '100%', objectFit: 'cover', borderRadius: '8px 0 0 8px' }} />
                </div>
                <div className="product-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--accent-crimson)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {pkg.category}
                  </span>
                  <h3 className="product-title" style={{ fontSize: '18px', marginTop: '4px', marginBottom: '8px' }}>{pkg.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px', lineHeight: '1.4' }}>
                    Koleksi eksklusif Kitsune Noir.
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    <p className="product-price" style={{ fontSize: '14px', marginBottom: '10px' }}>Harga: Rp {pkg.price.toLocaleString('id-ID')}</p>
                    <button 
                      onClick={() => addToCart({
                        productId: pkg.id,
                        name: pkg.name,
                        price: pkg.price,
                        imageUrl: pkg.imageUrl,
                        details: `Kategori: ${pkg.category}`,
                        quantity: 1
                      })}
                      className="add-to-cart-btn" 
                      style={{ width: '100%' }}
                    >
                      Pesan Sekarang
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
