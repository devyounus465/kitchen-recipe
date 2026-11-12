import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { PageHeader, Card, Table, Badge, ainput, abtnGhost } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, cn } from "@/lib/utils";
export const metadata = { title: "Users & Authors" };
export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const sp = await searchParams;
  const where = sql.join([sql`TRUE`, sp.q ? sql`(u.name ILIKE ${"%" + sp.q + "%"} OR u.email ILIKE ${"%" + sp.q + "%"} OR u.username ILIKE ${"%" + sp.q + "%"})` : sql`TRUE`, sp.role === "staff" ? sql`u.is_staff` : sp.role ? sql`u.role=${sp.role}` : sql`TRUE`], sql` AND `);
  const rows = [...await db.execute<{ id: number; name: string; email: string; username: string; role: string; status: string; is_staff: boolean; created_at: Date; last_login_at: Date | null; recipes: number; reviews: number }>(sql`SELECT u.id, u.name, u.email, u.username, u.role, u.status, u.is_staff, u.created_at, u.last_login_at, (SELECT count(*)::int FROM recipes r WHERE r.author_id=u.id) recipes, (SELECT count(*)::int FROM reviews r WHERE r.user_id=u.id) reviews FROM users u WHERE ${where} ORDER BY u.created_at DESC LIMIT 200`)];
  return (<><PageHeader title="Users & Authors" sub={`${rows.length} accounts`} />
    <form className="mb-4 flex flex-wrap gap-2" action="/admin/users"><input name="q" defaultValue={sp.q} placeholder="Search name, email, username…" className={cn(ainput, "!w-72")} /><select name="role" defaultValue={sp.role || ""} className={cn(ainput, "!w-44")}><option value="">All roles</option><option value="staff">Editorial authors</option><option value="admin">Admins</option><option value="editor">Editors</option><option value="contributor">Contributors</option><option value="user">Members</option></select><button className={abtnGhost}>Filter</button></form>
    <Card pad={false}><Table head={["User", "Role", "Status", "Recipes", "Reviews", "Joined", "Last login"]} empty={!rows.length}>{rows.map((u) => (
      <tr key={u.id} className="hover:bg-[#fafbfc]"><td className="px-4 py-2.5"><Link href={`/admin/users/${u.id}`} className="flex items-center gap-3"><Avatar name={u.name} size={32} /><div><div className="font-semibold hover:text-brand">{u.name} {u.is_staff && <span className="ml-1 rounded bg-brand-light px-1.5 text-[11px] font-bold text-brand">AUTHOR</span>}</div><div className="text-[12px] text-[#8a91a0]">{u.email}</div></div></Link></td>
        <td className="px-4"><Badge s={u.role} /></td><td className="px-4"><Badge s={u.status} /></td><td className="px-4 tabular-nums">{u.recipes}</td><td className="px-4 tabular-nums">{u.reviews}</td><td className="whitespace-nowrap px-4 text-[#6b7385]">{formatDate(u.created_at)}</td><td className="whitespace-nowrap px-4 text-[#6b7385]">{u.last_login_at ? formatDate(u.last_login_at) : "—"}</td></tr>))}</Table></Card></>);
}
