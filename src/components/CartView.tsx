"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { HydratedLine } from "@/lib/cart";
import { Price } from "./Price";
import { useCartCount } from "./CartProvider";
import { CheckoutFlow } from "./CheckoutFlow";

export function CartView({ initialItems }: { initialItems: HydratedLine[] }) {
  const [items, setItems] = useState(initialItems);
  const [pending, startTransition] = useTransition();
  const { refresh } = useCartCount();

  const subtotal = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  function update(variantId: number, qty: number) {
    startTransition(async () => {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, qty }),
      });
      const r = await fetch("/api/cart");
      const j = await r.json();
      setItems(j.items);
      window.dispatchEvent(new CustomEvent("koalafied:cart"));
      refresh();
    });
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-24 text-center">
        <h1 className="h-display text-4xl mb-4">Your cart is empty</h1>
        <Link href="/shop" className="inline-block mt-2 bg-ink text-white px-6 py-3 text-sm font-semibold">
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 pt-8">
      <h1 className="h-display text-4xl md:text-5xl mb-8">Cart</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 divide-y divide-line border-y border-line">
          {items.map((i) => (
            <div key={i.variantId} className="py-5 flex gap-4">
              <Link href={`/products/${i.productHandle}`} className="relative w-24 h-24 bg-[#f5f4f0] shrink-0">
                {i.image && <Image src={i.image} alt={i.title} fill sizes="96px" className="object-contain p-2" />}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${i.productHandle}`} className="font-semibold leading-snug line-clamp-2">
                  {i.title}
                </Link>
                {i.variantLabel && <div className="text-sm text-muted mt-1">{i.variantLabel}</div>}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center border border-line">
                    <button className="px-2 py-1" onClick={() => update(i.variantId, Math.max(0, i.qty - 1))} disabled={pending}>−</button>
                    <span className="w-8 text-center text-sm">{i.qty}</span>
                    <button className="px-2 py-1" onClick={() => update(i.variantId, i.qty + 1)} disabled={pending}>+</button>
                  </div>
                  <button className="text-sm underline text-muted" onClick={() => update(i.variantId, 0)}>
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold"><Price cents={i.priceCents * i.qty} /></div>
            </div>
          ))}
        </div>

        <CheckoutFlow items={items} />
      </div>
    </div>
  );
}
