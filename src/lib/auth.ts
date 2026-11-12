import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { redirect } from "next/navigation";

const COOKIE = "sm_session";
type SessionUser = typeof users.$inferSelect;
const PLACEHOLDER_SECRETS = ["dev-only-secret-change-me-0123456789abcdef0123456789", "change-me-run-openssl-rand-hex-32"];

let cachedKey: Uint8Array | null = null;
function key() {
  if (cachedKey) return cachedKey;
  const secret = process.env.AUTH_SECRET || "";
  const isProd = process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
  if (isProd && (secret.length < 32 || PLACEHOLDER_SECRETS.includes(secret))) {
    throw new Error("AUTH_SECRET must be set to a unique random value of at least 32 characters (e.g. `openssl rand -hex 32`).");
  }
  cachedKey = new TextEncoder().encode(secret || "insecure-local-development-secret-only");
  return cachedKey;
}

export async function createSession(user: { id: number; sessionVersion: number }) {
  const token = await new SignJWT({ uid: user.id, sv: user.sessionVersion }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && !!process.env.SITE_URL?.startsWith("https"), path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function destroySession() { (await cookies()).delete(COOKIE); }

export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const k = key(); // outside try: a misconfigured secret must surface, not log everyone out
  let payload: Record<string, unknown>;
  try { ({ payload } = await jwtVerify(token, k, { algorithms: ["HS256"] })); } catch { return null; }
  const [u] = await db.select().from(users).where(eq(users.id, Number(payload.uid)));
  if (!u || u.status !== "active" || Number(payload.sv ?? 0) !== u.sessionVersion) return null;
  return u;
}
/** Only allow same-site relative paths (blocks //evil.com, /\evil.com and control characters). */
export function safeNext(n: unknown, fallback = "/account/my-recipes/") {
  const s = String(n ?? "");
  return /^\/(?![\/\\])[^\s\\]*$/.test(s) && !/[\u0000-\u001f]/.test(s) ? s : fallback;
}
export async function requireUser(next = "/account/my-recipes/") {
  const u = await getUser(); if (!u) redirect(`/account/login/?next=${encodeURIComponent(safeNext(next))}`); return u;
}
export const isStaffRole = (r?: string) => r === "admin" || r === "editor";
export async function requireStaff() {
  const u = await getUser(); if (!u) redirect("/account/login/?next=/admin"); if (!isStaffRole(u.role)) redirect("/?denied=1"); return u;
}
export async function requireAdmin() { const u = await requireStaff(); if (u.role !== "admin") redirect("/admin?denied=1"); return u; }
