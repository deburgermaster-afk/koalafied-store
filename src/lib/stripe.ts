import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function stripe() {
  if (!_stripe) {
    const k = process.env.STRIPE_SECRET_KEY;
    if (!k) throw new Error("STRIPE_SECRET_KEY not set");
    _stripe = new Stripe(k, { apiVersion: "2025-02-24.acacia" });
  }
  return _stripe;
}

export const CURRENCY = (process.env.CURRENCY ?? "aud").toLowerCase();
