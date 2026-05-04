"use client";

import { useState } from "react";

type Props = { printifyOrderId: string };

export function PrintifyOrderActions({ printifyOrderId }: Props) {
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  async function run(action: "send_to_production" | "cancel" | "refresh") {
    if (action === "cancel" && !confirm("Cancel this Printify order? Only succeeds before production.")) return;
    setBusy(action);
    setMsg("");
    try {
      const r = await fetch(`/api/admin/printify/orders/${printifyOrderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "failed");
      setMsg(`✓ ${action.replace(/_/g, " ")} ok`);
      if (action === "refresh" || action === "cancel" || action === "send_to_production") {
        // Reload to reflect updated DB state
        setTimeout(() => location.reload(), 500);
      }
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy("");
    }
  }

  const Btn = ({
    onClick,
    children,
    tone = "default",
    label,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    tone?: "default" | "primary" | "danger";
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!!busy}
      className={
        "h-8 px-3 text-xs font-medium border disabled:opacity-50 " +
        (tone === "primary"
          ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
          : tone === "danger"
          ? "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
          : "bg-white text-stone-700 border-line hover:bg-[#f5f4f0]")
      }
    >
      {busy === label ? "…" : children}
    </button>
  );

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Btn onClick={() => run("refresh")} label="refresh">↻ Refresh status</Btn>
      <Btn onClick={() => run("send_to_production")} tone="primary" label="send_to_production">
        Send to production
      </Btn>
      <Btn onClick={() => run("cancel")} tone="danger" label="cancel">
        Cancel on Printify
      </Btn>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}
