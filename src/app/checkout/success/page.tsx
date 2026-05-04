import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-screen-sm px-4 py-24 text-center">
      <h1 className="h-display text-4xl mb-4">Order confirmed</h1>
      <p className="text-muted mb-2">
        Thanks for your order. A confirmation email is on its way.
      </p>
      {sp.session_id && (
        <p className="text-xs text-muted mb-6">Reference: {sp.session_id.slice(-12)}</p>
      )}
      <p className="text-sm text-muted mb-8">
        Your order is being submitted to our print partner automatically. You'll receive
        a tracking link from Australia Post once it ships.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/track" className="border border-ink px-6 py-3 text-sm font-semibold">
          Track an order
        </Link>
        <Link href="/shop" className="bg-ink text-white px-6 py-3 text-sm font-semibold">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
