import "server-only";
import { eq, sql } from "drizzle-orm";
import { permanentRedirect } from "next/navigation";
import { db, redirects } from "@/db";

/** Normalises to a site-relative path with a trailing slash; returns null for anything off-site. */
export function normalizePath(p: string) {
  let s = p.trim();
  try { if (/^https?:\/\//i.test(s)) s = new URL(s).pathname; } catch { return null; }
  if (!s.startsWith("/") || s.startsWith("//") || s.includes("\\") || /\s/.test(s)) return null;
  return s.endsWith("/") ? s : `${s}/`;
}

/** Record old → new when a slug changes, and collapse chains (a→b, b→c ⇒ a→c). */
export async function addRedirect(from: string, to: string) {
  const f = normalizePath(from); const t = normalizePath(to);
  if (!f || !t || f === t) return;
  await db.delete(redirects).where(eq(redirects.fromPath, t)); // the new URL is live again
  await db.update(redirects).set({ toPath: t }).where(eq(redirects.toPath, f));
  await db.insert(redirects).values({ fromPath: f, toPath: t }).onConflictDoUpdate({ target: redirects.fromPath, set: { toPath: t } });
}

/** Call from a page before notFound(): permanently redirects if an old URL was recorded. */
export async function followRedirect(path: string) {
  const f = normalizePath(path); if (!f) return;
  const [r] = await db.update(redirects).set({ hits: sql`${redirects.hits} + 1` }).where(eq(redirects.fromPath, f)).returning({ to: redirects.toPath });
  if (r) permanentRedirect(r.to);
}
