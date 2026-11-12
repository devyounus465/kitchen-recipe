import { sql } from "drizzle-orm";
import { db } from "@/db";
export const dynamic = "force-dynamic";
/** Liveness/readiness probe for Docker, uptime monitors and load balancers. */
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ ok: true, db: "up" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
