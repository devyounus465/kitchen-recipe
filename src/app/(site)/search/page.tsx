import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { asc, isNotNull } from "drizzle-orm";
import { db, categories } from "@/db";
import { searchRecipes, savedIdSet } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { CardGrid, EmptyState } from "@/components/recipe/RecipeCard";
import { Filters, SortSelect } from "@/components/search/Filters";
import { Pagination } from "@/components/ui/Pagination";
import { DIETS } from "@/lib/site";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const q = one((await searchParams).q); return { title: q ? `${q} recipes – search results` : "Search recipes", robots: { index: false } };
}
export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const diets = ([] as string[]).concat(sp.diet || []);
  const params = { q: one(sp.q), ingredient: one(sp.ingredient), exclude: one(sp.exclude), maxTime: Number(one(sp.maxTime)) || undefined, diets, category: one(sp.category), sort: one(sp.sort) || "relevance", page: Number(one(sp.page)) || 1 };
  const [res, user, cats] = await Promise.all([searchRecipes(params), getUser(), db.select({ slug: categories.slug, name: categories.name }).from(categories).where(isNotNull(categories.parentId)).orderBy(asc(categories.name))]);
  const saved = await savedIdSet(user?.id);
  const qs = (patch: Record<string, string | null>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries(sp)) ([] as string[]).concat(v || []).forEach((x) => u.append(k, x)); for (const [k, v] of Object.entries(patch)) { u.delete(k); if (v) u.set(k, v); } return `/search/?${u}`; };
  const chips: [string, string][] = [];
  if (params.ingredient) chips.push([`With: ${params.ingredient}`, qs({ ingredient: null })]);
  if (params.exclude) chips.push([`Without: ${params.exclude}`, qs({ exclude: null })]);
  if (params.maxTime) chips.push([`≤ ${params.maxTime} min`, qs({ maxTime: null })]);
  if (params.category) chips.push([cats.find((c) => c.slug === params.category)?.name || params.category, qs({ category: null })]);
  diets.forEach((d) => { const u = new URLSearchParams(qs({})); const rest = u.getAll("diet").filter((x) => x !== d); u.delete("diet"); rest.forEach((x) => u.append("diet", x)); chips.push([DIETS.find(([v]) => v === d)?.[1] || d, `/search/?${u}`]); });
  return (
    <div className="container-site pt-8">
      <form action="/search/" className="mx-auto mb-8 flex max-w-2xl overflow-hidden rounded-full border-2 border-ink">
        <label htmlFor="sq" className="sr-only">Search</label>
        <input id="sq" name="q" defaultValue={params.q} placeholder="Find a recipe or ingredient" className="h-12 flex-1 px-5 text-[17px] focus:outline-none" />
        <button className="bg-brand px-6 text-[14px] font-bold uppercase tracking-[0.06em] text-white hover:bg-brand-dark">Search</button>
      </form>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
        <h1 className="text-[28px] font-extrabold md:text-[36px]">{params.q ? <>Results for &ldquo;{params.q}&rdquo;</> : "All Recipes"} <span className="block text-[16px] font-semibold text-muted md:inline">{res.total.toLocaleString()} result{res.total === 1 ? "" : "s"}</span></h1>
        <div className="flex items-center gap-3"><Suspense><Filters categories={cats} mode="mobile" /></Suspense><Suspense><SortSelect value={params.sort} /></Suspense></div>
      </div>
      {chips.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{chips.map(([l, h]) => <Link key={l} href={h} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[14px] font-semibold text-white hover:bg-brand">{l}<X className="h-3.5 w-3.5" /></Link>)}</div>}
      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block"><Suspense><Filters categories={cats} mode="desktop" /></Suspense></div>
        <div>
          <h2 className="sr-only">Search results</h2>
          {res.rows.length ? <CardGrid cards={res.rows} saved={saved} loggedIn={!!user} cols={3} /> :
            <EmptyState title="We couldn't find any matches" body="Check your spelling, try fewer filters, or search for an ingredient instead." action={<Link href="/search/" className="btn-primary">Browse all recipes</Link>} />}
          <Pagination page={res.page} pages={res.pages} href={(p) => qs({ page: String(p) })} />
        </div>
      </div>
    </div>
  );
}
