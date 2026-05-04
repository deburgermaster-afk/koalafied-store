export const metadata = { title: "Our Story — Koalafied" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 sm:px-6 py-12 md:py-16">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Australia&apos;s Originals</div>
      <h1 className="h-display text-4xl md:text-6xl mb-6">Built on the mats.</h1>

      <p className="text-lg leading-relaxed text-ink/85 mb-4">
        KOALAFIED was born on the mats — a tribute to the grit of Australian jiu-jitsu and combat sports.
        We design every piece for the choke, the scramble, and every quiet morning before training.
      </p>
      <p className="text-lg leading-relaxed text-ink/85 mb-8">
        Heritage tees. Performance rashguards. No filler.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-10">
        <Stat label="Founded" value="Australia" />
        <Stat label="Made for" value="The long roll" />
        <Stat label="Shipping" value="Worldwide" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-3">Our promise</h2>
      <p className="text-base leading-relaxed text-ink/80 mb-3">
        Every order is produced on demand and inspected before it leaves our partners. Materials are
        chosen for breathability, recovery, and durability — the same things you&apos;d test on the
        mat before you trust them in a tournament.
      </p>
      <p className="text-base leading-relaxed text-ink/80 mb-3">
        If something doesn&apos;t fit right or doesn&apos;t hold up, we make it right. That&apos;s the
        deal — and that&apos;s why we&apos;re still Australia&apos;s Originals.
      </p>

      <h2 className="text-2xl font-bold tracking-tight mt-10 mb-3">Why Koalafied?</h2>
      <ul className="space-y-2 text-base text-ink/80">
        <li>· Worldwide shipping with tracked delivery.</li>
        <li>· Secure checkout via Stripe — your card details never touch our servers.</li>
        <li>· Heritage-grade materials, designed for combat sports.</li>
        <li>· 24/7 support — we answer every email.</li>
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-white p-4">
      <div className="text-[10px] tracking-[0.28em] uppercase text-muted">{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </div>
  );
}
