import { notFound } from "next/navigation";
import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { db, recipes, users } from "@/db";
import { deleteRecipe } from "@/lib/actions/admin";
import { formCategories, recipeToForm } from "@/lib/recipe-form";
import { RecipeForm } from "@/components/account/RecipeForm";
import { PageHeader, Badge, abtnGhost, abtnDanger, Saved } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ActionForm";
export const metadata = { title: "Edit recipe" };
export default async function EditRecipe({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params; const sp = await searchParams; const isNew = id === "new";
  const r = isNew ? null : (await db.select().from(recipes).where(eq(recipes.id, Number(id))))[0];
  if (!isNew && !r) notFound();
  const authors = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.role, ["admin", "editor", "contributor", "user"])).orderBy(asc(users.name));
  return (
    <div className="max-w-4xl">
      <PageHeader crumb={{ href: "/admin/recipes", label: "Recipes" }} title={r ? r.title : "New recipe"} sub={r ? `#${r.id} · last updated ${r.updatedAt.toLocaleString()}` : undefined}
        actions={r && <><Badge s={r.status} /><Link href={`/recipe/${r.id}/${r.slug}/`} target="_blank" className={abtnGhost}>Preview ↗</Link><form action={deleteRecipe}><input type="hidden" name="id" value={r.id} /><ConfirmButton className={abtnDanger}>Delete</ConfirmButton></form></>} />
      <Saved show={!!sp.saved} text="Recipe saved." />
      <RecipeForm admin cats={await formCategories()} authors={authors} r={r ? await recipeToForm(r) : { status: "draft" }} />
    </div>
  );
}
