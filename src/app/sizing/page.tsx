export const metadata = { title: "Sizing — Koalafied" };

const TEE_SIZES = [
  ["XS", '36"', '26"', '17"'],
  ["S", '38"', '27"', '17.5"'],
  ["M", '40"', '28"', '18"'],
  ["L", '42"', '29"', '18.5"'],
  ["XL", '44"', '30"', '19"'],
  ["2XL", '46"', '31"', '19.5"'],
  ["3XL", '48"', '32"', '20"'],
];

const RASH_SIZES = [
  ["XS", '34"', '25"', '15"'],
  ["S", '36"', '26"', '15.5"'],
  ["M", '38"', '27"', '16"'],
  ["L", '40"', '28"', '16.5"'],
  ["XL", '42"', '29"', '17"'],
  ["2XL", '44"', '30"', '17.5"'],
];

export default function SizingPage() {
  return (
    <div className="mx-auto max-w-screen-lg px-4 sm:px-6 py-12 md:py-16">
      <div className="text-[10px] tracking-[0.32em] uppercase text-muted mb-2">Sizing</div>
      <h1 className="h-display text-4xl md:text-5xl mb-6">Sizing guide</h1>
      <p className="text-ink/80 max-w-prose mb-10">
        Most KOALAFIED gear runs true-to-size. If you&apos;re between sizes, we recommend sizing up
        for tees and sticking to your true size for rashguards (compression fit).
      </p>

      <Section title="Tees (Heritage / Graphic)" rows={TEE_SIZES} />
      <Section title="Rashguards" rows={RASH_SIZES} />

      <div className="mt-10 text-sm text-muted">
        Measurements are flat-laid garment measurements ±1&quot;. Still unsure?
        Email <a href="mailto:info@koalafied.store" className="underline hover:text-ink">info@koalafied.store</a> with your height/weight and we&apos;ll recommend a size.
      </div>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="mb-10 border border-line bg-white">
      <div className="px-5 py-3 border-b border-line font-semibold text-sm">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-[#f8f8f6] text-left text-muted">
            <tr>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2">Chest</th>
              <th className="px-4 py-2">Length</th>
              <th className="px-4 py-2">Sleeve</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t border-line">
                <td className="px-4 py-2 font-semibold">{r[0]}</td>
                <td className="px-4 py-2">{r[1]}</td>
                <td className="px-4 py-2">{r[2]}</td>
                <td className="px-4 py-2">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
