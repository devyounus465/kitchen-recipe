import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, recipePhotos, recipes, users } from "@/db";
import { moderatePhoto } from "@/lib/actions/admin";
import { PageHeader, Badge, abtnGhost } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ActionForm";
import { Img } from "@/components/ui/Img";
import { formatDate, recipeUrl, cn } from "@/lib/utils";
export const metadata = { title: "Community photos" };
const PER = 40;
export default async function Photos({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams; const page = Math.max(1, Number(sp.page) || 1);
  const status = ["approved", "pending", "rejected"].includes(sp.status || "") ? sp.status! : null;
  const where = status ? eq(recipePhotos.status, status) : sql`TRUE`;
  const [list, [{ n }]] = await Promise.all([
    db.select({ p: recipePhotos, user: users.name, title: recipes.title, rid: recipes.id, slug: recipes.slug }).from(recipePhotos)
      .innerJoin(users, eq(users.id, recipePhotos.userId)).innerJoin(recipes, eq(recipes.id, recipePhotos.recipeId))
      .where(where).orderBy(desc(recipePhotos.createdAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(recipePhotos).where(where),
  ]);
  return (
    <>
      <PageHeader title="Community photos" sub={`${n} photos uploaded by members`} />
      <div className="mb-4 flex gap-2">
        {[["", "All"], ["approved", "Approved"], ["pending", "Pending"], ["rejected", "Rejected"]].map(([v, l]) => (
          <Link key={v} href={`/admin/photos${v ? `?status=${v}` : ""}`} className={cn("rounded-full px-3 py-1.5 text-[13px] font-semibold", (status || "") === v ? "bg-[#0f1115] text-white" : "bg-white ring-1 ring-admin-line hover:bg-[#f3f4f7]")}>{l}</Link>
        ))}
      </div>
      {!list.length && <p className="py-14 text-center text-[14px] text-[#6b7385]">No photos here.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {list.map(({ p, user, title, rid, slug }) => (
          <div key={p.id} className="overflow-hidden rounded-xl border border-admin-line bg-white">
            <Img src={p.url} alt={p.caption || title} w={400} className="aspect-square w-full" />
            <div className="space-y-1 p-2.5 text-[12px]">
              <Link href={recipeUrl({ id: rid, slug })} target="_blank" className="block truncate font-semibold hover:text-brand">{title}</Link>
              <div className="truncate text-[#6b7385]">by {user} · {formatDate(p.createdAt)}</div>
              <Badge s={p.status} />
              <form action={moderatePhoto} className="flex gap-1.5 pt-1"><input type="hidden" name="id" value={p.id} />
                {p.status !== "approved" && <button name="decision" value="approve" className={abtnGhost + " px-2 py-1 text-[12px]"}>Approve</button>}
                {p.status === "approved" && <button name="decision" value="reject" className={abtnGhost + " px-2 py-1 text-[12px]"}>Hide</button>}
                <ConfirmButton name="decision" value="delete" className={abtnGhost + " px-2 py-1 text-[12px] text-red-700"} message="Delete this photo permanently?">Delete</ConfirmButton>
              </form>
            </div>
          </div>
        ))}
      </div>
      {n > PER && <div className="mt-6 flex gap-2">{page > 1 && <Link className={abtnGhost} href={`/admin/photos?page=${page - 1}${status ? `&status=${status}` : ""}`}>Previous</Link>}{page * PER < n && <Link className={abtnGhost} href={`/admin/photos?page=${page + 1}${status ? `&status=${status}` : ""}`}>Next</Link>}</div>}
    </>
  );
}
