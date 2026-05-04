import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { stripe } from "@/lib/stripe";
import { cancelPrintifyOrder } from "@/lib/printify";

/**
 * Admin refund.
 *
 * Printify policy (https://help.printify.com):
 *   - Print-on-demand items can only be refunded by Printify for defects /
 *     misprints / damage in transit.
 *   - Buyer's-remorse refunds are at the merchant's discretion and the
 *     merchant absorbs the production cost.
 *   - We can cancel the Printify order via API only while it is still
 *     `on-hold` / `pending`. Once `in-production` the cancel call fails.
 *
 * This endpoint:
 *   1. If Printify order has no fulfilment id OR is in a cancelable status,
 *      attempts to cancel it on Printify so we don't pay for it.
 *   2. Refunds the Stripe PaymentIntent (full or partial).
 *   3. Updates our order row.
 *
 * Body: { amountCents?: number, reason?: "requested_by_customer" | "duplicate" | "fraudulent" | "defect" }
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const orderId = Number(id);
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!order.stripePaymentIntentId)
    return NextResponse.json(
      { error: "No Stripe payment intent on this order." },
      { status: 400 }
    );
  if (order.paymentStatus === "refunded")
    return NextResponse.json({ error: "Already refunded." }, { status: 400 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const amount = Number((body as { amountCents?: number }).amountCents ?? 0);
  const reason = ((body as { reason?: string }).reason ?? "requested_by_customer") as
    | "requested_by_customer"
    | "duplicate"
    | "fraudulent"
    | "defect";

  // Try to cancel Printify side first (best-effort).
  let printifyCancelMsg: string | null = null;
  if (order.printifyOrderId) {
    try {
      await cancelPrintifyOrder(order.printifyOrderId);
      printifyCancelMsg = "Printify order canceled.";
    } catch (e) {
      // Most common reason: already in production. Log + continue.
      printifyCancelMsg =
        "Could not cancel on Printify (likely already in production). " +
        "If you've already paid Printify for this order, the refund issued here " +
        "will not be reimbursed by Printify unless it qualifies as a defect/misprint.";
      console.warn("printify cancel failed:", e instanceof Error ? e.message : e);
    }
  }

  // Refund via Stripe.
  let refundId: string;
  try {
    const refund = await stripe().refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: amount > 0 ? amount : undefined, // omit = full refund
      reason: reason === "defect" ? "requested_by_customer" : reason,
      metadata: {
        order_id: String(order.id),
        admin_reason: reason,
      },
    });
    refundId = refund.id;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "stripe_refund_failed" },
      { status: 500 }
    );
  }

  const isFull = !amount || amount >= order.totalCents;
  await db
    .update(orders)
    .set({
      paymentStatus: isFull ? "refunded" : "partially_refunded",
      fulfillmentStatus: isFull ? "canceled" : order.fulfillmentStatus,
      notes:
        (order.notes ? order.notes + "\n" : "") +
        `Refund ${refundId} (${isFull ? "full" : `$${(amount / 100).toFixed(2)}`}, ${reason})` +
        (printifyCancelMsg ? ` — ${printifyCancelMsg}` : ""),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  return NextResponse.json({
    ok: true,
    refundId,
    printifyCancelMsg,
    full: isFull,
  });
}
