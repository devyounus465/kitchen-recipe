import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, videos } from "@/db";
import { PageHeader, Card, Table, Badge, abtnBrand } from "@/components/admin/ui";
import { Img } from "@/components/ui/Img";
export const metadata = { title: "Videos" };
export default async function Vids() {
  const list = await db.select().from(videos).orderBy(desc(videos.id));
  return (<><PageHeader title="Videos" actions={<Link href="/admin/videos/new" className={abtnBrand}>+ New video</Link>} />
    <Card pad={false}><Table head={["Video", "Source", "Status", ""]} empty={!list.length}>{list.map((v) => <tr key={v.id} className="hover:bg-[#fafbfc]"><td className="px-4 py-2.5"><Link href={`/admin/videos/${v.id}`} className="flex items-center gap-3"><Img src={v.thumbnailUrl} alt="" w={160} className="h-10 w-16 rounded-md" /><span className="font-semibold hover:text-brand">{v.title}</span></Link></td><td className="px-4 text-[13px] text-[#6b7385]">{v.videoUrl ? (v.videoUrl.startsWith("/media") ? "Uploaded MP4" : "External link") : <span className="text-amber-700">No file yet</span>}</td><td className="px-4"><Badge s={v.status} /></td><td className="px-4 text-right"><Link href={`/video/${v.id}/${v.slug}/`} target="_blank" className="text-[13px] font-semibold text-[#6b7385] hover:text-brand">View ↗</Link></td></tr>)}</Table></Card></>);
}
