import { notFound } from "next/navigation";
import { eq, inArray, asc } from "drizzle-orm";
import { db, articles, users } from "@/db";
import { saveArticle, deleteArticle } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnDanger, Saved } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
export const metadata = { title: "Edit article" };
export default async function EditArt({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params; const a = id === "new" ? null : (await db.select().from(articles).where(eq(articles.id, Number(id))))[0]; if (id !== "new" && !a) notFound();
  const authors = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.role, ["admin", "editor"])).orderBy(asc(users.name));
  return (
    <div className="max-w-5xl"><PageHeader crumb={{ href: "/admin/articles", label: "Articles" }} title={a?.title || "New article"} actions={a && <form action={deleteArticle}><input type="hidden" name="id" value={a.id} /><ConfirmButton className={abtnDanger}>Delete</ConfirmButton></form>} />
      <Saved show={!!(await searchParams).saved} />
      <ActionForm action={saveArticle}>{a && <input type="hidden" name="id" value={a.id} />}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card><div className="space-y-4"><div><label className={alabel}>Title</label><input name="title" defaultValue={a?.title} className={ainput + " text-[17px] font-semibold"} required /></div>
            <div><label className={alabel}>Dek / summary</label><textarea name="dek" rows={2} defaultValue={a?.dek || ""} className={ainput} /></div>
            <div><label className={alabel}>Body</label><textarea name="body" rows={20} defaultValue={a?.body} className={ainput + " font-mono text-[13px] leading-relaxed"} /><p className="mt-1 text-[12px] text-[#6b7385]">Formatting: <code>## Heading</code>, <code>**bold**</code>, <code>_italic_</code>, <code>[link](/path)</code>, <code>1.</code> / <code>-</code> lists, <code>&gt; tip</code>.</p></div></div></Card>
          <div className="space-y-6">
            <Card title="Publish"><div className="space-y-3"><div><label className={alabel}>Status</label><select name="status" defaultValue={a?.status || "draft"} className={ainput}><option value="draft">Draft</option><option value="published">Published</option></select></div>
              <div><label className={alabel}>Type</label><select name="kind" defaultValue={a?.kind || "article"} className={ainput}><option value="article">Article</option><option value="guide">Cooking guide</option><option value="news">News</option></select></div>
              <div><label className={alabel}>Author</label><select name="authorId" defaultValue={a?.authorId ?? ""} className={ainput}>{authors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div><AdminSubmit className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white">Save article</AdminSubmit></div></Card>
            <Card title="Hero image"><input name="heroUrl" defaultValue={a?.heroUrl || ""} className={ainput} placeholder="Image URL" /><input name="heroFile" type="file" accept="image/*" className="mt-2 text-[13px]" /></Card>
            <Card title="Related recipes"><input name="relatedRecipeIds" defaultValue={a?.relatedRecipeIds.join(", ")} className={ainput} placeholder="Recipe IDs, e.g. 3, 12" /></Card>
            <Card title="SEO"><div className="space-y-3"><div><label className={alabel}>Slug</label><input name="slug" defaultValue={a?.slug} className={ainput} /></div><div><label className={alabel}>SEO title</label><input name="seoTitle" defaultValue={a?.seoTitle || ""} className={ainput} /></div><div><label className={alabel}>Meta description</label><textarea name="seoDescription" rows={3} defaultValue={a?.seoDescription || ""} className={ainput} /></div></div></Card>
          </div>
        </div>
      </ActionForm>
    </div>
  );
}
