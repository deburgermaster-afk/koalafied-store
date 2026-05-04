import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { orders, products, customers } from "@/db/schema";
import { desc, sql, count } from "drizzle-orm";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const [{ totalOrders }] = await db
    .select({ totalOrders: count() })
    .from(orders);

  const [{ paidRevenueCents }] = await db
    .select({
      paidRevenueCents: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)::int`,
    })
    .from(orders)
    .where(sql`${orders.paymentStatus} = 'paid'`);

  const [{ unfulfilled }] = await db
    .select({ unfulfilled: count() })
    .from(orders)
    .where(sql`${orders.fulfillmentStatus} IN ('unfulfilled','in_production')`);

  const [{ totalProducts }] = await db
    .select({ totalProducts: count() })
    .from(products);

  const [{ totalCustomers }] = await db
    .select({ totalCustomers: count() })
    .from(customers);

  const recent = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(8);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-muted mb-6 lg:mb-8">All operations at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 lg:mb-10">
        <Stat label="Orders" value={totalOrders.toString()} />
        <Stat label="Revenue (paid)" value={formatMoney(paidRevenueCents, "AUD")} />
        <Stat label="To fulfil" value={unfulfilled.toString()} accent={unfulfilled > 0} />
        <Stat label="Products" value={totalProducts.toString()} />
        <Stat label="Customers" value={totalCustomers.toString()} />
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8 lg:mb-10">
        <QuickLink href="/admin/orders" title="Orders" desc="View, search, retry Printify, AusPost tracking" />
        <QuickLink href="/admin/products/new" title="+ New Product" desc="Add tees, rashguards, hoodies" />
        <QuickLink href="/admin/printify" title="Printify" desc="Sync catalog, map variants" />
      </div>

      <div className="bg-white border border-line">
        <div className="px-4 sm:px-5 py-3 border-b border-line flex items-center justify-between">
          <h2 className="font-semibold text-sm">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-muted bg-[#f8f8f6]">
            <tr>
              <th className="px-4 py-2">#</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium">#{o.id}</td>
                <td>{new Date(o.createdAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td>{o.customerEmail ?? "—"}</td>
                <td>{formatMoney(o.totalCents, o.currency)}</td>
                <td><Badge value={o.paymentStatus} /></td>
                <td><Badge value={o.fulfillmentStatus} /></td>
                <td className="pr-4">
                  <Link href={`/admin/orders/${o.id}`} className="text-xs underline">view</Link>
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-muted">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={"bg-white border border-line p-4 " + (accent ? "ring-2 ring-amber-300" : "")}>
      <div className="text-[10px] tracking-[0.22em] uppercase text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block bg-white border border-line p-5 hover:border-ink transition-colors"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted mt-1">{desc}</div>
    </Link>
  );
}

function Badge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const tone =
    v === "paid" || v === "delivered"
      ? "bg-emerald-100 text-emerald-800"
      : v === "shipped" || v === "in_production"
      ? "bg-blue-100 text-blue-800"
      : v === "canceled" || v.includes("fail")
      ? "bg-red-100 text-red-800"
      : "bg-stone-100 text-stone-700";
  return <span className={"inline-block text-[10px] px-2 py-0.5 rounded " + tone}>{value}</span>;
}
