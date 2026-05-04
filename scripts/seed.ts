import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

type SP = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  images: { src: string; alt: string | null; position: number }[];
  options: { name: string; position: number; values: string[] }[];
  variants: {
    id: number;
    sku: string | null;
    price: string;
    available: boolean;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    featured_image: { src: string } | null;
  }[];
};

function priceToCents(p: string) {
  return Math.round(parseFloat(p) * 100);
}
function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = neon(url);

  const file = path.join(process.cwd(), "products.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as { products: SP[] };

  console.log(`Seeding ${data.products.length} products…`);

  // Clear existing (safe for fresh seeds).
  await sql`DELETE FROM order_items`;
  await sql`DELETE FROM orders`;
  await sql`DELETE FROM product_options`;
  await sql`DELETE FROM product_images`;
  await sql`DELETE FROM variants`;
  await sql`DELETE FROM products`;

  const featuredHandles = new Set([
    "the-koalafied-classic-red-navy",
    "the-eucalyptus-stealth-black-blue",
    "the-midnight-koala-black-purple",
    "the-neon-joey-pink-black",
  ]);

  for (const p of data.products) {
    const minPriceCents = Math.min(...p.variants.map((v) => priceToCents(v.price)));
    const cleanTitle = p.title.replace(/\s+/g, " ").trim();
    const description = stripHtml(p.body_html);

    const [{ id: productId }] = (await sql`
      INSERT INTO products (handle, title, description, base_price_cents, currency, active, featured, source_id)
      VALUES (${p.handle}, ${cleanTitle}, ${description}, ${minPriceCents}, 'AUD', true,
              ${featuredHandles.has(p.handle)}, ${String(p.id)})
      RETURNING id
    `) as { id: number }[];

    for (const img of p.images) {
      await sql`
        INSERT INTO product_images (product_id, url, alt, position)
        VALUES (${productId}, ${img.src}, ${img.alt ?? cleanTitle}, ${img.position})
      `;
    }

    for (const o of p.options) {
      await sql`
        INSERT INTO product_options (product_id, name, position, values)
        VALUES (${productId}, ${o.name}, ${o.position}, ${JSON.stringify(o.values)}::jsonb)
      `;
    }

    for (const v of p.variants) {
      await sql`
        INSERT INTO variants (product_id, sku, price_cents, available, option1, option2, option3, image_url, source_id)
        VALUES (${productId}, ${v.sku}, ${priceToCents(v.price)}, ${v.available},
                ${v.option1}, ${v.option2}, ${v.option3},
                ${v.featured_image?.src ?? null}, ${String(v.id)})
      `;
    }

    console.log(`  ✓ ${cleanTitle} (${p.variants.length} variants, ${p.images.length} images)`);
  }

  console.log("✓ seed complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
