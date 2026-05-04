export function formatMoney(cents: number, currency = "AUD") {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function cleanTitle(t: string) {
  return t.replace(/\s+Worn by Champions.*/i, "").replace(/\s+/g, " ").trim();
}
