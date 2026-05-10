"use client";
import { createContext, useContext } from "react";

type Ctx = { count: number; refresh: () => void };
const CartCtx = createContext<Ctx>({ count: 0, refresh: () => {} });

export function useCartCount() {
  return useContext(CartCtx);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Cart provider is now a no-op (kept for backwards compatibility)
  return <CartCtx.Provider value={{ count: 0, refresh: () => {} }}>{children}</CartCtx.Provider>;
}
