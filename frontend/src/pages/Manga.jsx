import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { Search } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const priceOptions = [
  { label: "Semua Harga", value: Infinity },
  { label: "< Rp 50.000", value: 50000 },
  { label: "< Rp 100.000", value: 100000 },
  { label: "< Rp 150.000", value: 150000 },
  { label: "< Rp 200.000", value: 200000 },
  { label: "< Rp 250.000", value: 250000 },
  { label: "< Rp 300.000", value: 300000 },
];

export default function Manga() {
  const { addToCart } = useCart();
  const [mangaDatabases, setMangaDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeGenre, setActiveGenre] = useState('All');
  const [maxPrice, setMaxPrice] = useState(Infinity);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState({});

  const handleQtyChange = (id, val, max) => {
    const qty = Math.max(1, Math.min(max, parseInt(val) || 1));
    setQuantities(prev => ({ ...prev, [id]: qty }));
  };

  const genres = ['All', 'Dark Fantasy', 'Isekai', 'Action'];

  useEffect(() => {
    const fetchManga = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/products');
        if (response.data.success) {
          const allProducts = response.data.data;
          const mangas = allProducts.filter(p => p.category === 'Manga');
          setMangaDatabases(mangas);
        }
      } catch (err) {
        console.error('Failed to fetch manga products', err);
        setError('Gagal memuat data manga. Pastikan server backend aktif.');
      } finally {
        setLoading(false);
      }
    };
    fetchManga();
  }, []);

  // Sorting newest first and applying filters
  const { newArrivals, topManga } = useMemo(() => {
    let baseFiltered = mangaDatabases;
    
    if (searchQuery.trim() !== '') {
      baseFiltered = baseFiltered.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (activeGenre !== 'All') {
      baseFiltered = baseFiltered.filter(m => m.description?.includes(activeGenre));
    }
    
    baseFiltered = baseFiltered.filter(m => m.price < maxPrice);

    // Derive New Arrivals (Sort by newest date)
    const newArrivalsList = [...baseFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
    
    // Derive Top Manga (Sort by highest rating, can fallback to ID if tying)
    const topMangaList = [...baseFiltered].sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.price - a.price).slice(0, 8);

    return { newArrivals: newArrivalsList, topManga: topMangaList };
  }, [mangaDatabases, activeGenre, maxPrice, searchQuery]);

  const renderProductGrid = (mangas) => {
    if (loading) {
      return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;
    }
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(220,20,60,0.1)', borderRadius: '12px', border: '1px dashed rgba(220,20,60,0.3)' }}>
          <p style={{ color: '#dc143c', marginBottom: '10px', fontWeight: 'bold' }}>⚠️ Koneksi Gagal</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      );
    }
    if (mangas.length === 0) {
      return (
        <div style={{ textAlign: 'left', padding: '20px 0', width: '100%' }}>
          <p style={{ color: 'var(--text-muted)' }}>Manga tidak ditemukan untuk kriteria filter ini.</p>
        </div>
      );
    }
    return (
      <div className="product-grid" style={{ marginBottom: '50px' }}>
        {mangas.map((product, index) => (
          <motion.div 
            className="product-card" 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div style={{ overflow: 'hidden' }}>
              <img src={product.imageUrl} alt={product.name} className="product-image" />
            </div>
            <div className="product-info">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {product.category}
              </span>
              <h3 className="product-title" style={{ fontSize: '16px', marginTop: '4px' }}>{product.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="product-price" style={{ margin: 0 }}>Rp {product.price.toLocaleString('id-ID')}</p>
                <span style={{ fontSize: '11px', color: product.stockQuantity > 20 ? '#2ecc71' : '#e67e22', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                  Stok: {product.stockQuantity}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '2px', marginBottom: '15px', color: '#f59e0b' }}>
                {[...Array(product.rating || 5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid #333' }}>
                  <button 
                    onClick={() => handleQtyChange(product.id, (quantities[product.id] || 1) - 1, product.stockQuantity)}
                    style={{ padding: '4px 8px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >-</button>
                  <input 
                    type="number" 
                    value={quantities[product.id] || 1}
                    onChange={(e) => handleQtyChange(product.id, e.target.value, product.stockQuantity)}
                    style={{ width: '30px', textAlign: 'center', background: 'none', border: 'none', color: '#fff', fontSize: '0.8rem' }}
                  />
                  <button 
                    onClick={() => handleQtyChange(product.id, (quantities[product.id] || 1) + 1, product.stockQuantity)}
                    style={{ padding: '4px 8px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >+</button>
                </div>

                <button 
                  onClick={() => addToCart({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    details: `Kategori: ${product.category}`,
                    quantity: quantities[product.id] || 1
                  })}
                  className="add-to-cart-btn" 
                  style={{ flex: 1, padding: '8px' }}
                  disabled={product.stockQuantity <= 0}
                >
                  {product.stockQuantity <= 0 ? 'Habis' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container manga-page" style={{ paddingTop: '100px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Page Header */}
      <div className="container" style={{ marginBottom: '40px' }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Koleksi Manga</h1>
        <p style={{ color: 'var(--text-muted)' }}>Eksplorasi manga Dark Fantasy, Isekai, ran Action di Kitsune Noir.</p>
      </div>

      <div className="container" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* Filter Sidebar */}
        <div className="filter-sidebar">
          
          <div className="filter-group" style={{ marginBottom: '25px' }}>
            <h3>Pencarian</h3>
            <div style={{ position: 'relative', marginTop: '10px' }}>
              <input 
                type="text" 
                placeholder="Cari manga..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px',
                  border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: '#fff',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              <Search size={18} color="#a0a0b0" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="filter-group">
            <h3>Genre List</h3>
            <ul className="filter-list">
              {genres.map(g => (
                <li 
                  key={g} 
                  className={activeGenre === g ? 'active' : ''}
                  onClick={() => setActiveGenre(g)}
                >
                  <span className="checkbox-indicator"></span>
                  {g === 'All' ? 'Semua Genre' : g}
                </li>
              ))}
            </ul>
          </div>

          <div className="filter-group" style={{ marginTop: '35px' }}>
            <h3>Price List</h3>
            <ul className="filter-list">
              {priceOptions.map(p => (
                <li 
                  key={p.label}
                  className={maxPrice === p.value ? 'active' : ''}
                  onClick={() => setMaxPrice(p.value)}
                >
                  <span className="checkbox-indicator"></span>
                  {p.label}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Product Grid Area */}
        <div className="manga-main-area" style={{ flex: 1 }}>
          
          {/* New Arrivals Section */}
          <div className="manga-section">
            <h2 className="brand-font" style={{ fontSize: '24px', marginBottom: '20px', display: 'inline-block', borderBottom: '2px solid var(--accent-crimson)', paddingBottom: '8px' }}>
              New Arrivals
            </h2>
            {renderProductGrid(newArrivals)}
          </div>

          {/* Top Manga Section */}
          <div className="manga-section">
            <h2 className="brand-font" style={{ fontSize: '24px', marginBottom: '20px', display: 'inline-block', borderBottom: '2px solid var(--accent-crimson)', paddingBottom: '8px' }}>
              Top Manga
            </h2>
            {renderProductGrid(topManga)}
          </div>

        </div>

      </div>
    </div>
  );
}
