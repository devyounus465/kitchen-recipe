import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { db, categories } from "@/db";
import { saveCategory, deleteCategory } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnGhost } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
import { categoryUrl } from "@/lib/utils";
export const metadata = { title: "Categories" };
type C = typeof categories.$inferSelect;
function Fields({ c, parents }: { c?: C; parents: C[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div><label className={alabel}>Name</label><input name="name" defaultValue={c?.name} className={ainput} required /></div>
      <div><label className={alabel}>URL slug</label><input name="slug" defaultValue={c?.slug} className={ainput} placeholder="auto" /></div>
      <div><label className={alabel}>Parent (nav group)</label><select name="parentId" defaultValue={c?.parentId ?? ""} className={ainput}><option value="">— Top level —</option>{parents.filter((p) => p.id !== c?.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div className="flex gap-3"><div className="flex-1"><label className={alabel}>Sort order</label><input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className={ainput} /></div><label className="mt-6 flex items-center gap-2 text-[13px] font-medium"><input type="checkbox" name="showInNav" defaultChecked={c?.showInNav ?? true} className="accent-brand" />In navigation</label></div>
      <div className="sm:col-span-2"><label className={alabel}>Description</label><textarea name="description" rows={2} defaultValue={c?.description || ""} className={ainput} /></div>
      <div><label className={alabel}>SEO title</label><input name="seoTitle" defaultValue={c?.seoTitle || ""} className={ainput} /></div>
      <div><label className={alabel}>Meta description</label><input name="seoDescription" defaultValue={c?.seoDescription || ""} className={ainput} /></div>
    </div>
  );
}
export default async function Categories() {
  const all = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const counts = new Map((await db.execute<{ id: number; n: number }>(sql`SELECT category_id id, count(*)::int n FROM recipe_categories GROUP BY category_id`)).map((r) => [r.id, r.n]));
  const parents = all.filter((c) => !c.parentId);
  return (
    <>
      <PageHeader title="Categories" sub="Top-level categories become main navigation menus; children appear in their dropdowns." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">{parents.map((p) => (
          <Card key={p.id} title={`${p.name}`} action={<Link href={categoryUrl(p)} target="_blank" className="text-[12px] font-semibold text-brand">View ↗</Link>} pad={false}>
            <ul className="divide-y divide-admin-line">{[p, ...all.filter((c) => c.parentId === p.id)].map((c) => (
              <li key={c.id}><details className="group"><summary className="flex cursor-pointer items-center gap-3 px-5 py-2.5 hover:bg-[#fafbfc]"><span className={c.parentId ? "pl-4 font-medium" : "font-semibold"}>{c.parentId ? "↳ " : ""}{c.name}</span><span className="text-[12px] text-[#8a91a0]">/{c.slug}</span><span className="ml-auto text-[12px] tabular-nums text-[#6b7385]">{counts.get(c.id) ?? 0} recipes</span>{!c.showInNav && <span className="text-[11px] text-[#9aa1b0]">hidden</span>}<span className="text-[12px] font-semibold text-brand group-open:hidden">Edit</span></summary>
                <div className="border-t border-admin-line bg-[#fafbfc] p-5"><ActionForm action={saveCategory}><Fields c={c} parents={parents} /><div className="mt-4 flex gap-2"><AdminSubmit /></div></ActionForm>
                  <form action={deleteCategory} className="mt-2"><input type="hidden" name="id" value={c.id} /><ConfirmButton className={abtnGhost + " text-red-700"} message="Delete this category? Recipes stay, but lose this tag.">Delete category</ConfirmButton></form></div></details></li>
            ))}</ul>
          </Card>
        ))}</div>
        <Card title="Add category" className="self-start"><ActionForm action={saveCategory}><Fields parents={parents} /><div className="mt-4"><AdminSubmit>Create category</AdminSubmit></div></ActionForm></Card>
      </div>
    </>
  );
}
