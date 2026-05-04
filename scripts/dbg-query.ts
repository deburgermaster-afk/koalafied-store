import "dotenv/config";
import { db } from "../src/db";
import { products, productImages } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  const q = db
    .select({
      id: products.id,
      handle: products.handle,
      image: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${products.id} ORDER BY position ASC LIMIT 1)`,
    })
    .from(products)
    .where(eq(products.active, true))
    .limit(3);
  console.log("SQL:", q.toSQL());
  const rows = await q;
  console.log(rows);
}
main();
