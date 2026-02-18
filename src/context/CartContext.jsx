import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Load cart from LocalStorage on start
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("rajchavinCart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save to LocalStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("rajchavinCart", JSON.stringify(cart));
  }, [cart]);

  // Add Item
  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      // Check if item already exists
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, qty: quantity }];
    });
  };

  // Remove Item
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Update Quantity
  const updateQty = (productId, newQty) => {
    if (newQty < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, qty: newQty } : item
      )
    );
  };

  // Clear Cart
  const clearCart = () => setCart([]);

  // Calculate Total Price
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};