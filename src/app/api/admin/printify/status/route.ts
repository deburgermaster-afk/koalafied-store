import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listPrintifyShops, listPrintifyWebhooks } from "@/lib/printify";
import { db } from "@/db";
import { variants } from "@/db/schema";
import { sql as dsql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const out: {
    configured: boolean;
    tokenSet: boolean;
    shopIdSet: boolean;
    webhookSecretSet: boolean;
    shops?: Array<{ id: number; title: string; sales_channel: string }>;
    webhookCount?: number;
    mapping?: { mapped: number; total: number; unmapped: number };
    error?: string;
  } = {
    configured: false,
    tokenSet: !!process.env.PRINTIFY_API_TOKEN,
    shopIdSet: !!process.env.PRINTIFY_SHOP_ID,
    webhookSecretSet: !!process.env.PRINTIFY_WEBHOOK_SECRET,
  };
    try {
    const rows = await db
      .select({
        total: dsql<number>`count(*)::int`,
        mapped: dsql<number>`count(*) filter (where ${variants.printifyVariantId} is not null)::int`,
      })
      .from(variants);
    const r = rows[0] ?? { total: 0, mapped: 0 };
    out.mapping = { mapped: r.mapped, total: r.total, unmapped: r.total - r.mapped };
  } catch {}

  if (!out.tokenSet) {
    out.error = "PRINTIFY_API_TOKEN missing";
    return NextResponse.json(out);
  }
  try {
    const shops = await listPrintifyShops();
    out.shops = shops.map((s) => ({ id: s.id, title: s.title, sales_channel: s.sales_channel }));
    if (out.shopIdSet) {
      try {
        const hooks = await listPrintifyWebhooks();
        out.webhookCount = hooks.length;
      } catch {}
    }
    out.configured = true;
  } catch (e) {
    out.error = e instanceof Error ? e.message : "unknown_error";
  }
  return NextResponse.json(out);
}
