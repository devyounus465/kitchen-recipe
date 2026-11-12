import Link from "next/link";
import { editorialCollections } from "@/lib/queries";
import { PageHeader, Card, Table, abtnBrand } from "@/components/admin/ui";
import { Img } from "@/components/ui/Img";
export const metadata = { title: "Collections" };
export default async function Cols() {
  const list = await editorialCollections();
  return (<><PageHeader title="Editorial collections" sub="Curated recipe lists shown at /collections and on the homepage." actions={<Link href="/admin/collections/new" className={abtnBrand}>+ New collection</Link>} />
    <Card pad={false}><Table head={["Collection", "Recipes", ""]} empty={!list.length}>{list.map((c) => <tr key={c.id} className="hover:bg-[#fafbfc]"><td className="px-4 py-2.5"><Link href={`/admin/collections/${c.id}`} className="flex items-center gap-3"><Img src={c.imageUrl} alt="" w={120} className="h-10 w-12 rounded-md" /><div><div className="font-semibold hover:text-brand">{c.name}</div><div className="text-[12px] text-[#8a91a0]">/collections/{c.slug}</div></div></Link></td><td className="px-4 tabular-nums">{c.n}</td><td className="px-4 text-right"><Link href={`/collections/${c.slug}/`} target="_blank" className="text-[13px] font-semibold text-[#6b7385] hover:text-brand">View ↗</Link></td></tr>)}</Table></Card></>);
}
