import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useModal } from './ModalContext';
import axiosInstance from '../api/axiosInstance';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { showModal } = useModal();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const getGuestId = () => {
    let guestId = localStorage.getItem('guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guest_id', guestId);
    }
    return guestId;
  };

  const isUserLoggedIn = () => {
    return !!localStorage.getItem('accessToken');
  };

  const getCartHeaders = () => {
    if (isUserLoggedIn()) {
      return {};
    } else {
      return { 'X-Guest-ID': getGuestId() };
    }
  };

  const getCartEndpoint = () => {
    return isUserLoggedIn() ? '/api/v1/cart' : '/api/v1/cart/guest';
  };

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = getCartEndpoint();
      const headers = getCartHeaders();
      const response = await axiosInstance.get(endpoint, { headers });
      if (response.data.success) {
        setCart(response.data.data || []);
      }
    } catch (error) {
      // Silently fallback to empty cart — jangan crash halaman lain
      console.warn('[CartContext] Gagal memuat keranjang, fallback ke empty.', error?.message);
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (item) => {
    try {
      const requestData = {
        productId: item.productId || item.id || null,
        customOrderId: item.customOrderId || null,
        quantity: item.quantity || 1
      };

      const endpoint = getCartEndpoint();
      const headers = getCartHeaders();

      await axiosInstance.post(endpoint, requestData, { headers });
      
      showModal(`Berhasil menambahkan ${item.name || 'item'} ke keranjang!`, 'success');
      await fetchCart(); // Refresh cart from server
    } catch (error) {
      console.error('Failed to add to cart:', error);
      const msg = error.response?.data?.message || 'Gagal menambahkan item ke keranjang';
      showModal(msg, 'error');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const endpoint = `${getCartEndpoint()}/${cartItemId}`;
      const headers = getCartHeaders();
      
      await axiosInstance.delete(endpoint, { headers });
      await fetchCart(); // Refresh cart from server
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      showModal('Gagal menghapus item dari keranjang', 'error');
    }
  };

  const clearCart = async () => {
    try {
      const endpoint = getCartEndpoint();
      const headers = getCartHeaders();
      
      await axiosInstance.delete(endpoint, { headers });
      setCart([]); // Immediately clear local state
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, fetchCart, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
