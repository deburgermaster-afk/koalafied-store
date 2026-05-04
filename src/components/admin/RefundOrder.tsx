"use client";
import { useState } from "react";

type Props = {
  orderId: number;
  totalCents: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  printifyOrderId: string | null;
};

const FORMATTER = (cents: number, ccy: string) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: ccy }).format(
    cents / 100
  );

export function RefundOrder(p: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<
    "requested_by_customer" | "duplicate" | "fraudulent" | "defect"
  >("requested_by_customer");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  if (p.paymentStatus === "refunded") {
    return (
      <div className="text-sm text-emerald-700 font-medium">
        Refunded — no further action available.
      </div>
    );
  }

  // Printify policy summary surfaced to admin.
  const stage = p.fulfillmentStatus.toLowerCase();
  const isPostProduction = ["in_production", "shipped", "delivered"].includes(stage);
  const policy = !p.printifyOrderId
    ? "No Printify fulfillment yet — full refund is safe."
    : !isPostProduction
    ? "Printify order has not entered production. We will attempt to cancel it via API before refunding."
    : stage === "delivered" || stage === "shipped"
    ? "Item already shipped/delivered. Per Printify policy, refunds are only reimbursed by Printify for defects, misprints, or damage in transit. A full refund here is at your cost."
    : "Printify is already producing this order. The cancel API will likely fail; the refund here will be at your cost unless it qualifies as a defect.";

  async function submit() {
    setBusy(true);
    setMsg("");
    try {
      const cents = amount.trim() ? Math.round(parseFloat(amount) * 100) : 0;
      const r = await fetch(`/api/admin/orders/${p.orderId}/refund`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountCents: cents, reason }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "refund_failed");
      setMsg(
        `✓ Refund issued (${j.refundId}). ${j.printifyCancelMsg ?? ""}`.trim()
      );
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : "Refund failed"}`);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded"
      >
        Issue refund…
      </button>
    );
  }

  return (
    <div className="border border-red-200 bg-red-50/40 p-4 rounded space-y-3 text-sm">
      <div className="font-semibold text-red-800">Issue refund</div>
      <div className="text-xs text-red-900/80 leading-relaxed">{policy}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <div className="text-xs text-muted mb-1">
            Amount (leave empty for full {FORMATTER(p.totalCents, p.currency)})
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={(p.totalCents / 100).toFixed(2)}
            className="w-full border border-line px-2 py-1.5 bg-white"
          />
        </label>
        <label className="block">
          <div className="text-xs text-muted mb-1">Reason</div>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as typeof reason)}
            className="w-full border border-line px-2 py-1.5 bg-white"
          >
            <option value="requested_by_customer">Requested by customer</option>
            <option value="duplicate">Duplicate</option>
            <option value="fraudulent">Fraudulent</option>
            <option value="defect">Defect / misprint (Printify-claimable)</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="bg-red-600 text-white text-xs px-3 py-1.5 disabled:opacity-50 rounded"
        >
          {busy ? "Refunding…" : "Confirm refund"}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={busy}
          className="text-xs px-3 py-1.5 border border-line bg-white rounded"
        >
          Cancel
        </button>
        {msg && <span className="text-xs">{msg}</span>}
      </div>
    </div>
  );
}
