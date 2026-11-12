import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { db, videos, recipes, users } from "@/db";
import { saveVideo, deleteVideo } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnDanger, Saved } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
export const metadata = { title: "Edit video" };
export default async function EditVid({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params; const v = id === "new" ? null : (await db.select().from(videos).where(eq(videos.id, Number(id))))[0]; if (id !== "new" && !v) notFound();
  const [rs, authors] = await Promise.all([db.select({ id: recipes.id, title: recipes.title }).from(recipes).where(eq(recipes.status, "published")).orderBy(asc(recipes.title)), db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.role, ["admin", "editor"]))]);
  return (
    <div className="max-w-3xl"><PageHeader crumb={{ href: "/admin/videos", label: "Videos" }} title={v?.title || "New video"} actions={v && <form action={deleteVideo}><input type="hidden" name="id" value={v.id} /><ConfirmButton className={abtnDanger}>Delete</ConfirmButton></form>} />
      <Saved show={!!(await searchParams).saved} />
      <Card><ActionForm action={saveVideo}>{v && <input type="hidden" name="id" value={v.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={alabel}>Title</label><input name="title" defaultValue={v?.title} className={ainput} required /></div>
          <div className="sm:col-span-2"><label className={alabel}>Description</label><textarea name="description" rows={3} defaultValue={v?.description || ""} className={ainput} /></div>
          <div><label className={alabel}>Video URL (MP4, YouTube or Vimeo)</label><input name="videoUrl" defaultValue={v?.videoUrl || ""} className={ainput} /></div><div><label className={alabel}>…or upload MP4 (≤60MB)</label><input name="videoFile" type="file" accept="video/mp4" className="text-[13px]" /></div>
          <div><label className={alabel}>Thumbnail URL</label><input name="thumbnailUrl" defaultValue={v?.thumbnailUrl || ""} className={ainput} /></div><div><label className={alabel}>…or upload thumbnail</label><input name="thumbFile" type="file" accept="image/*" className="text-[13px]" /></div>
          <div><label className={alabel}>Duration (seconds)</label><input name="durationSec" type="number" defaultValue={v?.durationSec ?? 0} className={ainput} /></div>
          <div><label className={alabel}>Linked recipe</label><select name="recipeId" defaultValue={v?.recipeId ?? ""} className={ainput}><option value="">None</option>{rs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div>
          <div><label className={alabel}>Author</label><select name="authorId" defaultValue={v?.authorId ?? ""} className={ainput}>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label className={alabel}>Status</label><select name="status" defaultValue={v?.status || "draft"} className={ainput}><option value="draft">Draft</option><option value="published">Published</option></select></div>
          <div><label className={alabel}>Slug</label><input name="slug" defaultValue={v?.slug} className={ainput} /></div><div><label className={alabel}>SEO title</label><input name="seoTitle" defaultValue={v?.seoTitle || ""} className={ainput} /></div>
          <div className="sm:col-span-2"><label className={alabel}>Meta description</label><input name="seoDescription" defaultValue={v?.seoDescription || ""} className={ainput} /></div>
        </div><div className="mt-5"><AdminSubmit /></div></ActionForm></Card></div>
  );
}
