import "dotenv/config";
import { neon } from "@neondatabase/serverless";

// Lightweight bootstrap migration runner so we don't need drizzle-kit at runtime.
// Runs the SQL in drizzle/0000_init.sql.
import fs from "node:fs";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = neon(url);
  const dir = path.join(process.cwd(), "drizzle");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    console.log(`\n== ${f} ==`);
    const ddl = fs.readFileSync(path.join(dir, f), "utf8");
    const statements = ddl
      .split(/-->\s*statement-breakpoint|;\s*\n/g)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      // eslint-disable-next-line no-console
      console.log("→", stmt.slice(0, 80).replace(/\s+/g, " "));
      await sql(stmt);
    }
  }
  console.log("✓ migrations complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
