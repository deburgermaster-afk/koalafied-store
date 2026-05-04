export const metadata = { title: "Shipping — Koalafied" };

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-12 md:py-16 prose prose-zinc max-w-none">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Shipping</div>
      <h1 className="h-display text-4xl md:text-5xl mb-6">Shipping &amp; delivery</h1>
      <p>Thank you for shopping with us. Below are the details of our shipping process.</p>

      <h2 className="mt-8">Processing time</h2>
      <p>All orders are processed within <strong>1–3 business days</strong>. Orders are not shipped on weekends or public holidays.</p>

      <h2 className="mt-6">Shipping time</h2>
      <p>Delivery typically takes <strong>5–10 business days</strong> depending on your location.</p>

      <h2 className="mt-6">Shipping fees</h2>
      <p>Shipping costs are calculated at checkout. We may offer free shipping on selected products or promotions.</p>

      <h2 className="mt-6">Where we ship</h2>
      <p>We currently ship across Australia and to selected countries worldwide.</p>

      <h2 className="mt-6">Order tracking</h2>
      <p>Once your order has been shipped, you&apos;ll receive a confirmation email with a tracking number to monitor your delivery.</p>

      <h2 className="mt-6">Delays</h2>
      <p>Please note that delivery times may be affected by factors beyond our control such as customs, holidays, or high demand periods.</p>
    </div>
  );
}
