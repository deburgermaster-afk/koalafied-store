import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { products, productImages, variants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatMoney } from "@/lib/format";
import { ProductDeleteButton } from "@/components/admin/ProductDeleteButton";

export const dynamic = "force-dynamic";

export default async function ProductsAdmin() {
  await requireAdmin();
  const list = await db.select().from(products).orderBy(desc(products.createdAt));
  const images = await db.select().from(productImages);
  const allVariants = await db.select().from(variants);
  const cover = (pid: number) =>
    images.filter((i) => i.productId === pid).sort((a, b) => a.position - b.position)[0]?.url;
  const variantsFor = (pid: number) => allVariants.filter((v) => v.productId === pid);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink text-white px-4 py-2 text-sm font-semibold"
        >
          + New product
        </Link>
      </div>

      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="text-left text-muted bg-[#f8f8f6]">
            <tr>
              <th className="px-4 py-2.5"></th>
              <th>Title</th>
              <th>Price</th>
              <th>Variants</th>
              <th>Printify</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const vs = variantsFor(p.id);
              const mapped = vs.filter((v) => v.printifyProductId && v.printifyVariantId).length;
              const url = cover(p.id);
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-2">
                    <div className="relative w-10 h-10 bg-[#f5f4f0]">
                      {url && (
                        <Image src={url} alt={p.title} fill className="object-cover" sizes="40px" unoptimized />
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{p.title}</td>
                  <td>{formatMoney(p.basePriceCents, p.currency)}</td>
                  <td>
                    {mapped}/{vs.length} mapped
                  </td>
                  <td>
                    {vs[0]?.printifyProductId ? (
                      <span className="text-emerald-700 text-xs">{vs[0].printifyProductId.slice(0, 10)}…</span>
                    ) : (
                      <span className="text-amber-700 text-xs">unmapped</span>
                    )}
                  </td>
                  <td>
                    <span className={
                      "text-[10px] px-2 py-0.5 rounded " +
                      (p.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700")
                    }>
                      {p.active ? (p.featured ? "active · featured" : "active") : "draft"}
                    </span>
                  </td>
                  <td className="pr-4 flex gap-3">
                    <Link href={`/admin/products/${p.id}`} className="text-xs underline">edit</Link>
                    <Link href={`/products/${p.handle}`} className="text-xs underline" target="_blank">view</Link>
                    <ProductDeleteButton productId={p.id} productTitle={p.title} />
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted">No products yet. Click + New product.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
