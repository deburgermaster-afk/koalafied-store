import { NextRequest, NextResponse } from "next/server";

/**
 * Looks up Australian localities via the AusPost postcode search API.
 *
 * Accepts either:
 *   ?postcode=2000          — exact 4-digit postcode
 *   ?q=Bond                 — partial suburb/postcode (≥ 3 chars)
 *   ?state=NSW              — optional state filter (combined with q)
 *
 * Without an `AUSPOST_API_KEY` env var, returns an empty list so the UI
 * can fall back to free-text entry.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const postcode = (url.searchParams.get("postcode") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();
  const state = (url.searchParams.get("state") ?? "").trim().toUpperCase();

  let query = "";
  if (postcode) {
    if (!/^\d{4}$/.test(postcode)) {
      return NextResponse.json({ error: "Invalid postcode" }, { status: 400 });
    }
    query = postcode;
  } else if (q.length >= 3) {
    query = q;
  } else {
    return NextResponse.json({ localities: [] });
  }

  const key = process.env.AUSPOST_API_KEY;
  if (!key) {
    return NextResponse.json({ localities: [], fallback: true });
  }
  try {
    const params = new URLSearchParams({ q: query });
    if (state) params.set("state", state);
    const r = await fetch(
      `https://digitalapi.auspost.com.au/postcode/search.json?${params.toString()}`,
      { headers: { "auth-key": key, Accept: "application/json" }, cache: "no-store" }
    );
    if (!r.ok) {
      return NextResponse.json({ localities: [], fallback: true });
    }
    const j = (await r.json()) as {
      localities?: {
        locality?:
          | { location: string; postcode: number; state: string }[]
          | { location: string; postcode: number; state: string };
      };
    };
    let raw = j.localities?.locality;
    if (!raw) raw = [];
    if (!Array.isArray(raw)) raw = [raw];
    // De-dupe (AusPost can return PO box variants of the same suburb)
    const seen = new Set<string>();
    const localities = raw
      .map((l) => ({
        suburb: l.location,
        postcode: String(l.postcode),
        state: l.state,
      }))
      .filter((l) => {
        const k = `${l.postcode}|${l.suburb}|${l.state}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    return NextResponse.json({ localities });
  } catch {
    return NextResponse.json({ localities: [], fallback: true });
  }
}
