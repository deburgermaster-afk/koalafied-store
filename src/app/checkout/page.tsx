import { CheckoutFlow } from "@/components/CheckoutFlow";
import { CartView } from "@/components/CartView";
import { readCart, hydrateCart } from "@/lib/cart";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const lines = await readCart();
  const items = await hydrateCart(lines);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Your cart is empty</h1>
        <Link href="/shop" className="inline-block bg-ink text-white px-6 py-3 font-semibold">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return <CartView initialItems={items} />;
}
