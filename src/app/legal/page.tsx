import { SITE } from "@/lib/site";

export const metadata = { title: "Legal — Koalafied" };

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-12 md:py-16 prose prose-zinc max-w-none">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Legal</div>
      <h1 className="h-display text-4xl md:text-5xl mb-6">Legal information</h1>

      <h2>Trading entity</h2>
      <p>
        <strong>Koalafied Apparel Co.</strong>
        <br />
        {SITE.address.line1}
        <br />
        {SITE.address.city}, {SITE.address.state} {SITE.address.postcode}
        <br />
        {SITE.address.country}
      </p>

      <h2 className="mt-6">Contact</h2>
      <p>
        Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        <br />
        WhatsApp: <a href={SITE.whatsapp}>{SITE.phone}</a>
      </p>

      <h2 className="mt-6">Policies</h2>
      <ul>
        <li><a href="/privacy">Privacy policy</a></li>
        <li><a href="/terms">Terms of service</a></li>
        <li><a href="/returns">Returns &amp; refunds</a></li>
        <li><a href="/shipping">Shipping policy</a></li>
      </ul>

      <h2 className="mt-6">Payment processing</h2>
      <p>
        All payments are securely processed by <strong>Stripe</strong>. We never see or store your full card details.
      </p>

      <h2 className="mt-6">Fulfillment</h2>
      <p>
        Orders are produced on demand and fulfilled by our print partner network, then shipped from Australia and partner facilities worldwide.
      </p>
    </div>
  );
}
