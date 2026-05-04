import { NextRequest, NextResponse } from "next/server";
import { readCart, writeCart, hydrateCart } from "@/lib/cart";

export async function GET() {
  const lines = await readCart();
  const hydrated = await hydrateCart(lines);
  return NextResponse.json({ items: hydrated });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const variantId = Number(body.variantId);
  const qty = Math.max(1, Math.min(20, Number(body.qty) || 1));
  if (!Number.isFinite(variantId)) {
    return NextResponse.json({ error: "Invalid variantId" }, { status: 400 });
  }
  const lines = await readCart();
  const ex = lines.find((l) => l.variantId === variantId);
  if (ex) ex.qty = Math.min(20, ex.qty + qty);
  else lines.push({ variantId, qty });
  await writeCart(lines);
  return NextResponse.json({ ok: true, count: lines.reduce((s, l) => s + l.qty, 0) });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const variantId = Number(body.variantId);
  const qty = Math.max(0, Math.min(20, Number(body.qty) || 0));
  let lines = await readCart();
  if (qty === 0) lines = lines.filter((l) => l.variantId !== variantId);
  else {
    const ex = lines.find((l) => l.variantId === variantId);
    if (ex) ex.qty = qty;
  }
  await writeCart(lines);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await writeCart([]);
  return NextResponse.json({ ok: true });
}
