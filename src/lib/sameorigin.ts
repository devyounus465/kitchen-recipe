/** Rejects cross-site requests to JSON/form API routes (defence in depth on top of SameSite cookies). */
export function isCrossSite(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "cross-site";
  const origin = req.headers.get("origin"); const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host !== host; } catch { return true; }
}
