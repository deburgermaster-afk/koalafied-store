"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  Currency,
  convertCents,
  detectCurrencyFromTimezone,
  formatPrice,
} from "@/lib/currency";

type Ctx = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amountCents: number, from?: Currency) => string;
};

const CurrencyCtx = createContext<Ctx | null>(null);

const COOKIE = "kf_currency";

function readCookie(): Currency | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )kf_currency=([^;]+)/);
  if (!m) return null;
  const v = decodeURIComponent(m[1]) as Currency;
  if (v === "AUD" || v === "USD" || v === "GBP") return v;
  return null;
}

function writeCookie(c: Currency) {
  document.cookie = `${COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("AUD");

  // Hydrate from cookie or auto-detect
  useEffect(() => {
    const fromCookie = readCookie();
    if (fromCookie) {
      setCurrencyState(fromCookie);
      return;
    }
    const detected = detectCurrencyFromTimezone();
    setCurrencyState(detected);
    writeCookie(detected);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    writeCookie(c);
  };

  const format = (amountCents: number, from: Currency = "AUD") => {
    const converted = convertCents(amountCents, from, currency);
    return formatPrice(converted, currency);
  };

  return (
    <CurrencyCtx.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyCtx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyCtx);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
