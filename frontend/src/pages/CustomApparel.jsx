import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rnd } from 'react-rnd';
import { useCart } from '../contexts/CartContext';
import { removeBackground } from '@imgly/background-removal';
import { Loader2 } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import axiosInstance from '../api/axiosInstance';
import html2canvas from 'html2canvas';

import bajuHitamDepan from '../assets/baju_hitam_depan.jpg';
import bajuHitamBelakang from '../assets/baju_hitam_belakang.jpg';
import jaketHitamDepan from '../assets/jaket_hitam_depan.jpg';
import jaketHitamBelakang from '../assets/jaket_hitam_belakang.jpg';

const APPAREL_PRICES = {
  tshirt: 100000,
  jacket: 250000
};

const PRINT_PRICE_PER_SIDE = 35000;

const MOCKUPS = {
  tshirt: {
    white: { front: '/tshirt_white_front.png', back: '/tshirt_white_back.png' },
    black: { front: bajuHitamDepan, back: bajuHitamBelakang },
  },
  jacket: {
    white: { front: '/jacket_white_front.png', back: '/jacket_white_back.png' },
    black: { front: jaketHitamDepan, back: jaketHitamBelakang }
  }
};

export default function CustomApparel() {
  const [apparel, setApparel] = useState('tshirt'); // tshirt | jacket
  const [color, setColor] = useState('white'); // white | black
  const [size, setSize] = useState('L');
  const [view, setView] = useState('front'); // front | back
  const { showModal } = useModal();

  // Image uploads base64 string
  const [frontImage, setFrontImage] = useState(null); // URL pratinjau
  const [frontBlob, setFrontBlob] = useState(null);   // File asli untuk upload
  const [backImage, setBackImage] = useState(null);   // URL pratinjau
  const [backBlob, setBackBlob] = useState(null);     // File asli untuk upload
  const [isProcessing, setIsProcessing] = useState(false);

  // RND state
  const [frontRnd, setFrontRnd] = useState({ x: 50, y: 50, width: 100, height: 100 });
  const [backRnd, setBackRnd] = useState({ x: 50, y: 50, width: 100, height: 100 });
  const [quantity, setQuantity] = useState(1);

  const handleQtyChange = (val) => {
    const qty = Math.max(1, parseInt(val) || 1);
    setQuantity(qty);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showModal("Ukuran file maksimal 5MB", "error");
        return;
      }
      
      setIsProcessing(true);
      try {
        const imageBlob = await removeBackground(file);
        const url = URL.createObjectURL(imageBlob);
        
        if (view === 'front') {
          setFrontImage(url);
          setFrontBlob(imageBlob);
          setFrontRnd({ x: 50, y: 50, width: 150, height: 150 });
        } else {
          setBackImage(url);
          setBackBlob(imageBlob);
          setBackRnd({ x: 50, y: 50, width: 150, height: 150 });
        }
      } catch (error) {
        console.error("Gagal menghapus background:", error);
        // Fallback jika gagal hapus bg
        const fallbackUrl = URL.createObjectURL(file);
        if (view === 'front') {
          setFrontImage(fallbackUrl);
          setFrontBlob(file);
          setFrontRnd({ x: 50, y: 50, width: 150, height: 150 });
        } else {
          setBackImage(fallbackUrl);
          setBackBlob(file);
          setBackRnd({ x: 50, y: 50, width: 150, height: 150 });
        }
      } finally {
        setIsProcessing(false);
        e.target.value = ''; // Fix bug unable to select exact same file
      }
    }
  };

  const removeImage = () => {
    if (view === 'front') setFrontImage(null);
    else setBackImage(null);
  };

  const calculateTotal = () => {
    let total = APPAREL_PRICES[apparel];
    if (frontImage) total += PRINT_PRICE_PER_SIDE;
    if (backImage) total += PRINT_PRICE_PER_SIDE;
    return total;
  };

  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      showModal("Silakan login terlebih dahulu untuk melakukan custom order", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Capture Mockup Preview
      const mockupElement = document.getElementById('mockup-studio');
      const canvas = await html2canvas(mockupElement, {
        useCORS: true,
        backgroundColor: '#111',
        scale: 2 // Higher quality
      });
      
      const previewBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

      // 2. Upload both to Cloudinary
      let uploadedImageUrl = null;
      let previewImageUrl = null;

      // Upload Preview
      const previewFormData = new FormData();
      previewFormData.append('file', previewBlob, 'preview.jpg');
      const previewRes = await axiosInstance.post('/api/v1/upload/outfit-reference', previewFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      previewImageUrl = previewRes.data.data.imageUrl;

      // Upload Original Asset (if any)
      const targetBlob = frontBlob || backBlob;
      if (targetBlob) {
        const assetFormData = new FormData();
        assetFormData.append('file', targetBlob);
        const assetRes = await axiosInstance.post('/api/v1/upload/outfit-reference', assetFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrl = assetRes.data.data.imageUrl;
      }

      // 3. Simpan sebagai Custom Order di Database
      const customOrderReq = {
        serviceType: `Apparel: ${apparel}`,
        imageReferenceUrl: uploadedImageUrl,
        previewImageUrl: previewImageUrl,
        price: calculateTotal(),
        configurationJson: JSON.stringify({
          apparel, color, size,
          frontRnd, backRnd,
          hasFrontPrint: !!frontBlob,
          hasBackPrint: !!backBlob
        })
      };

      const customOrderRes = await axiosInstance.post('/api/v1/custom-orders', customOrderReq);
      const customOrderId = customOrderRes.data.data.id;

      // 4. Masukkan ke Keranjang
      await addToCart({
        customOrderId: customOrderId,
        name: `Custom ${apparel === 'tshirt' ? 'T-Shirt' : 'Jacket'}`,
        price: calculateTotal(),
        image: previewImageUrl, // Use preview image for cart
        details: `Warna: ${color}\nUkuran: ${size}\nCetak Depan: ${frontImage ? 'Ya' : 'Tidak'}\nCetak Belakang: ${backImage ? 'Ya' : 'Tidak'}`,
        quantity: quantity
      });

      showModal("Desain berhasil dimasukkan ke keranjang!", "success");

    } catch (error) {
      console.error("Gagal memproses custom order:", error);
      showModal("Gagal menyimpan desain. Silakan coba lagi.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container manga-page" style={{ paddingTop: '100px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      <div className="container" style={{ marginBottom: '40px' }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Custom Studio</h1>
        <p style={{ color: 'var(--text-muted)' }}>Desain pakaian impianmu. Unggah gambar, atur posisi, dan jadilah unik!</p>
      </div>

      <div className="container" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Editor Sidebar */}
        <div className="filter-sidebar" style={{ flex: '1 1 300px', background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
          
          {/* Tipe & Warna */}
          <div className="filter-group">
            <h3>Tipe Pakaian</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={() => setApparel('tshirt')} 
                className={`nav-btn ${apparel === 'tshirt' ? 'primary' : ''}`}
                style={{ flex: 1, padding: '10px' }}
              >T-Shirt</button>
              <button 
                onClick={() => setApparel('jacket')} 
                className={`nav-btn ${apparel === 'jacket' ? 'primary' : ''}`}
                style={{ flex: 1, padding: '10px' }}
              >Jacket</button>
            </div>
          </div>

          <div className="filter-group" style={{ marginTop: '25px' }}>
            <h3>Warna Dasar</h3>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <div 
                onClick={() => setColor('white')}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', cursor: 'pointer', border: color === 'white' ? '3px solid var(--accent-crimson)' : '3px solid transparent' }}
              />
              <div 
                onClick={() => setColor('black')}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#222', cursor: 'pointer', border: color === 'black' ? '3px solid var(--accent-crimson)' : '3px solid #555' }}
              />
            </div>
          </div>

          <div className="filter-group" style={{ marginTop: '25px' }}>
            <h3>Ukuran</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                <button 
                  key={sz}
                  onClick={() => setSize(sz)}
                  style={{ 
                    flex: 1, padding: '10px 0', background: size === sz ? 'var(--accent-crimson)' : 'transparent',
                    border: '1px solid var(--border-color)', color: '#fff', borderRadius: '5px', cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >{sz}</button>
              ))}
            </div>
          </div>

          <hr style={{ margin: '25px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Upload & View Switch */}
          <div className="filter-group">
            <h3>Area Cetak</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '15px' }}>
              <button 
                onClick={() => setView('front')} 
                style={{ flex: 1, padding: '10px', background: view === 'front' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}
              >Tampak Depan</button>
              <button 
                onClick={() => setView('back')} 
                style={{ flex: 1, padding: '10px', background: view === 'back' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}
              >Tampak Belakang</button>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label 
                style={{ display: 'block', width: '100%', padding: '15px', background: 'var(--accent-crimson)', color: '#fff', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Upload Desain ({view === 'front' ? 'Depan' : 'Belakang'})
                <input type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isProcessing} />
              </label>

              {isProcessing && (
                <div style={{ marginTop: '15px', color: 'var(--accent-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} /> Memproses Background...
                </div>
              )}
              {(view === 'front' && frontImage) || (view === 'back' && backImage) ? (
                <button 
                  onClick={removeImage}
                  style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Hapus Desain
                </button>
              ) : null}
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>Gunakan PNG transparan untuk hasil terbaik. (Maks 5MB)</p>
            </div>
          </div>
          
        </div>

        {/* Mockup Area */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div id="mockup-studio" style={{ position: 'relative', width: '100%', maxWidth: '500px', aspectRatio: '4/5', background: '#111', borderRadius: '15px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Base Image */}
            <AnimatePresence mode="wait">
              <motion.img 
                key={`${apparel}-${color}-${view}`}
                src={MOCKUPS[apparel][color][view]}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  position: 'absolute', width: '100%', height: '100%', objectFit: 'contain'
                }} 
              />
            </AnimatePresence>

            {/* Print Area Bounds */}
            <div 
              style={{
                position: 'absolute',
                top: '20%',
                width: '60%',
                height: '60%',
                border: '2px dashed rgba(255,255,255,0.3)',
                borderRadius: '5px',
                pointerEvents: 'none',
                zIndex: 5
              }}
            >
              <div style={{ position: 'absolute', top: '-25px', left: 0, width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Batas Cetak
              </div>
            </div>

            {/* Draggable RND Container */}
            <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', zIndex: 10 }}>
              {view === 'front' && frontImage && (
                <Rnd
                  bounds="parent"
                  size={{ width: frontRnd.width, height: frontRnd.height }}
                  position={{ x: frontRnd.x, y: frontRnd.y }}
                  onDragStop={(e, d) => setFrontRnd({ ...frontRnd, x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, position) => {
                    setFrontRnd({
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      ...position,
                    });
                  }}
                  lockAspectRatio={true}
                  style={{ border: '1px solid rgba(255,255,255,0.5)', cursor: 'move' }}
                >
                  <img src={frontImage} alt="front-design" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable="false" />
                </Rnd>
              )}

              {view === 'back' && backImage && (
                <Rnd
                  bounds="parent"
                  size={{ width: backRnd.width, height: backRnd.height }}
                  position={{ x: backRnd.x, y: backRnd.y }}
                  onDragStop={(e, d) => setBackRnd({ ...backRnd, x: d.x, y: d.y })}
                  onResizeStop={(e, dir, ref, delta, position) => {
                    setBackRnd({
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      ...position,
                    });
                  }}
                  lockAspectRatio={true}
                  style={{ border: '1px solid rgba(255,255,255,0.5)', cursor: 'move' }}
                >
                  <img src={backImage} alt="back-design" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable="false" />
                </Rnd>
              )}
            </div>
            
          </div>

          {/* Checkout Info */}
          <div style={{ width: '100%', maxWidth: '500px', marginTop: '20px', background: 'var(--card-bg)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Total Harga:</span>
              <span style={{ color: 'var(--accent-crimson)', fontSize: '24px' }}>Rp {calculateTotal().toLocaleString('id-ID')}</span>
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
              <p>- {apparel === 'tshirt' ? 'T-Shirt' : 'Jacket'} Polos: Rp {APPAREL_PRICES[apparel].toLocaleString('id-ID')}</p>
              <p>- Cetak Depan: {frontImage ? `Rp ${PRINT_PRICE_PER_SIDE.toLocaleString('id-ID')}` : '-'}</p>
              <p>- Cetak Belakang: {backImage ? `Rp ${PRINT_PRICE_PER_SIDE.toLocaleString('id-ID')}` : '-'}</p>
              <p>- Ukuran: {size}</p>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid #333' }}>
                <button 
                  onClick={() => handleQtyChange(quantity - 1)}
                  style={{ padding: '10px 15px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
                >-</button>
                <input 
                  type="number" 
                  value={quantity}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  style={{ width: '50px', textAlign: 'center', background: 'none', border: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}
                />
                <button 
                  onClick={() => handleQtyChange(quantity + 1)}
                  style={{ padding: '10px 15px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
                >+</button>
              </div>
              <button onClick={handleAddToCart} className="add-to-cart-btn" style={{ flex: 1, padding: '15px', fontSize: '16px', margin: 0 }}>
                Masukkan Keranjang
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
