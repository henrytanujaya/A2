import React, { useState, Suspense } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, Box as BoxIcon, Loader2, Scissors } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useModal } from '../contexts/ModalContext';
import axiosInstance from '../api/axiosInstance';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, Center, Float } from '@react-three/drei';
import * as THREE from 'three';
import { removeBackground } from '@imgly/background-removal';

function ActionFigureModel({ imageUrl }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl);
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  const aspect = texture.image.width / texture.image.height;
  const height = 6;
  const width = height * aspect;

  return (
    <group position={[0, height / 2 - 0.5, 0]}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        {/* Plane mesh mimicking an acrylic cutout standee */}
        <mesh castShadow receiveShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial 
            map={texture} 
            transparent={true} 
            alphaTest={0.1} 
            side={THREE.DoubleSide}
            roughness={0.3} 
            metalness={0.1}
          />
        </mesh>
        
        {/* Base Stand */}
        <mesh position={[0, -height / 2 - 0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[Math.max(width/1.2, 2.5), Math.max(width/1.2, 2.5), 0.2, 32]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.8} />
        </mesh>
      </Float>
    </group>
  );
}

function Loader() {
  return (
    <Html center>
      <div style={{ color: '#ff2a5f', fontWeight: 'bold', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: '20px' }}>
        Memuat Aset 3D...
      </div>
    </Html>
  );
}

export default function Custom3D() {
  const [fileUrl, setFileUrl] = useState(null); // Preview
  const [fileBlob, setFileBlob] = useState(null); // Actual file for upload
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToCart } = useCart();
  const { showModal } = useModal();

  const handleAddToCart = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      showModal("Silakan login terlebih dahulu untuk melakukan custom order", "error");
      return;
    }

    setIsProcessing(true);
    try {
      let uploadedImageUrl = null;

      // 1. Upload ke Cloudinary
      if (fileBlob) {
        const formData = new FormData();
        formData.append('file', fileBlob);
        const uploadRes = await axiosInstance.post('/api/v1/upload/figure-reference', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrl = uploadRes.data.data.imageUrl;
      }

      // 2. Simpan sebagai Custom Order
      const customOrderReq = {
        serviceType: "3D Figure",
        imageReferenceUrl: uploadedImageUrl,
        price: 350000,
        configurationJson: JSON.stringify({
          type: "AI Generated 3D Standee",
          originalFileName: fileBlob?.name
        })
      };

      const customOrderRes = await axiosInstance.post('/api/v1/custom-orders', customOrderReq);
      const customOrderId = customOrderRes.data.data.id;

      // 3. Tambah ke Keranjang
      await addToCart({
        customOrderId: customOrderId,
        name: "Custom 3D Action Figure (AI Generated)",
        price: 350000,
        image: uploadedImageUrl,
        details: "Tipe: True 3D Custom Figure\nModel: Akrilik Cutout Standee\nFitur: Auto Background Removal",
        quantity: 1
      });

    } catch (error) {
      console.error("Gagal memproses custom order figure:", error);
      showModal("Gagal menyimpan desain 3D. Silakan coba lagi.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = React.useCallback(async acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      setIsProcessing(true);
      try {
        // Run AI Background removal
        const imageBlob = await removeBackground(file);
        const url = URL.createObjectURL(imageBlob);
        setFileUrl(url);
        setFileBlob(imageBlob);
      } catch (error) {
        console.error("Gagal menghapus background:", error);
        // Fallback or warning can be added here
        setFileUrl(URL.createObjectURL(file));
        setFileBlob(file);
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const removeImage = () => {
    setFileUrl(null);
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
      {/* Page Header */}
      <div className="container" style={{ marginBottom: '40px', padding: 0 }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px', color: '#fff' }}>3D Action Figure Creator</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Kecerdasan Buatan (AI) kami akan secara otomatis memotong subjek foto dari background dan mengubahnya menjadi karakter True 3D!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Left Panel: Upload & Controls */}
        <div style={{ flex: '1 1 300px', background: 'rgba(20, 20, 20, 0.8)', padding: '30px', borderRadius: '15px', border: '1px solid #333' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Upload size={24} color="#ff2a5f" /> Unggah Foto
          </h2>

          {!fileUrl && !isProcessing && (
            <div 
              {...getRootProps()} 
              style={{
                border: isDragActive ? '2px dashed #ff2a5f' : '2px dashed #444',
                borderRadius: '10px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? 'rgba(255, 42, 95, 0.1)' : 'rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              <input {...getInputProps()} />
              <Upload size={40} color={isDragActive ? '#ff2a5f' : '#666'} style={{ marginBottom: '15px' }} />
              <p>Tarik & lepas foto apa saja di sini</p>
              <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>Sistem pintar kami akan menghapus background Anda secara otomatis.</p>
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}>Mendukung JPG, PNG (Maks 10MB)</p>
            </div>
          )}

          {isProcessing && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '40px 20px', borderRadius: '10px', border: '1px solid #444', textAlign: 'center' }}>
              <Loader2 size={40} color="#ff2a5f" style={{ margin: '0 auto 15px', animation: 'spin 2s linear infinite' }} />
              <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>Menganalisis Objek...</h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '10px' }}>
                AI sedang mengekstrak subjek tunggal dari background untuk dijadikan model 3D (dapat memakan waktu).
              </p>
            </div>
          )}

          {fileUrl && !isProcessing && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', border: '1px solid #444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
                  <Scissors size={18} /> Subjek Terpotong
                </span>
                <button onClick={removeImage} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <X size={18} /> Hapus
                </button>
              </div>
              
              {/* Checkboard background specifically to show transparency effectively */}
              <div style={{ borderRadius: '8px', border: '1px dashed #444', overflow: 'hidden', background: `url('data:image/svg+xml;utf8,<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" fill="none"/><rect width="10" height="10" fill="rgba(255,255,255,0.05)"/><rect x="10" y="10" width="10" height="10" fill="rgba(255,255,255,0.05)"/></svg>')` }}>
                <img src={fileUrl} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '15px' }}>
                Dapat dilihat bahwa background asli telah dihapus. Cek model 3D di area penampil!
              </p>
            </div>
          )}

          <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(42, 255, 137, 0.05)', borderRadius: '10px', border: '1px solid rgba(42, 255, 137, 0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BoxIcon size={18} color="#2aff89" /> True 3D Extracted
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.5' }}>
              Sistem menggunakan AI Background Removal. Gambar yang terpotong menjadi <b>objek 3D Standee (Bolak-balik)</b>.
            </p>
          </div>
          
          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.9rem' }}>Berdasarkan material True 3D & cetak</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-crimson)' }}>Rp 350.000</div>
          </div>
          
          <button 
            onClick={handleAddToCart} 
            disabled={!fileUrl || isProcessing}
            className={`nav-btn ${fileUrl ? 'primary' : ''}`} 
            style={{ 
              width: '100%', 
              marginTop: '15px', 
              padding: '15px', 
              fontSize: '1.1rem', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '10px',
              opacity: (fileUrl && !isProcessing) ? 1 : 0.5,
              cursor: (fileUrl && !isProcessing) ? 'pointer' : 'not-allowed',
              background: (!fileUrl || isProcessing) ? '#333' : undefined
            }}>
             <Check /> Simpan & Masukkan Keranjang
          </button>
        </div>

        {/* Right Panel: Interactive 3D Viewer Area */}
        <div style={{ flex: '2 1 500px', height: '600px', background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%)', borderRadius: '15px', overflow: 'hidden', position: 'relative', border: '1px solid #333' }}>
          
          {fileUrl ? (
            <Canvas shadows camera={{ position: [0, 2, 10], fov: 50 }}>
              <color attach="background" args={['#0a0a0a']} />
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              
              <Suspense fallback={<Loader />}>
                <Center>
                  <ActionFigureModel imageUrl={fileUrl} />
                </Center>
                <Environment preset="city" />
                <ContactShadows position={[0, -3.5, 0]} opacity={0.5} scale={20} blur={2} far={10} />
              </Suspense>

              <OrbitControls 
                enablePan={false} 
                minPolarAngle={Math.PI / 4} 
                maxPolarAngle={Math.PI / 1.5} 
                minDistance={5} 
                maxDistance={15} 
                autoRotate
                autoRotateSpeed={1.5}
              />
            </Canvas>
          ) : (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#555' }}>
              <BoxIcon size={64} style={{ margin: '0 auto 20px', color: '#333', animation: 'pulse 2s infinite' }} />
              <h3 style={{ color: '#666', fontSize: '1.5rem' }}>3D Cutout Viewer</h3>
              <p style={{ marginTop: '10px', fontSize: '1rem', color: '#555' }}>
                Area pratinjau karakter terpotong otomatis.<br/>Menunggu Anda mengunggah gambar.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

