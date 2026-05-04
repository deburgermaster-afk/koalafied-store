import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Printify webhook receiver.
 *
 * Subscribed event types (configure in Printify dashboard):
 *   - order:shipment:created
 *   - order:shipment:delivered
 *   - order:updated
 *   - order:sent-to-production
 *
 * Set PRINTIFY_WEBHOOK_SECRET to enable HMAC-SHA256 signature verification.
 * Printify sends the signature as `X-Pfy-Signature: sha256=<hex>`.
 */
type PrintifyEvent =
  | "order:shipment:created"
  | "order:shipment:delivered"
  | "order:updated"
  | "order:sent-to-production"
  | "order:created"
  | string;

type ShipmentResource = {
  id?: string;
  carrier?: string;
  number?: string;
  url?: string;
  delivered_at?: string;
  shipped_at?: string;
};

type PrintifyPayload = {
  id?: string;
  type?: PrintifyEvent;
  created_at?: string;
  resource?: {
    id?: string; // Printify order id
    type?: string; // "order" | "shipment"
    data?: {
      id?: string;
      external_id?: string;
      status?: string;
      shipments?: ShipmentResource[];
      // for shipment events Printify nests shipment fields directly:
      carrier?: string;
      number?: string;
      url?: string;
      delivered_at?: string;
      shipped_at?: string;
    };
  };
};

function verifySignature(raw: string, header: string | null) {
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET;
  if (!secret) return true; // verification disabled
  if (!header) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig =
    req.headers.get("x-pfy-signature") ??
    req.headers.get("printify-signature") ??
    req.headers.get("x-printify-signature");

  if (!verifySignature(raw, sig)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let event: PrintifyPayload;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const data = event.resource?.data ?? {};
  const printifyOrderId = data.id ?? event.resource?.id;
  const externalId = data.external_id; // we set this to "koalafied-<orderId>"

  // Resolve our order row.
  let orderId: number | null = null;
  if (externalId?.startsWith("koalafied-")) {
    const n = Number(externalId.slice("koalafied-".length));
    if (Number.isFinite(n)) orderId = n;
  }
  if (!orderId && printifyOrderId) {
    const row = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.printifyOrderId, printifyOrderId))
      .limit(1);
    if (row[0]) orderId = row[0].id;
  }
  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  switch (event.type) {
    case "order:sent-to-production":
    case "order:created": {
      updates.fulfillmentStatus = "in_production";
      if (printifyOrderId) updates.printifyOrderId = printifyOrderId;
      break;
    }
    case "order:shipment:created": {
      // Some Printify payloads put shipment fields directly under data; others
      // include a shipments[] array. Support both.
      const sh =
        data.shipments && data.shipments.length
          ? data.shipments[data.shipments.length - 1]
          : ({
              carrier: data.carrier,
              number: data.number,
              url: data.url,
              shipped_at: data.shipped_at,
            } as ShipmentResource);
      if (sh.number) updates.trackingCode = sh.number;
      if (sh.carrier) updates.trackingCarrier = sh.carrier;
      if (sh.url) updates.trackingUrl = sh.url;
      updates.shippedAt = sh.shipped_at ? new Date(sh.shipped_at) : new Date();
      updates.fulfillmentStatus = "shipped";
      break;
    }
    case "order:shipment:delivered": {
      const sh =
        data.shipments && data.shipments.length
          ? data.shipments[data.shipments.length - 1]
          : ({
              delivered_at: data.delivered_at,
            } as ShipmentResource);
      updates.deliveredAt = sh.delivered_at ? new Date(sh.delivered_at) : new Date();
      updates.fulfillmentStatus = "delivered";
      break;
    }
    case "order:updated": {
      // Mirror Printify status into our fulfillment column
      const map: Record<string, string> = {
        "on-hold": "on_hold",
        canceled: "canceled",
        cancelled: "canceled",
        fulfilled: "shipped",
      };
      if (data.status && map[data.status]) updates.fulfillmentStatus = map[data.status];
      break;
    }
    default:
      return NextResponse.json({ ok: true, ignored: event.type });
  }

  await db.update(orders).set(updates).where(eq(orders.id, orderId));
  return NextResponse.json({ ok: true });
}
