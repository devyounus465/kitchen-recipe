import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { recipeBulk } from "@/lib/actions/admin";
import { PageHeader, Card, Badge, Table, abtnBrand, abtnGhost, ainput, Saved } from "@/components/admin/ui";
import { Img } from "@/components/ui/Img";
import { formatDate, cn } from "@/lib/utils";
export const metadata = { title: "Recipes" };
const PER = 25;
export default async function AdminRecipes({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; sort?: string; deleted?: string }> }) {
  const sp = await searchParams; const page = Math.max(1, Number(sp.page) || 1);
  const where = sql.join([sql`TRUE`, sp.q ? sql`(r.title ILIKE ${"%" + sp.q + "%"} OR r.id::text = ${sp.q})` : sql`TRUE`, sp.status ? sql`r.status = ${sp.status}` : sql`TRUE`], sql` AND `);
  const order = sp.sort === "rating" ? sql`r.rating_avg DESC` : sp.sort === "views" ? sql`r.view_count DESC` : sp.sort === "saves" ? sql`r.save_count DESC` : sp.sort === "title" ? sql`r.title ASC` : sql`r.updated_at DESC`;
  const rows = [...await db.execute<{ id: number; title: string; slug: string; status: string; image_url: string; rating_avg: number; rating_count: number; view_count: number; save_count: number; updated_at: Date; author: string }>(sql`SELECT r.id, r.title, r.slug, r.status, r.image_url, r.rating_avg, r.rating_count, r.view_count, r.save_count, r.updated_at, u.name author FROM recipes r LEFT JOIN users u ON u.id=r.author_id WHERE ${where} ORDER BY ${order} LIMIT ${PER} OFFSET ${(page - 1) * PER}`)];
  const [{ n }] = await db.execute<{ n: number }>(sql`SELECT count(*)::int n FROM recipes r WHERE ${where}`);
  const counts = [...await db.execute<{ status: string; n: number }>(sql`SELECT status, count(*)::int n FROM recipes GROUP BY status`)];
  const qs = (p: Record<string, string | undefined>) => "/admin/recipes?" + new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, sort: sp.sort, ...p }).filter(([, v]) => v) as [string, string][]);
  const pages = Math.ceil(n / PER);
  return (
    <>
      <PageHeader title="Recipes" sub={`${n} recipes`} actions={<Link href="/admin/recipes/new" className={abtnBrand}>+ New recipe</Link>} />
      <Saved show={!!sp.deleted} text="Recipe deleted." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[["", "All"], ["published", "Published"], ["pending", "Pending"], ["draft", "Drafts"], ["rejected", "Rejected"]].map(([v, l]) => <Link key={v} href={qs({ status: v || undefined, page: undefined })} className={cn("rounded-full px-3 py-1.5 text-[13px] font-semibold", (sp.status || "") === v ? "bg-[#0f1115] text-white" : "bg-white text-[#3b4252] ring-1 ring-admin-line hover:bg-[#f3f4f7]")}>{l} <span className="opacity-60">{v ? counts.find((c) => c.status === v)?.n ?? 0 : counts.reduce((a, c) => a + c.n, 0)}</span></Link>)}
        <form className="ml-auto flex gap-2" action="/admin/recipes">{sp.status && <input type="hidden" name="status" value={sp.status} />}<input name="q" defaultValue={sp.q} placeholder="Search title or ID…" className={cn(ainput, "!w-56")} />
          <select name="sort" defaultValue={sp.sort || ""} className={cn(ainput, "!w-36")}><option value="">Last updated</option><option value="title">Title A–Z</option><option value="rating">Rating</option><option value="views">Views</option><option value="saves">Saves</option></select><button className={abtnGhost}>Apply</button></form>
      </div>
      <Card pad={false}>
        <form action={recipeBulk}>
          <div className="flex items-center gap-2 border-b border-admin-line px-4 py-2.5"><span className="text-[13px] text-[#6b7385]">Bulk action:</span><select name="bulk" className={cn(ainput, "!w-40 py-1.5")}><option value="published">Publish</option><option value="draft">Move to draft</option><option value="pending">Mark pending</option><option value="delete">Delete</option></select><button className={abtnGhost}>Apply to selected</button></div>
          <Table head={["", "Recipe", "Status", "Author", "Rating", "Views", "Saves", "Updated", ""]} empty={!rows.length}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#fafbfc]">
                <td className="w-8 px-4"><input type="checkbox" name="id" value={r.id} aria-label={`Select ${r.title}`} className="h-4 w-4 accent-brand" /></td>
                <td className="px-4 py-2.5"><Link href={`/admin/recipes/${r.id}`} className="flex items-center gap-3"><Img src={r.image_url} alt="" w={120} className="h-10 w-12 shrink-0 rounded-md" /><div className="min-w-0"><div className="truncate font-semibold text-[#0f1115] hover:text-brand">{r.title}</div><div className="text-[12px] text-[#8a91a0]">#{r.id} · /{r.slug}</div></div></Link></td>
                <td className="px-4"><Badge s={r.status} /></td><td className="whitespace-nowrap px-4 text-[#3b4252]">{r.author || "—"}</td>
                <td className="whitespace-nowrap px-4 tabular-nums">★ {r.rating_avg.toFixed(1)} <span className="text-[#8a91a0]">({r.rating_count})</span></td>
                <td className="px-4 tabular-nums">{r.view_count.toLocaleString()}</td><td className="px-4 tabular-nums">{r.save_count}</td>
                <td className="whitespace-nowrap px-4 text-[#6b7385]">{formatDate(r.updated_at)}</td>
                <td className="whitespace-nowrap px-4 text-right"><Link href={`/recipe/${r.id}/${r.slug}/`} target="_blank" className="text-[13px] font-semibold text-[#6b7385] hover:text-brand">View ↗</Link></td>
              </tr>
            ))}
          </Table>
        </form>
      </Card>
      {pages > 1 && <div className="mt-4 flex items-center justify-between text-[13px] text-[#6b7385]"><span>Page {page} of {pages}</span><div className="flex gap-2">{page > 1 && <Link className={abtnGhost} href={qs({ page: String(page - 1) })}>Previous</Link>}{page < pages && <Link className={abtnGhost} href={qs({ page: String(page + 1) })}>Next</Link>}</div></div>}
    </>
  );
}
