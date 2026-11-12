import "server-only";
import { headers } from "next/headers";

const hits = new Map<string, number[]>();
/** In-memory sliding window limiter (per server instance). Use Redis for multi-instance deployments. */
export function rateLimit(key: string, max = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now(); const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  if (hits.size > 50_000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k); // bound memory
  return arr.length <= max;
}
/** Client IP: the last X-Forwarded-For hop is added by our own proxy (Caddy/Vercel); earlier hops are client-controlled. */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",").pop() || h.get("x-real-ip") || "local").trim();
}
