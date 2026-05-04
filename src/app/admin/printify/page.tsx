import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { variants, products } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";
import {
  listPrintifyShops,
  listPrintifyWebhooks,
  PRINTIFY_WEBHOOK_TOPICS,
  type PrintifyShop,
  type PrintifyWebhook,
} from "@/lib/printify";
import { PrintifyActions } from "@/components/admin/PrintifyActions";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminPrintify() {
  await requireAdmin();

  const tokenSet = !!process.env.PRINTIFY_API_TOKEN;
  const shopSet = !!process.env.PRINTIFY_SHOP_ID;
  const webhookSecretSet = !!process.env.PRINTIFY_WEBHOOK_SECRET;

  const [{ totalVariants }] = await db.select({ totalVariants: count() }).from(variants);
  const [{ mappedVariants }] = await db
    .select({ mappedVariants: count() })
    .from(variants)
    .where(sql`${variants.printifyProductId} IS NOT NULL AND ${variants.printifyVariantId} IS NOT NULL`);

  const productSummary = await db
    .select({
      id: products.id,
      title: products.title,
      total: sql<number>`COUNT(${variants.id})::int`,
      mapped: sql<number>`SUM(CASE WHEN ${variants.printifyProductId} IS NOT NULL AND ${variants.printifyVariantId} IS NOT NULL THEN 1 ELSE 0 END)::int`,
    })
    .from(products)
    .leftJoin(variants, eq(variants.productId, products.id))
    .groupBy(products.id)
    .orderBy(products.title);

  // Best-effort live data
  let shops: PrintifyShop[] = [];
  let initialWebhooks: PrintifyWebhook[] = [];
  let connectError: string | null = null;
  if (tokenSet) {
    try {
      shops = await listPrintifyShops();
    } catch (e) {
      connectError = e instanceof Error ? e.message : "connect_failed";
    }
    if (shopSet) {
      try {
        initialWebhooks = await listPrintifyWebhooks();
      } catch {}
    }
  }

  // Build the default webhook target URL based on incoming request
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const defaultWebhookUrl =
    (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      `${proto}://${host}`) + "/api/webhooks/printify";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Printify</h1>
      <p className="text-sm text-muted mb-6">
        Connection, webhooks, and live order actions. Auto fulfillment runs on every paid Stripe checkout —
        use this page to test the connection, install webhooks, sync variant mappings, or take manual action.
      </p>

      {/* Status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Status label="API token" ok={tokenSet} />
        <Status label="Shop ID" ok={shopSet} />
        <Status label="Webhook secret" ok={webhookSecretSet} />
        <Status label="API reachable" ok={tokenSet && !connectError} note={connectError ?? undefined} />
      </div>

      {/* Shop info */}
      {shops.length > 0 && (
        <div className="bg-white border border-line p-4 mb-6 text-sm">
          <div className="text-[10px] tracking-[0.22em] uppercase text-muted mb-2">Shops on this token</div>
          <ul className="space-y-1">
            {shops.map((s) => {
              const active = String(s.id) === process.env.PRINTIFY_SHOP_ID;
              return (
                <li key={s.id} className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs">{s.id}</span>
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-muted">{s.sales_channel}</span>
                  {active && (
                    <span className="ml-auto text-[10px] uppercase font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5">
                      active
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Variant mapping summary */}
      <div className="bg-white border border-line p-5 mb-6">
        <div className="font-semibold mb-1">Variant mapping</div>
        <div className="text-sm text-muted">
          {mappedVariants}/{totalVariants} local variants are mapped to Printify products.
          Only mapped variants will auto-submit to Printify when paid.
        </div>
      </div>

      {/* Local product mapping table */}
      <div className="bg-white border border-line mb-6">
        <div className="px-5 py-3 border-b border-line font-semibold text-sm">Local products</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="text-left text-muted bg-[#f8f8f6]">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th>Variants</th>
                <th>Mapped</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {productSummary.map((p) => {
                const ok = p.mapped > 0 && p.mapped === p.total;
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-4 py-2">{p.title}</td>
                    <td>{p.total}</td>
                    <td>{p.mapped}</td>
                    <td>
                      <span
                        className={
                          "text-[10px] px-2 py-0.5 rounded " +
                          (ok
                            ? "bg-emerald-100 text-emerald-800"
                            : p.mapped > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-700")
                        }
                      >
                        {ok ? "ready" : p.mapped > 0 ? "partial" : "unmapped"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live action panels */}
      <PrintifyActions
        initialWebhooks={initialWebhooks}
        webhookTopics={PRINTIFY_WEBHOOK_TOPICS}
        defaultWebhookUrl={defaultWebhookUrl}
        webhookSecretSet={webhookSecretSet}
      />
    </div>
  );
}

function Status({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <div className={"border p-4 bg-white " + (ok ? "border-emerald-300" : "border-amber-300")}>
      <div className="text-[10px] tracking-[0.22em] uppercase text-muted">{label}</div>
      <div className={"text-sm font-semibold mt-1 " + (ok ? "text-emerald-700" : "text-amber-700")}>
        {ok ? "Configured" : "Missing"}
      </div>
      {note && <div className="text-[10px] text-red-600 mt-1 break-words">{note}</div>}
    </div>
  );
}
