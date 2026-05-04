import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type AdminSession } from "@/lib/session";

// Very small in-memory rate limiter (5 attempts / 5 min per IP).
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX = 5;
function ipFrom(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = ipFrom(req);
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now - a.firstAt < WINDOW_MS && a.count >= MAX) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const { email, password } = await req.json().catch(() => ({}));
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !hash) {
    return NextResponse.json(
      { error: "Admin not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH." },
      { status: 503 }
    );
  }

  const submittedEmail = String(email ?? "").trim().toLowerCase();
  const okPwd = await bcrypt.compare(String(password ?? ""), hash);
  const okEmail = submittedEmail === adminEmail;
  if (!okEmail || !okPwd) {
    const cur = attempts.get(ip) ?? { count: 0, firstAt: now };
    if (now - cur.firstAt >= WINDOW_MS) {
      cur.count = 0;
      cur.firstAt = now;
    }
    cur.count += 1;
    attempts.set(ip, cur);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  attempts.delete(ip);
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions);
  session.isAdmin = true;
  session.loggedInAt = Date.now();
  await session.save();
  return NextResponse.json({ ok: true });
}
