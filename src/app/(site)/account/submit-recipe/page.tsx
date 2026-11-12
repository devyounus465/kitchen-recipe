import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountNav";
import { RecipeForm } from "@/components/account/RecipeForm";
import { formCategories } from "@/lib/recipe-form";
export const metadata = { title: "Submit a Recipe", robots: { index: false } };
export default async function Submit() {
  const u = await requireUser("/account/submit-recipe/");
  return <AccountShell active="submit" user={u} title="Submit a Recipe"><p className="mb-6 max-w-2xl text-[17px]">Share a recipe you love with the Simmerly community. Our editors review every submission — you&apos;ll get credit as the contributor once it&apos;s published.</p><RecipeForm cats={await formCategories()} /></AccountShell>;
}
