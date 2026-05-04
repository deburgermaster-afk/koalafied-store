import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { products, productImages, variants, productOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

type Body = {
  title: string;
  handle?: string;
  description?: string;
  basePriceCents: number;
  active?: boolean;
  featured?: boolean;
  images?: { url: string; alt?: string }[];
  sizes?: string[];
  colors?: string[];
  variants?: {
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    sku?: string | null;
    priceCents: number;
    available?: boolean;
    imageUrl?: string | null;
    printifyProductId?: string | null;
    printifyVariantId?: string | null;
  }[];
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.title || !Number.isFinite(body.basePriceCents)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const baseHandle = (body.handle && slugify(body.handle)) || slugify(body.title) || `product-${Date.now()}`;

  // Ensure unique handle
  let handle = baseHandle;
  let suffix = 1;
  while (true) {
    const exists = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.handle, handle))
      .limit(1);
    if (!exists[0]) break;
    suffix += 1;
    handle = `${baseHandle}-${suffix}`;
  }

  const [p] = await db
    .insert(products)
    .values({
      handle,
      title: body.title,
      description: body.description ?? "",
      basePriceCents: body.basePriceCents,
      active: body.active ?? true,
      featured: body.featured ?? false,
    })
    .returning();

  if (body.images?.length) {
    await db.insert(productImages).values(
      body.images.map((im, i) => ({
        productId: p.id,
        url: im.url,
        alt: im.alt ?? body.title,
        position: i,
      }))
    );
  }

  // Build variants either from the provided variants array, or the
  // sizes×colors cross product (defaulting price to basePriceCents).
  const builtVariants: Body["variants"] = body.variants?.length
    ? body.variants
    : (() => {
        const out: NonNullable<Body["variants"]> = [];
        const sizes = body.sizes?.length ? body.sizes : [null];
        const colors = body.colors?.length ? body.colors : [null];
        for (const c of colors) {
          for (const s of sizes) {
            out.push({
              option1: c,
              option2: s,
              priceCents: body.basePriceCents,
              available: true,
            });
          }
        }
        return out;
      })();

  if (builtVariants.length) {
    await db.insert(variants).values(
      builtVariants.map((v) => ({
        productId: p.id,
        sku: v.sku ?? null,
        priceCents: v.priceCents,
        available: v.available ?? true,
        option1: v.option1 ?? null,
        option2: v.option2 ?? null,
        option3: v.option3 ?? null,
        imageUrl: v.imageUrl ?? null,
        printifyProductId: v.printifyProductId ?? null,
        printifyVariantId: v.printifyVariantId ?? null,
      }))
    );
  }

  // Save option metadata (for the storefront swatch UI)
  const opts: { name: string; values: string[] }[] = [];
  if (body.colors?.length) opts.push({ name: "Color", values: body.colors });
  if (body.sizes?.length) opts.push({ name: "Size", values: body.sizes });
  if (opts.length) {
    await db.insert(productOptions).values(
      opts.map((o, i) => ({
        productId: p.id,
        name: o.name,
        position: i,
        values: o.values,
      }))
    );
  }

  return NextResponse.json({ ok: true, id: p.id, handle: p.handle });
}
