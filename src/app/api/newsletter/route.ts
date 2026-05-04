import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lightweight newsletter signup. Stores via Resend audience if RESEND_API_KEY + RESEND_AUDIENCE_ID are present;
 * otherwise just acknowledges. Always returns 200 to avoid leaking subscription state.
 */
export async function POST(req: NextRequest) {
  let email = "";
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = (await req.json()) as { email?: string };
      email = (j.email ?? "").trim();
    } else {
      const f = await req.formData();
      email = String(f.get("email") ?? "").trim();
    }
  } catch {
    /* noop */
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Still redirect for form posts, return JSON for API consumers
    if (ct.includes("application/json")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/?newsletter=invalid", req.url), 303);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (apiKey && audienceId) {
    try {
      await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
    } catch {
      /* swallow — don't fail signup on provider hiccup */
    }
  } else {
    console.log(`[newsletter] signup (no provider configured): ${email}`);
  }

  if (ct.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/?newsletter=ok", req.url), 303);
}
