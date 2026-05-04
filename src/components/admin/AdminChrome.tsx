"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/products", label: "Products", icon: "👕" },
  { href: "/admin/products/new", label: "+ New Product", icon: "✚" },
  { href: "/admin/printify", label: "Printify", icon: "🖨" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

const EXTERNAL = [
  { href: "https://printify.com/app/orders", label: "Printify dashboard" },
  { href: "https://dashboard.stripe.com/payments", label: "Stripe payments" },
  { href: "https://console.neon.tech", label: "Neon DB" },
  { href: "https://auspost.com.au/mypost-business", label: "AusPost MyPost" },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isLogin = pathname === "/admin/login";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isLogin) {
    return <div className="min-h-screen bg-[#fafaf7] text-ink">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] text-ink">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-ink text-white flex items-center justify-between px-4 h-14 border-b border-white/10">
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 active:bg-white/10 rounded"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link href="/admin" className="font-bold tracking-wider text-sm">KOALAFIED · ADMIN</Link>
        <form action="/api/admin/logout" method="post">
          <button className="text-[10px] uppercase tracking-[0.18em] text-white/60 hover:text-white px-2">
            Sign out
          </button>
        </form>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-ink text-white/85 flex flex-col shadow-2xl">
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.32em] uppercase text-white/50">Koalafied</div>
                <div className="text-lg font-bold tracking-wider">Control Room</div>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="p-2 -mr-2 text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <Nav pathname={pathname} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 bg-ink text-white/85 flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <Link href="/admin" className="block">
            <div className="text-[10px] tracking-[0.32em] uppercase text-white/50">Koalafied</div>
            <div className="text-lg font-bold tracking-wider">Control Room</div>
          </Link>
        </div>
        <Nav pathname={pathname} />
        <form action="/api/admin/logout" method="post" className="border-t border-white/10 p-4">
          <button className="w-full text-left text-xs uppercase tracking-[0.18em] text-white/60 hover:text-white">
            Sign out
          </button>
        </form>
      </aside>

      <main className="lg:pl-60 min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
        {children}
      </main>
    </div>
  );
}

function Nav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 py-3 text-sm overflow-y-auto">
      {NAV.map((n) => {
        const active =
          n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={
              "flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 hover:text-white " +
              (active
                ? "bg-white/10 text-white border-l-2 border-emerald-400"
                : "border-l-2 border-transparent")
            }
          >
            <span className="w-5 text-center text-[13px] opacity-70">{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        );
      })}
      <div className="px-5 pt-6 pb-2 text-[10px] tracking-[0.28em] uppercase text-white/40">
        External
      </div>
      {EXTERNAL.map((x) => (
        <a
          key={x.href}
          href={x.href}
          target="_blank"
          rel="noreferrer"
          className="block px-5 py-2 hover:bg-white/5 text-[13px]"
        >
          ↗ {x.label}
        </a>
      ))}
    </nav>
  );
}
