import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { products, productImages, variants, productOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

type Body = {
  title: string;
  handle: string;
  description?: string;
  basePriceCents: number;
  active?: boolean;
  featured?: boolean;
  images?: { id?: number; url: string; alt?: string }[];
  sizes?: string[];
  colors?: string[];
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  
  const { id } = await params;
  const productId = parseInt(id);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || !body.title || !Number.isFinite(body.basePriceCents)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Check if product exists
  const existing = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Update product
  await db
    .update(products)
    .set({
      title: body.title,
      handle: body.handle,
      description: body.description ?? "",
      basePriceCents: body.basePriceCents,
      active: body.active ?? true,
      featured: body.featured ?? false,
    })
    .where(eq(products.id, productId));

  // Update images: delete removed ones, update existing, add new
  if (body.images) {
    const incomingIds = body.images.filter((im) => im.id).map((im) => im.id!);
    
    // Delete images not in the incoming list
    const existingImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId));
    
    for (const img of existingImages) {
      if (!incomingIds.includes(img.id)) {
        await db.delete(productImages).where(eq(productImages.id, img.id));
      }
    }

    // Insert new images
    const newImages = body.images.filter((im) => !im.id);
    if (newImages.length > 0) {
      await db.insert(productImages).values(
        newImages.map((im, i) => ({
          productId,
          url: im.url,
          alt: im.alt ?? "",
          position: (incomingIds.length || 0) + i,
        }))
      );
    }

    // Update positions/alt text for existing images
    for (let i = 0; i < body.images.length; i++) {
      const im = body.images[i];
      if (im.id) {
        await db
          .update(productImages)
          .set({ position: i, alt: im.alt ?? "" })
          .where(eq(productImages.id, im.id));
      }
    }
  }

  // Update product options and regenerate variants if sizes/colors changed
  await db.delete(productOptions).where(eq(productOptions.productId, productId));

  const opts: { name: string; values: string[] }[] = [];
  if (body.colors?.length) opts.push({ name: "Color", values: body.colors });
  if (body.sizes?.length) opts.push({ name: "Size", values: body.sizes });

  if (opts.length) {
    await db.insert(productOptions).values(
      opts.map((o, i) => ({
        productId,
        name: o.name,
        position: i,
        values: o.values,
      }))
    );
  }

  // Regenerate variants if sizes/colors changed
  // Get current variants to preserve Printify mappings
  const currentVariants = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, productId));

  // Build new variants keeping Printify mappings where possible
  const builtVariants: typeof variants.$inferInsert[] = [];
  const sizes = body.sizes?.length ? body.sizes : [null];
  const colors = body.colors?.length ? body.colors : [null];

  for (const c of colors) {
    for (const s of sizes) {
      const existing = currentVariants.find(
        (v) => v.option1 === c && v.option2 === s
      );
      if (existing) {
        // Keep existing variant with Printify mappings
        builtVariants.push({
          ...existing,
          priceCents: body.basePriceCents,
        });
      } else {
        // Create new variant
        builtVariants.push({
          productId,
          sku: null,
          priceCents: body.basePriceCents,
          available: true,
          option1: c,
          option2: s,
          option3: null,
          imageUrl: null,
          printifyProductId: null,
          printifyVariantId: null,
        });
      }
    }
  }

  // Delete old variants and insert updated ones
  await db.delete(variants).where(eq(variants.productId, productId));
  if (builtVariants.length > 0) {
    await db.insert(variants).values(builtVariants);
  }

  return NextResponse.json({ ok: true, id: productId });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  
  const { id } = await params;
  const productId = parseInt(id);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  // Check if product exists
  const existing = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Delete all related records
  await db.delete(productImages).where(eq(productImages.productId, productId));
  await db.delete(variants).where(eq(variants.productId, productId));
  await db.delete(productOptions).where(eq(productOptions.productId, productId));
  
  // Delete product
  await db.delete(products).where(eq(products.id, productId));

  return NextResponse.json({ ok: true });
}