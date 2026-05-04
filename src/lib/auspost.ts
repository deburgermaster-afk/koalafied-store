/**
 * Australia Post PAC API client (shipping rates) + tracking.
 * Docs: https://developers.auspost.com.au/apis/pac/reference
 *
 * Configuration (env):
 *   AUSPOST_API_KEY              — PAC API key (required for live rates)
 *   AUSPOST_FROM_POSTCODE        — origin postcode (default 2000)
 *   AUSPOST_PARCEL_LENGTH_CM     — default 22
 *   AUSPOST_PARCEL_WIDTH_CM      — default 16
 *   AUSPOST_PARCEL_HEIGHT_CM     — default 4
 *   AUSPOST_WEIGHT_PER_ITEM_KG   — default 0.25
 *   AUSPOST_MIN_WEIGHT_KG        — default 0.5
 */
const BASE = "https://digitalapi.auspost.com.au";

export const auspostConfig = () => ({
  hasKey: !!process.env.AUSPOST_API_KEY,
  fromPostcode: process.env.AUSPOST_FROM_POSTCODE ?? "2000",
  lengthCm: Number(process.env.AUSPOST_PARCEL_LENGTH_CM ?? "22"),
  widthCm: Number(process.env.AUSPOST_PARCEL_WIDTH_CM ?? "16"),
  heightCm: Number(process.env.AUSPOST_PARCEL_HEIGHT_CM ?? "4"),
  weightPerItemKg: Number(process.env.AUSPOST_WEIGHT_PER_ITEM_KG ?? "0.25"),
  minWeightKg: Number(process.env.AUSPOST_MIN_WEIGHT_KG ?? "0.5"),
});

function key() {
  const k = process.env.AUSPOST_API_KEY;
  if (!k) throw new Error("AUSPOST_API_KEY not set");
  return k;
}

async function ap<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "auth-key": key(), Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`AusPost ${path} failed ${r.status}: ${body}`);
  }
  return (await r.json()) as T;
}

export type RateRequest = {
  fromPostcode?: string;
  toPostcode: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
};

export type RateOption = {
  code: string;
  name: string;
  priceCents: number;
  deliveryTime?: string;
};

export async function getDomesticRates(req: RateRequest): Promise<RateOption[]> {
  const cfg = auspostConfig();
  const from = req.fromPostcode ?? cfg.fromPostcode;
  const length = req.lengthCm ?? cfg.lengthCm;
  const width = req.widthCm ?? cfg.widthCm;
  const height = req.heightCm ?? cfg.heightCm;
  const qs = new URLSearchParams({
    from_postcode: from,
    to_postcode: req.toPostcode,
    length: String(length),
    width: String(width),
    height: String(height),
    weight: String(Math.max(0.1, req.weightKg)),
  });
  const res = await ap<{
    services: { service: { code: string; name: string; price: string }[] };
  }>(`/postage/parcel/domestic/service.json?${qs.toString()}`);
  const list = res.services?.service ?? [];
  return list.map((s) => ({
    code: s.code,
    name: s.name,
    priceCents: Math.round(parseFloat(s.price) * 100),
  }));
}

export async function trackParcel(trackingCode: string) {
  return ap<{
    tracking_results: Array<{
      tracking_id: string;
      status: string;
      trackable_items?: Array<{
        events: Array<{ description: string; location: string; date: string }>;
      }>;
    }>;
  }>(`/track/v1/track?tracking_ids=${encodeURIComponent(trackingCode)}`);
}

/**
 * Map an AusPost service code to Printify shipping_method id.
 * Printify: 1 = Standard, 2 = Express/Priority.
 * https://developers.printify.com/#orders
 */
export function printifyShippingMethodFor(code: string | null | undefined): 1 | 2 {
  if (!code) return 1;
  return /EXPRESS|PRIORITY/i.test(code) ? 2 : 1;
}

/** Human label for a stored shipping_code (used in admin UI). */
export function shippingMethodLabel(code: string | null | undefined): string {
  if (!code) return "Standard";
  if (/EXPRESS/i.test(code)) return "AusPost Express";
  if (/PRIORITY/i.test(code)) return "AusPost Priority";
  return "AusPost Standard";
}
