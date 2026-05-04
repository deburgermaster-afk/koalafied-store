/**
 * Printify Auto-Mapping Script
 *
 * Pulls products from your Printify shop and matches them by title to local products,
 * then writes printify_product_id/printify_variant_id onto each variant.
 *
 * Variant matching strategy:
 *   - Match by title similarity for product
 *   - Match by option values (Color, Size) for variant
 *   - Falls back to first available Printify variant if no exact match
 *
 * Run: npm run printify:sync
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { listPrintifyProducts, type PrintifyProduct } from "../src/lib/printify";

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function bestProductMatch(localTitle: string, pProducts: PrintifyProduct[]) {
  const target = norm(localTitle);
  let best: { p: PrintifyProduct; score: number } | null = null;
  for (const p of pProducts) {
    const t = norm(p.title);
    let score = 0;
    if (t === target) score = 1000;
    else if (t.includes(target) || target.includes(t)) score = 500;
    else {
      const words = target.match(/.{1,4}/g) ?? [];
      score = words.filter((w) => t.includes(w)).length;
    }
    if (!best || score > best.score) best = { p, score };
  }
  return best && best.score > 0 ? best.p : null;
}

function bestVariantMatch(
  localOpts: (string | null)[],
  pProduct: PrintifyProduct
) {
  const target = localOpts.filter(Boolean).map((s) => norm(s as string)).join("|");
  let best: { variantId: number; score: number } | null = null;
  for (const v of pProduct.variants) {
    if (!v.is_enabled) continue;
    const t = norm(v.title || "");
    let score = 0;
    for (const opt of localOpts) {
      if (opt && t.includes(norm(opt))) score += 10;
    }
    if (norm(v.title || "") === target) score += 50;
    if (!best || score > best.score) best = { variantId: v.id, score };
  }
  return best?.variantId ?? pProduct.variants.find((v) => v.is_enabled)?.id ?? null;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
    console.error("Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID in .env first.");
    process.exit(1);
  }

  const sql = neon(url);
  console.log("Fetching Printify catalog…");
  const pProducts = await listPrintifyProducts();
  console.log(`  → ${pProducts.length} products in Printify shop`);

  const local = (await sql`
    SELECT p.id, p.title,
           json_agg(json_build_object(
             'id', v.id, 'option1', v.option1, 'option2', v.option2, 'option3', v.option3
           )) AS variants
    FROM products p JOIN variants v ON v.product_id = p.id
    GROUP BY p.id, p.title
  `) as { id: number; title: string; variants: { id: number; option1: string|null; option2: string|null; option3: string|null }[] }[];

  for (const lp of local) {
    const pp = bestProductMatch(lp.title, pProducts);
    if (!pp) {
      console.log(`  ✗ no match: ${lp.title}`);
      continue;
    }
    console.log(`  ✓ ${lp.title}  →  Printify "${pp.title}" (${pp.id})`);
    for (const v of lp.variants) {
      const vid = bestVariantMatch([v.option1, v.option2, v.option3], pp);
      await sql`
        UPDATE variants
        SET printify_product_id = ${pp.id}, printify_variant_id = ${vid ? String(vid) : null}
        WHERE id = ${v.id}
      `;
    }
  }
  console.log("✓ printify mapping complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
