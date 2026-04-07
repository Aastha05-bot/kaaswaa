import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const { user } = useAuth(); // Or we can rely on sessionStorage token
  
  const token = sessionStorage.getItem("token");
  const userId = sessionStorage.getItem("user_id"); // Assuming user_id is in sessionStorage or token
  
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to parse JWT if user_id is not in sessionStorage directly
  const getUserId = () => {
    if (userId) return userId;
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getUserId();

  const fetchCart = async () => {
    if (!currentUserId || !token) {
      setCart([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${currentUserId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // data contains joined cart_items
        setCart(data);
      } else {
        setCart([]);
      }
    } catch(err) {
      console.error(err);
      setCart([]);
    }
  };

  const fetchWishlist = async () => {
    if (!currentUserId || !token) {
      setWishlist([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/wishlist/${currentUserId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      } else {
        setWishlist([]);
      }
    } catch(err) {
      console.error(err);
      setWishlist([]);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart();
      fetchWishlist();
    } else {
      setCart([]);
      setWishlist([]);
    }
    setLoading(false);
  }, [token]);

  // Actions
  const addToCart = async (productId, quantity = 1, customization = null, customPrice = null) => {
    if (!currentUserId) return;
    
    try {
      const res = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          user_id: currentUserId, 
          product_id: productId, 
          quantity,
          customization,
          custom_price: customPrice
        })
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const updateCartQuantity = async (cartItemId, quantity) => {
    if (!currentUserId) return;
    try {
      const res = await fetch("http://localhost:5000/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: currentUserId, cart_item_id: cartItemId, quantity })
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cart/remove/${currentUserId}/${cartItemId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cart/clear/${currentUserId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchCart();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!currentUserId) return;

    const inWishlist = wishlist.some(item => item.product_id === productId);
    
    if (inWishlist) {
      try {
        const res = await fetch(`http://localhost:5000/api/wishlist/${currentUserId}/${productId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) fetchWishlist();
      } catch(err) {
        console.error(err);
      }
    } else {
      try {
        const res = await fetch("http://localhost:5000/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: currentUserId, product_id: productId })
        });
        if (res.ok) fetchWishlist();
      } catch(err) {
        console.error(err);
      }
    }
  };

  // derived metrics
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistItemCount = wishlist.length;

  return (
    <ShopContext.Provider value={{
      cart, wishlist, loading,
      cartItemCount, wishlistItemCount,
      addToCart, updateCartQuantity, removeFromCart, clearCart,
      toggleWishlist, fetchCart, fetchWishlist
    }}>
      {children}
    </ShopContext.Provider>
  );
};
