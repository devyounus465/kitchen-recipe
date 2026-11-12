import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db, collections } from "@/db";
import { requireUser } from "@/lib/auth";
import { collectionCards } from "@/lib/queries";
import { deleteCollection } from "@/lib/actions/account";
import { AccountShell } from "@/components/account/AccountNav";
import { RecipeCard, EmptyState } from "@/components/recipe/RecipeCard";
import { EditCollectionForm } from "@/components/account/CollectionWidgets";
import { RemoveFromCollection } from "./RemoveButton";
export const metadata = { title: "Collection", robots: { index: false } };
export default async function OwnCollection({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(); const id = Number((await params).id);
  const [c] = await db.select().from(collections).where(and(eq(collections.id, id), eq(collections.userId, u.id))); if (!c) notFound();
  const cards = await collectionCards(c.id);
  return (
    <AccountShell active="collections" user={u} title={c.name}>
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>{c.isPublic && <p className="mb-4 text-[15px]">Public link: <Link className="link" href={`/collections/${c.slug}/`}>/collections/{c.slug}/</Link></p>}
          {cards.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">{cards.map((r) => <div key={r.id}><RecipeCard r={r} loggedIn saved /><RemoveFromCollection collectionId={c.id} recipeId={r.id} /></div>)}</div>
            : <EmptyState title="This collection is empty" body="Add recipes from your Saved list." action={<Link href="/account/my-recipes/" className="btn-primary">Go to Saved</Link>} />}</div>
        <div className="space-y-4"><EditCollectionForm c={c} /><form action={deleteCollection}><input type="hidden" name="id" value={c.id} /><button className="btn h-10 w-full border-2 border-red-700 text-[13px] text-red-700 hover:bg-red-700 hover:text-white">Delete Collection</button></form></div>
      </div>
    </AccountShell>
  );
}
