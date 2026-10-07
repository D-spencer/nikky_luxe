"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  variantType: string | null;
  variantName: string | null;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
};

type AddCartItem = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  ready: boolean;
  addItem: (item: AddCartItem) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nikky-luxe-cart-v1";

function buildKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId || "base"}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // Ignore corrupted local cart data.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  function addItem(item: AddCartItem) {
    const key = buildKey(item.productId, item.variantId);
    const quantity = Math.max(1, Math.min(20, item.quantity || 1));

    setItems((current) => {
      const existing = current.find((entry) => entry.key === key);
      if (!existing) return [...current, { ...item, key, quantity }];
      return current.map((entry) =>
        entry.key === key
          ? { ...entry, quantity: Math.min(20, entry.quantity + quantity) }
          : entry
      );
    });
  }

  function setQuantity(key: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(key);
      return;
    }
    setItems((current) =>
      current.map((entry) =>
        entry.key === key
          ? { ...entry, quantity: Math.max(1, Math.min(20, quantity)) }
          : entry
      )
    );
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((entry) => entry.key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  const value: CartContextValue = {
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    ready,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
