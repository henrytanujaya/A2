import React from 'react';
import { motion } from 'framer-motion';

const topProducts = [
  {
    id: 1,
    title: "Gegege no Kitaro Vol. 1",
    price: "Rp 150.000",
    image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop", 
    rating: 5,
  },
  {
    id: 2,
    title: "Stylized Kitsune Mask Pin",
    price: "Rp 150.000",
    image: "https://images.unsplash.com/photo-1614983646436-b51f04af2553?q=80&w=600&auto=format&fit=crop",
    rating: 5,
  },
  {
    id: 3,
    title: "Mystical Yokai Poster Set",
    price: "Rp 150.000",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=600&auto=format&fit=crop",
    rating: 5,
  },
  {
    id: 4,
    title: "Demon Slayer Haori",
    price: "Rp 150.000",
    image: "https://images.unsplash.com/photo-1601645063073-67c6eb230ed8?q=80&w=600&auto=format&fit=crop",
    rating: 5,
  }
];

export default function Home() {
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
            <h1 className="hero-title">Fall Into The Spirit World: <br/> <span className="text-crimson">New Yokai Merch & Manga</span></h1>
            <p className="hero-subtitle">Mistis, Premium, Responsive. Eksplorasi koleksi eksklusif budaya jejepangan kami dengan pengiriman ke seluruh dunia.</p>
          </motion.div>
        </div>
      </section>

      {/* New Arrivals Grid Section */}
      <section className="products-section">
        <div className="container">
          <h2 className="section-title">New Arrivals</h2>
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
                  <img src={product.image} alt={product.title} className="product-image" />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>
                  <p className="product-price">{product.price}</p>
                  
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '15px', color: '#f59e0b' }}>
                    {[...Array(product.rating)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>

                  <button className="add-to-cart-btn">Add to Cart</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
