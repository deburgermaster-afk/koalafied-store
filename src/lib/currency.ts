export type Currency = "AUD" | "USD" | "GBP";

// Approximate FX rates from AUD base. Refreshed periodically; close enough for display.
// Production: refresh daily from a feed and cache in Redis/edge.
export const FX_FROM_AUD: Record<Currency, number> = {
  AUD: 1,
  USD: 0.66,
  GBP: 0.52,
};

export const CURRENCY_META: Record<
  Currency,
  { label: string; symbol: string; flag: string; locale: string }
> = {
  AUD: { label: "AUD", symbol: "$", flag: "🇦🇺", locale: "en-AU" },
  USD: { label: "USD", symbol: "$", flag: "🇺🇸", locale: "en-US" },
  GBP: { label: "GBP", symbol: "£", flag: "🇬🇧", locale: "en-GB" },
};

export const ALL_CURRENCIES: Currency[] = ["AUD", "USD", "GBP"];

export function convertCents(amountCents: number, from: Currency, to: Currency) {
  if (from === to) return amountCents;
  const aud = amountCents / FX_FROM_AUD[from];
  return Math.round(aud * FX_FROM_AUD[to]);
}

export function formatPrice(amountCents: number, currency: Currency) {
  const meta = CURRENCY_META[currency];
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function detectCurrencyFromTimezone(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/^Australia\//i.test(tz)) return "AUD";
    if (/^Europe\/London$/i.test(tz)) return "GBP";
    if (/^America\//i.test(tz)) return "USD";
  } catch {
    /* ignore */
  }
  return "AUD";
}
