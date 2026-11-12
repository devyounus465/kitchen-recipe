import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, desc } from "drizzle-orm";
import { MapPin, CalendarDays } from "lucide-react";
import { db, users, recipes, reviews, articles, collections } from "@/db";
import { savedIdSet } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { CardGrid } from "@/components/recipe/RecipeCard";
import { ArticleCard } from "@/components/editorial/ArticleCard";
import { recipeUrl, formatDate } from "@/lib/utils";
import { sql } from "drizzle-orm";

type P = { params: Promise<{ username: string }> };
async function load(u: string) { const [x] = await db.select().from(users).where(eq(users.username, decodeURIComponent(u))); return x?.status === "active" ? x : null; }
export async function generateMetadata({ params }: P): Promise<Metadata> { const u = await load((await params).username); return u ? { title: `${u.name}'s Profile`, description: u.bio || undefined } : {}; }

export default async function CookProfile({ params }: P) {
  const u = await load((await params).username); if (!u) notFound();
  const viewer = await getUser();
  const [mine, revs, arts, cols, saved] = await Promise.all([
    db.select({ id: recipes.id, slug: recipes.slug, title: recipes.title, imageUrl: recipes.imageUrl, ratingAvg: recipes.ratingAvg, ratingCount: recipes.ratingCount, totalMin: recipes.totalMin, tag: sql<string | null>`null` }).from(recipes).where(and(eq(recipes.authorId, u.id), eq(recipes.status, "published"))).orderBy(desc(recipes.publishedAt)),
    db.select({ id: reviews.id, rating: reviews.rating, body: reviews.body, createdAt: reviews.createdAt, rid: recipes.id, rslug: recipes.slug, rtitle: recipes.title }).from(reviews).innerJoin(recipes, eq(recipes.id, reviews.recipeId)).where(and(eq(reviews.userId, u.id), eq(reviews.status, "approved"))).orderBy(desc(reviews.createdAt)).limit(10),
    db.select({ id: articles.id, slug: articles.slug, title: articles.title, dek: articles.dek, heroUrl: articles.heroUrl, kind: articles.kind, publishedAt: articles.publishedAt, authorName: sql<string>`${u.name}` }).from(articles).where(and(eq(articles.authorId, u.id), eq(articles.status, "published"))).orderBy(desc(articles.publishedAt)),
    db.select().from(collections).where(and(eq(collections.userId, u.id), eq(collections.isPublic, true))),
    savedIdSet(viewer?.id),
  ]);
  return (
    <div className="container-site pt-10">
      <div className="flex flex-col items-start gap-6 border-b-2 border-ink pb-8 sm:flex-row sm:items-center">
        <Avatar name={u.name} url={u.avatarUrl} size={112} />
        <div className="flex-1">
          {u.isStaff && <div className="eyebrow">{u.title || "Simmerly Editor"}</div>}
          <h1 className="text-[36px] font-extrabold md:text-[44px]">{u.name}</h1>
          <div className="mt-1 flex flex-wrap gap-4 text-[15px] text-muted"><span>@{u.username}</span>{u.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{u.location}</span>}<span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />Member since {formatDate(u.createdAt)}</span></div>
          {u.bio && <p className="mt-3 max-w-2xl text-[17px]">{u.bio}</p>}
        </div>
        <dl className="flex gap-8 text-center">{[["Recipes", mine.length], ["Reviews", revs.length], ["Articles", arts.length]].map(([l, n]) => <div key={l as string}><dt className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">{l}</dt><dd className="text-[28px] font-extrabold text-ink">{n}</dd></div>)}</dl>
        {viewer?.id === u.id && <Link href="/account/settings/" className="btn-outline h-10 text-[13px]">Edit Profile</Link>}
      </div>
      {mine.length > 0 && <section className="mt-12"><h2 className="h-section mb-6">{u.isStaff ? "Recipes" : "Submitted Recipes"}</h2><CardGrid cards={mine} saved={saved} loggedIn={!!viewer} /></section>}
      {arts.length > 0 && <section className="mt-12"><h2 className="h-section mb-6">Articles</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div></section>}
      {cols.length > 0 && <section className="mt-12"><h2 className="h-section mb-6">Public Collections</h2><ul className="flex flex-wrap gap-3">{cols.map((c) => <li key={c.id}><Link href={`/collections/${c.slug}/`} className="btn-ghost">{c.name}</Link></li>)}</ul></section>}
      <section className="mt-12"><h2 className="h-section mb-4">Recent Reviews</h2>
        {revs.length ? <ul className="divide-y divide-rule">{revs.map((r) => <li key={r.id} className="py-5"><Link href={recipeUrl({ id: r.rid, slug: r.rslug })} className="text-[18px] font-extrabold text-ink hover:text-brand hover:underline">{r.rtitle}</Link><div className="mt-1 flex items-center gap-2 text-[14px] text-muted"><Stars value={r.rating} size={14} />{formatDate(r.createdAt)}</div>{r.body && <p className="mt-2">{r.body}</p>}</li>)}</ul> : <p className="text-muted">No reviews yet.</p>}
      </section>
    </div>
  );
}
