import "dotenv/config";
import { neon } from "@neondatabase/serverless";
async function main(){
  const s = neon(process.env.DATABASE_URL!);
  const p = await s`SELECT id FROM products WHERE handle='the-koalafied-classic-red-navy'`;
  const v = await s`SELECT option1, option2, option3 FROM variants WHERE product_id=${(p[0] as any).id}`;
  console.log(v);
}
main();
