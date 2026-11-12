const hits = new Map<string, number[]>();
/** In-memory sliding window limiter (single instance). Use Redis in multi-instance deployments. */
export function rateLimit(key: string, max = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now(); const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr); return arr.length <= max;
}
