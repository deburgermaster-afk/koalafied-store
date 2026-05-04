import { NextResponse, type NextRequest } from "next/server";

/**
 * - Adds X-Robots-Tag: noindex to /admin and /api/admin so search engines
 *   never index admin URLs.
 * - Hard-blocks /api/admin requests that have no admin session cookie
 *   (defence in depth on top of requireAdmin in each handler).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPath && !isAdminApi) return NextResponse.next();

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

  // Cookie presence check (the actual signature/iron-session decryption
  // happens inside the route — we just want to short-circuit obvious probes).
  if (isAdminApi) {
    const allowList = ["/api/admin/login", "/api/admin/logout"];
    if (!allowList.includes(pathname)) {
      const cookie = req.cookies.get("koalafied_admin");
      if (!cookie) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
