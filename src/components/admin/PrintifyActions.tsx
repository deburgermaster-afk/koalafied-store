"use client";

import { useState } from "react";
import type { PrintifyWebhook } from "@/lib/printify";

type Props = {
  initialWebhooks: PrintifyWebhook[];
  webhookTopics: readonly string[];
  defaultWebhookUrl: string;
  webhookSecretSet: boolean;
};

export function PrintifyActions({
  initialWebhooks,
  webhookTopics,
  defaultWebhookUrl,
  webhookSecretSet,
}: Props) {
  const [hooks, setHooks] = useState<PrintifyWebhook[]>(initialWebhooks);
  const [busy, setBusy] = useState<string>("");
  const [log, setLog] = useState<string>("");
  const [whUrl, setWhUrl] = useState<string>(defaultWebhookUrl);
  const [pfOrders, setPfOrders] = useState<
    Array<{
      id: string;
      external_id?: string | null;
      status: string;
      total_price: number;
      created_at: string;
      address_to?: { first_name: string; last_name: string };
      shipments?: Array<{ number: string }>;
    }>
  >([]);
  const [pfOrdersPage, setPfOrdersPage] = useState<number>(1);
  const [pfOrdersTotal, setPfOrdersTotal] = useState<number>(0);
  const [syncResult, setSyncResult] = useState<string>("");

  function note(msg: string) {
    setLog(`[${new Date().toLocaleTimeString()}] ${msg}\n` + log);
  }

  async function call(label: string, fn: () => Promise<string | void>) {
    setBusy(label);
    try {
      const r = await fn();
      if (r) note(r);
    } catch (e) {
      note(`✗ ${label}: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy("");
    }
  }

  async function refreshHooks() {
    await call("refresh webhooks", async () => {
      const r = await fetch("/api/admin/printify/webhooks");
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setHooks(j.hooks);
      return `✓ ${j.hooks.length} webhooks loaded`;
    });
  }
  async function installWebhooks() {
    await call("install webhooks", async () => {
      const r = await fetch("/api/admin/printify/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "install_all", url: whUrl }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      await refreshHooks();
      return `✓ Installed ${j.created.length} new webhook(s) at ${j.target}`;
    });
  }
  async function deleteHook(id: string) {
    if (!confirm(`Delete webhook ${id}?`)) return;
    await call("delete webhook", async () => {
      const r = await fetch("/api/admin/printify/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setHooks((h) => h.filter((x) => x.id !== id));
      return `✓ Deleted webhook ${id}`;
    });
  }
  async function loadPfOrders(page = 1) {
    await call("load orders", async () => {
      const r = await fetch(`/api/admin/printify/orders?page=${page}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setPfOrders(j.data ?? []);
      setPfOrdersPage(j.current_page ?? page);
      setPfOrdersTotal(j.total ?? 0);
      return `✓ Loaded ${j.data?.length ?? 0} Printify orders`;
    });
  }
  async function orderAction(id: string, action: "send_to_production" | "cancel" | "refresh") {
    if (action === "cancel" && !confirm(`Cancel Printify order ${id}? Only works pre-production.`)) return;
    await call(`${action} ${id}`, async () => {
      const r = await fetch(`/api/admin/printify/orders/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      await loadPfOrders(pfOrdersPage);
      return `✓ ${action} ${id}`;
    });
  }
  async function runSync() {
    setSyncResult("");
    await call("sync", async () => {
      const r = await fetch("/api/admin/printify/sync", { method: "POST" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setSyncResult(
        `Matched ${j.matchedProducts}/${j.totalLocalProducts} products · mapped ${j.mappedVariants} variants · skipped ${j.skipped}`
      );
      return `✓ Sync complete`;
    });
  }
  async function testConnection() {
    await call("test", async () => {
      const r = await fetch("/api/admin/printify/status");
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      return `✓ Connected · ${j.shops?.length ?? 0} shop(s) · ${j.webhookCount ?? 0} webhook(s)`;
    });
  }

  const Btn = ({
    onClick,
    children,
    tone = "default",
    disabled,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    tone?: "default" | "primary" | "danger";
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!!busy || disabled}
      className={
        "inline-flex items-center gap-1 h-8 px-3 text-xs font-medium border disabled:opacity-50 " +
        (tone === "primary"
          ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
          : tone === "danger"
          ? "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
          : "bg-white text-stone-700 border-line hover:bg-[#f5f4f0]")
      }
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Connection */}
      <Section title="Connection">
        <div className="flex flex-wrap items-center gap-2">
          <Btn onClick={testConnection} tone="primary">Test connection</Btn>
          <a
            href="https://printify.com/app/account/api"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center h-8 px-3 text-xs underline text-stone-700"
          >
            Manage API tokens ↗
          </a>
        </div>
      </Section>

      {/* Webhooks */}
      <Section title="Webhooks">
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <div className="flex-1 min-w-[260px]">
            <label className="block text-[10px] uppercase text-muted mb-1">Target URL</label>
            <input
              value={whUrl}
              onChange={(e) => setWhUrl(e.target.value)}
              className="w-full h-9 px-2 text-sm border border-line bg-white"
            />
          </div>
          <Btn onClick={installWebhooks} tone="primary">Install all topics</Btn>
          <Btn onClick={refreshHooks}>Refresh</Btn>
        </div>
        {!webhookSecretSet && (
          <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
            <strong>PRINTIFY_WEBHOOK_SECRET</strong> not set — webhooks will be created without HMAC validation.
          </div>
        )}
        <div className="text-[11px] text-muted mb-2">
          Topics: {webhookTopics.join(", ")}
        </div>
        {hooks.length === 0 ? (
          <div className="text-sm text-muted">No webhooks installed.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead className="text-left text-muted bg-[#f8f8f6]">
                <tr>
                  <th className="px-2 py-1.5">Topic</th>
                  <th>URL</th>
                  <th>ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hooks.map((h) => (
                  <tr key={h.id} className="border-t border-line">
                    <td className="px-2 py-1.5 font-mono">{h.topic}</td>
                    <td className="break-all">{h.url}</td>
                    <td className="text-muted font-mono">{h.id.slice(0, 10)}…</td>
                    <td>
                      <Btn onClick={() => deleteHook(h.id)} tone="danger">Delete</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Sync */}
      <Section title="Variant mapping">
        <p className="text-sm text-muted mb-3">
          Auto-match local products to Printify by title and map each variant by its option label.
          Run this after adding new products on Printify.
        </p>
        <div className="flex items-center gap-2">
          <Btn onClick={runSync} tone="primary">Run sync now</Btn>
          {syncResult && <span className="text-xs text-emerald-700">{syncResult}</span>}
        </div>
      </Section>

      {/* Printify orders */}
      <Section title="Printify orders (live)">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Btn onClick={() => loadPfOrders(1)} tone="primary">Load orders</Btn>
          {pfOrdersTotal > 0 && (
            <span className="text-xs text-muted">
              {pfOrdersTotal} total · page {pfOrdersPage}
            </span>
          )}
          {pfOrdersPage > 1 && <Btn onClick={() => loadPfOrders(pfOrdersPage - 1)}>← Prev</Btn>}
          {pfOrders.length === 25 && <Btn onClick={() => loadPfOrders(pfOrdersPage + 1)}>Next →</Btn>}
        </div>
        {pfOrders.length === 0 ? (
          <div className="text-sm text-muted">Click "Load orders" to fetch from Printify.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead className="text-left text-muted bg-[#f8f8f6]">
                <tr>
                  <th className="px-2 py-1.5">Printify ID</th>
                  <th>Local</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Tracking</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pfOrders.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-2 py-1.5 font-mono">
                      <a
                        href={`https://printify.com/app/orders/${o.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {o.id.slice(0, 10)}…
                      </a>
                    </td>
                    <td className="text-muted">{o.external_id ?? "—"}</td>
                    <td>
                      {o.address_to
                        ? `${o.address_to.first_name} ${o.address_to.last_name}`
                        : "—"}
                    </td>
                    <td>
                      <span className="px-1.5 py-0.5 bg-stone-100">{o.status}</span>
                    </td>
                    <td>${(o.total_price / 100).toFixed(2)}</td>
                    <td className="font-mono text-[10px]">
                      {o.shipments?.[0]?.number ?? "—"}
                    </td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap">
                        <Btn onClick={() => orderAction(o.id, "refresh")}>↻</Btn>
                        <Btn onClick={() => orderAction(o.id, "send_to_production")} tone="primary">
                          Send
                        </Btn>
                        <Btn onClick={() => orderAction(o.id, "cancel")} tone="danger">
                          Cancel
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Activity log */}
      <Section title="Activity">
        <pre className="text-xs bg-[#f8f8f6] border border-line p-3 max-h-48 overflow-auto whitespace-pre-wrap">
          {busy ? `… ${busy}\n` : ""}{log || "No actions yet."}
        </pre>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-line">
      <div className="px-4 py-2 border-b border-line text-[10px] tracking-[0.22em] uppercase text-muted">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
