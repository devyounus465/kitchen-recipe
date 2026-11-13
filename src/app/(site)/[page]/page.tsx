import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, pages, users } from "@/db";
import { renderMarkdown } from "@/lib/markdown";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { followRedirect } from "@/lib/redirects";

type P = { params: Promise<{ page: string }> };
async function load(slug: string) { const [p] = await db.select().from(pages).where(eq(pages.slug, slug)); return p; }
export async function generateMetadata({ params }: P): Promise<Metadata> { const p = await load((await params).page); return p ? { title: p.seoTitle || p.title, description: p.seoDescription || undefined } : {}; }
export default async function CmsPage({ params }: P) {
  const { page } = await params; const p = await load(page);
  if (!p) { await followRedirect(`/${page}/`); notFound(); }
  const editors = p.slug === "about-us" ? await db.select().from(users).where(eq(users.isStaff, true)) : [];
  return (
    <div className="container-site pt-10">
      <div className="mx-auto max-w-[760px]">
        <h1 className="text-[40px] font-extrabold md:text-[48px]">{p.title}</h1>
        <div className="prose-site mt-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
        {editors.length > 0 && (
          <section id="editors" className="mt-12 scroll-mt-24"><h2 className="h-section mb-6">Meet Our Editors</h2>
            <div className="grid gap-6 sm:grid-cols-3">{editors.map((e) => <Link key={e.id} href={`/cook/${e.username}/`} className="group text-center"><Avatar name={e.name} size={96} className="mx-auto" /><div className="mt-3 text-[18px] font-extrabold text-ink group-hover:underline">{e.name}</div><div className="text-[14px] text-muted">{e.title}</div></Link>)}</div></section>
        )}
        <p className="mt-12 text-[14px] text-muted">Last updated {formatDate(p.updatedAt)}</p>
      </div>
    </div>
  );
}
