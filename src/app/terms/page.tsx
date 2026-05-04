import { SITE } from "@/lib/site";

export const metadata = { title: "Terms of Service — Koalafied" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-12 md:py-16 prose prose-zinc max-w-none">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Legal</div>
      <h1 className="h-display text-4xl md:text-5xl mb-6">Terms of service</h1>

      <p>
        Welcome to KOALAFIED. By visiting, interacting with, or using our Services, you agree to be bound by these Terms of Service and our Privacy Policy.
      </p>

      <h2 className="mt-8">1. Access and account</h2>
      <p>
        You must be at least the age of majority in your state of residence. You are responsible for the security of your account credentials and all account activity.
      </p>

      <h2 className="mt-6">2. Our products</h2>
      <p>
        We make every effort to display product details accurately. Colours and product appearance may differ slightly between devices and screen settings.
        We reserve the right to discontinue or limit any product at any time.
      </p>

      <h2 className="mt-6">3. Orders</h2>
      <p>
        When you place an order, you are making an offer to purchase. We reserve the right to accept or decline orders for any reason. Your order is not accepted until we confirm acceptance and process payment.
      </p>

      <h2 className="mt-6">4. Prices and billing</h2>
      <p>
        Prices, discounts, and promotions are subject to change without notice. Posted prices do not include taxes, shipping, or import charges unless stated otherwise.
      </p>

      <h2 className="mt-6">5. Shipping and delivery</h2>
      <p>
        Delivery times are estimates only. Once we transfer products to the carrier, title and risk of loss pass to you.
        See our <a href="/shipping">shipping policy</a> for full details.
      </p>

      <h2 className="mt-6">6. Returns</h2>
      <p>
        Purchases are subject to our <a href="/returns">refund policy</a>. Custom and sale items may be non-returnable.
      </p>

      <h2 className="mt-6">7. Intellectual property</h2>
      <p>
        All trademarks, logos, designs, photography, and content on this site are owned by Koalafied or our licensors and protected by copyright and trademark law. You may not reproduce, modify, or distribute any content without prior written consent.
      </p>

      <h2 className="mt-6">8. Prohibited uses</h2>
      <p>
        You agree not to use the Services for any unlawful purpose, to violate intellectual property rights, to harass or harm any person, to transmit malware, or to interfere with the operation of the site.
      </p>

      <h2 className="mt-6">9. Disclaimer &amp; limitation of liability</h2>
      <p>
        The Services and all products are provided &quot;as is&quot; and &quot;as available.&quot; To the fullest extent permitted by law, Koalafied is not liable for any indirect, incidental, or consequential damages arising from your use of the Services or any product purchased through them.
      </p>

      <h2 className="mt-6">10. Governing law</h2>
      <p>
        These Terms are governed by the laws of Victoria, Australia. Disputes will be heard in the courts of Victoria.
      </p>

      <h2 className="mt-6">11. Changes</h2>
      <p>
        We may update these Terms from time to time. The current version always lives at this page.
      </p>

      <h2 className="mt-6">12. Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </div>
  );
}
