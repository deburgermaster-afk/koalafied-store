/**
 * Strip backgrounds from product main images using @imgly/background-removal-node (free, runs locally).
 * - Downloads each main (position=0) productImage URL
 * - Removes background → transparent PNG
 * - Uploads the new PNG to ImgBB
 * - Updates product_images.url with the new transparent URL
 *
 * Usage:  npx tsx scripts/remove-bg.ts            # process all
 *         npx tsx scripts/remove-bg.ts --product 13   # one product
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { removeBackground } from "@imgly/background-removal-node";

const ImgBBKey = process.env.IMGBB_API_KEY;
if (!ImgBBKey) throw new Error("IMGBB_API_KEY missing");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const sql = neon(url);

async function uploadToImgBB(buf: Buffer, name: string): Promise<string> {
  const form = new FormData();
  form.append("image", buf.toString("base64"));
  form.append("name", name);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${ImgBBKey}`, {
    method: "POST",
    body: form,
  });
  if (!r.ok) throw new Error(`imgbb upload failed: ${r.status}`);
  const j = (await r.json()) as { data?: { url?: string } };
  if (!j.data?.url) throw new Error("imgbb response missing url");
  return j.data.url;
}

async function main() {
  const args = process.argv.slice(2);
  const onlyProductIdx = args.indexOf("--product");
  const onlyProduct = onlyProductIdx >= 0 ? Number(args[onlyProductIdx + 1]) : null;
  const allImages = args.includes("--all"); // include gallery images, not just main

  let rows;
  if (onlyProduct) {
    rows = (await sql`
      SELECT pi.id, pi.url, pi.product_id, pi.position, p.title
      FROM product_images pi
      JOIN products p ON p.id = pi.product_id
      WHERE pi.product_id = ${onlyProduct} ${allImages ? sql`` : sql`AND pi.position = 0`}
      ORDER BY pi.product_id, pi.position`) as { id: number; url: string; product_id: number; position: number; title: string }[];
  } else if (allImages) {
    rows = (await sql`
      SELECT pi.id, pi.url, pi.product_id, pi.position, p.title
      FROM product_images pi
      JOIN products p ON p.id = pi.product_id
      ORDER BY pi.product_id, pi.position`) as { id: number; url: string; product_id: number; position: number; title: string }[];
  } else {
    rows = (await sql`
      SELECT pi.id, pi.url, pi.product_id, pi.position, p.title
      FROM product_images pi
      JOIN products p ON p.id = pi.product_id
      WHERE pi.position = 0
      ORDER BY pi.product_id`) as { id: number; url: string; product_id: number; position: number; title: string }[];
  }

  console.log(`Processing ${rows.length} main image(s)…`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const r of rows) {
    try {
      // Skip if already a transparent PNG hosted on imgbb (heuristic: includes 'kf-bgremoved')
      if (r.url.includes("kf-bgremoved")) {
        console.log(`  skip (already processed)  ${r.title}`);
        skipped++;
        continue;
      }
      console.log(`  ↓ download  ${r.title}`);
      const blob = await removeBackground(r.url, {
        // medium quality is plenty for 800-1200px product photos
        model: "medium",
        output: { format: "image/png", quality: 0.92 },
      });
      const ab = await blob.arrayBuffer();
      const buf = Buffer.from(ab);
      console.log(`  ↑ upload   (${(buf.length / 1024).toFixed(0)} KB)`);
      const newUrl = await uploadToImgBB(buf, `kf-bgremoved-p${r.product_id}-${Date.now()}`);
      await sql`UPDATE product_images SET url = ${newUrl} WHERE id = ${r.id}`;
      console.log(`  ✓ ${r.title}  →  ${newUrl}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${r.title}: ${(e as Error).message}`);
      failed++;
    }
  }
  console.log(`Done. ok=${ok} skipped=${skipped} failed=${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
