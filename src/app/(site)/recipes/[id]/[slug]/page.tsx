import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db, categories } from "@/db";
import { cardsInCategory, savedIdSet, cardsInCategorySlug } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CardGrid, RecipeCard } from "@/components/recipe/RecipeCard";
import { Pagination } from "@/components/ui/Pagination";
import { Img } from "@/components/ui/Img";
import { categoryUrl } from "@/lib/utils";

type P = { params: Promise<{ id: string; slug: string }>; searchParams: Promise<{ page?: string; sort?: string }> };
async function load(id: string) { const n = Number(id); if (!Number.isInteger(n)) return null; const [c] = await db.select().from(categories).where(eq(categories.id, n)); return c ?? null; }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await load((await params).id); if (!c) return {};
  return { title: c.seoTitle || `${c.name} Recipes`, description: c.seoDescription || c.description || undefined, alternates: { canonical: categoryUrl(c) } };
}

export default async function CategoryPage({ params, searchParams }: P) {
  const { id, slug } = await params; const sp = await searchParams;
  const c = await load(id); if (!c) notFound();
  if (c.slug !== slug) permanentRedirect(categoryUrl(c));
  const page = Math.max(1, Number(sp.page) || 1); const sort = sp.sort === "latest" ? "latest" : "rating";
  const [user, parent, kids] = await Promise.all([getUser(), c.parentId ? db.select().from(categories).where(eq(categories.id, c.parentId)).then((x) => x[0]) : null, db.select().from(categories).where(eq(categories.parentId, c.id)).orderBy(asc(categories.sortOrder))]);
  const siblings = parent ? await db.select().from(categories).where(eq(categories.parentId, parent.id)).orderBy(asc(categories.sortOrder)) : [];
  const { rows, total } = await cardsInCategory(c.id, 24, (page - 1) * 24, sort);
  const saved = await savedIdSet(user?.id);
  const featured = page === 1 && sort === "rating" ? rows.slice(0, 3) : [];
  const rest = featured.length ? rows.slice(3) : rows;
  const kidCovers = await Promise.all(kids.map(async (k) => ({ k, img: (await cardsInCategorySlug(k.slug, 1))[0]?.imageUrl })));
  const chips = kids.length ? kids : siblings;
  return (
    <div className="container-site pt-6 md:pt-10">
      <Breadcrumbs items={[{ href: "/recipes/", label: "Recipes" }, ...(parent ? [{ href: categoryUrl(parent), label: parent.name }] : [])]} />
      <h1 className="text-[36px] font-extrabold leading-tight md:text-[48px]">{c.name} Recipes</h1>
      {c.description && <p className="mt-3 max-w-3xl text-[19px] text-body">{c.description}</p>}
      {chips.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {chips.map((k) => <Link key={k.id} href={categoryUrl(k)} aria-current={k.id === c.id ? "page" : undefined} className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-[14px] font-bold uppercase tracking-[0.05em] transition ${k.id === c.id ? "border-ink bg-ink text-white" : "border-rule text-ink hover:border-ink"}`}>{k.name}</Link>)}
        </div>
      )}
      {featured.length > 0 && (
        <section className="mt-10 grid gap-6 md:grid-cols-[2fr_1fr]">
          <RecipeCard r={featured[0]} size="lg" saved={saved.has(featured[0].id)} loggedIn={!!user} />
          <div className="grid gap-6">{featured.slice(1).map((r) => <RecipeCard key={r.id} r={r} size="sm" saved={saved.has(r.id)} loggedIn={!!user} />)}</div>
        </section>
      )}
      {kids.length > 0 && page === 1 && (
        <section className="mt-14">
          <h2 className="h-section mb-6 border-b-2 border-ink pb-3">Explore {c.name}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {kidCovers.map(({ k, img }) => <Link key={k.id} href={categoryUrl(k)} className="group text-center"><div className="aspect-square overflow-hidden rounded-full"><Img src={img} alt="" w={300} className="h-full w-full transition group-hover:scale-110" /></div><div className="mt-2 font-extrabold text-ink group-hover:underline">{k.name}</div></Link>)}
          </div>
        </section>
      )}
      <section className="mt-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
          <h2 className="h-section">All {c.name} <span className="text-[18px] font-semibold text-muted">({total})</span></h2>
          <div className="flex gap-2 text-[14px] font-bold uppercase tracking-[0.05em]">
            <Link href={`${categoryUrl(c)}?sort=rating`} className={sort === "rating" ? "text-brand underline underline-offset-4" : "text-ink hover:text-brand"}>Top Rated</Link><span className="text-rule">|</span>
            <Link href={`${categoryUrl(c)}?sort=latest`} className={sort === "latest" ? "text-brand underline underline-offset-4" : "text-ink hover:text-brand"}>Newest</Link>
          </div>
        </div>
        <CardGrid cards={rest.length ? rest : rows} saved={saved} loggedIn={!!user} />
        <Pagination page={page} pages={Math.ceil(total / 24)} href={(p) => `${categoryUrl(c)}?page=${p}&sort=${sort}`} />
      </section>
    </div>
  );
}
