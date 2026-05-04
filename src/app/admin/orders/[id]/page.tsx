import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { RetryPrintify } from "@/components/RetryPrintify";
import { RefundOrder } from "@/components/admin/RefundOrder";
import { PrintifyOrderActions } from "@/components/admin/PrintifyOrderActions";
import { getPrintifyOrder, printifyStageLabel } from "@/lib/printify";
import { trackParcel, shippingMethodLabel } from "@/lib/auspost";

export const dynamic = "force-dynamic";

type Stage = "ordered" | "in_production" | "shipped" | "delivered";
const STAGES: { key: Stage; label: string }[] = [
  { key: "ordered", label: "Order placed" },
  { key: "in_production", label: "In production" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function currentStage(o: { fulfillmentStatus: string; deliveredAt: Date | null; shippedAt: Date | null; printifyOrderId: string | null }): Stage {
  if (o.deliveredAt || o.fulfillmentStatus === "delivered") return "delivered";
  if (o.shippedAt || o.fulfillmentStatus === "shipped") return "shipped";
  if (o.fulfillmentStatus === "in_production" || o.printifyOrderId) return "in_production";
  return "ordered";
}

export default async function AdminOrder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const orderId = Number(id);
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!o) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  // Best-effort enrich from external systems (don't break the page on error).
  let printifyStatus: string | null = null;
  if (o.printifyOrderId && process.env.PRINTIFY_API_TOKEN) {
    try {
      const pf = await getPrintifyOrder(o.printifyOrderId);
      printifyStatus = pf.status;
    } catch {}
  }
  let trackingEvents: Array<{ description: string; location: string; date: string }> = [];
  if (o.trackingCode && process.env.AUSPOST_API_KEY) {
    try {
      const t = await trackParcel(o.trackingCode);
      trackingEvents =
        t.tracking_results?.[0]?.trackable_items?.[0]?.events ?? [];
    } catch {}
  }

  const addr = o.shippingAddress;
  const stage = currentStage(o);
  const stageIndex = STAGES.findIndex((s) => s.key === stage);
  const pfStage = printifyStageLabel(printifyStatus);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/orders" className="text-xs text-muted underline">← All orders</Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">Order #{o.id}</h1>
          <div className="text-xs sm:text-sm text-muted">
            {new Date(o.createdAt).toLocaleString("en-AU", { dateStyle: "long", timeStyle: "short" })}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge value={o.paymentStatus} />
          <Badge value={o.fulfillmentStatus} />
          {pfStage.label !== "Not submitted" && (
            <span className={"inline-block text-[10px] px-2 py-0.5 rounded " + toneClass(pfStage.tone)}>
              Printify · {pfStage.label}
            </span>
          )}
        </div>
      </div>

      {/* Fulfillment timeline */}
      <div className="bg-white border border-line p-4 mb-6">
        <div className="text-[10px] tracking-[0.22em] uppercase text-muted mb-3">Fulfillment</div>
        <ol className="grid grid-cols-4 gap-2">
          {STAGES.map((s, i) => {
            const reached = i <= stageIndex;
            const current = i === stageIndex;
            return (
              <li key={s.key} className="flex flex-col items-center text-center">
                <div
                  className={
                    "w-7 h-7 rounded-full grid place-items-center text-xs font-bold " +
                    (reached ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-500") +
                    (current ? " ring-4 ring-emerald-200" : "")
                  }
                >
                  {reached ? "✓" : i + 1}
                </div>
                <div className={"text-[10px] sm:text-xs mt-1 " + (reached ? "text-ink font-medium" : "text-muted")}>
                  {s.label}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Panel title="Customer">
          <div className="text-sm">{o.customerName ?? "—"}</div>
          <div className="text-sm text-muted break-words">{o.customerEmail ?? "—"}</div>
          {addr?.phone && <div className="text-sm text-muted">{addr.phone}</div>}
        </Panel>
        <Panel title="Shipping address">
          {addr ? (
            <div className="text-sm leading-relaxed">
              {addr.name}<br />
              {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
              {addr.suburb} {addr.state} {addr.postcode}<br />
              {addr.country}
            </div>
          ) : (
            <div className="text-sm text-muted">No address on file.</div>
          )}
        </Panel>
        <Panel title="Totals">
          <Row k="Subtotal" v={formatMoney(o.subtotalCents, o.currency)} />
          <Row k="Shipping" v={formatMoney(o.shippingCents, o.currency)} />
          <Row k="Total" v={formatMoney(o.totalCents, o.currency)} bold />
          <Row k="Method" v={shippingMethodLabel(o.shippingMethod)} />
        </Panel>
        <Panel title="Tracking">
          {o.trackingCode ? (
            <>
              <Row k="Carrier" v={o.trackingCarrier ?? "—"} />
              <Row k="Code" v={
                o.trackingUrl ? (
                  <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="underline break-all">{o.trackingCode}</a>
                ) : (
                  <Link href={`/track?code=${o.trackingCode}`} className="underline break-all">{o.trackingCode}</Link>
                )
              } />
              {o.shippedAt && <Row k="Shipped" v={new Date(o.shippedAt).toLocaleString("en-AU")} />}
              {o.deliveredAt && <Row k="Delivered" v={new Date(o.deliveredAt).toLocaleString("en-AU")} />}
            </>
          ) : (
            <div className="text-sm text-muted">No tracking yet — Printify will push it via webhook when it ships.</div>
          )}
        </Panel>
      </div>

      {/* AusPost events */}
      {trackingEvents.length > 0 && (
        <Panel title="AusPost delivery events" className="mb-6">
          <ol className="space-y-2 text-sm">
            {trackingEvents.slice(0, 10).map((e, i) => (
              <li key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div>{e.description}</div>
                  <div className="text-xs text-muted">
                    {e.location ? `${e.location} · ` : ""}
                    {new Date(e.date).toLocaleString("en-AU")}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <Panel title="Printify fulfillment" className="mb-6">
        {o.printifyOrderId ? (
          <div className="space-y-2">
            <div className="text-sm">
              <span className={"font-medium " + (pfStage.tone === "green" ? "text-emerald-700" : pfStage.tone === "red" ? "text-red-700" : "text-blue-700")}>
                {pfStage.label}
              </span>
              {" — "}
              Order ID: <code className="break-all">{o.printifyOrderId}</code>
              <a
                href={`https://printify.com/app/orders/${o.printifyOrderId}`}
                target="_blank"
                rel="noreferrer"
                className="ml-2 underline text-xs"
              >
                open in Printify ↗
              </a>
            </div>
            {printifyStatus && (
              <div className="text-xs text-muted">Live status: {printifyStatus}</div>
            )}
            <PrintifyOrderActions printifyOrderId={o.printifyOrderId} />
          </div>
        ) : o.printifyError ? (
          <div className="space-y-2">
            <div className="text-sm text-red-700 break-words">{o.printifyError}</div>
            <RetryPrintify orderId={o.id} />
          </div>
        ) : (
          <div className="text-sm text-muted">Not submitted yet.</div>
        )}
      </Panel>

      {/* Refund */}
      <Panel title="Refund" className="mb-6">
        {o.paymentStatus === "paid" || o.paymentStatus === "partially_refunded" ? (
          <RefundOrder
            orderId={o.id}
            totalCents={o.totalCents}
            currency={o.currency}
            paymentStatus={o.paymentStatus}
            fulfillmentStatus={o.fulfillmentStatus}
            printifyOrderId={o.printifyOrderId}
          />
        ) : o.paymentStatus === "refunded" ? (
          <div className="text-sm text-emerald-700">Already refunded.</div>
        ) : (
          <div className="text-sm text-muted">Order not paid — no refund available.</div>
        )}
      </Panel>

      <Panel title="Items">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="text-left text-muted bg-[#f8f8f6]">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th>Variant</th>
                <th>Printify mapping</th>
                <th>Qty</th>
                <th className="text-right pr-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-t border-line">
                  <td className="px-3 py-2">{i.productTitle}</td>
                  <td>{i.variantLabel || "—"}</td>
                  <td className="text-xs text-muted">
                    {i.printifyProductId ? `${i.printifyProductId} / ${i.printifyVariantId}` : "—"}
                  </td>
                  <td>{i.qty}</td>
                  <td className="text-right pr-3">
                    {formatMoney(i.unitPriceCents * i.qty, o.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {o.notes && (
        <Panel title="Internal notes" className="mt-6">
          <pre className="text-xs whitespace-pre-wrap break-words text-ink/80">{o.notes}</pre>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"bg-white border border-line " + (className ?? "")}>
      <div className="px-4 py-2 border-b border-line text-[10px] tracking-[0.22em] uppercase text-muted">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: React.ReactNode; bold?: boolean }) {
  return (
    <div className={"flex justify-between gap-2 text-sm py-0.5 " + (bold ? "font-semibold" : "")}>
      <span className="text-muted shrink-0">{k}</span>
      <span className="text-right break-words">{v}</span>
    </div>
  );
}

function toneClass(t: "muted" | "blue" | "amber" | "green" | "red") {
  return t === "green"
    ? "bg-emerald-100 text-emerald-800"
    : t === "blue"
    ? "bg-blue-100 text-blue-800"
    : t === "amber"
    ? "bg-amber-100 text-amber-800"
    : t === "red"
    ? "bg-red-100 text-red-800"
    : "bg-stone-100 text-stone-700";
}

function Badge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const tone =
    v === "paid" || v === "delivered"
      ? "bg-emerald-100 text-emerald-800"
      : v === "shipped" || v === "in_production"
      ? "bg-blue-100 text-blue-800"
      : v === "canceled" || v === "refunded" || v.includes("fail")
      ? "bg-red-100 text-red-800"
      : v === "partially_refunded"
      ? "bg-amber-100 text-amber-800"
      : "bg-stone-100 text-stone-700";
  return <span className={"inline-block text-[10px] px-2 py-0.5 rounded " + tone}>{value}</span>;
}
