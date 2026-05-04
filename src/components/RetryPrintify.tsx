"use client";
import { useState } from "react";

export function RetryPrintify({ orderId }: { orderId: number }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function go() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`/api/admin/orders/${orderId}/retry-printify`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setMsg("Submitted to Printify ✓");
      setTimeout(() => location.reload(), 1000);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-2">
      <button onClick={go} disabled={busy} className="bg-ink text-white px-3 py-1 text-xs font-semibold">
        {busy ? "Submitting…" : "Retry Printify submission"}
      </button>
      {msg && <span className="ml-2 text-xs">{msg}</span>}
    </div>
  );
}
