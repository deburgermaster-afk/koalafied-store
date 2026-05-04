import Link from "next/link";
import Image from "next/image";
import { Permanent_Marker } from "next/font/google";
import { db } from "@/db";
import { products, productOptions, variants } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { formatMoney, cleanTitle } from "@/lib/format";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Price } from "@/components/Price";

const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });

export const dynamic = "force-dynamic";

const FEATURED_HANDLE = "the-koalafied-classic-red-navy";

async function getProducts(limit: number) {
  return db
    .select({
      id: products.id,
      handle: products.handle,
      title: products.title,
      basePriceCents: products.basePriceCents,
      currency: products.currency,
      featured: products.featured,
      image: sql<string>`(SELECT url FROM product_images WHERE product_id = "products"."id" ORDER BY position ASC LIMIT 1)`,
    })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(desc(products.featured), desc(products.createdAt))
    .limit(limit);
}

async function getFeaturedProduct() {
  const [p] = await db
    .select()
    .from(products)
    .where(eq(products.handle, FEATURED_HANDLE))
    .limit(1);
  if (!p) return null;
  const opts = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, p.id))
    .orderBy(productOptions.position);
  const vars = await db
    .select({ option1: variants.option1, option2: variants.option2 })
    .from(variants)
    .where(eq(variants.productId, p.id));
  const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  const sizeRe = /^(xs|s|m|l|xl|xxl|xxxl|xxxxl|2xl|3xl|4xl|5xl)$/i;
  const norm = (s: string) => {
    const u = s.toUpperCase();
    if (u === "XXL") return "2XL";
    if (u === "XXXL") return "3XL";
    if (u === "XXXXL") return "4XL";
    return u;
  };
  const all: string[] = [];
  for (const v of vars) {
    for (const o of [v.option1, v.option2]) {
      if (o && sizeRe.test(o)) all.push(norm(o));
    }
  }
  const sizes = Array.from(new Set(all)).sort(
    (a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
  );
  return { product: p, options: opts, sizes };
}

export default async function HomePage() {
  const [list, feat] = await Promise.all([getProducts(8), getFeaturedProduct()]);

  return (
    <div>
      <HeroSlideshow />

      {/* FEATURED PRODUCT — dark, image flush, info right */}
      {feat && (
        <>
          <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 mt-12 md:mt-20 mb-4 md:mb-6">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted">
              Featured
            </p>
            <p className="mt-1 text-xs md:text-sm text-muted max-w-xl">
              The Chamo Rousa holding the prototype of the rashguard.
            </p>
          </div>
          <section className="bg-ink text-white">
            <div className="grid grid-cols-2 items-stretch">
              <Link
                href={`/products/${feat.product.handle}`}
                className="relative block w-full h-full min-h-[280px] md:min-h-[440px] bg-black overflow-hidden group"
              >
                <Image
                  src="/assets/hero-2.jpeg"
                  alt={feat.product.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 50vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                  style={{ objectPosition: "center 18%" }}
                />
              </Link>

              <div className="flex flex-col justify-center px-4 py-6 sm:px-6 md:px-10 lg:px-14">
                <h2 className="font-bold text-lg md:text-3xl lg:text-4xl leading-tight tracking-tight mb-3 md:mb-5">
                  {cleanTitle(feat.product.title)}
                </h2>

                {feat.sizes.length > 0 && (
                  <div className="mb-4 md:mb-6">
                    <div className="text-[9px] md:text-[10px] tracking-[0.25em] uppercase text-white/60 mb-2">
                      Sizes
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-1.5">
                      {feat.sizes.map((s) => (
                        <span
                          key={s}
                          className="border border-white/30 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xl md:text-2xl font-bold mb-5 md:mb-7">
                  <Price cents={feat.product.basePriceCents} />
                </div>

                <Link
                  href={`/products/${feat.product.handle}`}
                  className="inline-flex items-center justify-center bg-white text-ink px-6 md:px-10 py-3 md:py-3.5 text-xs md:text-sm font-semibold tracking-[0.18em] uppercase hover:bg-white/90 transition-colors w-full md:w-fit"
                >
                  Shop now
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 4 PRODUCTS — New In grid */}
      <section className="mx-auto max-w-screen-2xl px-3 sm:px-5 mt-14 md:mt-20">
        <div className="flex items-end justify-between mb-5 md:mb-7">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-1">
              Just landed
            </p>
            <h2 className="h-display text-2xl md:text-4xl">New in</h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:inline-block text-sm font-semibold underline underline-offset-4"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 md:gap-x-3 gap-y-7">
          {list
            .filter((p) => p.handle !== FEATURED_HANDLE)
            .slice(0, 4)
            .map((p) => (
              <Link key={p.id} href={`/products/${p.handle}`} className="group">
                <div className="relative aspect-[3/4] bg-[#f5f4f0] overflow-hidden">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain p-3 group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="mt-3 px-1">
                  <div className="text-sm leading-snug line-clamp-2">
                    {cleanTitle(p.title)}
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    <Price cents={p.basePriceCents} />
                  </div>
                </div>
              </Link>
            ))}
        </div>
        <div className="mt-8 md:mt-10 flex justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-ink text-white px-10 py-3.5 text-sm font-semibold tracking-[0.18em] uppercase hover:bg-black/85 transition-colors"
          >
            Shop all
          </Link>
        </div>
      </section>

      {/* INSTAGRAM POST — Celebrating return of our heroes */}
      <section className="mt-14 md:mt-20">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 text-center mb-6 md:mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-2">
            From the community
          </p>
          <h2 className="h-display text-2xl md:text-4xl">
            Celebrating the return of our heroes
          </h2>
        </div>
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-[#f5f4f0]">
          <Image
            src="/assets/section.jpg"
            alt="Celebrating the return of our heroes"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 mt-6 md:mt-8 text-sm md:text-base leading-relaxed">
          <div className="flex items-center justify-between text-xs md:text-sm text-muted mb-3">
            <a
              href="https://www.instagram.com/henry_cejudo/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.26.07 1.64.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.26.06-1.64.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.52 0-4.76.06-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.27.83-.39.39-.63.76-.83 1.27-.15.39-.33.97-.38 2.04C2.66 8.48 2.66 8.85 2.66 12s0 3.52.06 4.76c.05 1.07.23 1.65.38 2.04.2.51.44.88.83 1.27.39.39.76.63 1.27.83.39.15.97.33 2.04.38C8.48 21.34 8.85 21.34 12 21.34s3.52 0 4.76-.06c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.27-.83.39-.39.63-.76.83-1.27.15-.39.33-.97.38-2.04.06-1.24.06-1.61.06-4.76s0-3.52-.06-4.76c-.05-1.07-.23-1.65-.38-2.04a3.4 3.4 0 0 0-.83-1.27 3.4 3.4 0 0 0-1.27-.83c-.39-.15-.97-.33-2.04-.38C15.52 4 15.15 4 12 4Zm0 3.05a4.95 4.95 0 1 1 0 9.9 4.95 4.95 0 0 1 0-9.9Zm0 1.8a3.15 3.15 0 1 0 0 6.3 3.15 3.15 0 0 0 0-6.3Zm5.16-2.07a1.16 1.16 0 1 1 0 2.32 1.16 1.16 0 0 1 0-2.32Z" />
              </svg>
              @henry_cejudo
            </a>
            <span>6 February 2019</span>
          </div>
          <p className="text-ink">
            <span className="font-semibold">henry_cejudo</span> When I was a kid, I
            remember vividly watching the 2000 Olympics in Sydney on Television.
            It&apos;s always been a country that I wanted to explore. Today I am
            living my dream in Melbourne, Australia. 🇦🇺
          </p>
          <p className="mt-2 text-accent text-sm">
            #justakidfromthehood #blessed #livingthedream
          </p>
        </div>
      </section>

      {/* CELEBRITY SPOTLIGHT — Alex Volkanoski */}
      <section className="mt-14 md:mt-20">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 text-center mb-6 md:mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-2">
            Worn in the wild
          </p>
          <h2 className="h-display text-2xl md:text-4xl">
            Alex Volkanoski rocks Koalafied
          </h2>
          <p className="mt-3 text-sm md:text-base text-ink/70 max-w-xl mx-auto">
            Aussie MMA artist holding our koala T-shirt at Wollongong.
          </p>
        </div>
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-[#f5f4f0]">
          <Image
            src="/assets/celebritys.png"
            alt="Alex Volkanoski holding the Koalafied koala T-shirt at Wollongong"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* NEWSLETTER FEATURE — full-bleed campaign image */}
      <section className="mt-14 md:mt-20">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 text-center mb-6 md:mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-2">
            The Dispatch
          </p>
          <h2 className="h-display text-2xl md:text-4xl">
            Drop alerts &amp; fight-week stories
          </h2>
          <p className="mt-3 text-sm md:text-base text-ink/70 max-w-xl mx-auto">
            Subscribe for early access to limited drops, athlete dispatches, and 10% off your first order.
          </p>
        </div>
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-[#f5f4f0]">
          <Image
            src="/assets/newsletter.jpg"
            alt="Koalafied newsletter campaign"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <form
            action="/api/newsletter"
            method="post"
            className="absolute inset-x-0 bottom-0 p-5 md:p-10"
          >
            <div className="max-w-md mx-auto md:mx-0 flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="flex-1 bg-white/95 border border-white/40 px-4 py-3 text-sm text-ink placeholder-ink/50 focus:outline-none focus:bg-white"
              />
              <button
                type="submit"
                className="bg-ink text-white px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase hover:bg-black/85 transition-colors"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* KOALAFIELD ROOTS */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 mt-16 md:mt-24">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start border-t border-line pt-10 md:pt-14">
          <div className="md:col-span-4">
            <p className={`${marker.className} text-base md:text-lg text-accent mb-3 normal-case`}>
              Our Roots · Rio → Australia
            </p>
            <h2 className={`${marker.className} text-4xl md:text-6xl leading-[1.05] normal-case`}>
              Koalafield Roots
            </h2>
          </div>
          <div className="md:col-span-8 text-base md:text-lg text-ink/80 leading-relaxed space-y-4 max-w-2xl">
            <p>
              Inspired by old-school Brazilian Jiu-Jitsu — the dusty academies
              of Rio, the lineage of Gracie, Machado, and Carlson — where the
              gentle art was forged on hard mats and harder lessons.
            </p>
            <p>
              We carry that grit south. Koalafield translates that heritage
              through an Australian lens: clean cuts, honest materials,
              warrior spirit.
            </p>
            <p>
              Premium tees for the streets. Rashguards engineered to roll,
              train, and compete — proudly designed and made in Australia.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
