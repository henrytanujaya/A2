import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../contexts/CartContext';

export default function Home() {
  const { addToCart } = useCart();
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTopProducts = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/products');
        if (response.data.success && isMounted) {
          const allProducts = response.data.data;
          const sorted = allProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
          setTopProducts(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
        if (isMounted && topProducts.length === 0) setError("Gagal memuat produk. Pastikan server backend aktif dan coba refresh halaman.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchTopProducts();
    const intervalId = setInterval(fetchTopProducts, 3000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="hero-title">Fall Into The Spirit World: <br /> <span className="text-crimson">New Yokai Merch & Manga</span></h1>
            <p className="hero-subtitle">Mistis, Premium, Responsive. Eksplorasi koleksi eksklusif budaya jepang kami dengan pengiriman ke seluruh Indonesia.</p>
          </motion.div>
        </div>
      </section>

      {/* New Arrivals Grid Section */}
      <section className="products-section">
        <div className="container">
          <h2 className="section-title">New Arrivals</h2>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Loading products...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(220,20,60,0.1)', borderRadius: '12px', border: '1px dashed rgba(220,20,60,0.3)' }}>
              <p style={{ color: '#dc143c', marginBottom: '10px', fontWeight: 'bold' }}>⚠️ Koneksi Gagal</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
            </div>
          ) : topProducts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Belum ada produk tersedia.</div>
          ) : (
            <div className="product-grid">
              {topProducts.map((product, index) => (
                <motion.div
                  className="product-card"
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                  </div>
                  <div className="product-info">
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-price">Rp {product.price.toLocaleString('id-ID')}</p>

                    <div style={{ display: 'flex', gap: '2px', marginBottom: '15px', color: '#f59e0b' }}>
                      {[...Array(product.rating || 5)].map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>

                    <button
                      className="add-to-cart-btn"
                      onClick={() => addToCart({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        details: product.category,
                        quantity: 1
                      })}
                    >
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
