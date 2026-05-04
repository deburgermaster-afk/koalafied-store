import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  cancelPrintifyOrder,
  sendPrintifyOrderToProduction,
  getPrintifyOrder,
} from "@/lib/printify";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  try {
    if (action === "send_to_production") {
      const r = await sendPrintifyOrderToProduction(id);
      // Try to reflect on local record
      await db
        .update(orders)
        .set({ fulfillmentStatus: "in_production", updatedAt: new Date() })
        .where(eq(orders.printifyOrderId, id));
      return NextResponse.json({ ok: true, result: r });
    }
    if (action === "cancel") {
      const r = await cancelPrintifyOrder(id);
      await db
        .update(orders)
        .set({ fulfillmentStatus: "cancelled", updatedAt: new Date() })
        .where(eq(orders.printifyOrderId, id));
      return NextResponse.json({ ok: true, result: r });
    }
    if (action === "refresh") {
      const r = await getPrintifyOrder(id);
      const ship = r.shipments?.[0];
      if (ship?.number) {
        await db
          .update(orders)
          .set({
            trackingCode: ship.number,
            trackingCarrier: ship.carrier,
            trackingUrl: ship.url,
            shippedAt: new Date(),
            fulfillmentStatus: ship.delivered_at ? "delivered" : "shipped",
            deliveredAt: ship.delivered_at ? new Date(ship.delivered_at) : null,
            updatedAt: new Date(),
          })
          .where(eq(orders.printifyOrderId, id));
      }
      return NextResponse.json({ ok: true, result: r });
    }
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
