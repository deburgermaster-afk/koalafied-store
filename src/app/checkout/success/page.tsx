import Link from "next/link";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  let orderId: number | null = null;
  let orderStatus = "pending";

  if (sp.session_id) {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.stripeSessionId, sp.session_id))
        .limit(1);
      
      if (order) {
        orderId = order.id;
        orderStatus = order.status;
      }
    } catch (e) {
      console.error("Failed to fetch order", e);
    }
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-24 text-center">
      <h1 className="h-display text-4xl mb-4">Order confirmed ✓</h1>
      {orderId && (
        <p className="text-2xl font-bold text-ink mb-4">Order #{orderId}</p>
      )}
      <p className="text-muted mb-2">
        Thanks for your order. A confirmation email is on its way.
      </p>
      <p className="text-sm text-muted mb-8">
        Your order is being submitted to our print partner automatically. You'll receive
        a tracking link from Australia Post once it ships.
      </p>
      <div className="bg-[#f8f8f6] p-4 rounded mb-8 border border-line">
        <p className="text-sm text-muted">Status: <span className="font-semibold text-ink capitalize">{orderStatus}</span></p>
      </div>
      <div className="flex gap-3 justify-center">
        <Link href={`/track?order=${orderId || ''}`} className="border border-ink px-6 py-3 text-sm font-semibold">
          Track an order
        </Link>
        <Link href="/shop" className="bg-ink text-white px-6 py-3 text-sm font-semibold">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
