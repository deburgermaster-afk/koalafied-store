import { NextResponse, NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listPrintifyOrders } from "@/lib/printify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1") || 1;
  try {
    const r = await listPrintifyOrders(page, 25);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
