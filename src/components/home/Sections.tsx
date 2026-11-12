import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { db, categories, collections } from "@/db";
import { and, eq, isNotNull } from "drizzle-orm";
import type { homepageSections } from "@/db";
import { cardsByIds, latestCards, topRatedCards, popularCards, cardsInCategorySlug, articleList, videoList, collectionCards, type Card } from "@/lib/queries";
import { RecipeCard, CardGrid } from "@/components/recipe/RecipeCard";
import { Img } from "@/components/ui/Img";
import { Stars } from "@/components/ui/Stars";
import { Newsletter } from "@/components/layout/Newsletter";
import { articleUrl, categoryUrl, compact, recipeUrl, videoUrl } from "@/lib/utils";

type Section = typeof homepageSections.$inferSelect;
type Ctx = { saved: Set<number>; loggedIn: boolean };

function Heading({ title, href, sub }: { title: string; href?: string; sub?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
      <div><h2 className="h-section">{title}</h2>{sub && <p className="mt-1 text-[16px] text-muted">{sub}</p>}</div>
      {href && <Link href={href} className="hidden shrink-0 items-center gap-1 text-[14px] font-bold uppercase tracking-[0.06em] text-brand hover:underline sm:flex">See all <ChevronRight className="h-4 w-4" /></Link>}
    </div>
  );
}

async function cardsFor(cfg: Section["config"]): Promise<Card[]> {
  const limit = cfg.limit ?? 4;
  if (cfg.recipeIds?.length) return cardsByIds(cfg.recipeIds);
  if (cfg.categorySlug) return cardsInCategorySlug(cfg.categorySlug, limit);
  if (cfg.sort === "rating") return topRatedCards(limit);
  if (cfg.sort === "popular") return popularCards(limit);
  return latestCards(limit);
}

async function Hero({ s }: { s: Section }) {
  const cards = await cardsFor(s.config);
  const [main, ...rest] = cards;
  if (!main) return null;
  return (
    <section className="container-site pt-6 lg:pt-8">
      <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <Link href={recipeUrl(main)} className="group relative block overflow-hidden">
          <div className="aspect-[4/3] w-full lg:aspect-[16/11]"><Img src={main.imageUrl} alt={main.title} w={1400} eager className="h-full w-full transition duration-700 group-hover:scale-[1.03]" /></div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-24 md:p-8 md:pt-32">
            <span className="inline-block bg-brand px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-white">{main.tag || "Featured"}</span>
            <h2 className="mt-3 max-w-xl text-[28px] font-extrabold leading-[1.1] text-white decoration-2 underline-offset-4 group-hover:underline md:text-[40px]">{main.title}</h2>
            {main.ratingCount > 0 && <div className="mt-2 flex items-center gap-2 text-white/90"><Stars value={main.ratingAvg} /> <span className="text-[14px]">{compact(main.ratingCount)} Ratings</span></div>}
          </div>
        </Link>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-1">
          {rest.slice(0, 3).map((r) => (
            <Link key={r.id} href={recipeUrl(r)} className="group flex gap-4 sm:flex-col lg:flex-row">
              <div className="aspect-square w-32 shrink-0 overflow-hidden sm:w-full lg:w-36"><Img src={r.imageUrl} alt={r.title} w={400} className="h-full w-full transition group-hover:scale-105" /></div>
              <div className="flex flex-col justify-center">
                {r.tag && <span className="eyebrow text-[12px]">{r.tag}</span>}
                <h3 className="mt-1 text-[19px] font-extrabold leading-snug text-ink decoration-brand decoration-2 underline-offset-4 group-hover:underline">{r.title}</h3>
                {r.ratingCount > 0 && <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"><Stars value={r.ratingAvg} size={13} />{compact(r.ratingCount)}</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

async function RecipeGrid({ s, ctx, row }: { s: Section; ctx: Ctx; row?: boolean }) {
  const cards = await cardsFor(s.config);
  const href = s.config.categorySlug ? `/search/?category=${s.config.categorySlug}` : s.config.sort === "rating" ? "/search/?sort=rating" : "/search/?sort=newest";
  return (
    <section className="container-site mt-14">
      <Heading title={s.title} href={href} sub={s.config.subtitle} />
      {row ? (
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
          {cards.map((r) => <div key={r.id} className="w-[70%] shrink-0 snap-start sm:w-[42%] md:w-auto"><RecipeCard r={r} saved={ctx.saved.has(r.id)} loggedIn={ctx.loggedIn} /></div>)}
        </div>
      ) : <CardGrid cards={cards} saved={ctx.saved} loggedIn={ctx.loggedIn} />}
    </section>
  );
}

async function CategoryTiles({ s }: { s: Section }) {
  const cats = await db.select().from(categories).where(and(isNotNull(categories.parentId), eq(categories.showInNav, true))).limit(40);
  const covers = await Promise.all(cats.map(async (c) => ({ c, img: (await cardsInCategorySlug(c.slug, 1))[0]?.imageUrl })));
  const pick = covers.filter((x) => x.img).sort((a, b) => a.c.sortOrder - b.c.sortOrder).filter((_, i) => i % 2 === 0).slice(0, s.config.limit ?? 8);
  return (
    <section className="mt-14 bg-tint py-12">
      <div className="container-site">
        <Heading title={s.title} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
          {pick.map(({ c, img }) => (
            <Link key={c.id} href={categoryUrl(c)} className="group flex flex-col items-center text-center">
              <div className="aspect-square w-full overflow-hidden rounded-full border-4 border-white shadow-card md:w-[85%]"><Img src={img} alt={c.name} w={400} className="h-full w-full transition group-hover:scale-110" /></div>
              <span className="mt-3 text-[17px] font-extrabold text-ink decoration-brand decoration-2 underline-offset-4 group-hover:underline">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

async function CollectionFeature({ s, ctx }: { s: Section; ctx: Ctx }) {
  const [col] = await db.select().from(collections).where(eq(collections.slug, s.config.collectionSlug || ""));
  if (!col) return null;
  const cards = (await collectionCards(col.id)).slice(0, s.config.limit ?? 4);
  return (
    <section className="container-site mt-14">
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Link href={`/collections/${col.slug}/`} className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden bg-ink p-6 text-white">
          <Img src={col.imageUrl} alt="" w={800} className="absolute inset-0 h-full w-full opacity-60 transition group-hover:scale-105" />
          <div className="relative">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/85">Collection</span>
            <h2 className="mt-1 text-[32px] font-extrabold leading-tight">{s.title}</h2>
            <p className="mt-2 text-white/85">{s.config.subtitle || col.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-bold uppercase tracking-[0.06em] underline-offset-4 group-hover:underline">View collection <ChevronRight className="h-4 w-4" /></span>
          </div>
        </Link>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:gap-x-6">{cards.map((r) => <RecipeCard key={r.id} r={r} saved={ctx.saved.has(r.id)} loggedIn={ctx.loggedIn} size="sm" />)}</div>
      </div>
    </section>
  );
}

async function ArticleList({ s }: { s: Section }) {
  const list = await articleList(undefined, s.config.limit ?? 4);
  return (
    <section className="container-site mt-14">
      <Heading title={s.title} href="/kitchen-tips/" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((a) => (
          <Link key={a.id} href={articleUrl(a)} className="group">
            <div className="aspect-[3/2] overflow-hidden"><Img src={a.heroUrl} alt={a.title} w={600} className="h-full w-full transition group-hover:scale-105" /></div>
            <div className="eyebrow mt-3 text-[12px]">{a.kind === "guide" ? "Cooking Guide" : a.kind === "news" ? "News" : "Article"}</div>
            <h3 className="mt-1 text-[18px] font-extrabold leading-snug text-ink decoration-brand decoration-2 underline-offset-4 group-hover:underline">{a.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function VideoRow({ s }: { s: Section }) {
  const list = await videoList(s.config.limit ?? 4);
  return (
    <section className="mt-14 bg-ink py-12 text-white">
      <div className="container-site">
        <div className="mb-6 flex items-end justify-between border-b-2 border-white pb-3"><h2 className="text-[26px] font-extrabold text-white md:text-[32px]">{s.title}</h2><Link href="/videos/" className="flex items-center gap-1 text-[14px] font-bold uppercase tracking-[0.06em] hover:underline">All videos <ChevronRight className="h-4 w-4" /></Link></div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {list.map((v) => (
            <Link key={v.id} href={videoUrl(v)} className="group">
              <div className="relative aspect-video overflow-hidden"><Img src={v.thumbnailUrl} alt={v.title} w={600} className="h-full w-full transition group-hover:scale-105" />
                <span className="absolute bottom-2 left-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand"><Play className="h-4 w-4 fill-white text-white" /></span>
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[12px] font-semibold">{Math.floor((v.durationSec ?? 0) / 60)}:{String((v.durationSec ?? 0) % 60).padStart(2, "0")}</span></div>
              <h3 className="mt-2 text-[16px] font-bold leading-snug text-white group-hover:underline">{v.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function RenderSection({ s, ctx }: { s: Section; ctx: Ctx }) {
  switch (s.type) {
    case "hero": return <Hero s={s} />;
    case "recipe_grid": return <RecipeGrid s={s} ctx={ctx} />;
    case "recipe_row": return <RecipeGrid s={s} ctx={ctx} row />;
    case "category_tiles": return <CategoryTiles s={s} />;
    case "collection_feature": return <CollectionFeature s={s} ctx={ctx} />;
    case "article_list": return <ArticleList s={s} />;
    case "video_row": return <VideoRow s={s} />;
    case "newsletter": return <section className="container-site mt-14"><div className="rounded-lg border-2 border-ink bg-brand-light px-6 py-8 md:px-12"><Newsletter title={s.title} subtitle={s.config.subtitle} /></div></section>;
    default: return null;
  }
}
