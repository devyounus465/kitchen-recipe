import { NextResponse, type NextRequest } from "next/server";

/**
 * Private staging (brief §12): when STAGING_PASSWORD is set, every page requires HTTP Basic auth
 * (any username + that password) and is marked noindex. Unset it for the public launch.
 */
function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// Brute-force guard for the staging password: max 20 failed attempts per IP per 10 minutes.
const failures = new Map<string, number[]>();
function tooManyFailures(ip: string, record: boolean) {
  const now = Date.now(); const recent = (failures.get(ip) || []).filter((t) => now - t < 600_000);
  if (record) recent.push(now);
  failures.set(ip, recent);
  if (failures.size > 10_000) failures.clear();
  return recent.length > 20;
}

export function middleware(req: NextRequest) {
  const password = process.env.STAGING_PASSWORD;
  if (!password) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/health")) return NextResponse.next();

  const ip = (req.headers.get("x-forwarded-for")?.split(",").pop() || req.headers.get("x-real-ip") || "local").trim();
  if (tooManyFailures(ip, false)) return new NextResponse("Too many attempts. Try again in a few minutes.", { status: 429, headers: { "Retry-After": "600", "X-Robots-Tag": "noindex, nofollow" } });
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(given, password)) {
        const res = NextResponse.next();
        res.headers.set("X-Robots-Tag", "noindex, nofollow");
        return res;
      }
    } catch { /* malformed header → challenge again */ }
    tooManyFailures(ip, true); // only count actual wrong passwords, not the browser's first unauthenticated request
  }
  return new NextResponse("This staging site is private.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Staging", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"] };
