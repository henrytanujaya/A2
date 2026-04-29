import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Minus, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

export default function AdminStock() {
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/v1/products');
      if (res.data.success) {
        const fetchedProducts = res.data.data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: `Rp ${p.price.toLocaleString('id-ID')}`,
          stock: p.stockQuantity
        }));
        setProducts(fetchedProducts);
        
        const orig = {};
        fetchedProducts.forEach(p => orig[p.id] = p.stock);
        setOriginalProducts(orig);
      }
    } catch (err) {
      console.error("Gagal memuat produk", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (id, newStock) => {
    if (newStock < 0) return;
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  const handleSave = async () => {
    const promises = [];
    products.forEach(p => {
      if (p.stock !== originalProducts[p.id]) {
        promises.push(axiosInstance.patch(`/api/v1/products/${p.id}/stock?quantity=${p.stock}`));
      }
    });

    if (promises.length === 0) {
      setModalMessage("Tidak ada perubahan stok untuk disimpan.");
      setShowModal(true);
      return;
    }

    try {
      await Promise.all(promises);
      setModalMessage("Perubahan stok berhasil disimpan dan disinkronisasi ke database!");
      
      const orig = { ...originalProducts };
      products.forEach(p => orig[p.id] = p.stock);
      setOriginalProducts(orig);
    } catch (err) {
      console.error("Gagal menyimpan stok", err);
      setModalMessage("Gagal menyimpan perubahan stok. Coba lagi.");
    }
    setShowModal(true);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#fff' }}>Kelola Stok Barang</h1>
            <p style={{ color: '#a0a0b0', margin: 0 }}>Atur dan perbarui ketersediaan inventaris produk Anda.</p>
          </div>
          <button 
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: '#dc143c', color: '#fff', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(220, 20, 60, 0.4)'
            }}
          >
            <Save size={18} />
            Simpan Perubahan
          </button>
        </div>

        <div style={{
          background: 'rgba(26, 26, 36, 0.8)',
          border: '1px solid rgba(220, 20, 60, 0.2)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(220, 20, 60, 0.1)', borderBottom: '1px solid rgba(220, 20, 60, 0.2)' }}>
                <th style={{ padding: '15px 20px', color: '#dc143c', fontWeight: 'bold' }}>ID</th>
                <th style={{ padding: '15px 20px', color: '#dc143c', fontWeight: 'bold' }}>Nama Produk</th>
                <th style={{ padding: '15px 20px', color: '#dc143c', fontWeight: 'bold' }}>Kategori</th>
                <th style={{ padding: '15px 20px', color: '#dc143c', fontWeight: 'bold' }}>Harga</th>
                <th style={{ padding: '15px 20px', color: '#dc143c', fontWeight: 'bold', textAlign: 'center' }}>Stok</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0a0b0' }}>Memuat stok barang...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0a0b0' }}>Tidak ada produk ditemukan.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '15px 20px', color: '#a0a0b0' }}>#{product.id}</td>
                    <td style={{ padding: '15px 20px', color: '#fff' }}>{product.name}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem',
                        background: 'rgba(255,255,255,0.1)', color: '#a0a0b0'
                      }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', color: '#fff' }}>{product.price}</td>
                    <td style={{ padding: '15px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => handleStockChange(product.id, product.stock - 1)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number" 
                        value={product.stock}
                        onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                        style={{ 
                          width: '60px', padding: '5px', textAlign: 'center', 
                          background: 'rgba(0,0,0,0.3)', border: '1px solid #333', 
                          color: product.stock !== originalProducts[product.id] ? '#f1c40f' : (product.stock < 10 ? '#e74c3c' : '#fff'), 
                          borderRadius: '5px', fontWeight: 'bold'
                        }}
                      />
                      <button 
                        onClick={() => handleStockChange(product.id, product.stock + 1)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modern Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, backdropFilter: 'blur(5px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={{
                background: 'rgba(26, 26, 36, 0.95)',
                border: '1px solid rgba(46, 204, 113, 0.4)',
                borderRadius: '15px',
                padding: '40px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                position: 'relative'
              }}
            >
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                <CheckCircle size={40} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.8rem', margin: '0 0 10px 0' }}>Berhasil!</h3>
              <p style={{ color: '#a0a0b0', margin: '0 0 30px 0', fontSize: '1.1rem', lineHeight: '1.5' }}>{modalMessage}</p>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: '#2ecc71', color: '#fff', border: 'none', 
                  padding: '12px 40px', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Selesai
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
