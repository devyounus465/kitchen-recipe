import Link from "next/link";
import { Img } from "@/components/ui/Img";
import { articleUrl, formatDate } from "@/lib/utils";
export type ArticleRow = { id: number; slug: string; title: string; dek: string | null; heroUrl: string | null; kind: string; publishedAt: Date | null; authorName: string | null };
export const kindLabel = (k: string) => (k === "guide" ? "Cooking Guide" : k === "news" ? "News" : "Article");
export function ArticleCard({ a, wide }: { a: ArticleRow; wide?: boolean }) {
  return (
    <Link href={articleUrl(a)} className={wide ? "group grid gap-5 md:grid-cols-2" : "group block"}>
      <div className="aspect-[3/2] overflow-hidden"><Img src={a.heroUrl} alt={a.title} w={wide ? 1000 : 600} className="h-full w-full transition duration-500 group-hover:scale-105" /></div>
      <div className={wide ? "flex flex-col justify-center" : ""}>
        <div className="eyebrow mt-3 text-[12px]">{kindLabel(a.kind)}</div>
        <h3 className={`mt-1 font-extrabold leading-snug text-ink decoration-brand decoration-2 underline-offset-4 group-hover:underline ${wide ? "text-[30px]" : "text-[19px]"}`}>{a.title}</h3>
        {wide && a.dek && <p className="mt-2 text-[17px] text-body">{a.dek}</p>}
        <p className="mt-2 text-[14px] text-muted">{a.authorName && <>By {a.authorName} · </>}{formatDate(a.publishedAt)}</p>
      </div>
    </Link>
  );
}
export function ArticleHub({ title, intro, list }: { title: string; intro: string; list: ArticleRow[] }) {
  const [lead, ...rest] = list;
  return (
    <div className="container-site pt-10">
      <h1 className="text-[40px] font-extrabold md:text-[48px]">{title}</h1>
      <p className="mt-2 max-w-3xl text-[19px]">{intro}</p>
      {lead ? <div className="mt-10"><ArticleCard a={lead} wide /></div> : <p className="mt-10 text-muted">No articles published yet.</p>}
      {rest.length > 0 && <div className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{rest.map((a) => <ArticleCard key={a.id} a={a} />)}</div>}
    </div>
  );
}
