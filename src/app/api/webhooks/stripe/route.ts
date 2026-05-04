import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { orders, orderItems, variants, products } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createPrintifyOrder, sendPrintifyOrderToProduction } from "@/lib/printify";
import { printifyShippingMethodFor } from "@/lib/auspost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error("Webhook verify failed", e);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCompletedSession(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCompletedSession(session: Stripe.Checkout.Session) {
  // Idempotency: skip if we already have this session marked paid.
  const existingBySession = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, session.id))
    .limit(1);

  // If we created a pending order at checkout, just update it.
  const pendingId = Number(session.metadata?.pending_order_id ?? "0") || null;
  if (pendingId && existingBySession[0]?.paymentStatus !== "paid") {
    const total = session.amount_total ?? existingBySession[0]?.totalCents ?? 0;
    const ship = session.shipping_details;
    const updatedAddress = ship?.address
      ? {
          name: ship.name ?? existingBySession[0]?.shippingAddress?.name ?? "",
          line1: ship.address.line1 ?? existingBySession[0]?.shippingAddress?.line1 ?? "",
          line2: ship.address.line2 ?? existingBySession[0]?.shippingAddress?.line2,
          suburb: ship.address.city ?? existingBySession[0]?.shippingAddress?.suburb ?? "",
          state: ship.address.state ?? existingBySession[0]?.shippingAddress?.state ?? "",
          postcode: ship.address.postal_code ?? existingBySession[0]?.shippingAddress?.postcode ?? "",
          country: ship.address.country ?? existingBySession[0]?.shippingAddress?.country ?? "AU",
          phone: session.customer_details?.phone ?? existingBySession[0]?.shippingAddress?.phone,
        }
      : existingBySession[0]?.shippingAddress ?? null;
    await db
      .update(orders)
      .set({
        status: "paid",
        paymentStatus: "paid",
        totalCents: total,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        shippingAddress: updatedAddress,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, pendingId));
    await tryFulfillWithPrintify(pendingId);
    return;
  }

  if (existingBySession.length) return;

  const cart: { v: number; q: number }[] = JSON.parse(session.metadata?.cart ?? "[]");
  const variantIds = cart.map((c) => c.v);
  const rows = variantIds.length
    ? await db
        .select({ v: variants, p: products })
        .from(variants)
        .innerJoin(products, eq(products.id, variants.productId))
        .where(inArray(variants.id, variantIds))
    : [];

  const subtotal = rows.reduce((sum, r) => {
    const qty = cart.find((c) => c.v === r.v.id)?.q ?? 0;
    return sum + r.v.priceCents * qty;
  }, 0);
  const shippingCents = session.shipping_cost?.amount_total ?? 0;
  const total = (session.amount_total ?? subtotal + shippingCents);

  const ship = session.shipping_details;
  const shippingAddress = ship?.address
    ? {
        name: ship.name ?? session.customer_details?.name ?? "",
        line1: ship.address.line1 ?? "",
        line2: ship.address.line2 ?? undefined,
        suburb: ship.address.city ?? "",
        state: ship.address.state ?? "",
        postcode: ship.address.postal_code ?? "",
        country: ship.address.country ?? "AU",
        phone: session.customer_details?.phone ?? undefined,
      }
    : null;

  const customerId = Number(session.metadata?.customer_id ?? "0") || null;

  const [order] = await db
    .insert(orders)
    .values({
      stripeSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      status: "paid",
      paymentStatus: "paid",
      fulfillmentStatus: "unfulfilled",
      subtotalCents: subtotal,
      shippingCents,
      totalCents: total,
      currency: (session.currency ?? "aud").toUpperCase(),
      customerId: customerId ?? undefined,
      customerEmail: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? null,
      shippingAddress,
      shippingMethod: session.metadata?.shipping_code ?? null,
    })
    .returning();

  for (const c of cart) {
    const r = rows.find((x) => x.v.id === c.v);
    if (!r) continue;
    const label = [r.v.option1, r.v.option2, r.v.option3].filter(Boolean).join(" / ");
    await db.insert(orderItems).values({
      orderId: order.id,
      variantId: r.v.id,
      productTitle: r.p.title,
      variantLabel: label,
      qty: c.q,
      unitPriceCents: r.v.priceCents,
      imageUrl: r.v.imageUrl,
      printifyProductId: r.v.printifyProductId ?? null,
      printifyVariantId: r.v.printifyVariantId ?? null,
    });
  }

  // Auto-submit to Printify if all items mapped + token present.
  await tryFulfillWithPrintify(order.id);
}

async function tryFulfillWithPrintify(orderId: number) {
  if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
    console.warn("Printify not configured; skipping auto-fulfillment");
    return;
  }
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !order.shippingAddress) return;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  const lineItems = items
    .filter((i) => i.printifyProductId && i.printifyVariantId)
    .map((i) => ({
      product_id: i.printifyProductId!,
      variant_id: parseInt(i.printifyVariantId!, 10),
      quantity: i.qty,
    }));

  if (lineItems.length === 0 || lineItems.length !== items.length) {
    await db
      .update(orders)
      .set({
        printifyError:
          "Some items missing Printify mapping. Run `npm run printify:sync` then retry from admin.",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    return;
  }

  const addr = order.shippingAddress!;
  const [first, ...rest] = (order.customerName ?? addr.name ?? "Customer").split(" ");
  try {
    const created = await createPrintifyOrder({
      external_id: `koalafied-${order.id}`,
      label: `KOALAFIED #${order.id}`,
      line_items: lineItems,
      shipping_method: printifyShippingMethodFor(order.shippingMethod),
      send_shipping_notification: true,
      address_to: {
        first_name: first || "Customer",
        last_name: rest.join(" ") || ".",
        email: order.customerEmail ?? "",
        phone: addr.phone,
        country: addr.country || "AU",
        region: addr.state,
        address1: addr.line1,
        address2: addr.line2,
        city: addr.suburb,
        zip: addr.postcode,
      },
    });
    await sendPrintifyOrderToProduction(created.id);
    await db
      .update(orders)
      .set({
        printifyOrderId: created.id,
        fulfillmentStatus: "in_production",
        printifyError: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  } catch (e: unknown) {
    await db
      .update(orders)
      .set({
        printifyError: e instanceof Error ? e.message : "Printify error",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }
}
