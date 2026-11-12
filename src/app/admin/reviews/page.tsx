import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { moderateReview } from "@/lib/actions/admin";
import { PageHeader, Card, Table, Badge, abtnGhost, ainput } from "@/components/admin/ui";
import { formatDate, cn } from "@/lib/utils";
export const metadata = { title: "Ratings & Reviews" };
export default async function Reviews({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; rating?: string; page?: string }> }) {
  const sp = await searchParams; const page = Math.max(1, Number(sp.page) || 1);
  const where = sql.join([sql`TRUE`, sp.q ? sql`(rv.body ILIKE ${"%" + sp.q + "%"} OR r.title ILIKE ${"%" + sp.q + "%"} OR u.name ILIKE ${"%" + sp.q + "%"})` : sql`TRUE`, sp.status ? sql`rv.status=${sp.status}` : sql`TRUE`, sp.rating ? sql`rv.rating=${Number(sp.rating)}` : sql`TRUE`], sql` AND `);
  const rows = [...await db.execute<{ id: number; rating: number; body: string; status: string; helpful_count: number; created_at: Date; name: string; title: string; rid: number; slug: string }>(sql`SELECT rv.id, rv.rating, rv.body, rv.status, rv.helpful_count, rv.created_at, u.name, r.title, r.id rid, r.slug FROM reviews rv JOIN users u ON u.id=rv.user_id JOIN recipes r ON r.id=rv.recipe_id WHERE ${where} ORDER BY rv.created_at DESC LIMIT 50 OFFSET ${(page - 1) * 50}`)];
  const [{ n }] = await db.execute<{ n: number }>(sql`SELECT count(*)::int n FROM reviews rv JOIN users u ON u.id=rv.user_id JOIN recipes r ON r.id=rv.recipe_id WHERE ${where}`);
  return (
    <>
      <PageHeader title="Ratings & Reviews" sub={`${n} reviews`} />
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/reviews"><input name="q" defaultValue={sp.q} placeholder="Search text, recipe or user…" className={cn(ainput, "!w-64")} />
        <select name="status" defaultValue={sp.status || ""} className={cn(ainput, "!w-36")}><option value="">Any status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select>
        <select name="rating" defaultValue={sp.rating || ""} className={cn(ainput, "!w-32")}><option value="">Any rating</option>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}</select><button className={abtnGhost}>Filter</button></form>
      <Card pad={false}>
        <form action={moderateReview}>
          <div className="flex items-center gap-2 border-b border-admin-line px-4 py-2.5"><span className="text-[13px] text-[#6b7385]">Selected:</span><button name="decision" value="approve" className={abtnGhost}>Approve</button><button name="decision" value="reject" className={abtnGhost}>Reject</button><button name="decision" value="delete" className={abtnGhost + " text-red-700"}>Delete</button></div>
          <Table head={["", "Rating", "Review", "Recipe", "User", "Helpful", "Status", "Date"]} empty={!rows.length}>
            {rows.map((r) => <tr key={r.id} className="align-top hover:bg-[#fafbfc]"><td className="px-4 py-3"><input type="checkbox" name="id" value={r.id} className="h-4 w-4 accent-brand" aria-label="Select review" /></td>
              <td className="whitespace-nowrap px-4 py-3 text-brand">{"★".repeat(r.rating)}<span className="text-[#d6d9e0]">{"★".repeat(5 - r.rating)}</span></td><td className="max-w-md px-4 py-3 text-[#3b4252]">{r.body || <i className="text-[#9aa1b0]">Rating only</i>}</td>
              <td className="px-4 py-3"><Link href={`/recipe/${r.rid}/${r.slug}/#reviews`} target="_blank" className="font-medium hover:text-brand">{r.title}</Link></td><td className="whitespace-nowrap px-4 py-3">{r.name}</td><td className="px-4 py-3 tabular-nums">{r.helpful_count}</td><td className="px-4 py-3"><Badge s={r.status} /></td><td className="whitespace-nowrap px-4 py-3 text-[#6b7385]">{formatDate(r.created_at)}</td></tr>)}
          </Table>
        </form>
      </Card>
      {n > 50 && <div className="mt-4 flex gap-2">{page > 1 && <Link className={abtnGhost} href={`/admin/reviews?page=${page - 1}`}>Previous</Link>}{page * 50 < n && <Link className={abtnGhost} href={`/admin/reviews?page=${page + 1}`}>Next</Link>}</div>}
    </>
  );
}
