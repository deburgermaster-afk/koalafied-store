"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/shop", label: "Shop", icon: ShopIcon },
  { href: "/track", label: "Track", icon: TruckIcon },
  { href: "/checkout", label: "Cart", icon: CartIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <div className="fixed left-1/2 bottom-4 -translate-x-1/2 z-50 print:hidden">
      <nav
        className="flex items-center gap-1 rounded-full bg-ink text-white shadow-2xl px-2 py-2 backdrop-blur"
        style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex flex-col items-center justify-center rounded-full transition-all px-4 py-2 text-[11px] tracking-wide",
                active ? "bg-white text-ink" : "text-white/85 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function HomeIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" />
    </svg>
  );
}
function ShopIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M4 7h16l-1.5 12.5a1 1 0 0 1-1 .5h-11a1 1 0 0 1-1-.5z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}
function TruckIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7.5" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}
function BagIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function CartIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
