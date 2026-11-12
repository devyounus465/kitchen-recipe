import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, savedRecipes, recipes, collections, collectionRecipes } from "@/db";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountNav";
import { RecipeCard, EmptyState } from "@/components/recipe/RecipeCard";
import { AddToCollection, NewCollectionForm } from "@/components/account/CollectionWidgets";
import { Img } from "@/components/ui/Img";
import { CheckCircle2 } from "lucide-react";
export const metadata = { title: "My Recipes", robots: { index: false } };

export default async function MyRecipes({ searchParams }: { searchParams: Promise<{ tab?: string; welcome?: string; reset?: string }> }) {
  const sp = await searchParams; const u = await requireUser("/account/my-recipes/");
  const tab = sp.tab === "collections" ? "collections" : "saved";
  const cols = await db.select({ id: collections.id, name: collections.name, slug: collections.slug, isPublic: collections.isPublic, n: sql<number>`(SELECT count(*)::int FROM collection_recipes cr WHERE cr.collection_id=${collections.id})`,
    cover: sql<string | null>`(SELECT r.image_url FROM collection_recipes cr JOIN recipes r ON r.id=cr.recipe_id WHERE cr.collection_id=${collections.id} ORDER BY cr.position LIMIT 1)` }).from(collections).where(eq(collections.userId, u.id)).orderBy(desc(collections.createdAt));
  const saved = tab === "saved" ? await db.select({ id: recipes.id, slug: recipes.slug, title: recipes.title, imageUrl: recipes.imageUrl, ratingAvg: recipes.ratingAvg, ratingCount: recipes.ratingCount, totalMin: recipes.totalMin, tag: sql<string | null>`null` })
    .from(savedRecipes).innerJoin(recipes, eq(recipes.id, savedRecipes.recipeId)).where(and(eq(savedRecipes.userId, u.id), eq(recipes.status, "published"))).orderBy(desc(savedRecipes.createdAt)) : [];
  const membership = tab === "saved" && cols.length ? await db.select().from(collectionRecipes).where(sql`${collectionRecipes.collectionId} IN (${sql.join(cols.map((c) => sql`${c.id}`), sql`, `)})`) : [];
  return (
    <AccountShell active={tab} user={u} title="My Recipes">
      {(sp.welcome || sp.reset) && <div role="status" className="mb-6 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800"><CheckCircle2 className="h-5 w-5" />{sp.welcome ? `Welcome to Simmerly, ${u.name.split(" ")[0]}! Tap the heart on any recipe to save it here.` : "Your password has been reset."}</div>}
      <div className="mb-6 flex gap-6 border-b border-rule">
        {[["saved", `Saved (${tab === "saved" ? saved.length : "…"})`, "/account/my-recipes/"], ["collections", `Collections (${cols.length})`, "/account/my-recipes/?tab=collections"]].map(([k, l, h]) => <Link key={k} href={h} className={`-mb-px border-b-[3px] pb-2 text-[16px] font-bold uppercase tracking-[0.05em] ${tab === k ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"}`}>{l}</Link>)}
      </div>
      {tab === "saved" ? (saved.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
          {saved.map((r) => <div key={r.id}><RecipeCard r={r} saved loggedIn showTag={false} /><div className="mt-2"><AddToCollection recipeId={r.id} collections={cols.map((c) => ({ id: c.id, name: c.name, has: membership.some((m) => m.collectionId === c.id && m.recipeId === r.id) }))} /></div></div>)}
        </div>
      ) : <EmptyState title="You haven't saved any recipes yet" body="Tap the heart icon on any recipe to save it to My Recipes." action={<Link href="/recipes/" className="btn-primary">Find recipes</Link>} />) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {cols.length ? <div className="grid grid-cols-2 gap-5 md:grid-cols-3">{cols.map((c) => (
            <Link key={c.id} href={`/account/collections/${c.id}/`} className="group"><div className="aspect-square overflow-hidden rounded-lg bg-tint"><Img src={c.cover} alt="" w={400} className="h-full w-full transition group-hover:scale-105" /></div>
              <div className="mt-2 text-[17px] font-extrabold text-ink group-hover:underline">{c.name}</div><div className="text-[14px] text-muted">{c.n} recipes · {c.isPublic ? "Public" : "Private"}</div></Link>))}</div>
            : <EmptyState title="No collections yet" body="Group your saved recipes into collections like “Holiday Baking” or “Quick Lunches”." />}
          <div className="rounded-lg border border-rule p-5"><h2 className="mb-3 text-[20px] font-extrabold">New Collection</h2><NewCollectionForm /></div>
        </div>
      )}
    </AccountShell>
  );
}
