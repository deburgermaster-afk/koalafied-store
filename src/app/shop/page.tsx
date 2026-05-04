import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { products, productImages } from "@/db/schema";
import { desc, eq, sql, ilike, or } from "drizzle-orm";
import { formatMoney, cleanTitle } from "@/lib/format";
import { Price } from "@/components/Price";

export const dynamic = "force-dynamic";

type Search = { cat?: string; q?: string };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const cat = sp.cat?.toLowerCase();
  const q = sp.q?.trim();

  let where = eq(products.active, true);
  const filters: ReturnType<typeof eq>[] = [where];
  if (cat === "rashguards") filters.push(ilike(products.title, "%rashguard%"));
  else if (cat === "tees")
    filters.push(or(ilike(products.title, "%tee%"), ilike(products.title, "%t-shirt%"))!);
  if (q) filters.push(ilike(products.title, `%${q}%`));

  const list = await db
    .select({
      id: products.id,
      handle: products.handle,
      title: products.title,
      basePriceCents: products.basePriceCents,
      currency: products.currency,
      image: sql<string>`(SELECT url FROM product_images WHERE product_id = "products"."id" ORDER BY position ASC LIMIT 1)`,
    })
    .from(products)
    .where(filters.length > 1 ? (filters.reduce((a, b) => sql`${a} AND ${b}`) as typeof where) : where)
    .orderBy(desc(products.featured), desc(products.createdAt));

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-8">
      <div className="flex items-end justify-between mb-6">
        <h1 className="h-display text-4xl md:text-6xl">
          {cat ? cat[0].toUpperCase() + cat.slice(1) : "All products"}
        </h1>
        <div className="text-sm text-muted">{list.length} items</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: "All", href: "/shop" },
          { label: "Rashguards", href: "/shop?cat=rashguards" },
          { label: "Tees", href: "/shop?cat=tees" },
        ].map((c) => {
          const active = (cat ?? "") === c.label.toLowerCase().replace(/s$/, "s") || (!cat && c.label === "All");
          return (
            <Link
              key={c.label}
              href={c.href}
              className={
                "px-4 py-1.5 rounded-full text-sm border transition-colors " +
                (active ? "bg-ink text-white border-ink" : "border-line hover:border-ink")
              }
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-10">
        {list.map((p) => (
          <Link key={p.id} href={`/products/${p.handle}`} className="group">
            <div className="relative aspect-[3/4] bg-[#f5f4f0] overflow-hidden">
              {p.image && (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
                />
              )}
            </div>
            <div className="mt-3 px-1">
              <div className="text-sm leading-snug line-clamp-2">{cleanTitle(p.title)}</div>
              <div className="mt-1 text-sm font-semibold">
                <Price cents={p.basePriceCents} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
