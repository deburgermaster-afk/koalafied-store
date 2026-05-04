import { NextRequest, NextResponse } from "next/server";
import { trackParcel } from "@/lib/auspost";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  if (!process.env.AUSPOST_API_KEY) {
    return NextResponse.json({
      ok: false,
      error: "AusPost API key not configured. Set AUSPOST_API_KEY in environment.",
    }, { status: 503 });
  }
  try {
    const data = await trackParcel(code);
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "track_failed" },
      { status: 500 }
    );
  }
}
