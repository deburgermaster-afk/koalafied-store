import "dotenv/config";
import { neon } from "@neondatabase/serverless";
async function main() {
  const s = neon(process.env.DATABASE_URL!);
  const r = await s`SELECT p.id, p.handle, (SELECT url FROM product_images WHERE product_id=p.id ORDER BY position ASC LIMIT 1) as img, (SELECT count(*)::int FROM product_images WHERE product_id=p.id) as n FROM products p LIMIT 5`;
  console.log(r);
}
main();
