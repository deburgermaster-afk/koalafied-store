import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listPrintifyProducts } from "@/lib/printify";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  await requireAdmin();
  try {
    const all = await listPrintifyProducts();
    // Lightweight summary
    const items = all.map((p) => ({
      id: p.id,
      title: p.title,
      variantCount: p.variants?.length ?? 0,
      enabled: p.variants?.filter((v) => v.is_enabled).length ?? 0,
    }));
    return NextResponse.json({ ok: true, total: items.length, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
