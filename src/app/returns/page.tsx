import { SITE } from "@/lib/site";

export const metadata = { title: "Returns & Exchanges — Koalafied" };

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-12 md:py-16 prose prose-zinc max-w-none">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Refund policy</div>
      <h1 className="h-display text-4xl md:text-5xl mb-6">Returns &amp; exchanges</h1>

      <p>
        We have a <strong>30-day return policy</strong> — you have 30 days after receiving your item to request a return.
        To be eligible, your item must be in the same condition that you received it: unworn or unused, with tags, and in its original packaging.
        You&apos;ll also need the receipt or proof of purchase.
      </p>

      <p>
        To start a return, contact us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        Items sent back to us without first requesting a return will not be accepted.
      </p>

      <h2 className="mt-8">Damages and issues</h2>
      <p>
        Please inspect your order on arrival and contact us immediately if your item is defective, damaged, or you receive the wrong item — so we can evaluate the issue and make it right.
      </p>

      <h2 className="mt-6">Exchanges</h2>
      <p>
        The fastest way to get what you want is to return the item you have and, once accepted, place a new order for the replacement.
      </p>

      <h2 className="mt-6">Exceptions / non-returnable items</h2>
      <p>
        Custom orders and personalised items can&apos;t be returned. We also cannot accept returns on sale items or gift cards.
      </p>

      <h2 className="mt-6">European Union 14-day cooling-off</h2>
      <p>
        If your order is being shipped into the EU, you have the right to cancel or return your order within 14 days for any reason and without justification.
        The same condition rules apply.
      </p>

      <h2 className="mt-6">Refunds</h2>
      <p>
        We&apos;ll notify you once we&apos;ve received and inspected your return. If approved, you&apos;ll be refunded automatically on your original payment method within 10 business days.
        If more than 15 business days have passed since approval, please email us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </div>
  );
}
