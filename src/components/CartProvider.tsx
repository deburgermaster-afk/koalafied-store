"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Ctx = { count: number; refresh: () => void };
const CartCtx = createContext<Ctx>({ count: 0, refresh: () => {} });

export function useCartCount() {
  return useContext(CartCtx);
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    try {
      const raw = readCookie("koalafied_cart");
      if (!raw) return setCount(0);
      const arr = JSON.parse(raw);
      const n = Array.isArray(arr) ? arr.reduce((s: number, x: { qty: number }) => s + (Number(x.qty) || 0), 0) : 0;
      setCount(n);
    } catch {
      setCount(0);
    }
  }, []);
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    const onStorage = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("koalafied:cart", onStorage as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("koalafied:cart", onStorage as EventListener);
    };
  }, [refresh]);
  return <CartCtx.Provider value={{ count, refresh }}>{children}</CartCtx.Provider>;
}
