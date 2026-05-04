import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listPrintifyProducts } from "@/lib/printify";
import { db } from "@/db";
import { products, variants } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Auto-map local variants to Printify products by title match.
 * Mirrors what `npm run printify:sync` does, runnable from the admin UI.
 */
export async function POST() {
  await requireAdmin();
  try {
    const pfProducts = await listPrintifyProducts();
    const localProducts = await db.select().from(products);
    const localVariants = await db.select().from(variants);

    // Index variants by product id
    const variantsByProduct = new Map<number, typeof localVariants>();
    for (const v of localVariants) {
      const arr = variantsByProduct.get(v.productId) ?? [];
      arr.push(v);
      variantsByProduct.set(v.productId, arr);
    }

    let matchedProducts = 0;
    let mappedVariants = 0;
    let skipped = 0;

    function norm(s: string) {
      return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    }
    function tokens(s: string) {
      return norm(s).split(" ").filter(Boolean);
    }

    let unmappedVariants = 0;

    for (const lp of localProducts) {
      const lpKey = norm(lp.title);
      const pf = pfProducts.find((p) => norm(p.title) === lpKey);
      if (!pf) {
        skipped++;
        continue;
      }
      matchedProducts++;
      const lvs = variantsByProduct.get(lp.id) ?? [];

      // Prefer enabled variants first
      const pfVariantsSorted = [...pf.variants].sort((a, b) => {
        const ae = (a as { is_enabled?: boolean }).is_enabled === false ? 1 : 0;
        const be = (b as { is_enabled?: boolean }).is_enabled === false ? 1 : 0;
        return ae - be;
      });

      for (const lv of lvs) {
        const opts = [lv.option1, lv.option2, lv.option3]
          .filter(Boolean)
          .map((x) => String(x));
        if (opts.length === 0) {
          unmappedVariants++;
          continue;
        }
        const optTokens = opts.flatMap((o) => tokens(o));
        const joinedNorm = norm(opts.join(" "));

        // 1) Exact normalized title match (any order, any separator)
        let match = pfVariantsSorted.find((pv) => norm(pv.title) === joinedNorm);

        // 2) Try reversed order
        if (!match) {
          const reversedNorm = norm([...opts].reverse().join(" "));
          match = pfVariantsSorted.find((pv) => norm(pv.title) === reversedNorm);
        }

        // 3) Token-subset match: every local option's tokens must all appear in pv title tokens
        if (!match) {
          match = pfVariantsSorted.find((pv) => {
            const pvToks = new Set(tokens(pv.title));
            return optTokens.every((t) => pvToks.has(t));
          });
        }

        // 4) Per-option contains: every local option (as a phrase) appears in pv title
        if (!match) {
          match = pfVariantsSorted.find((pv) => {
            const pvNorm = norm(pv.title);
            return opts.every((o) => pvNorm.includes(norm(o)));
          });
        }

        if (match) {
          await db
            .update(variants)
            .set({
              printifyProductId: pf.id,
              printifyVariantId: String(match.id),
            })
            .where(eq(variants.id, lv.id));
          mappedVariants++;
        } else {
          unmappedVariants++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      matchedProducts,
      mappedVariants,
      unmappedVariants,
      skipped,
      totalPrintifyProducts: pfProducts.length,
      totalLocalProducts: localProducts.length,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
