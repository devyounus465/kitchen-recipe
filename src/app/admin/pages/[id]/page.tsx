import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, pages } from "@/db";
import { savePage } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnGhost } from "@/components/admin/ui";
import { ActionForm, AdminSubmit } from "@/components/admin/ActionForm";
export const metadata = { title: "Edit page" };
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const p = id === "new" ? null : (await db.select().from(pages).where(eq(pages.id, Number(id))))[0]; if (id !== "new" && !p) notFound();
  return (<div className="max-w-4xl"><PageHeader crumb={{ href: "/admin/pages", label: "Pages" }} title={p?.title || "New page"} actions={p && <a href={`/${p.slug}/`} target="_blank" className={abtnGhost}>View ↗</a>} />
    <Card><ActionForm action={savePage}>{p && <input type="hidden" name="id" value={p.id} />}<div className="grid gap-4 sm:grid-cols-2">
      <div><label className={alabel}>Title</label><input name="title" defaultValue={p?.title} className={ainput} required /></div><div><label className={alabel}>Slug (URL)</label><input name="slug" defaultValue={p?.slug} className={ainput} /></div>
      <div className="sm:col-span-2"><label className={alabel}>Body (markdown)</label><textarea name="body" rows={18} defaultValue={p?.body} className={ainput + " font-mono text-[13px]"} /></div>
      <div><label className={alabel}>SEO title</label><input name="seoTitle" defaultValue={p?.seoTitle || ""} className={ainput} /></div><div><label className={alabel}>Meta description</label><input name="seoDescription" defaultValue={p?.seoDescription || ""} className={ainput} /></div>
    </div><div className="mt-5"><AdminSubmit /></div></ActionForm></Card></div>);
}
