import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, collections, users } from "@/db";
import { collectionCards, savedIdSet } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CardGrid } from "@/components/recipe/RecipeCard";
import { ShareButton } from "@/components/recipe/ShareButton";
import Link from "next/link";
import { followRedirect } from "@/lib/redirects";

type P = { params: Promise<{ slug: string }> };
async function load(slug: string) {
  const [c] = await db.select({ c: collections, owner: users }).from(collections).leftJoin(users, eq(users.id, collections.userId)).where(and(eq(collections.slug, slug), eq(collections.isPublic, true), or(eq(collections.isEditorial, true), isNull(collections.userId), eq(collections.isPublic, true))));
  return c;
}
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const x = await load((await params).slug); if (!x) return {};
  return { title: x.c.seoTitle || x.c.name, description: x.c.seoDescription || x.c.description || undefined };
}
export default async function CollectionPage({ params }: P) {
  const { slug } = await params; const x = await load(slug);
  if (!x) { await followRedirect(`/collections/${slug}/`); notFound(); }
  const user = await getUser(); const [cards, saved] = await Promise.all([collectionCards(x.c.id), savedIdSet(user?.id)]);
  return (
    <div className="container-site pt-8">
      <Breadcrumbs items={[{ href: "/collections/", label: "Collections" }]} />
      <h1 className="text-[36px] font-extrabold md:text-[48px]">{x.c.name}</h1>
      {x.c.description && <p className="mt-2 max-w-3xl text-[19px]">{x.c.description}</p>}
      <div className="mt-4 flex items-center gap-4 text-[15px] text-muted">{x.owner ? <span>Collection by <Link href={`/cook/${x.owner.username}/`} className="font-bold text-ink underline">{x.owner.name}</Link></span> : <span>Curated by the Simmerly editors</span>}<span>· {cards.length} recipes</span></div>
      <div className="mt-4"><ShareButton title={x.c.name} url={`/collections/${x.c.slug}/`} /></div>
      <div className="mt-10"><CardGrid cards={cards} saved={saved} loggedIn={!!user} /></div>
    </div>
  );
}
