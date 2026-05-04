import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  publishPrintifyProduct,
  unpublishPrintifyProduct,
  publishingSucceeded,
  getPrintifyProduct,
} from "@/lib/printify";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  try {
    if (action === "publish") {
      await publishPrintifyProduct(id);
      // Acknowledge to clear locked state on Printify side
      await publishingSucceeded(id, id).catch(() => {});
      return NextResponse.json({ ok: true });
    }
    if (action === "unpublish") {
      await unpublishPrintifyProduct(id);
      return NextResponse.json({ ok: true });
    }
    if (action === "get") {
      const p = await getPrintifyProduct(id);
      return NextResponse.json({ ok: true, product: p });
    }
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
