import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, ne, desc } from "drizzle-orm";
import { db, articles, users } from "@/db";
import { getUser, isStaffRole } from "@/lib/auth";
import { cardsByIds, savedIdSet } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Img } from "@/components/ui/Img";
import { Avatar } from "@/components/ui/Avatar";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { ShareButton } from "@/components/recipe/ShareButton";
import { ArticleCard, kindLabel } from "@/components/editorial/ArticleCard";
import { articleUrl, cookUrl, formatDate } from "@/lib/utils";
import { followRedirect } from "@/lib/redirects";

type P = { params: Promise<{ slug: string }> };
async function load(slug: string) {
  const [a] = await db.select().from(articles).where(eq(articles.slug, slug)); if (!a) return null;
  const [author] = a.authorId ? await db.select().from(users).where(eq(users.id, a.authorId)) : [null];
  return { ...a, author };
}
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = await load((await params).slug); if (!a) return {};
  return { title: a.seoTitle || a.title, description: a.seoDescription || a.dek || undefined, alternates: { canonical: articleUrl(a) }, openGraph: { type: "article", images: a.heroUrl ? [a.heroUrl] : [] } };
}
export default async function ArticlePage({ params }: P) {
  const { slug } = await params; const a = await load(slug); const user = await getUser();
  if (!a || (a.status !== "published" && !isStaffRole(user?.role))) { await followRedirect(`/article/${slug}/`); notFound(); }
  const [recipesRel, more, saved] = await Promise.all([cardsByIds(a.relatedRecipeIds),
    db.select({ id: articles.id, slug: articles.slug, title: articles.title, dek: articles.dek, heroUrl: articles.heroUrl, kind: articles.kind, publishedAt: articles.publishedAt, authorName: users.name }).from(articles).leftJoin(users, eq(users.id, articles.authorId)).where(and(eq(articles.status, "published"), ne(articles.id, a.id))).orderBy(desc(articles.publishedAt)).limit(3),
    savedIdSet(user?.id)]);
  const hub = a.kind === "news" ? { href: "/news/", label: "News" } : { href: "/kitchen-tips/", label: "Kitchen Tips" };
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.dek, image: a.heroUrl, datePublished: a.publishedAt?.toISOString(), author: a.author ? { "@type": "Person", name: a.author.name } : undefined };
  return (
    <article className="container-site pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-[760px]">
        <Breadcrumbs items={[hub]} />
        <div className="eyebrow">{kindLabel(a.kind)}</div>
        <h1 className="mt-2 text-[34px] font-extrabold leading-[1.1] md:text-[46px]">{a.title}</h1>
        {a.dek && <p className="mt-4 text-[21px] leading-snug text-body">{a.dek}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-rule py-4">
          {a.author && <div className="flex items-center gap-3 text-[15px]"><Avatar name={a.author.name} size={44} /><div>By <Link href={cookUrl(a.author)} className="font-bold text-ink underline underline-offset-2 hover:text-brand">{a.author.name}</Link><div className="text-muted">Published on {formatDate(a.publishedAt)}</div></div></div>}
          <ShareButton title={a.title} url={articleUrl(a)} />
        </div>
        <figure className="mt-6"><Img src={a.heroUrl} alt={a.title} w={1400} eager className="aspect-[3/2] w-full" /></figure>
        <div className="prose-site mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} />
        {a.author && (
          <div className="mt-12 flex gap-4 rounded-lg bg-tint p-5"><Avatar name={a.author.name} size={64} />
            <div><Link href={cookUrl(a.author)} className="text-[19px] font-extrabold text-ink hover:underline">{a.author.name}</Link>{a.author.title && <div className="text-[14px] font-semibold uppercase tracking-[0.06em] text-brand">{a.author.title}</div>}<p className="mt-1 text-[16px]">{a.author.bio}</p></div></div>
        )}
      </div>
      {recipesRel.length > 0 && <section className="mt-16"><h2 className="h-section mb-6 border-b-2 border-ink pb-3">Recipes in This Story</h2><div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">{recipesRel.map((r) => <RecipeCard key={r.id} r={r} saved={saved.has(r.id)} loggedIn={!!user} />)}</div></section>}
      {more.length > 0 && <section className="mt-16"><h2 className="h-section mb-6 border-b-2 border-ink pb-3">Read More</h2><div className="grid gap-6 sm:grid-cols-3">{more.map((m) => <ArticleCard key={m.id} a={m} />)}</div></section>}
    </article>
  );
}
