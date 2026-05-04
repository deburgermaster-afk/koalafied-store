import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, sql, and, or, ilike, eq } from "drizzle-orm";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string; status?: string };

export default async function AdminOrdersIndex({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = (sp.status ?? "").trim();

  const [agg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      paid: sql<number>`count(*) filter (where payment_status = 'paid')::int`,
      unfulfilled: sql<number>`count(*) filter (where fulfillment_status not in ('fulfilled','delivered','cancelled','refunded'))::int`,
      shipped: sql<number>`count(*) filter (where fulfillment_status = 'shipped')::int`,
      delivered: sql<number>`count(*) filter (where fulfillment_status = 'delivered')::int`,
      refunded: sql<number>`count(*) filter (where payment_status in ('refunded','partially_refunded'))::int`,
      errors: sql<number>`count(*) filter (where printify_error is not null and printify_order_id is null)::int`,
      revenue: sql<number>`coalesce(sum(total_cents) filter (where payment_status = 'paid'),0)::bigint`,
      today: sql<number>`count(*) filter (where created_at::date = current_date)::int`,
    })
    .from(orders);

  const where = and(
    q
      ? or(
          ilike(orders.customerEmail, `%${q}%`),
          ilike(orders.customerName, `%${q}%`),
          ilike(orders.trackingCode, `%${q}%`),
          ilike(orders.printifyOrderId, `%${q}%`),
          sql`${orders.id}::text ilike ${`%${q}%`}`
        )
      : undefined,
    status === "unfulfilled"
      ? sql`${orders.fulfillmentStatus} not in ('fulfilled','delivered','cancelled','refunded')`
      : status === "shipped"
      ? eq(orders.fulfillmentStatus, "shipped")
      : status === "delivered"
      ? eq(orders.fulfillmentStatus, "delivered")
      : status === "refunded"
      ? or(eq(orders.paymentStatus, "refunded"), eq(orders.paymentStatus, "partially_refunded"))
      : status === "errors"
      ? and(sql`${orders.printifyError} is not null`, sql`${orders.printifyOrderId} is null`)
      : undefined
  );

  const list = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(300);

  const chips: Array<{ key: string; label: string; count: number }> = [
    { key: "", label: "All", count: agg.total },
    { key: "unfulfilled", label: "Unfulfilled", count: agg.unfulfilled },
    { key: "shipped", label: "Shipped", count: agg.shipped },
    { key: "delivered", label: "Delivered", count: agg.delivered },
    { key: "refunded", label: "Refunded", count: agg.refunded },
    { key: "errors", label: "Printify errors", count: agg.errors },
  ];

  function payBadge(s: string) {
    const map: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-800",
      unpaid: "bg-amber-100 text-amber-800",
      refunded: "bg-rose-100 text-rose-800",
      partially_refunded: "bg-rose-100 text-rose-800",
      failed: "bg-red-100 text-red-800",
    };
    return map[s] ?? "bg-stone-100 text-stone-700";
  }
  function fulBadge(s: string) {
    const map: Record<string, string> = {
      unfulfilled: "bg-stone-100 text-stone-700",
      in_production: "bg-blue-100 text-blue-800",
      shipped: "bg-indigo-100 text-indigo-800",
      delivered: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-rose-100 text-rose-800",
      refunded: "bg-rose-100 text-rose-800",
      fulfilled: "bg-emerald-100 text-emerald-800",
    };
    return map[s] ?? "bg-stone-100 text-stone-700";
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Orders</h1>
        <form className="flex items-center gap-2" method="get">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search id / email / tracking…"
            className="h-9 w-56 sm:w-72 border border-line px-3 text-sm bg-white"
          />
          <button className="h-9 px-3 text-sm border border-line bg-white hover:bg-[#f5f4f0]">Search</button>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Today" value={agg.today.toString()} />
        <Stat label="Paid" value={agg.paid.toString()} />
        <Stat label="Unfulfilled" value={agg.unfulfilled.toString()} accent="amber" />
        <Stat label="Revenue" value={formatMoney(Number(agg.revenue), "AUD")} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((c) => {
          const active = (status || "") === c.key;
          const href =
            "?" +
            new URLSearchParams({
              ...(q ? { q } : {}),
              ...(c.key ? { status: c.key } : {}),
            }).toString();
          return (
            <Link
              key={c.label}
              href={href}
              className={
                "px-3 h-8 inline-flex items-center text-xs font-medium border " +
                (active
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-line hover:bg-[#f5f4f0]")
              }
            >
              {c.label}
              <span className={"ml-2 " + (active ? "text-stone-300" : "text-muted")}>{c.count}</span>
            </Link>
          );
        })}
      </div>

      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-sm min-w-[920px]">
          <thead className="text-left text-muted bg-[#f8f8f6]">
            <tr>
              <th className="px-4 py-2.5">#</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Printify</th>
              <th>Tracking</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-t border-line hover:bg-[#fafaf6]">
                <td className="px-4 py-2.5 font-medium">#{o.id}</td>
                <td className="whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleString("en-AU", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="max-w-[200px] truncate">
                  <div className="truncate">{o.customerName ?? "—"}</div>
                  <div className="truncate text-xs text-muted">{o.customerEmail ?? ""}</div>
                </td>
                <td className="whitespace-nowrap">{formatMoney(o.totalCents, o.currency)}</td>
                <td>
                  <span className={"px-2 py-0.5 text-[11px] font-semibold uppercase " + payBadge(o.paymentStatus)}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td>
                  <span className={"px-2 py-0.5 text-[11px] font-semibold uppercase " + fulBadge(o.fulfillmentStatus)}>
                    {o.fulfillmentStatus.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="max-w-[140px] truncate">
                  {o.printifyOrderId ? (
                    <span className="text-emerald-700">{o.printifyOrderId.slice(0, 12)}…</span>
                  ) : o.printifyError ? (
                    <span className="text-red-600" title={o.printifyError}>error</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="max-w-[160px] truncate">
                  {o.trackingCode ? (
                    o.trackingUrl ? (
                      <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="underline">
                        {o.trackingCode}
                      </a>
                    ) : (
                      <Link href={`/track?code=${o.trackingCode}`} className="underline">
                        {o.trackingCode}
                      </Link>
                    )
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="pr-4">
                  <Link href={`/admin/orders/${o.id}`} className="text-xs underline">view</Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted">
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber";
}) {
  return (
    <div className="bg-white border border-line p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={"mt-1 text-xl font-bold " + (accent === "amber" ? "text-amber-700" : "")}>{value}</div>
    </div>
  );
}
