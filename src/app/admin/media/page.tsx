import { desc } from "drizzle-orm";
import { db, media } from "@/db";
import { uploadMedia, deleteMedia } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
import { CopyUrl } from "./CopyUrl";
export const metadata = { title: "Media Library" };
export default async function Media() {
  const list = await db.select().from(media).orderBy(desc(media.createdAt)).limit(200);
  return (<><PageHeader title="Media Library" sub="Upload images and videos, then paste their URL into any recipe, article, collection or video." />
    <Card title="Upload"><ActionForm action={uploadMedia} className="flex flex-wrap items-end gap-4"><div><label className={alabel}>Files (JPG, PNG, WebP, GIF ≤4MB · MP4 ≤60MB)</label><input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" className="text-[13px]" required /></div><div className="min-w-[220px] flex-1"><label className={alabel}>Alt text</label><input name="alt" className={ainput} placeholder="Describe the image" /></div><AdminSubmit>Upload</AdminSubmit></ActionForm></Card>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {list.length === 0 && <p className="col-span-full py-10 text-center text-[14px] text-[#6b7385]">No uploads yet.</p>}
      {list.map((m) => (
        <div key={m.id} className="overflow-hidden rounded-xl border border-admin-line bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {m.mime.startsWith("image/") ? <img src={m.url} alt={m.alt || ""} className="aspect-square w-full object-cover" /> : <video src={m.url} className="aspect-square w-full bg-black object-cover" />}
          <div className="p-2.5 text-[12px]"><div className="truncate font-semibold" title={m.filename}>{m.filename}</div><div className="text-[#8a91a0]">{(m.size / 1024).toFixed(0)} KB</div>
            <div className="mt-2 flex items-center justify-between"><CopyUrl url={m.url} /><form action={deleteMedia}><input type="hidden" name="id" value={m.id} /><ConfirmButton className="text-[12px] font-semibold text-red-700 hover:underline">Delete</ConfirmButton></form></div></div>
        </div>))}
    </div></>);
}
