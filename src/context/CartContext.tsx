import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

import type { Product } from "@/data/products";



interface CartItem {

  product: Product;

  quantity: number;

  variant?: string;

}



interface CartContextType {

  items: CartItem[];

  isOpen: boolean;

  openCart: () => void;

  closeCart: () => void;

  addItem: (product: Product, variant?: string) => void;

  removeItem: (productId: string) => void;

  updateQuantity: (productId: string, qty: number) => void;

  clearCart: () => void;

  total: number;

  itemCount: number;

}



const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "rafaghelli_cart_items_v1";

const loadStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(item => item?.product?.id && item.quantity > 0) : [];
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
};



export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [items, setItems] = useState<CartItem[]>(loadStoredCart);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } else {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [items]);



  const openCart = useCallback(() => setIsOpen(true), []);

  const closeCart = useCallback(() => setIsOpen(false), []);



  const addItem = useCallback((product: Product, variant?: string) => {

    setItems(prev => {

      const existing = prev.find(i => i.product.id === product.id && i.variant === variant);

      if (existing) {

        return prev.map(i => i.product.id === product.id && i.variant === variant ? { ...i, quantity: i.quantity + 1 } : i);

      }

      return [...prev, { product, quantity: 1, variant }];

    });

    setIsOpen(true);

  }, []);



  const removeItem = useCallback((productId: string) => {

    setItems(prev => prev.filter(i => i.product.id !== productId));

  }, []);



  const updateQuantity = useCallback((productId: string, qty: number) => {

    if (qty <= 0) {

      setItems(prev => prev.filter(i => i.product.id !== productId));

    } else {

      setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));

    }

  }, []);



  const clearCart = useCallback(() => setItems([]), []);



  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);



  return (

    <CartContext.Provider value={{ items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>

      {children}

    </CartContext.Provider>

  );

};



export const useCart = () => {

  const ctx = useContext(CartContext);

  if (!ctx) throw new Error("useCart must be used within CartProvider");

  return ctx;

};
