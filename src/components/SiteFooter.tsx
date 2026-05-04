"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-white/85">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-10 md:py-14 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-[11px] tracking-[0.32em] uppercase text-white/50 mb-2">
              The Koalafield Dispatch
            </div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Get drop alerts, fight-week stories, and 10% off your first order.
            </h3>
            <p className="mt-2 text-sm text-white/60 max-w-md">
              No spam. Just early access to limited drops, Aussie BJJ events,
              and dispatches from our athletes on the mats.
            </p>
          </div>
          <form
            action="/api/newsletter"
            method="post"
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="flex-1 bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              className="bg-white text-ink px-6 py-3 text-xs font-semibold tracking-[0.18em] uppercase hover:bg-white/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
        {/* Brand column */}
        <div className="col-span-2 md:col-span-2 pr-4">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black tracking-[0.18em]">Koalafied</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/65 max-w-sm">
            Born out of a harsh environment. Forged on the mats of Australia &mdash;
            built for the choke, the scramble, and every quiet morning before training.
            Heritage tees. Performance rashguards. Designed for the long roll.
          </p>

          {/* Social icons */}
          <div className="mt-6 flex items-center gap-3">
            <SocialLink href={SITE.socials.instagram} label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </SocialLink>
            <SocialLink href={SITE.socials.tiktok} label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                <path d="M16 3v3.2a4.8 4.8 0 0 0 4.8 4.8V14a8 8 0 0 1-4.8-1.6V17a5 5 0 1 1-5-5h.6v3.2A1.8 1.8 0 1 0 13 17V3h3z" />
              </svg>
            </SocialLink>
            <SocialLink href={SITE.socials.facebook} label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.6-1.6h1.6V4.2c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3V14h2.7v8h3.5z" />
              </svg>
            </SocialLink>
            <SocialLink href={SITE.socials.youtube} label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18.1 5.6 12 5.6 12 5.6s-6.1 0-7.9.5A3 3 0 0 0 2 8.2 32 32 0 0 0 1.6 12 32 32 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.8.5 7.9.5 7.9.5s6.1 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.3.4-2.5.4-3.8s-.1-2.5-.4-3.8zM10 15.2V8.8l5.4 3.2L10 15.2z" />
              </svg>
            </SocialLink>
            <SocialLink href={`mailto:${SITE.email}`} label="Email">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </SocialLink>
          </div>

          <div className="mt-6 text-xs text-white/50 leading-relaxed">
            <div>Proudly shipping from Australia.</div>
            <div>Fulfilled on demand. Built to last.</div>
          </div>
        </div>

        {/* Shop */}
        <FooterCol title="Shop">
          <li><Link href="/shop">All Products</Link></li>
          <li><Link href="/shop?cat=tees">Tees</Link></li>
          <li><Link href="/shop?cat=rashguards">Rashguards</Link></li>
          <li><Link href="/shop?sort=new">New Arrivals</Link></li>
          <li><Link href="/shop?sort=best">Best Sellers</Link></li>
        </FooterCol>

        {/* Support */}
        <FooterCol title="Support">
          <li><Link href="/track">Track Order</Link></li>
          <li><Link href="/shipping">Shipping</Link></li>
          <li><Link href="/returns">Returns &amp; Exchanges</Link></li>
          <li><Link href="/sizing">Sizing Guide</Link></li>
          <li><Link href="/contact">Contact Us</Link></li>
        </FooterCol>

        {/* Company */}
        <FooterCol title="Company">
          <li><Link href="/about">Our Story</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/account">My Account</Link></li>
          <li><a href={SITE.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></li>
          <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
        </FooterCol>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/55">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© {year} Koalafied Apparel Co. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/legal" className="hover:text-white">Legal</Link>
          </div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-white/40">
            <span>Made on the mats</span>
            <span>·</span>
            <span>{SITE.address.city}, AU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-white mb-4 text-[11px] tracking-[0.28em] uppercase">
        {title}
      </div>
      <ul className="space-y-2.5 text-sm text-white/65 [&_a:hover]:text-white">
        {children}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="w-9 h-9 inline-flex items-center justify-center border border-white/15 text-white/80 hover:text-ink hover:bg-white hover:border-white transition-colors"
    >
      {children}
    </a>
  );
}
