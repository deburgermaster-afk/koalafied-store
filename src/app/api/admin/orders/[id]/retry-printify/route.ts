import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createPrintifyOrder, sendPrintifyOrderToProduction } from "@/lib/printify";
import { requireAdmin } from "@/lib/admin";
import { printifyShippingMethodFor } from "@/lib/auspost";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  const orderId = Number(id);
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!order.shippingAddress) return NextResponse.json({ error: "missing_address" }, { status: 400 });
  if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID)
    return NextResponse.json({ error: "printify_not_configured" }, { status: 503 });

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const lineItems = items
    .filter((i) => i.printifyProductId && i.printifyVariantId)
    .map((i) => ({
      product_id: i.printifyProductId!,
      variant_id: parseInt(i.printifyVariantId!, 10),
      quantity: i.qty,
    }));
  if (lineItems.length === 0 || lineItems.length !== items.length) {
    return NextResponse.json(
      { error: "Missing Printify mapping. Run npm run printify:sync." },
      { status: 400 }
    );
  }

  const addr = order.shippingAddress!;
  const [first, ...rest] = (order.customerName ?? addr.name ?? "Customer").split(" ");
  try {
    const created = await createPrintifyOrder({
      external_id: `koalafied-${order.id}-retry-${Date.now()}`,
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
        printifyError: null,
        fulfillmentStatus: "in_production",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    return NextResponse.json({ ok: true, printifyOrderId: created.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "printify_error";
    await db.update(orders).set({ printifyError: msg, updatedAt: new Date() }).where(eq(orders.id, orderId));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
