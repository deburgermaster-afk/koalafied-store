"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { formatMoney } from "@/lib/format";
import { Price } from "./Price";
import { useCartCount } from "./CartProvider";

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
  const router = useRouter();
  const { refresh } = useCartCount();
  const [selected, setSelected] = useState<(string | null)[]>(
    options.map((o) => (o.values.length === 1 ? o.values[0] : null))
  );
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string>("");

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

  async function addToCart() {
    if (!matched) {
      setMsg("Please select all options.");
      return;
    }
    if (!inStock) {
      setMsg("Out of stock.");
      return;
    }
    setAdding(true);
    setMsg("");
    try {
      const r = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: matched.id, qty }),
      });
      if (!r.ok) throw new Error("cart_fail");
      window.dispatchEvent(new CustomEvent("koalafied:cart"));
      refresh();
      setMsg("Added to cart.");
    } catch {
      setMsg("Could not add. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function buyNow() {
    await addToCart();
    router.push("/cart");
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-6">
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-square bg-[#f5f4f0] overflow-hidden">
            {images[activeImg] && (
              <Image
                src={images[activeImg].url}
                alt={images[activeImg].alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={clsx(
                    "relative shrink-0 w-20 h-20 bg-[#f5f4f0] border",
                    i === activeImg ? "border-ink" : "border-line"
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

          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center border border-line">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2">−</button>
              <span className="w-10 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(20, qty + 1))} className="px-3 py-2">+</button>
            </div>
            {matched && (
              <span className="text-sm text-muted">
                {inStock ? "In stock" : "Out of stock"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={addToCart}
              disabled={adding || !matched || !inStock}
              className="bg-ink text-white py-3 text-sm font-semibold disabled:opacity-50 hover:bg-black/85"
            >
              {adding ? "Adding…" : isPreorder ? "Preorder" : "Add to cart"}
            </button>
            <button
              onClick={buyNow}
              disabled={adding || !matched || !inStock}
              className="border border-ink py-3 text-sm font-semibold disabled:opacity-50 hover:bg-ink hover:text-white"
            >
              {isPreorder ? "Preorder now" : "Buy now"}
            </button>
          </div>
          {isPreorder && (
            <div className="mt-3 border border-amber-300 bg-amber-50 text-amber-900 text-xs p-3 leading-relaxed">
              <strong className="font-semibold">Preorder.</strong> Rashguards are produced in limited drops.
              Estimated dispatch <strong>4–6 weeks</strong> from order. You'll be charged today and notified the moment your parcel ships with AusPost tracking.
            </div>
          )}
          {msg && <div className="mt-3 text-sm text-muted">{msg}</div>}

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
