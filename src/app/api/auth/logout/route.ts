import { destroySession } from "@/lib/auth";
import { isCrossSite } from "@/lib/sameorigin";
// Relative Location so the redirect is correct behind proxies (Caddy/Nginx/Vercel),
// where req.url holds the internal host (e.g. 0.0.0.0:3000) rather than the public domain.
export async function POST(req: Request) {
  if (isCrossSite(req)) return new Response("Forbidden", { status: 403 });
  await destroySession();
  return new Response(null, { status: 303, headers: { Location: "/?loggedout=1" } });
}
