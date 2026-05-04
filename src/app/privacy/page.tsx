import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy Policy — Koalafied" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-12 md:py-16 prose prose-zinc max-w-none">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Legal</div>
      <h1 className="h-display text-4xl md:text-5xl mb-2">Privacy policy</h1>
      <p className="text-sm text-muted mt-0">Last updated: 24 March 2026</p>

      <p>
        Koalafied operates this store and website to provide you, the customer, with a curated shopping experience.
        This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use,
        or make a purchase using the Services or otherwise communicate with us.
      </p>

      <h2 className="mt-8">Information we collect</h2>
      <ul>
        <li><strong>Contact details</strong> — your name, address, billing &amp; shipping address, phone, email.</li>
        <li><strong>Financial information</strong> — payment-card information, transaction details. (Cards processed by Stripe; we never store full card numbers.)</li>
        <li><strong>Account information</strong> — username, password, preferences, settings.</li>
        <li><strong>Transaction information</strong> — items viewed, added to cart, purchased, returned.</li>
        <li><strong>Communications</strong> — content of customer support enquiries.</li>
        <li><strong>Device &amp; usage data</strong> — IP address, browser, navigation patterns.</li>
      </ul>

      <h2 className="mt-6">How we use it</h2>
      <ul>
        <li>To provide the Services — process orders, payments, shipping, returns, and account management.</li>
        <li>To send transactional and (with your consent) marketing communications.</li>
        <li>To detect fraud, secure our services, and protect public safety.</li>
        <li>To comply with applicable law and respond to valid legal process.</li>
      </ul>

      <h2 className="mt-6">Who we share with</h2>
      <p>
        Service providers (Stripe for payments, Printify for fulfilment, Resend for email,
        Neon for database hosting, Vercel for application hosting), shipping carriers,
        and authorities when required by law. We do not sell your personal information.
      </p>

      <h2 className="mt-6">Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, delete, correct, or port your personal information,
        and to opt out of marketing communications. To exercise any of these rights, email
        {" "}<a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>

      <h2 className="mt-6">Children</h2>
      <p>The Services are not intended for children, and we do not knowingly collect data from minors.</p>

      <h2 className="mt-6">Security</h2>
      <p>
        We use TLS in transit and industry-standard practices, but no system is impenetrable.
        Please do not transmit sensitive information over unsecured channels.
      </p>

      <h2 className="mt-6">Contact</h2>
      <p>
        If you have any questions, please contact us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>{" "}
        or {SITE.address.line1}, {SITE.address.city}, {SITE.address.state} {SITE.address.postcode}, {SITE.address.country}.
      </p>
    </div>
  );
}
