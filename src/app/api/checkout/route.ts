import { NextRequest, NextResponse } from "next/server";
import { stripe, CURRENCY } from "@/lib/stripe";
import { readCart, hydrateCart } from "@/lib/cart";
import { db } from "@/db";
import { orders, orderItems, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentCustomer } from "@/lib/customer";
import type { ShippingAddress } from "@/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const shipping: { code: string; name: string; priceCents: number } | null = body.shipping ?? null;
  const address: ShippingAddress | null = body.address ?? null;

  const me = await getCurrentCustomer();
  if (!me) {
    return NextResponse.json(
      { error: "Sign in with email code to continue." },
      { status: 401 }
    );
  }

  const cart = await readCart();
  const items = await hydrateCart(cart);
  if (items.length === 0) return NextResponse.json({ error: "Cart empty" }, { status: 400 });

  if (!address || !address.line1 || !address.suburb || !address.postcode) {
    return NextResponse.json({ error: "Address incomplete" }, { status: 400 });
  }
  if (!shipping) {
    return NextResponse.json({ error: "Select a shipping method" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("xxx")) {
    return NextResponse.json(
      { error: "Stripe not configured. Set STRIPE_SECRET_KEY in .env." },
      { status: 503 }
    );
  }

  // Update customer profile so we remember the address + phone for next time.
  await db
    .update(customers)
    .set({
      name: address.name || me.name,
      phone: address.phone || me.phone,
      defaultAddress: address,
    })
    .where(eq(customers.id, me.id));

  const subtotal = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const total = subtotal + shipping.priceCents;

  // Persist a pending order so we can show it in the customer's account
  // even if the Stripe webhook is delayed.
  const [pending] = await db
    .insert(orders)
    .values({
      status: "pending",
      paymentStatus: "unpaid",
      subtotalCents: subtotal,
      shippingCents: shipping.priceCents,
      totalCents: total,
      currency: CURRENCY.toUpperCase(),
      customerId: me.id,
      customerEmail: me.email,
      customerName: address.name,
      shippingAddress: address,
      shippingMethod: shipping.code,
    })
    .returning();

  for (const i of items) {
    await db.insert(orderItems).values({
      orderId: pending.id,
      variantId: i.variantId,
      productTitle: i.title,
      variantLabel: i.variantLabel,
      qty: i.qty,
      unitPriceCents: i.priceCents,
      imageUrl: i.image ?? undefined,
    });
  }

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: me.email,
    line_items: items.map((i) => ({
      price_data: {
        currency: CURRENCY,
        product_data: {
          name: `${i.title}${i.variantLabel ? ` — ${i.variantLabel}` : ""}`,
          images: i.image ? [i.image] : undefined,
          metadata: { variantId: String(i.variantId) },
        },
        unit_amount: i.priceCents,
      },
      quantity: i.qty,
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shipping.priceCents, currency: CURRENCY },
          display_name: shipping.name,
          delivery_estimate: {
            minimum: { unit: "business_day", value: 2 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
    ],
    metadata: {
      cart: JSON.stringify(items.map((i) => ({ v: i.variantId, q: i.qty }))),
      shipping_code: shipping.code,
      customer_id: String(me.id),
      pending_order_id: String(pending.id),
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
  });

  await db
    .update(orders)
    .set({ stripeSessionId: session.id, updatedAt: new Date() })
    .where(eq(orders.id, pending.id));

  return NextResponse.json({ id: session.id, url: session.url });
}
