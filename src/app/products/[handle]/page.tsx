import { db } from "@/db";
import { products, productImages, productOptions, variants } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

function isRashguard(handle: string, title: string) {
  const h = (handle + " " + title).toLowerCase();
  return h.includes("rashguard") || h.includes("rash guard");
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.handle, handle))
    .limit(1);
  if (!product) notFound();

  const [images, options, vs] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.position)),
    db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
      .orderBy(asc(productOptions.position)),
    db.select().from(variants).where(eq(variants.productId, product.id)),
  ]);

  return (
    <ProductDetail
      product={{
        id: product.id,
        handle: product.handle,
        title: product.title,
        description: product.description,
        currency: product.currency,
      }}
      isPreorder={isRashguard(product.handle, product.title)}
      images={images.map((i) => ({ url: i.url, alt: i.alt }))}
      options={options.map((o) => ({ name: o.name, values: o.values as string[] }))}
      variants={vs.map((v) => ({
        id: v.id,
        priceCents: v.priceCents,
        available: v.available,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
      }))}
    />
  );
}
