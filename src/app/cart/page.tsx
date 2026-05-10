export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Shopping Cart</h1>
      <p className="text-muted mb-8">
        Shopping cart functionality has been disabled. Browse our products in the shop.
      </p>
      <a href="/shop" className="inline-block bg-ink text-white px-6 py-3 font-semibold">
        Continue Shopping
      </a>
    </div>
  );
}
