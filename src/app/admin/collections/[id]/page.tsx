import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, collections, collectionRecipes, recipes } from "@/db";
import { saveCollection, deleteCollectionAdmin } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnDanger, Saved } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
export const metadata = { title: "Edit collection" };
export default async function EditCol({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params; const isNew = id === "new";
  const c = isNew ? null : (await db.select().from(collections).where(eq(collections.id, Number(id))))[0]; if (!isNew && !c) notFound();
  const items = c ? await db.select({ id: recipes.id, title: recipes.title }).from(collectionRecipes).innerJoin(recipes, eq(recipes.id, collectionRecipes.recipeId)).where(eq(collectionRecipes.collectionId, c.id)).orderBy(asc(collectionRecipes.position)) : [];
  const all = await db.select({ id: recipes.id, title: recipes.title }).from(recipes).where(eq(recipes.status, "published")).orderBy(asc(recipes.title));
  return (
    <div className="max-w-4xl"><PageHeader crumb={{ href: "/admin/collections", label: "Collections" }} title={c?.name || "New collection"} actions={c && <form action={deleteCollectionAdmin}><input type="hidden" name="id" value={c.id} /><ConfirmButton className={abtnDanger}>Delete</ConfirmButton></form>} />
      <Saved show={!!(await searchParams).saved} />
      <Card><ActionForm action={saveCollection}>{c && <input type="hidden" name="id" value={c.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={alabel}>Name</label><input name="name" defaultValue={c?.name} className={ainput} required /></div><div><label className={alabel}>Slug</label><input name="slug" defaultValue={c?.slug} className={ainput} /></div>
          <div className="sm:col-span-2"><label className={alabel}>Description</label><textarea name="description" rows={2} defaultValue={c?.description || ""} className={ainput} /></div>
          <div className="sm:col-span-2"><label className={alabel}>Cover image URL</label><input name="imageUrl" defaultValue={c?.imageUrl || ""} className={ainput} placeholder="https://… or /media/… (upload in Media Library)" /></div>
          <div className="sm:col-span-2"><label className={alabel}>Recipe IDs in order (comma separated)</label><input name="recipeIds" defaultValue={items.map((i) => i.id).join(", ")} className={ainput} />
            <p className="mt-1 text-[12px] text-[#6b7385]">Current: {items.map((i) => `#${i.id} ${i.title}`).join(" · ") || "none"}</p>
            <details className="mt-2 text-[12px]"><summary className="cursor-pointer font-semibold text-brand">Recipe ID reference</summary><div className="mt-2 grid max-h-48 grid-cols-2 gap-x-4 overflow-y-auto text-[#3b4252]">{all.map((r) => <span key={r.id}>#{r.id} {r.title}</span>)}</div></details></div>
          <div><label className={alabel}>SEO title</label><input name="seoTitle" defaultValue={c?.seoTitle || ""} className={ainput} /></div><div><label className={alabel}>Meta description</label><input name="seoDescription" defaultValue={c?.seoDescription || ""} className={ainput} /></div>
        </div><div className="mt-5"><AdminSubmit /></div></ActionForm></Card></div>
  );
}
