import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireStaff } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
export const metadata: Metadata = { title: { default: "Studio", template: "%s · Simmerly Studio" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await requireStaff();
  const [c] = await db.execute<{ r: number; rv: number; p: number; m: number }>(sql`SELECT (SELECT count(*)::int FROM recipes WHERE status='pending') r, (SELECT count(*)::int FROM reviews WHERE status='pending') rv, (SELECT count(*)::int FROM recipe_photos WHERE status='pending') p, (SELECT count(*)::int FROM contact_messages WHERE NOT handled) m`);
  return (
    <div className="min-h-screen bg-admin-bg text-[15px] text-[#1d2433]" style={{ fontSize: 15 }}>
      <AdminSidebar user={{ name: u.name, role: u.role }} counts={{ "/admin/moderation": c.r + c.rv + c.p, "/admin/messages": c.m }} />
      <div className="lg:pl-[248px]"><div className="mx-auto max-w-[1360px] px-4 pb-16 pt-16 sm:px-8 lg:pt-8">{children}</div></div>
    </div>
  );
}
