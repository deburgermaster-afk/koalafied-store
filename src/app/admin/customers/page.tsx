import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  await requireAdmin();
  const rows = await db
    .select({
      id: customers.id,
      email: customers.email,
      name: customers.name,
      phone: customers.phone,
      createdAt: customers.createdAt,
      orderCount: count(orders.id),
      lifetimeCents: sql<number>`COALESCE(SUM(${orders.totalCents}) FILTER (WHERE ${orders.paymentStatus} = 'paid'), 0)::int`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .limit(200);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-6">Customers</h1>
      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-left text-muted bg-[#f8f8f6]">
            <tr>
              <th className="px-4 py-2.5">Email</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Lifetime</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-2">{c.email}</td>
                <td>{c.name ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.orderCount}</td>
                <td>{formatMoney(c.lifetimeCents, "AUD")}</td>
                <td>{new Date(c.createdAt).toLocaleDateString("en-AU")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
