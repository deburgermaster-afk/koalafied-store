import { NextRequest, NextResponse } from "next/server";
import { getDomesticRates, auspostConfig } from "@/lib/auspost";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const postcode = url.searchParams.get("postcode") ?? "";
  const items = Math.max(1, Number(url.searchParams.get("items") ?? "1"));
  if (!/^\d{4}$/.test(postcode)) {
    return NextResponse.json({ error: "Invalid postcode" }, { status: 400 });
  }
  const cfg = auspostConfig();
  const weightKg = Math.max(cfg.minWeightKg, items * cfg.weightPerItemKg);
  try {
    if (!cfg.hasKey) {
      // Fallback flat rates while key is missing — keeps UX functional.
      return NextResponse.json({
        rates: [
          { code: "AUS_PARCEL_REGULAR", name: "Standard (3-7 business days)", priceCents: 995 },
          { code: "AUS_PARCEL_EXPRESS", name: "Express (1-3 business days)", priceCents: 1695 },
        ],
        fallback: true,
      });
    }
    const rates = await getDomesticRates({ toPostcode: postcode, weightKg });
    return NextResponse.json({ rates });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "rates_failed" },
      { status: 500 }
    );
  }
}
