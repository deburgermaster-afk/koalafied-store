"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { CurrencySwitcher } from "./CurrencySwitcher";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const overlay = pathname === "/";
  const hidden = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (!overlay) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const transparent = overlay && !scrolled && !menuOpen;

  if (hidden) return null;

  return (
    <>
    {!overlay && <div aria-hidden className="h-[100px] md:h-[108px]" />}
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-40 transition-colors duration-300",
        transparent
          ? "bg-transparent text-white"
          : "bg-white/95 backdrop-blur text-ink border-b border-line"
      )}
    >
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 h-14 md:h-16 flex items-center gap-3">
        <Link href="/" className="shrink-0 flex items-center" aria-label="Koalafied home">
          <Image
            src="/assets/logo.webp"
            alt="Koalafied"
            width={120}
            height={40}
            priority
            className={clsx(
              "h-8 md:h-10 w-auto object-contain transition",
              transparent && "brightness-0 invert"
            )}
          />
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-2xl mx-2">
          <form action="/shop" method="get" className="relative">
            <input
              name="q"
              type="search"
              placeholder="Search"
              className={clsx(
                "w-full rounded-full pl-10 pr-4 py-2 text-sm outline-none transition-colors",
                transparent
                  ? "bg-white/15 hover:bg-white/25 focus:bg-white focus:text-ink placeholder-white/80 text-white"
                  : "bg-[#f3f3f1] hover:bg-[#ececea] focus:bg-white focus:ring-1 focus:ring-ink/40"
              )}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-80"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </form>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Link href="/track" aria-label="Track order" className={clsx("hidden sm:grid place-items-center w-10 h-10 rounded-full", transparent ? "hover:bg-white/15" : "hover:bg-[#f3f3f1]")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7.5" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" />
            </svg>
          </Link>
          <Link href="/account" aria-label="Account" className={clsx("hidden sm:grid place-items-center w-10 h-10 rounded-full", transparent ? "hover:bg-white/15" : "hover:bg-[#f3f3f1]")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </svg>
          </Link>
          <CurrencySwitcher dark={transparent} />
          <button
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
            className={clsx("grid place-items-center w-10 h-10 rounded-full", transparent ? "hover:bg-white/15" : "hover:bg-[#f3f3f1]")}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className={clsx(transparent ? "" : "border-t border-line")}>
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-5">
          <ul className="flex items-center justify-around md:justify-center gap-2 md:gap-12 h-11 text-xs md:text-sm font-semibold tracking-[0.18em] uppercase">
            <li><Link href="/shop" className="px-2 py-2 hover:underline underline-offset-8 decoration-2">All</Link></li>
            <li><Link href="/shop?cat=rashguards" className="px-2 py-2 hover:underline underline-offset-8 decoration-2">Rashguards</Link></li>
            <li><Link href="/shop?cat=tees" className="px-2 py-2 hover:underline underline-offset-8 decoration-2">Tees</Link></li>
            <li className="hidden md:block"><Link href="/shop" className="px-2 py-2 hover:underline underline-offset-8 decoration-2">New</Link></li>
            <li className="hidden md:block"><Link href="/about" className="px-2 py-2 hover:underline underline-offset-8 decoration-2">About</Link></li>
          </ul>
        </div>
      </nav>

      {/* Slide-down panel */}
      {menuOpen && (
        <div
          className="absolute left-0 right-0 top-full bg-white text-ink border-b border-line shadow-lg"
          onMouseLeave={() => setMenuOpen(false)}
        >
          <div className="mx-auto max-w-screen-2xl px-5 py-8 grid md:grid-cols-3 gap-8">
            <div>
              <div className="font-semibold uppercase tracking-wider text-xs mb-3">Shop</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/shop" onClick={() => setMenuOpen(false)}>All products</Link></li>
                <li><Link href="/shop?cat=rashguards" onClick={() => setMenuOpen(false)}>Rashguards</Link></li>
                <li><Link href="/shop?cat=tees" onClick={() => setMenuOpen(false)}>Tees</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold uppercase tracking-wider text-xs mb-3">Help</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/track" onClick={() => setMenuOpen(false)}>Track order</Link></li>
                <li><Link href="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold uppercase tracking-wider text-xs mb-3">Account</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/account" onClick={() => setMenuOpen(false)}>My account</Link></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
