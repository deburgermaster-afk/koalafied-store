/**
 * Strict Printify mapping:
 *  - Product matches require exact normalized title (case/punctuation insensitive)
 *  - Variants match by token-subset of options against Printify variant title
 *  - Clears any prior mappings first to remove bad fuzzy matches
 *
 * Run: tsx scripts/printify-sync-strict.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { listPrintifyProducts } from "../src/lib/printify";

function norm(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function tokens(s: string) {
  return norm(s).split(" ").filter(Boolean);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = neon(url);

  console.log("Clearing existing Printify mappings…");
  await sql`UPDATE variants SET printify_product_id = NULL, printify_variant_id = NULL`;

  console.log("Fetching Printify catalog…");
  const pProducts = await listPrintifyProducts();
  console.log(`  → ${pProducts.length} products in Printify shop`);

  const local = (await sql`
    SELECT p.id, p.title,
           json_agg(json_build_object(
             'id', v.id,
             'option1', v.option1,
             'option2', v.option2,
             'option3', v.option3
           )) AS variants
    FROM products p JOIN variants v ON v.product_id = p.id
    GROUP BY p.id, p.title
  `) as {
    id: number;
    title: string;
    variants: { id: number; option1: string | null; option2: string | null; option3: string | null }[];
  }[];

  let matchedProducts = 0;
  let mappedVariants = 0;
  let unmappedVariants = 0;
  let skippedProducts = 0;

  for (const lp of local) {
    const lpKey = norm(lp.title);
    const pf = pProducts.find((p) => norm(p.title) === lpKey);
    if (!pf) {
      console.log(`  ✗ skip (no exact title match): ${lp.title}`);
      skippedProducts++;
      continue;
    }
    matchedProducts++;
    console.log(`  ✓ ${lp.title}  →  Printify "${pf.title}"`);

    // Prefer enabled Printify variants
    const pfVars = [...pf.variants].sort((a, b) => {
      const ae = a.is_enabled === false ? 1 : 0;
      const be = b.is_enabled === false ? 1 : 0;
      return ae - be;
    });

    for (const v of lp.variants) {
      const opts = [v.option1, v.option2, v.option3].filter(Boolean) as string[];
      if (opts.length === 0) {
        unmappedVariants++;
        continue;
      }
      const optTokens = opts.flatMap((o) => tokens(o));
      const joinedNorm = norm(opts.join(" "));
      const reversedNorm = norm([...opts].reverse().join(" "));

      let match =
        pfVars.find((pv) => norm(pv.title) === joinedNorm) ??
        pfVars.find((pv) => norm(pv.title) === reversedNorm) ??
        pfVars.find((pv) => {
          const set = new Set(tokens(pv.title));
          return optTokens.every((t) => set.has(t));
        }) ??
        pfVars.find((pv) => {
          const t = norm(pv.title);
          return opts.every((o) => t.includes(norm(o)));
        });

      if (match) {
        await sql`
          UPDATE variants
          SET printify_product_id = ${pf.id}, printify_variant_id = ${String(match.id)}
          WHERE id = ${v.id}
        `;
        mappedVariants++;
      } else {
        console.log(`     · unmapped variant: [${opts.join(" / ")}]`);
        unmappedVariants++;
      }
    }
  }

  console.log("");
  console.log(`Done. matchedProducts=${matchedProducts} skippedProducts=${skippedProducts} mappedVariants=${mappedVariants} unmappedVariants=${unmappedVariants}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
