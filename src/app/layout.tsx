import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/components/CartProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SupportChatGate } from "@/components/SupportChatGate";
import { getCurrentCustomer } from "@/lib/customer";

export const metadata: Metadata = {
  title: "Koalafied — Born out of a harsh environment",
  description:
    "Authentic jiu-jitsu and combat sports apparel. Heritage tees, performance rashguards. Built in Australia.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentCustomer().catch(() => null);
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        <NextTopLoader color="#1a1a1a" height={2} showSpinner={false} shadow="0 0 8px #1a1a1a" />
        <CurrencyProvider>
        <CartProvider>
          <SiteHeader />
          <main className="pb-28">{children}</main>
          <SiteFooter />
          <BottomNav />
          <SupportChatGate defaultEmail={me?.email ?? ""} defaultName={me?.defaultAddress?.name ?? ""} />
        </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
