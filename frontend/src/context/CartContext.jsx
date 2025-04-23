import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const CartContext = createContext({
  cart: { items: [], total_price: 0 },
  isLoading: true,
  addToCart: () => {},
  updateCartItem: () => {},
  removeFromCart: () => {},
  clearCart: () => {}
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Fetch cart when user is authenticated
  useEffect(() => {
    const fetchCart = async () => {
      if (isAuthenticated) {
        try {
          setIsLoading(true);
          const token = localStorage.getItem('token');
          const response = await api.get('/cart', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setCart(response.data);
        } catch (error) {
          console.error('Error fetching cart:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setCart({ items: [], total_price: 0 });
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (cartItem) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/cart/items', cartItem, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Failed to add item to cart'
      };
    }
  };

  const updateCartItem = async (productId, cartItem) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/cart/items/${productId}`, cartItem, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      console.error('Error updating cart item:', error);
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Failed to update item quantity'
      };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/cart/items/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Failed to remove item from cart'
      };
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.delete('/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Failed to clear cart'
      };
    }
  };

  const value = {
    cart,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
