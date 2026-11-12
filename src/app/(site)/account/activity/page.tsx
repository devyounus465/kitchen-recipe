import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { db, recipes, reviews, recipePhotos } from "@/db";
import { requireUser } from "@/lib/auth";
import { deleteOwnRecipe } from "@/lib/actions/account";
import { AccountShell } from "@/components/account/AccountNav";
import { Stars } from "@/components/ui/Stars";
import { Img } from "@/components/ui/Img";
import { formatDate, recipeUrl, cn } from "@/lib/utils";
export const metadata = { title: "My Activity", robots: { index: false } };
const badge = (s: string) => <span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-[0.05em]", s === "published" || s === "approved" ? "bg-green-100 text-green-800" : s === "pending" ? "bg-amber-100 text-amber-800" : s === "rejected" ? "bg-red-100 text-red-800" : "bg-tint text-muted")}>{s === "pending" ? "In review" : s}</span>;
export default async function Activity({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const u = await requireUser("/account/activity/"); const sp = await searchParams;
  const [subs, revs, photos] = await Promise.all([
    db.select().from(recipes).where(eq(recipes.authorId, u.id)).orderBy(desc(recipes.updatedAt)),
    db.select({ r: reviews, title: recipes.title, slug: recipes.slug }).from(reviews).innerJoin(recipes, eq(recipes.id, reviews.recipeId)).where(eq(reviews.userId, u.id)).orderBy(desc(reviews.createdAt)),
    db.select({ p: recipePhotos, title: recipes.title, slug: recipes.slug }).from(recipePhotos).innerJoin(recipes, eq(recipes.id, recipePhotos.recipeId)).where(eq(recipePhotos.userId, u.id)).orderBy(desc(recipePhotos.createdAt)),
  ]);
  return (
    <AccountShell active="activity" user={u} title="My Activity">
      {sp.submitted && <div role="status" className="mb-6 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800"><CheckCircle2 className="h-5 w-5" />{sp.submitted === "draft" ? "Draft saved." : sp.submitted === "published" ? "Recipe published." : "Thanks! Your recipe was submitted and is waiting for review by our editors."}</div>}
      <div className="mb-8 grid grid-cols-3 gap-4">{[["Recipes", subs.length], ["Reviews", revs.length], ["Photos", photos.length]].map(([l, n]) => <div key={l as string} className="rounded-lg bg-tint p-4 text-center"><div className="text-[30px] font-extrabold text-ink">{n}</div><div className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">{l}</div></div>)}</div>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-[22px] font-extrabold">My Recipe Submissions</h2><Link href="/account/submit-recipe/" className="btn-primary h-10 text-[13px]">Submit a Recipe</Link></div>
        {subs.length ? <ul className="divide-y divide-rule rounded-lg border border-rule">{subs.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-4 p-4"><Img src={r.imageUrl} alt="" w={200} className="h-16 w-20 rounded" />
            <div className="min-w-0 flex-1"><Link href={recipeUrl(r)} className="font-bold text-ink hover:underline">{r.title}</Link><div className="mt-1 flex items-center gap-2 text-[14px] text-muted">{badge(r.status)} Updated {formatDate(r.updatedAt)}</div>{r.status === "rejected" && r.rejectReason && <p className="mt-1 text-[14px] text-red-700">Editor note: {r.rejectReason}</p>}</div>
            <div className="flex gap-3 text-[14px] font-bold"><Link href={`/account/recipes/${r.id}/edit/`} className="text-brand hover:underline">Edit</Link>{r.status !== "published" && <form action={deleteOwnRecipe}><input type="hidden" name="id" value={r.id} /><button className="text-red-700 hover:underline">Delete</button></form>}</div></li>))}</ul>
          : <p className="text-muted">You haven&apos;t submitted any recipes yet.</p>}</section>
      <section className="mt-10"><h2 className="mb-3 text-[22px] font-extrabold">My Reviews</h2>
        {revs.length ? <ul className="divide-y divide-rule">{revs.map(({ r, title, slug }) => <li key={r.id} className="py-4"><div className="flex flex-wrap items-center gap-2"><Link href={recipeUrl({ id: r.recipeId, slug })} className="font-bold text-ink hover:underline">{title}</Link>{badge(r.status)}</div><div className="mt-1 flex items-center gap-2 text-[14px] text-muted"><Stars value={r.rating} size={14} />{formatDate(r.createdAt)} · {r.helpfulCount} found helpful</div>{r.body && <p className="mt-1">{r.body}</p>}</li>)}</ul> : <p className="text-muted">No reviews yet.</p>}</section>
      <section className="mt-10"><h2 className="mb-3 text-[22px] font-extrabold">My Photos</h2>
        {photos.length ? <div className="grid grid-cols-3 gap-3 md:grid-cols-5">{photos.map(({ p, title, slug }) => <Link key={p.id} href={recipeUrl({ id: p.recipeId, slug })} className="group"><Img src={p.url} alt={title} w={300} className="aspect-square w-full rounded" /><div className="mt-1">{badge(p.status)}</div></Link>)}</div> : <p className="text-muted">No photos yet.</p>}</section>
    </AccountShell>
  );
}
