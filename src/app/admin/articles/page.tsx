import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, articles, users } from "@/db";
import { PageHeader, Card, Table, Badge, abtnBrand } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "Articles" };
export default async function Arts() {
  const list = await db.select({ a: articles, author: users.name }).from(articles).leftJoin(users, eq(users.id, articles.authorId)).orderBy(desc(articles.updatedAt));
  return (<><PageHeader title="Articles, guides & news" actions={<Link href="/admin/articles/new" className={abtnBrand}>+ New article</Link>} />
    <Card pad={false}><Table head={["Title", "Type", "Status", "Author", "Published", ""]} empty={!list.length}>{list.map(({ a, author }) => <tr key={a.id} className="hover:bg-[#fafbfc]"><td className="px-4 py-2.5"><Link href={`/admin/articles/${a.id}`} className="font-semibold hover:text-brand">{a.title}</Link><div className="text-[12px] text-[#8a91a0]">/article/{a.slug}</div></td><td className="px-4 capitalize">{a.kind}</td><td className="px-4"><Badge s={a.status} /></td><td className="px-4">{author}</td><td className="whitespace-nowrap px-4 text-[#6b7385]">{formatDate(a.publishedAt) || "—"}</td><td className="px-4 text-right"><Link href={`/article/${a.slug}/`} target="_blank" className="text-[13px] font-semibold text-[#6b7385] hover:text-brand">View ↗</Link></td></tr>)}</Table></Card></>);
}
