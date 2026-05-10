import { requireAdmin } from "@/lib/admin";
import { auspostConfig } from "@/lib/auspost";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await requireAdmin();
  const cfg = auspostConfig();

  const items: Array<{
    title: string;
    rows: Array<{ k: string; v: React.ReactNode; ok?: boolean }>;
  }> = [
    {
      title: "Australia Post (PAC API + tracking)",
      rows: [
        {
          k: "API key",
          v: cfg.hasKey ? "configured" : "missing — using flat fallback rates",
          ok: cfg.hasKey,
        },
        { k: "Origin postcode (AUSPOST_FROM_POSTCODE)", v: cfg.fromPostcode },
        { k: "Parcel L × W × H (cm)", v: `${cfg.lengthCm} × ${cfg.widthCm} × ${cfg.heightCm}` },
        { k: "Weight per item (kg)", v: cfg.weightPerItemKg },
        { k: "Min parcel weight (kg)", v: cfg.minWeightKg },
      ],
    },
    {
      title: "Printify (auto-fulfillment for t-shirts)",
      rows: [
        {
          k: "API token",
          v: process.env.PRINTIFY_API_TOKEN ? "configured" : "missing — orders will not auto-submit",
          ok: !!process.env.PRINTIFY_API_TOKEN,
        },
        {
          k: "Shop ID",
          v: process.env.PRINTIFY_SHOP_ID || "not set",
          ok: !!process.env.PRINTIFY_SHOP_ID,
        },
        {
          k: "Webhook secret",
          v: process.env.PRINTIFY_WEBHOOK_SECRET ? "configured" : "missing — webhook signatures unchecked",
          ok: !!process.env.PRINTIFY_WEBHOOK_SECRET,
        },
        {
          k: "Webhook URL",
          v: <code className="text-xs break-all">{(process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain") + "/api/webhooks/printify"}</code>,
        },
      ],
    },
    {
      title: "Stripe (payments + refunds)",
      rows: [
        {
          k: "Secret key",
          v: process.env.STRIPE_SECRET_KEY ? "configured" : "missing",
          ok: !!process.env.STRIPE_SECRET_KEY,
        },
        {
          k: "Webhook secret",
          v: process.env.STRIPE_WEBHOOK_SECRET ? "configured" : "missing",
          ok: !!process.env.STRIPE_WEBHOOK_SECRET,
        },
        { k: "Currency", v: (process.env.CURRENCY ?? "aud").toUpperCase() },
      ],
    },
    {
      title: "Image hosting",
      rows: [
        {
          k: "ImgBB API key",
          v: process.env.IMGBB_API_KEY ? "configured (uploads → imgbb.com)" : "missing — uploads fall back to /public/uploads (dev only)",
          ok: !!process.env.IMGBB_API_KEY,
        },
      ],
    },
    {
      title: "Email (OTP + receipts)",
      rows: [
        {
          k: "Pulse API key",
          v: process.env.PULSE_API_KEY ? "configured" : "missing — using Resend or dev fallback",
          ok: !!process.env.PULSE_API_KEY,
        },
        {
          k: "Resend API key",
          v: process.env.RESEND_API_KEY ? "configured" : "missing — OTPs printed to server logs",
          ok: !!process.env.RESEND_API_KEY,
        },
        { k: "Mail from", v: process.env.MAIL_FROM ?? "—" },
      ],
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted mb-6">
        Read-only summary of integration configuration loaded from <code>.env</code>.
        Edit your <code>.env</code> file (or Fly secrets in production) and restart the
        server to change these.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {items.map((s) => (
          <div key={s.title} className="bg-white border border-line">
            <div className="px-4 py-2 border-b border-line text-[10px] tracking-[0.22em] uppercase text-muted">
              {s.title}
            </div>
            <div className="p-4 space-y-1.5">
              {s.rows.map((r, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted shrink-0">{r.k}</span>
                  <span
                    className={
                      "text-right " +
                      (r.ok === true ? "text-emerald-700 font-medium" : r.ok === false ? "text-red-700" : "")
                    }
                  >
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white border border-line p-4 text-sm space-y-2">
        <div className="font-semibold">Refund policy summary (Printify)</div>
        <ul className="text-muted space-y-1 list-disc pl-5">
          <li>While Printify status is <em>on-hold</em> / <em>pending</em> we can cancel via API and a full refund costs you nothing.</li>
          <li>Once Printify enters <em>in-production</em>, the cancel API will fail — refunds come out of your margin.</li>
          <li>Defects, misprints and damage in transit are reimbursed by Printify if reported within 30 days with photos.</li>
          <li>Use refund reason <em>Defect / misprint</em> in the order page to mark such cases for follow-up.</li>
        </ul>
      </div>
    </div>
  );
}
