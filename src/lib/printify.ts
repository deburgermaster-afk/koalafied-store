/**
 * Printify API client.
 * Docs: https://developers.printify.com/
 */
const BASE = "https://api.printify.com/v1";

function token() {
  const t = process.env.PRINTIFY_API_TOKEN;
  if (!t) throw new Error("PRINTIFY_API_TOKEN not set");
  return t;
}
function shopId() {
  const s = process.env.PRINTIFY_SHOP_ID;
  if (!s) throw new Error("PRINTIFY_SHOP_ID not set");
  return s;
}

export type PrintifyVariant = {
  id: number;
  title: string;
  is_enabled: boolean;
  price: number;
};
export type PrintifyProduct = {
  id: string;
  title: string;
  variants: PrintifyVariant[];
};

async function pf<T>(p: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${p}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      "User-Agent": "Koalafied/1.0",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Printify ${p} failed ${r.status}: ${body}`);
  }
  return (await r.json()) as T;
}

export async function listPrintifyProducts(): Promise<PrintifyProduct[]> {
  const out: PrintifyProduct[] = [];
  let page = 1;
  while (true) {
    const res = await pf<{ data: PrintifyProduct[]; last_page: number }>(
      `/shops/${shopId()}/products.json?page=${page}&limit=50`
    );
    out.push(...res.data);
    if (page >= res.last_page) break;
    page++;
  }
  return out;
}

export type CreateOrderInput = {
  external_id: string;
  label?: string;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
  }>;
  shipping_method: number; // 1 = Standard, 2 = Priority/Express
  send_shipping_notification?: boolean;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country: string; // ISO-2, e.g. "AU"
    region: string; // state code
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
};

export async function createPrintifyOrder(input: CreateOrderInput) {
  return pf<{ id: string; status: string }>(
    `/shops/${shopId()}/orders.json`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export async function sendPrintifyOrderToProduction(orderId: string) {
  return pf<{ id: string }>(
    `/shops/${shopId()}/orders/${orderId}/send_to_production.json`,
    { method: "POST" }
  );
}

export async function getPrintifyOrder(orderId: string) {
  return pf<{
    id: string;
    status: string;
    shipments?: Array<{
      carrier: string;
      number: string;
      url: string;
      delivered_at?: string;
    }>;
  }>(`/shops/${shopId()}/orders/${orderId}.json`);
}

/**
 * Cancel a Printify order. Per Printify policy this is only permitted while
 * the order is still in `on-hold` (awaiting fulfilment). Once it is in
 * production the API returns 4xx and a manual cancellation request is needed.
 * https://developers.printify.com/#cancel-an-unpaid-order
 */
export async function cancelPrintifyOrder(orderId: string) {
  return pf<{ id: string; status: string }>(
    `/shops/${shopId()}/orders/${orderId}/cancel.json`,
    { method: "POST" }
  );
}

/** Stages where Printify still allows API cancellation (i.e. refundable in full). */
export const PRINTIFY_CANCELABLE_STATUSES = new Set([
  "pending",
  "on-hold",
  "payment-not-received",
]);

// ───────── Shops ─────────
export type PrintifyShop = { id: number; title: string; sales_channel: string };
export async function listPrintifyShops() {
  return pf<PrintifyShop[]>(`/shops.json`);
}

// ───────── Orders (list / actions) ─────────
export type PrintifyOrderSummary = {
  id: string;
  external_id?: string | null;
  status: string;
  total_price: number;
  total_shipping: number;
  total_tax: number;
  created_at: string;
  shipments?: Array<{ carrier: string; number: string; url: string; delivered_at?: string }>;
  address_to?: { first_name: string; last_name: string; email?: string; country: string };
  line_items?: Array<{ product_id: string; variant_id: number; quantity: number; metadata?: { title?: string } }>;
};
export async function listPrintifyOrders(page = 1, limit = 25) {
  return pf<{ data: PrintifyOrderSummary[]; current_page: number; last_page: number; total: number }>(
    `/shops/${shopId()}/orders.json?page=${page}&limit=${limit}`
  );
}

export async function calcPrintifyShipping(input: {
  line_items: Array<{ product_id: string; variant_id: number; quantity: number }>;
  address_to: { country: string; region: string; address1: string; city: string; zip: string };
}) {
  return pf<{ standard: number; express: number; priority?: number }>(
    `/shops/${shopId()}/orders/shipping.json`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

// ───────── Webhooks ─────────
export type PrintifyWebhook = {
  id: string;
  topic: string;
  url: string;
  shop_id: number;
  secret?: string;
};
export const PRINTIFY_WEBHOOK_TOPICS = [
  "order:created",
  "order:updated",
  "order:sent-to-production",
  "order:shipment:created",
  "order:shipment:delivered",
  "product:publish:started",
] as const;

export async function listPrintifyWebhooks() {
  return pf<PrintifyWebhook[]>(`/shops/${shopId()}/webhooks.json`);
}
export async function createPrintifyWebhook(topic: string, url: string, secret?: string) {
  return pf<PrintifyWebhook>(`/shops/${shopId()}/webhooks.json`, {
    method: "POST",
    body: JSON.stringify({ topic, url, secret }),
  });
}
export async function deletePrintifyWebhook(id: string) {
  return pf<{ id: string }>(`/shops/${shopId()}/webhooks/${id}.json`, { method: "DELETE" });
}

// ───────── Products (publish/unpublish + detail) ─────────
export type PrintifyProductDetail = PrintifyProduct & {
  visible: boolean;
  is_locked: boolean;
  blueprint_id?: number;
  print_provider_id?: number;
  tags?: string[];
  images?: Array<{ src: string; position: string; is_default?: boolean }>;
};
export async function getPrintifyProduct(productId: string) {
  return pf<PrintifyProductDetail>(`/shops/${shopId()}/products/${productId}.json`);
}
export async function publishPrintifyProduct(productId: string) {
  return pf<{ ok: true }>(`/shops/${shopId()}/products/${productId}/publish.json`, {
    method: "POST",
    body: JSON.stringify({
      title: true,
      description: true,
      images: true,
      variants: true,
      tags: true,
      keyFeatures: true,
      shipping_template: true,
    }),
  });
}
export async function publishingSucceeded(productId: string, externalId: string, externalHandle?: string) {
  return pf<{ ok: true }>(`/shops/${shopId()}/products/${productId}/publishing_succeeded.json`, {
    method: "POST",
    body: JSON.stringify({ external: { id: externalId, handle: externalHandle ?? externalId } }),
  });
}
export async function publishingFailed(productId: string, reason: string) {
  return pf<{ ok: true }>(`/shops/${shopId()}/products/${productId}/publishing_failed.json`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
export async function unpublishPrintifyProduct(productId: string) {
  return pf<{ ok: true }>(`/shops/${shopId()}/products/${productId}/unpublish.json`, {
    method: "POST",
  });
}

// ───────── Catalog (read-only browse) ─────────
export async function listPrintifyBlueprints() {
  return pf<Array<{ id: number; title: string; brand: string; model: string }>>(`/catalog/blueprints.json`);
}
export async function listPrintProviders(blueprintId: number) {
  return pf<Array<{ id: number; title: string }>>(`/catalog/blueprints/${blueprintId}/print_providers.json`);
}

/** Map a Printify status string to a friendly label + tone for UI. */
export function printifyStageLabel(status: string | null | undefined): { label: string; tone: "muted" | "blue" | "amber" | "green" | "red" } {
  const s = (status ?? "").toLowerCase();
  if (!s) return { label: "Not submitted", tone: "muted" };
  if (s === "pending" || s === "on-hold" || s === "payment-not-received")
    return { label: "Awaiting production", tone: "amber" };
  if (s === "in-production" || s === "in_production")
    return { label: "In production", tone: "blue" };
  if (s === "fulfilled" || s === "shipped")
    return { label: "Shipped by Printify", tone: "blue" };
  if (s === "delivered") return { label: "Delivered", tone: "green" };
  if (s === "canceled" || s === "cancelled")
    return { label: "Canceled", tone: "red" };
  return { label: status ?? "—", tone: "muted" };
}
