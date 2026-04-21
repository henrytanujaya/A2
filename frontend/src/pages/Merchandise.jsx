import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

const merchPackages = [
  {
    id: 'paket-a',
    title: 'Paket A',
    subtitle: 'Manga + Keychain Karakter',
    description: 'Dapatkan komik kesukaanmu dengan gantungan kunci karakter anime lucu eksklusif hanya di Kitsune Matsuri.',
    image: 'https://images.unsplash.com/photo-1578353314501-f8e04d49aeca?q=80&w=600&auto=format&fit=crop',
    price: 125000,
    items: ['Manga', 'Keychain Karakter Anime']
  },
  {
    id: 'paket-b',
    title: 'Paket B',
    subtitle: 'Custom Pakaian + Sticker',
    description: 'Pakaian kualitas terbaik dengan desain spesial ditambah bonus sticker karakter anime premium.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop',
    price: 135000,
    items: ['Custom Pakaian', 'Sticker Karakter Anime']
  },
  {
    id: 'paket-c',
    title: 'Paket C',
    subtitle: 'Custom Figure + Mini Poster',
    description: 'Koleksi pajangan 3D Action Figure custom dan mini poster keren karakter anime favoritmu.',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop',
    price: 340000,
    items: ['Custom 3D Action Figure', 'Mini Poster Karakter Anime']
  },
  {
    id: 'paket-d',
    title: 'Paket D',
    subtitle: 'Manga + Pakaian + Mini Poster',
    description: 'Paket lengkap untuk menemani harimu: baca komik, pakai baju keren, dan pajang poster estetik.',
    image: 'https://images.unsplash.com/photo-1612036782180-6f0b6ce846ce?q=80&w=600&auto=format&fit=crop',
    price: 220000,
    items: ['Manga', 'Pakaian', 'Mini Poster']
  },
  {
    id: 'paket-e',
    title: 'Paket E',
    subtitle: 'Campur Semua',
    description: 'Ultimate Bundle: Manga, Pakaian, 3D Figure, Keychain, Sticker, dan Mini Poster dalam satu paket sultan!',
    image: 'https://images.unsplash.com/photo-1580477651156-5ea06bd302f1?q=80&w=600&auto=format&fit=crop',
    price: 550000,
    items: ['Manga', 'Custom Pakaian', 'Custom 3D Action Figure', 'Keychain', 'Sticker', 'Mini Poster']
  }
];

export default function Merchandise() {
  const { addToCart } = useCart();
  return (
    <div className="page-container manga-page" style={{ paddingTop: '100px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Page Header */}
      <div className="container" style={{ marginBottom: '40px' }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Merchandise Eksklusif</h1>
        <p style={{ color: 'var(--text-muted)' }}>Pilih paket merchandise terbaikmu: dari Manga, Custom Pakaian, hingga 3D Action Figure.</p>
      </div>

      <div className="container">
        <div style={{ marginBottom: '50px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px' }}>
          {merchPackages.map((pkg, index) => (
            <motion.div 
              className="product-card" 
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              style={{ display: 'flex', flexDirection: 'row', width: 'calc(50% - 15px)', minWidth: '450px', alignItems: 'stretch' }}
            >
              <div style={{ width: '220px', flexShrink: 0, overflow: 'hidden' }}>
                <img src={pkg.image} alt={pkg.title} className="product-image" style={{ height: '100%', objectFit: 'cover', borderRadius: '8px 0 0 8px' }} />
              </div>
              <div className="product-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-crimson)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {pkg.title}
                </span>
                <h3 className="product-title" style={{ fontSize: '18px', marginTop: '4px', marginBottom: '8px' }}>{pkg.subtitle}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px', lineHeight: '1.4' }}>
                  {pkg.description}
                </p>
                
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Isi Paket:</span>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
                    {pkg.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <p className="product-price" style={{ fontSize: '14px', marginBottom: '10px' }}>Harga: Rp {pkg.price.toLocaleString('id-ID')}</p>
                  <button 
                    onClick={() => addToCart({
                      name: `Bundle: ${pkg.title}`,
                      price: pkg.price,
                      image: pkg.image,
                      details: `Isi Paket: ${pkg.items.join(', ')}`
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
      </div>
    </div>
  );
}
