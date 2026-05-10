import { requireAdmin } from "@/lib/admin";
import { EditProductForm } from "@/components/admin/EditProductForm";
import { db } from "@/db";
import { products, productImages, variants, productOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  
  const { id } = await params;
  const productId = parseInt(id);
  if (isNaN(productId)) notFound();
  
  const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product[0]) notFound();
  
  const images = await db.select().from(productImages).where(eq(productImages.productId, productId));
  const allVariants = await db.select().from(variants).where(eq(variants.productId, productId));
  const options = await db.select().from(productOptions).where(eq(productOptions.productId, productId));

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 lg:py-10">
      <h1 className="h-display text-2xl sm:text-3xl mb-2">Edit product</h1>
      <p className="text-sm text-muted mb-8">
        Edit product details, images, pricing, and availability.
      </p>
      <EditProductForm 
        product={product[0]} 
        images={images}
        variants={allVariants}
        options={options}
      />
    </div>
  );
}
