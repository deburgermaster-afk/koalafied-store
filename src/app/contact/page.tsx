import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata = { title: "Contact — Koalafied" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-12 md:py-16">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Get in touch</div>
      <h1 className="h-display text-4xl md:text-5xl mb-6">Reconnect with us</h1>
      <p className="text-base leading-relaxed text-ink/80 mb-8">
        Have a question about your order, sizing, or a custom drop?
        We answer every message — usually within 24 hours.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <a
          href={`mailto:${SITE.email}`}
          className="border border-line bg-white p-5 hover:border-ink transition-colors"
        >
          <div className="text-[10px] tracking-[0.28em] uppercase text-muted mb-1">Email</div>
          <div className="text-sm font-semibold break-all">{SITE.email}</div>
        </a>
        <a
          href={SITE.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="border border-line bg-white p-5 hover:border-ink transition-colors"
        >
          <div className="text-[10px] tracking-[0.28em] uppercase text-muted mb-1">WhatsApp</div>
          <div className="text-sm font-semibold">{SITE.phone}</div>
        </a>
        <div className="border border-line bg-white p-5">
          <div className="text-[10px] tracking-[0.28em] uppercase text-muted mb-1">Address</div>
          <div className="text-sm leading-relaxed">
            {SITE.address.line1}
            <br />
            {SITE.address.city}, {SITE.address.state} {SITE.address.postcode}
            <br />
            {SITE.address.country}
          </div>
        </div>
        <div className="border border-line bg-white p-5">
          <div className="text-[10px] tracking-[0.28em] uppercase text-muted mb-1">Socials</div>
          <div className="text-sm flex flex-wrap gap-x-3 gap-y-1">
            <a className="underline hover:text-ink" href={SITE.socials.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <a className="underline hover:text-ink" href={SITE.socials.tiktok} target="_blank" rel="noreferrer">TikTok</a>
            <a className="underline hover:text-ink" href={SITE.socials.facebook} target="_blank" rel="noreferrer">Facebook</a>
          </div>
        </div>
      </div>

      <ContactForm />

      <div className="mt-12 text-sm text-muted">
        Looking to track an order?{" "}
        <Link href="/track" className="underline hover:text-ink">Track here</Link>.
      </div>
    </div>
  );
}

function ContactForm() {
  return (
    <form
      className="border border-line bg-white p-5"
      action="/api/support/message"
      method="post"
    >
      <div className="text-[10px] tracking-[0.28em] uppercase text-muted mb-3">Send a message</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input name="name" placeholder="Your name" className="border border-line px-3 py-2 text-sm" />
        <input name="email" type="email" required placeholder="Email" className="border border-line px-3 py-2 text-sm" />
      </div>
      <select name="topic" className="mt-3 w-full border border-line px-3 py-2 text-sm bg-white">
        <option value="general">General enquiry</option>
        <option value="order">Order issue</option>
        <option value="sizing">Sizing help</option>
        <option value="wholesale">Wholesale</option>
      </select>
      <textarea
        name="message"
        rows={5}
        required
        placeholder="How can we help?"
        className="mt-3 w-full border border-line px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="mt-3 bg-ink text-white px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase hover:bg-ink/90 transition-colors"
      >
        Send message
      </button>
    </form>
  );
}
