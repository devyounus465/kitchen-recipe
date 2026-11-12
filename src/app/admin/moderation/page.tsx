import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, recipes, reviews, recipePhotos, users } from "@/db";
import { moderateRecipe, moderateReview, moderatePhoto } from "@/lib/actions/admin";
import { PageHeader, Card, abtnBrand, abtnGhost, abtnDanger, ainput } from "@/components/admin/ui";
import { Img } from "@/components/ui/Img";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "Moderation" };
export default async function Moderation() {
  const [subs, revs, photos] = await Promise.all([
    db.select({ r: recipes, author: users.name }).from(recipes).leftJoin(users, eq(users.id, recipes.authorId)).where(eq(recipes.status, "pending")).orderBy(desc(recipes.updatedAt)),
    db.select({ rv: reviews, name: users.name, title: recipes.title }).from(reviews).innerJoin(users, eq(users.id, reviews.userId)).innerJoin(recipes, eq(recipes.id, reviews.recipeId)).where(eq(reviews.status, "pending")).orderBy(desc(reviews.createdAt)),
    db.select({ p: recipePhotos, name: users.name, title: recipes.title }).from(recipePhotos).innerJoin(users, eq(users.id, recipePhotos.userId)).innerJoin(recipes, eq(recipes.id, recipePhotos.recipeId)).where(eq(recipePhotos.status, "pending")).orderBy(desc(recipePhotos.createdAt)),
  ]);
  const empty = <p className="py-8 text-center text-[14px] text-[#6b7385]">All caught up ✓</p>;
  return (
    <>
      <PageHeader title="Moderation queue" sub={`${subs.length + revs.length + photos.length} items need review`} />
      <Card title={`Submitted recipes (${subs.length})`} pad={false}>
        {subs.length ? <ul className="divide-y divide-admin-line">{subs.map(({ r, author }) => (
          <li key={r.id} className="flex flex-wrap items-start gap-4 p-5"><Img src={r.imageUrl} alt="" w={300} className="h-24 w-32 rounded-lg" />
            <div className="min-w-0 flex-1"><div className="text-[16px] font-semibold text-[#0f1115]">{r.title}</div><div className="text-[13px] text-[#6b7385]">by {author} · {formatDate(r.updatedAt)} · {r.ingredients.length} ingredients · {r.steps.length} steps</div><p className="mt-1 line-clamp-2 text-[14px] text-[#3b4252]">{r.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2"><Link href={`/recipe/${r.id}/${r.slug}/`} target="_blank" className={abtnGhost}>Preview ↗</Link><Link href={`/admin/recipes/${r.id}`} className={abtnGhost}>Edit</Link>
                <form action={moderateRecipe}><input type="hidden" name="id" value={r.id} /><button name="decision" value="approve" className={abtnBrand}>Approve & publish</button></form>
                <form action={moderateRecipe} className="flex gap-2"><input type="hidden" name="id" value={r.id} /><input name="reason" placeholder="Reason (sent to author)" className={ainput + " !w-56 py-1.5"} /><button name="decision" value="reject" className={abtnDanger}>Reject</button></form></div></div>
          </li>))}</ul> : empty}
      </Card>
      <Card title={`Reviews (${revs.length})`} pad={false} className="mt-6">
        {revs.length ? <ul className="divide-y divide-admin-line">{revs.map(({ rv, name, title }) => (
          <li key={rv.id} className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><div className="text-[14px]"><b>{name}</b> on <b>{title}</b> <span className="text-brand">{"★".repeat(rv.rating)}</span></div><p className="mt-0.5 text-[14px] text-[#3b4252]">{rv.body}</p></div>
            <form action={moderateReview} className="flex gap-2"><input type="hidden" name="id" value={rv.id} /><button name="decision" value="approve" className={abtnBrand}>Approve</button><button name="decision" value="reject" className={abtnGhost}>Reject</button><button name="decision" value="delete" className={abtnDanger}>Delete</button></form></li>))}</ul> : empty}
      </Card>
      <Card title={`Photos (${photos.length})`} className="mt-6">
        {photos.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{photos.map(({ p, name, title }) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-admin-line"><Img src={p.url} alt="" w={400} className="aspect-square w-full" /><div className="p-2.5 text-[12px]"><div className="truncate font-semibold">{title}</div><div className="truncate text-[#6b7385]">by {name}</div>
            <form action={moderatePhoto} className="mt-2 flex gap-1.5"><input type="hidden" name="id" value={p.id} /><button name="decision" value="approve" className={abtnBrand + " flex-1 px-2 py-1 text-[12px]"}>Approve</button><button name="decision" value="delete" className={abtnDanger + " px-2 py-1 text-[12px]"}>Delete</button></form></div></div>))}</div> : empty}
      </Card>
    </>
  );
}
