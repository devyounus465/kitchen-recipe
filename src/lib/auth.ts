import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { redirect } from "next/navigation";

const COOKIE = "sm_session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");
export type SessionUser = typeof users.$inferSelect;

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.SITE_URL?.startsWith("https"), path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function destroySession() { (await cookies()).delete(COOKIE); }

export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const [u] = await db.select().from(users).where(eq(users.id, Number(payload.uid)));
    if (!u || u.status !== "active") return null;
    return u;
  } catch { return null; }
}
export async function requireUser(next = "/account/my-recipes") {
  const u = await getUser(); if (!u) redirect(`/account/login?next=${encodeURIComponent(next)}`); return u;
}
export const isStaffRole = (r?: string) => r === "admin" || r === "editor";
export async function requireStaff() {
  const u = await getUser(); if (!u) redirect("/account/login?next=/admin"); if (!isStaffRole(u.role)) redirect("/?denied=1"); return u;
}
export async function requireAdmin() { const u = await requireStaff(); if (u.role !== "admin") redirect("/admin?denied=1"); return u; }
