import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, pages } from "@/db";
import { PageHeader, Card, Table, abtnBrand } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "Pages & SEO" };
export default async function Pages() {
  const list = await db.select().from(pages).orderBy(asc(pages.title));
  return (<><PageHeader title="Pages & SEO" sub="Static pages (About, Privacy, Terms…). Recipe, category, article and video SEO fields live on each item's edit screen." actions={<Link href="/admin/pages/new" className={abtnBrand}>+ New page</Link>} />
    <Card pad={false}><Table head={["Page", "URL", "SEO title", "Updated"]}>{list.map((p) => <tr key={p.id} className="hover:bg-[#fafbfc]"><td className="px-4 py-2.5"><Link href={`/admin/pages/${p.id}`} className="font-semibold hover:text-brand">{p.title}</Link></td><td className="px-4 text-[#6b7385]">/{p.slug}/</td><td className="px-4 text-[#6b7385]">{p.seoTitle || <i>Default</i>}</td><td className="px-4 text-[#6b7385]">{formatDate(p.updatedAt)}</td></tr>)}</Table></Card></>);
}
