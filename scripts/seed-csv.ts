import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { neon } from "@neondatabase/serverless";

type Row = Record<string, string>;

function priceToCents(p: string) {
  if (!p) return 0;
  return Math.round(parseFloat(p) * 100);
}
function stripHtml(s: string) {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function clean(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = neon(url);

  const file = path.join(process.cwd(), "Assests ", "products_export_1.csv");
  const raw = fs.readFileSync(file, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Row[];

  console.log(`Parsed ${rows.length} CSV rows`);

  // Group rows by Handle (Shopify exports list product on first row, variants/images on following rows with same handle)
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const h = r["Handle"]?.trim();
    if (!h) continue;
    if (!groups.has(h)) groups.set(h, []);
    groups.get(h)!.push(r);
  }

  console.log(`Found ${groups.size} unique products`);

  // Wipe and reseed
  await sql`DELETE FROM order_items`;
  await sql`DELETE FROM orders`;
  await sql`DELETE FROM product_options`;
  await sql`DELETE FROM product_images`;
  await sql`DELETE FROM variants`;
  await sql`DELETE FROM products`;

  const featuredHandles = new Set<string>();
  let firstHandles: string[] = [];

  for (const [handle, grp] of groups) {
    // Title/body taken from first row that has them
    const head = grp.find((r) => r["Title"]) ?? grp[0];
    const title = clean(head["Title"] || handle.replace(/-/g, " "));
    const description = stripHtml(head["Body (HTML)"] || "");
    const status = (head["Status"] || "active").toLowerCase();
    if (status !== "active") continue;

    // Variants: rows that have Option1 Value or a Variant Price
    const variantRows = grp.filter(
      (r) => (r["Option1 Value"] && r["Variant Price"]) || r["Variant SKU"]
    );
    const prices = variantRows
      .map((r) => priceToCents(r["Variant Price"]))
      .filter((c) => c > 0);
    if (prices.length === 0) continue;
    const basePrice = Math.min(...prices);

    firstHandles.push(handle);
    if (firstHandles.length <= 4) featuredHandles.add(handle);

    const [{ id: productId }] = (await sql`
      INSERT INTO products (handle, title, description, base_price_cents, currency, active, featured)
      VALUES (${handle}, ${title}, ${description}, ${basePrice}, 'AUD', true, ${featuredHandles.has(handle)})
      RETURNING id
    `) as { id: number }[];

    // Images: any row with Image Src, dedupe by url, ordered by Image Position
    const seenImg = new Set<string>();
    const imgs: { src: string; alt: string; pos: number }[] = [];
    for (const r of grp) {
      const src = r["Image Src"]?.trim();
      if (!src || seenImg.has(src)) continue;
      seenImg.add(src);
      imgs.push({
        src,
        alt: clean(r["Image Alt Text"] || title),
        pos: parseInt(r["Image Position"] || "0", 10) || imgs.length + 1,
      });
    }
    imgs.sort((a, b) => a.pos - b.pos);
    for (let i = 0; i < imgs.length; i++) {
      await sql`
        INSERT INTO product_images (product_id, url, alt, position)
        VALUES (${productId}, ${imgs[i].src}, ${imgs[i].alt}, ${i})
      `;
    }

    // Options: collect distinct values per option name from variant rows
    const optNames = ["Option1 Name", "Option2 Name", "Option3 Name"];
    const optValCols = ["Option1 Value", "Option2 Value", "Option3 Value"];
    for (let i = 0; i < 3; i++) {
      const name = clean(head[optNames[i]] || grp.find((r) => r[optNames[i]])?.[optNames[i]] || "");
      if (!name) continue;
      const valuesSet = new Set<string>();
      for (const r of variantRows) {
        const v = clean(r[optValCols[i]]);
        if (v) valuesSet.add(v);
      }
      if (valuesSet.size === 0) continue;
      await sql`
        INSERT INTO product_options (product_id, name, position, values)
        VALUES (${productId}, ${name}, ${i + 1}, ${JSON.stringify([...valuesSet])}::jsonb)
      `;
    }

    // Variants
    for (const r of variantRows) {
      const sku = clean(r["Variant SKU"]) || null;
      const price = priceToCents(r["Variant Price"]);
      if (!price) continue;
      const o1 = clean(r["Option1 Value"]) || null;
      const o2 = clean(r["Option2 Value"]) || null;
      const o3 = clean(r["Option3 Value"]) || null;
      const img = clean(r["Variant Image"]) || clean(r["Image Src"]) || null;
      const policy = (r["Variant Inventory Policy"] || "").toLowerCase();
      const available = policy !== "deny" ? true : true; // treat all as available
      await sql`
        INSERT INTO variants (product_id, sku, price_cents, available, option1, option2, option3, image_url)
        VALUES (${productId}, ${sku}, ${price}, ${available}, ${o1}, ${o2}, ${o3}, ${img})
      `;
    }

    console.log(`  ✓ ${title} (${variantRows.length} variants, ${imgs.length} images)`);
  }

  console.log(`\n✓ Imported ${firstHandles.length} products from CSV`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
