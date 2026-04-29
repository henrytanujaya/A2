import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [show, setShow] = useState(false);
  const [config, setConfig] = useState({
    message: '',
    type: 'success', // 'success' or 'error'
    onClose: null
  });

  const showModal = (message, type = 'success', onClose = null) => {
    setConfig({ message, type, onClose });
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    if (config.onClose) config.onClose();
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, backdropFilter: 'blur(5px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={{
                background: 'rgba(26, 26, 36, 0.95)',
                border: `1px solid ${config.type === 'success' ? 'rgba(46, 204, 113, 0.4)' : 'rgba(220, 20, 60, 0.4)'}`,
                borderRadius: '15px',
                padding: '40px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                position: 'relative'
              }}
            >
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: config.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(220, 20, 60, 0.1)', 
                color: config.type === 'success' ? '#2ecc71' : '#dc143c', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' 
              }}>
                {config.type === 'success' ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.8rem', margin: '0 0 10px 0' }}>
                {config.type === 'success' ? 'Berhasil' : 'Perhatian'}
              </h3>
              <p style={{ color: '#a0a0b0', margin: '0 0 30px 0', fontSize: '1.1rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {config.message}
              </p>
              <button 
                onClick={handleClose}
                style={{
                  background: config.type === 'success' ? '#2ecc71' : '#dc143c', 
                  color: '#fff', border: 'none', 
                  padding: '12px 40px', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s',
                  boxShadow: `0 4px 15px ${config.type === 'success' ? 'rgba(46, 204, 113, 0.3)' : 'rgba(220, 20, 60, 0.3)'}`
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
    </ModalContext.Provider>
  );
};
