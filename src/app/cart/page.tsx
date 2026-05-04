import { readCart, hydrateCart } from "@/lib/cart";
import { CartView } from "@/components/CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const lines = await readCart();
  const items = await hydrateCart(lines);
  return <CartView initialItems={items} />;
}
