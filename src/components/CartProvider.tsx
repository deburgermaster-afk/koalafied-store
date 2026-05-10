"use client";
import { createContext, useContext, useState, useEffect } from "react";

type Ctx = { count: number; refresh: () => void };
const CartCtx = createContext<Ctx>({ count: 0, refresh: () => {} });

export function useCartCount() {
  return useContext(CartCtx);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const refresh = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      const total = data.items?.reduce((sum: number, item: any) => sum + item.qty, 0) || 0;
      setCount(total);
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("koalafied:cart", handler);
    return () => window.removeEventListener("koalafied:cart", handler);
  }, []);

  return <CartCtx.Provider value={{ count, refresh }}>{children}</CartCtx.Provider>;
}
