import "server-only";
import { rateLimit, clientIp } from "@/lib/ratelimit";

/** Shared helpers for the public, read-only JSON API (/api/v1). No cookies or private data are used. */
const HEADERS = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60, s-maxage=300", "X-Content-Type-Options": "nosniff" };
export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: HEADERS });
export async function limited() {
  return rateLimit(`api:${await clientIp()}`, 120, 60_000) ? null : json({ error: "rate_limited", message: "Too many requests; max 120 per minute." }, 429);
}
