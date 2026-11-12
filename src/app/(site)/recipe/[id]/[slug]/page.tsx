import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql, and } from "drizzle-orm";
import { MessageSquare, Pencil } from "lucide-react";
import { db, recipes, reviews } from "@/db";
import { getRecipe, relatedCards, recipeReviews, ratingHistogram, recipePhotoList, isSaved, savedIdSet } from "@/lib/queries";
import { getUser, isStaffRole } from "@/lib/auth";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Stars } from "@/components/ui/Stars";
import { Img } from "@/components/ui/Img";
import { Avatar } from "@/components/ui/Avatar";
import { SaveButton } from "@/components/recipe/SaveButton";
import { ShareButton } from "@/components/recipe/ShareButton";
import { PrintButton } from "@/components/recipe/PrintButton";
import { Ingredients } from "@/components/recipe/Ingredients";
import { Nutrition } from "@/components/recipe/Nutrition";
import { ReviewForm } from "@/components/recipe/ReviewForm";
import { ReviewList } from "@/components/recipe/ReviewList";
import { PhotoStrip } from "@/components/recipe/PhotoStrip";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { categoryUrl, compact, formatDate, formatMinutes, recipeUrl, cookUrl } from "@/lib/utils";
import { SITE } from "@/lib/site";

type P = { params: Promise<{ id: string; slug: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params; const r = await getRecipe(Number(id));
  if (!r || r.status !== "published") return { title: "Recipe not found" };
  return { title: r.seoTitle || r.title, description: r.seoDescription || r.description, alternates: { canonical: recipeUrl(r) },
    openGraph: { title: r.title, description: r.description, images: r.imageUrl ? [r.imageUrl] : [], type: "article" } };
}

export default async function RecipePage({ params, searchParams }: P) {
  const { id, slug } = await params; const { sort = "helpful" } = await searchParams;
  const rid = Number(id); if (!Number.isInteger(rid)) notFound();
  const [r, user] = await Promise.all([getRecipe(rid), getUser()]);
  const canPreview = r && user && (isStaffRole(user.role) || user.id === r.authorId);
  if (!r || (r.status !== "published" && !canPreview)) notFound();
  if (slug !== r.slug) permanentRedirect(recipeUrl(r));
  if (r.status === "published") await db.update(recipes).set({ viewCount: sql`${recipes.viewCount} + 1` }).where(eq(recipes.id, rid));

  const [related, revs, hist, photos, saved, savedSet, mine] = await Promise.all([
    relatedCards(rid, 8), recipeReviews(rid, sort, user?.id), ratingHistogram(rid), recipePhotoList(rid), isSaved(user?.id, rid), savedIdSet(user?.id),
    user ? db.select().from(reviews).where(and(eq(reviews.recipeId, rid), eq(reviews.userId, user.id))).then((x) => x[0]) : null,
  ]);
  const primary = r.categories.find((c) => c.parentId) || r.categories[0];
  const parent = primary?.parentId ? r.categories.find((c) => c.id === primary.parentId) : null;
  const crumbs = [{ href: "/recipes/", label: "Recipes" }];
  if (primary) crumbs.push({ href: categoryUrl(primary), label: primary.name });
  const path = recipeUrl(r);
  const maxHist = Math.max(1, ...hist.map((h) => h.n));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Recipe", name: r.title, description: r.description, image: r.imageUrl ? [r.imageUrl] : undefined,
    author: r.author ? { "@type": "Person", name: r.author.name } : undefined, datePublished: r.publishedAt?.toISOString(),
    prepTime: `PT${r.prepMin}M`, cookTime: `PT${r.cookMin}M`, totalTime: `PT${r.totalMin}M`, recipeYield: String(r.servings), recipeCuisine: r.cuisine || undefined,
    recipeCategory: primary?.name, recipeIngredient: r.ingredients.map((i) => [i.qty, i.unit, i.item].filter(Boolean).join(" ")),
    recipeInstructions: r.steps.map((s) => ({ "@type": "HowToStep", text: s.text })),
    nutrition: r.nutrition ? { "@type": "NutritionInformation", calories: `${r.nutrition.calories} kcal` } : undefined,
    aggregateRating: r.ratingCount ? { "@type": "AggregateRating", ratingValue: r.ratingAvg.toFixed(1), ratingCount: r.ratingCount } : undefined,
  };
  const canEdit = user && (user.id === r.authorId || isStaffRole(user.role));

  return (
    <article className="container-site pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {r.status !== "published" && <div className="no-print mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] font-semibold text-amber-900">Preview — this recipe is <b>{r.status}</b> and not visible to the public.</div>}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 max-w-[760px]">
          <Breadcrumbs items={parent && primary ? [crumbs[0], { href: categoryUrl(parent), label: parent.name }, crumbs[1]] : crumbs} />
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.015em] md:text-[44px]">{r.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
            {r.ratingCount > 0 ? <><span className="flex items-center gap-1.5 font-bold text-ink"><Stars value={r.ratingAvg} size={18} /> {r.ratingAvg.toFixed(1)} ({compact(r.ratingCount)})</span>
              <span className="text-rule">|</span><a href="#reviews" className="font-semibold text-ink underline underline-offset-2 hover:text-brand">{compact(r.reviewCount)} Reviews</a></> : <a href="#reviews" className="font-semibold text-ink underline">Be the first to rate & review!</a>}
            <span className="text-rule">|</span><a href="#photos" className="font-semibold text-ink underline underline-offset-2 hover:text-brand">{r.photoCount} Photos</a>
          </div>
          <p className="mt-4 text-[19px] leading-relaxed text-body">{r.description}</p>
          {r.author && (
            <div className="mt-5 flex items-center gap-3 text-[15px]">
              <Avatar name={r.author.name} url={r.author.avatarUrl} size={44} />
              <div>
                <div>{r.author.isStaff ? "By" : "Submitted by"} <Link href={cookUrl(r.author)} className="font-bold text-ink underline underline-offset-2 hover:text-brand">{r.author.name}</Link>{r.author.title && <span className="text-muted"> · {r.author.title}</span>}</div>
                <div className="text-muted">{r.updatedAt > (r.publishedAt ?? r.updatedAt) ? `Updated on ${formatDate(r.updatedAt)}` : `Published on ${formatDate(r.publishedAt)}`}</div>
              </div>
            </div>
          )}
          <div className="no-print mt-6 flex flex-wrap gap-2.5 border-y border-rule py-4">
            <SaveButton recipeId={r.id} initial={saved} variant="button" loggedIn={!!user} />
            <a href="#review-form" className="btn h-11 border-2 border-ink px-5 text-[14px] text-ink hover:bg-ink hover:text-white"><MessageSquare className="h-4 w-4" /> Rate</a>
            <PrintButton />
            <ShareButton title={r.title} url={path} />
            {canEdit && <Link href={`/account/recipes/${r.id}/edit`} className="btn h-11 border-2 border-rule px-5 text-[14px] text-ink hover:border-ink"><Pencil className="h-4 w-4" /> Edit</Link>}
          </div>
          <figure className="mt-6"><div className="aspect-[3/2] overflow-hidden bg-tint"><Img src={r.imageUrl} alt={r.title} w={1400} eager className="h-full w-full" /></div>
            {r.author && <figcaption className="mt-1.5 text-[13px] text-muted">Photo by {r.author.name}</figcaption>}</figure>

          {/* details card */}
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-tint p-5 sm:grid-cols-3">
            {([["Prep Time", formatMinutes(r.prepMin)], ["Cook Time", formatMinutes(r.cookMin)], ["Additional Time", formatMinutes(r.additionalMin)], ["Total Time", formatMinutes(r.totalMin)], ["Servings", String(r.servings)], ["Yield", r.yieldText]] as [string, string | null][]).filter(([, v]) => v).map(([l, v]) => (
              <div key={l}><div className="text-[14px] font-bold uppercase tracking-[0.06em] text-ink">{l}:</div><div className="text-[17px]">{v}</div></div>
            ))}
          </div>
          {r.diets.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{r.diets.map((d) => <Link key={d} href={`/search/?diet=${d}`} className="rounded-full border border-rule px-3 py-1 text-[13px] font-bold uppercase tracking-[0.06em] text-ink hover:border-brand hover:text-brand">{d.replace("-", " ")}</Link>)}</div>}

          <Ingredients items={r.ingredients} servings={r.servings} yieldText={r.yieldText} />

          <section id="directions" className="mt-12">
            <h2 className="text-[28px] font-extrabold">Directions</h2>
            <ol className="mt-5 space-y-7">
              {r.steps.map((s, i) => (
                <li key={i}>
                  <h3 className="text-[18px] font-extrabold">Step {i + 1}</h3>
                  <p className="mt-1 text-[18px] leading-relaxed">{s.text}</p>
                  {s.image && <Img src={s.image} alt={`Step ${i + 1}`} w={900} className="mt-3 aspect-[3/2] w-full" />}
                </li>
              ))}
            </ol>
          </section>
          {r.notes && <section className="mt-10 border-l-4 border-brand bg-tint px-5 py-4"><h2 className="text-[20px] font-extrabold">Cook&apos;s Note</h2><p className="mt-1">{r.notes}</p></section>}
          {r.nutrition && <Nutrition n={r.nutrition} servings={r.servings} />}
          <PhotoStrip title={r.title} photos={photos} recipeId={r.id} loggedIn={!!user} path={path} />

          <section id="reviews" className="no-print mt-14 scroll-mt-20">
            <h2 className="text-[28px] font-extrabold">Reviews ({compact(r.reviewCount)})</h2>
            <div className="mt-5 grid gap-8 md:grid-cols-[260px_1fr]">
              <div>
                <div className="flex items-center gap-2"><Stars value={r.ratingAvg} size={22} /><span className="text-[20px] font-extrabold text-ink">{r.ratingAvg.toFixed(1)} out of 5</span></div>
                <p className="mt-1 text-[15px] text-muted">{compact(r.ratingCount)} Ratings</p>
                <ul className="mt-4 space-y-1.5">
                  {hist.map((h) => (
                    <li key={h.stars} className="flex items-center gap-2 text-[14px]"><span className="w-12">{h.stars} star</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-rule"><span className="block h-full rounded-full bg-brand" style={{ width: `${(h.n / maxHist) * 100}%` }} /></span>
                      <span className="w-6 text-right text-muted">{h.n}</span></li>
                  ))}
                </ul>
              </div>
              <ReviewForm recipeId={r.id} loggedIn={!!user} existing={mine ? { rating: mine.rating, body: mine.body } : null} path={path} />
            </div>
            <div className="mt-8"><ReviewList reviews={revs} sort={sort} /></div>
          </section>
        </div>

        <aside className="no-print hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-lg border border-rule p-5">
              <div className="text-[13px] font-bold uppercase tracking-[0.1em] text-brand">Jump to</div>
              <ul className="mt-2 space-y-1.5 text-[16px] font-semibold">
                {[["#ingredients", "Ingredients"], ["#directions", "Directions"], ["#nutrition", "Nutrition Facts"], ["#photos", "Photos"], ["#reviews", "Reviews"]].map(([h, l]) => <li key={h}><a href={h} className="text-ink hover:text-brand hover:underline">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <div className="mb-3 border-b-2 border-ink pb-2 text-[18px] font-extrabold text-ink">Trending Now</div>
              <ul className="space-y-4">{related.slice(4, 8).map((c) => (
                <li key={c.id}><Link href={recipeUrl(c)} className="group flex gap-3"><Img src={c.imageUrl} alt="" w={200} className="h-16 w-20 shrink-0" /><span className="text-[15px] font-bold leading-snug text-ink group-hover:underline">{c.title}</span></Link></li>
              ))}</ul>
            </div>
          </div>
        </aside>
      </div>

      <section className="no-print mt-16">
        <div className="mb-6 border-b-2 border-ink pb-3"><h2 className="h-section">You&apos;ll Also Love</h2></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">{related.slice(0, 8).map((c) => <RecipeCard key={c.id} r={c} saved={savedSet.has(c.id)} loggedIn={!!user} />)}</div>
      </section>
      <p className="print-only mt-6 text-[10pt]">Printed from {SITE.name} · {SITE.url}{path}</p>
    </article>
  );
}
