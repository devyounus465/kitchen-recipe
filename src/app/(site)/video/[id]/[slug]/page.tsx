import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { eq, and, ne, desc } from "drizzle-orm";
import { Play } from "lucide-react";
import { db, videos, users } from "@/db";
import { cardsByIds, savedIdSet } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { VideoPlayer } from "@/components/editorial/VideoPlayer";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Img } from "@/components/ui/Img";
import { videoUrl, formatDate, cookUrl } from "@/lib/utils";

type P = { params: Promise<{ id: string; slug: string }> };
async function load(id: string) { const n = Number(id); if (!Number.isInteger(n)) return null; const [v] = await db.select({ v: videos, author: users }).from(videos).leftJoin(users, eq(users.id, videos.authorId)).where(eq(videos.id, n)); return v ?? null; }
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const x = await load((await params).id); if (!x) return {};
  return { title: x.v.seoTitle || x.v.title, description: x.v.seoDescription || x.v.description || undefined, alternates: { canonical: videoUrl(x.v) } };
}
export default async function VideoPage({ params }: P) {
  const { id, slug } = await params; const x = await load(id);
  if (!x || x.v.status !== "published") notFound();
  if (x.v.slug !== slug) permanentRedirect(videoUrl(x.v));
  const user = await getUser();
  const [rec, more, saved] = await Promise.all([x.v.recipeId ? cardsByIds([x.v.recipeId]) : [], db.select().from(videos).where(and(eq(videos.status, "published"), ne(videos.id, x.v.id))).orderBy(desc(videos.publishedAt)).limit(6), savedIdSet(user?.id)]);
  const jsonLd = { "@context": "https://schema.org", "@type": "VideoObject", name: x.v.title, description: x.v.description, thumbnailUrl: x.v.thumbnailUrl, uploadDate: x.v.publishedAt?.toISOString(), duration: `PT${x.v.durationSec}S`, contentUrl: x.v.videoUrl || undefined };
  return (
    <div className="container-site pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={[{ href: "/videos/", label: "Videos" }]} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight md:text-[42px]">{x.v.title}</h1>
          <p className="mt-2 text-[15px] text-muted">{x.author && <>By <Link href={cookUrl(x.author)} className="font-bold text-ink underline">{x.author.name}</Link> · </>}{formatDate(x.v.publishedAt)}</p>
          <div className="mt-5"><VideoPlayer url={x.v.videoUrl} poster={x.v.thumbnailUrl} title={x.v.title} /></div>
          <p className="mt-5 text-[18px] leading-relaxed">{x.v.description}</p>
          {rec[0] && <section className="mt-10"><h2 className="h-section mb-5 border-b-2 border-ink pb-3">Get the Recipe</h2><div className="max-w-sm"><RecipeCard r={rec[0]} saved={saved.has(rec[0].id)} loggedIn={!!user} /></div></section>}
        </div>
        <aside><div className="mb-4 border-b-2 border-ink pb-2 text-[20px] font-extrabold text-ink">Up Next</div>
          <ul className="space-y-4">{more.map((m) => <li key={m.id}><Link href={videoUrl(m)} className="group flex gap-3"><div className="relative h-20 w-32 shrink-0 overflow-hidden"><Img src={m.thumbnailUrl} alt="" w={300} className="h-full w-full" /><Play className="absolute bottom-1 left-1 h-5 w-5 fill-white text-white" /></div><span className="text-[15px] font-bold leading-snug text-ink group-hover:underline">{m.title}</span></Link></li>)}</ul></aside>
      </div>
    </div>
  );
}
