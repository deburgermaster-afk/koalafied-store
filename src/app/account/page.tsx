import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { Price } from "@/components/Price";
import { HelpButton } from "@/components/HelpButton";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "ordered", label: "Ordered" },
  { key: "in_production", label: "In production" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

function stageIndex(o: { fulfillmentStatus: string; trackingCode?: string | null; deliveredAt?: Date | null; shippedAt?: Date | null; printifyOrderId?: string | null }) {
  if (o.deliveredAt || o.fulfillmentStatus === "delivered") return 3;
  if (o.shippedAt || o.fulfillmentStatus === "shipped" || o.trackingCode) return 2;
  if (o.printifyOrderId || o.fulfillmentStatus === "in_production") return 1;
  return 0;
}

export default async function AccountPage() {
  const me = await getCurrentCustomer();
  if (!me) redirect("/cart");

  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, me.id))
    .orderBy(desc(orders.createdAt));

  // Fetch all items in one query
  const itemsByOrder = new Map<number, Array<typeof orderItems.$inferSelect>>();
  if (myOrders.length) {
    const ids = myOrders.map((o) => o.id);
    const its = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));
    for (const it of its) {
      const arr = itemsByOrder.get(it.orderId) ?? [];
      arr.push(it);
      itemsByOrder.set(it.orderId, arr);
    }
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <h1 className="h-display text-4xl md:text-5xl">My account</h1>
          <p className="text-sm text-muted mt-1">{me.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton topic="general">Need help?</HelpButton>
          <form action="/api/auth/logout" method="post">
            <button className="text-sm underline">Sign out</button>
          </form>
        </div>
      </div>

      {me.defaultAddress && (
        <div className="mb-10 border border-line p-5 max-w-md text-sm">
          <div className="font-semibold mb-2">Default address</div>
          <div>{me.defaultAddress.name}</div>
          <div>{me.defaultAddress.line1}</div>
          {me.defaultAddress.line2 && <div>{me.defaultAddress.line2}</div>}
          <div>
            {me.defaultAddress.suburb} {me.defaultAddress.state} {me.defaultAddress.postcode}
          </div>
          <div>{me.defaultAddress.country}</div>
          {me.defaultAddress.phone && <div className="mt-1 text-muted">{me.defaultAddress.phone}</div>}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">My orders</h2>
      {myOrders.length === 0 ? (
        <div className="border border-line p-8 text-center bg-[#fbfaf6]">
          <div className="text-muted mb-4">No orders yet.</div>
          <Link href="/shop" className="inline-block bg-stone-900 text-white px-5 h-10 leading-10 text-sm font-medium">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((o) => {
            const its = itemsByOrder.get(o.id) ?? [];
            const idx = stageIndex(o);
            return (
              <div key={o.id} className="border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#f8f8f6] border-b border-line text-sm">
                  <div>
                    <span className="font-semibold">Order #{o.id}</span>
                    <span className="text-muted ml-3">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "px-2 py-0.5 text-[11px] font-semibold uppercase " +
                        (o.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : o.paymentStatus === "refunded" || o.paymentStatus === "partially_refunded"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800")
                      }
                    >
                      {o.paymentStatus.replace(/_/g, " ")}
                    </span>
                    <span className="font-semibold">
                      <Price cents={o.totalCents} from={(o.currency as "AUD") || "AUD"} />
                    </span>
                  </div>
                </div>

                {/* Stage timeline */}
                <div className="px-4 py-4 border-b border-line">
                  <div className="flex items-center justify-between">
                    {STAGES.map((s, i) => {
                      const done = i <= idx;
                      const current = i === idx;
                      return (
                        <div key={s.key} className="flex-1 flex flex-col items-center text-center">
                          <div
                            className={
                              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold " +
                              (done
                                ? "bg-emerald-600 text-white"
                                : "bg-stone-200 text-stone-500")
                            }
                          >
                            {done ? "✓" : i + 1}
                          </div>
                          <div
                            className={
                              "mt-1.5 text-[11px] " +
                              (current ? "font-semibold text-stone-900" : "text-muted")
                            }
                          >
                            {s.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 h-0.5 bg-stone-200 relative -z-10">
                    <div
                      className="absolute top-0 left-0 h-0.5 bg-emerald-600 transition-all"
                      style={{ width: `${(idx / (STAGES.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="divide-y divide-line">
                  {its.map((it) => (
                    <div key={it.id} className="flex gap-4 px-4 py-3">
                      <div className="relative w-16 h-16 bg-[#f5f4f0] shrink-0">
                        {it.imageUrl && (
                          <Image
                            src={it.imageUrl}
                            alt={it.productTitle}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-sm">
                        <div className="font-medium leading-snug line-clamp-2">{it.productTitle}</div>
                        {it.variantLabel && (
                          <div className="text-xs text-muted">{it.variantLabel}</div>
                        )}
                        <div className="text-xs text-muted mt-0.5">Qty {it.qty}</div>
                      </div>
                      <div className="text-right text-sm font-semibold whitespace-nowrap">
                        <Price cents={it.unitPriceCents * it.qty} from={(o.currency as "AUD") || "AUD"} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-line text-sm flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {o.trackingCode ? (
                      <span>
                        {o.trackingCarrier ? `${o.trackingCarrier}: ` : "Tracking: "}
                        {o.trackingUrl ? (
                          <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="underline">
                            {o.trackingCode}
                          </a>
                        ) : (
                          <Link href={`/track?code=${o.trackingCode}`} className="underline">
                            {o.trackingCode}
                          </Link>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">Tracking will appear here once shipped.</span>
                    )}
                    {o.shippedAt && (
                      <span className="text-muted text-xs">Shipped {new Date(o.shippedAt).toLocaleDateString()}</span>
                    )}
                    {o.deliveredAt && (
                      <span className="text-emerald-700 text-xs">Delivered {new Date(o.deliveredAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <HelpButton orderId={o.id}>Help with this order</HelpButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
