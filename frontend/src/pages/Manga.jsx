import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

const mangaDatabases = [
  { id: 101, title: "Berserk - Deluxe Edition Vol 1", price: 450000, genre: "Dark Fantasy", image: "https://images.unsplash.com/photo-1544640808-32cb4fbad06e?q=80&w=600&auto=format&fit=crop", rating: 5, dateAdded: '2023-11-20' },
  { id: 102, title: "Attack on Titan Vol 34", price: 120000, genre: "Dark Fantasy", image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop", rating: 5, dateAdded: '2023-12-01' },
  { id: 103, title: "Solo Leveling Vol 1", price: 180000, genre: "Action", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=600&auto=format&fit=crop", rating: 4, dateAdded: '2023-10-15' },
  { id: 104, title: "Tokyo Ghoul Vol 1", price: 150000, genre: "Dark Fantasy", image: "https://images.unsplash.com/photo-1518382473859-fb01dd797960?q=80&w=600&auto=format&fit=crop", rating: 5, dateAdded: '2023-11-10' },
  { id: 105, title: "Mushoku Tensei Vol 1", price: 130000, genre: "Isekai", image: "https://images.unsplash.com/photo-1589998059171-989d887dda1e?q=80&w=600&auto=format&fit=crop", rating: 4, dateAdded: '2023-09-25' },
  { id: 106, title: "Chainsaw Man Vol 1", price: 140000, genre: "Action", image: "https://images.unsplash.com/photo-1601645063073-67c6eb230ed8?q=80&w=600&auto=format&fit=crop", rating: 5, dateAdded: '2024-01-05' },
  { id: 107, title: "Re:Zero Vol 1", price: 160000, genre: "Isekai", image: "https://images.unsplash.com/photo-1614983646436-b51f04af2553?q=80&w=600&auto=format&fit=crop", rating: 5, dateAdded: '2024-02-10' },
  { id: 108, title: "Jujutsu Kaisen Vol 1", price: 150000, genre: "Action", image: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=600&auto=format&fit=crop", rating: 5, dateAdded: '2024-03-15' },
  { id: 109, title: "Vagabond Vol 1", price: 145000, genre: "Action", image: "https://images.unsplash.com/photo-1601645063073-67c6eb230ed8?q=80&w=600&auto=format&fit=crop", rating: 5, dateAdded: '2023-08-05' },
  { id: 110, title: "Overlord Vol 1", price: 95000, genre: "Isekai", image: "https://images.unsplash.com/photo-1589998059171-989d887dda1e?q=80&w=600&auto=format&fit=crop", rating: 4, dateAdded: '2023-07-20' },
];

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
  const [activeGenre, setActiveGenre] = useState('All');
  const [maxPrice, setMaxPrice] = useState(Infinity);

  const genres = ['All', 'Dark Fantasy', 'Isekai', 'Action'];

  // Sorting newest first and applying filters
  const { newArrivals, topManga } = useMemo(() => {
    let baseFiltered = mangaDatabases;
    
    if (activeGenre !== 'All') {
      baseFiltered = baseFiltered.filter(m => m.genre === activeGenre);
    }
    
    baseFiltered = baseFiltered.filter(m => m.price < maxPrice);

    // Derive New Arrivals (Sort by newest date)
    const newArrivalsList = [...baseFiltered].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 4);
    
    // Derive Top Manga (Sort by highest rating, can fallback to ID if tying)
    const topMangaList = [...baseFiltered].sort((a, b) => b.rating - a.rating || b.price - a.price).slice(0, 8);

    return { newArrivals: newArrivalsList, topManga: topMangaList };
  }, [activeGenre, maxPrice]);

  const renderProductGrid = (mangas) => {
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
              <img src={product.image} alt={product.title} className="product-image" />
            </div>
            <div className="product-info">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {product.genre}
              </span>
              <h3 className="product-title" style={{ fontSize: '16px', marginTop: '4px' }}>{product.title}</h3>
              <p className="product-price">Rp {product.price.toLocaleString('id-ID')}</p>
              
              <div style={{ display: 'flex', gap: '2px', marginBottom: '15px', color: '#f59e0b' }}>
                {[...Array(product.rating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              <button 
                onClick={() => addToCart({
                  name: product.title,
                  price: product.price,
                  image: product.image,
                  details: `Kategori: Manga\nGenre: ${product.genre}`
                })}
                className="add-to-cart-btn" 
                style={{ marginTop: 'auto' }}
              >
                Add to Cart
              </button>
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
