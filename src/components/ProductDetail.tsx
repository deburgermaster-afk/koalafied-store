"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Price } from "./Price";

type Img = { url: string; alt: string };
type Opt = { name: string; values: string[] };
type Var = {
  id: number;
  priceCents: number;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
};

export function ProductDetail({
  product,
  images,
  options,
  variants,
  isPreorder = false,
}: {
  product: { id: number; handle: string; title: string; description: string; currency: string };
  images: Img[];
  options: Opt[];
  variants: Var[];
  isPreorder?: boolean;
}) {
  const [selected, setSelected] = useState<(string | null)[]>(
    options.map((o) => (o.values.length === 1 ? o.values[0] : null))
  );
  const [activeImg, setActiveImg] = useState(0);

  const matched = useMemo<Var | null>(() => {
    if (selected.some((s) => s === null && options.length)) return null;
    return (
      variants.find(
        (v) =>
          (selected[0] ?? null) === (v.option1 ?? null) &&
          (selected[1] ?? null) === (v.option2 ?? null) &&
          (selected[2] ?? null) === (v.option3 ?? null)
      ) ?? null
    );
  }, [selected, variants, options.length]);

  const price = matched?.priceCents ?? variants[0]?.priceCents ?? 0;
  const inStock = matched?.available ?? false;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
        <div className="flex flex-col">
          <div className="relative bg-[#f5f4f0] overflow-hidden rounded flex items-center justify-center" style={{ height: 'clamp(300px, 80vh, 600px)', maxWidth: '100%' }}>
            {images[activeImg] && (
              <Image
                src={images[activeImg].url}
                alt={images[activeImg].alt}
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
                className="object-contain p-2 sm:p-4 md:p-6"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={clsx(
                    "relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-[#f5f4f0] border rounded transition-colors",
                    i === activeImg ? "border-ink border-2" : "border-line hover:border-ink/50"
                  )}
                >
                  <Image src={img.url} alt={img.alt} fill className="object-contain p-1" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <h1 className="h-display text-3xl md:text-4xl mb-2">{product.title}</h1>
          <div className="text-2xl font-semibold mb-6"><Price cents={price} /></div>

          {options.map((o, idx) => (
            <div key={o.name} className="mb-5">
              <div className="text-sm font-semibold mb-2">
                {o.name}: <span className="text-muted font-normal">{selected[idx] ?? "Select"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {o.values.map((v) => {
                  const active = selected[idx] === v;
                  return (
                    <button
                      key={v}
                      onClick={() => {
                        const next = [...selected];
                        next[idx] = v;
                        setSelected(next);
                      }}
                      className={clsx(
                        "px-4 py-2 text-sm border rounded-sm transition-colors",
                        active ? "bg-ink text-white border-ink" : "border-line hover:border-ink"
                      )}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {matched && (
            <div className="text-sm text-muted mb-6">
              {inStock ? "✓ In stock" : "Out of stock"}
            </div>
          )}

          <button
            disabled={!inStock}
            className="w-full bg-ink text-white py-3 px-4 rounded font-semibold mb-8 hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>

          <div className="mt-8 prose prose-sm max-w-none text-ink/85 whitespace-pre-line">
            {product.description}
          </div>

          <ul className="mt-8 text-sm text-muted space-y-2 border-t border-line pt-6">
            <li>📦 Worldwide shipping — live AusPost rates</li>
            <li>🛡️ Secure Stripe checkout</li>
            <li>↺ 14-day returns on unused items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
