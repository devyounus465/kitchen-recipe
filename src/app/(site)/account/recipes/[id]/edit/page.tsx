import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, recipes } from "@/db";
import { requireUser, isStaffRole } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountNav";
import { RecipeForm } from "@/components/account/RecipeForm";
import { formCategories, recipeToForm } from "@/lib/recipe-form";
export const metadata = { title: "Edit Recipe", robots: { index: false } };
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser(); const id = Number((await params).id);
  const [r] = await db.select().from(recipes).where(eq(recipes.id, id)); if (!r) notFound();
  if (isStaffRole(u.role)) redirect(`/admin/recipes/${id}`);
  if (r.authorId !== u.id) notFound();
  return <AccountShell active="activity" user={u} title="Edit Recipe">{r.status === "published" && <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-[15px] text-amber-900">Edits to a published recipe are re-reviewed by our editors before going live.</p>}<RecipeForm r={await recipeToForm(r)} cats={await formCategories()} /></AccountShell>;
}
