"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, CartContextType } from "../types";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart 必須在 CartProvider 內使用");
  return ctx;
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.id === item.id && i.size === item.size && i.color === item.color
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += item.quantity;
        return updated;
      } else {
        return [...prev, item];
      }
    });
  };

  const updateQuantity = (idx: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  };

  const removeItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}; 