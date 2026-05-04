"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useCurrency } from "./CurrencyProvider";
import { ALL_CURRENCIES, CURRENCY_META, Currency } from "@/lib/currency";

export function CurrencySwitcher({ dark = false }: { dark?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const meta = CURRENCY_META[currency];

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Change currency"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex items-center gap-1.5 h-10 px-2 md:px-3 rounded-full text-sm font-medium",
          dark ? "hover:bg-white/15" : "hover:bg-[#f3f3f1]"
        )}
      >
        <span className="text-base leading-none">{meta.flag}</span>
        <span className="hidden sm:inline">{meta.label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className={clsx(
            "absolute right-0 top-full mt-1 min-w-[140px] rounded-lg shadow-xl border overflow-hidden z-50",
            "bg-white text-ink border-line"
          )}
        >
          {ALL_CURRENCIES.map((c) => {
            const m = CURRENCY_META[c];
            const active = c === currency;
            return (
              <button
                key={c}
                onClick={() => {
                  setCurrency(c as Currency);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f3f3f1]",
                  active && "font-semibold"
                )}
              >
                <span className="text-base">{m.flag}</span>
                <span>{m.label}</span>
                {active && (
                  <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
