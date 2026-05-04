import { cookies } from "next/headers";
import { db } from "@/db";
import { variants, products, productImages } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";

export type CartLine = { variantId: number; qty: number };
const COOKIE = "koalafied_cart";

function decode(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => ({
        variantId: Number(x.variantId),
        qty: Math.max(1, Math.min(20, Number(x.qty) || 1)),
      }))
      .filter((x) => Number.isFinite(x.variantId));
  } catch {
    return [];
  }
}

export async function readCart(): Promise<CartLine[]> {
  const c = await cookies();
  return decode(c.get(COOKIE)?.value);
}

export async function writeCart(lines: CartLine[]) {
  const c = await cookies();
  c.set(COOKIE, JSON.stringify(lines), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function hydrateCart(lines: CartLine[]) {
  if (lines.length === 0) return [];
  const ids = lines.map((l) => l.variantId);
  const rows = await db
    .select({
      v: variants,
      p: products,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, ids));

  // get a fallback image per product
  const productIds = [...new Set(rows.map((r) => r.p.id))];
  const imgs = productIds.length
    ? await db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
    : [];
  const firstImg = new Map<number, string>();
  for (const i of imgs) {
    if (!firstImg.has(i.productId)) firstImg.set(i.productId, i.url);
  }

  return lines
    .map((line) => {
      const r = rows.find((x) => x.v.id === line.variantId);
      if (!r) return null;
      const opts = [r.v.option1, r.v.option2, r.v.option3].filter(Boolean).join(" / ");
      const image = r.v.imageUrl ?? firstImg.get(r.p.id) ?? null;
      return {
        variantId: r.v.id,
        productId: r.p.id,
        productHandle: r.p.handle,
        title: r.p.title,
        variantLabel: opts,
        priceCents: r.v.priceCents,
        currency: r.p.currency,
        qty: line.qty,
        image,
        printifyProductId: r.v.printifyProductId,
        printifyVariantId: r.v.printifyVariantId,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

export type HydratedLine = Awaited<ReturnType<typeof hydrateCart>>[number];
