import "server-only";
import { asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, categories, recipeCategories, recipes } from "@/db";
import { ingredientToLine } from "./ingredients";
import type { RecipeFormData } from "@/components/account/RecipeForm";
export async function formCategories() {
  const p = alias(categories, "p");
  const rows = await db.select({ id: categories.id, name: categories.name, parent: p.name }).from(categories).innerJoin(p, eq(p.id, categories.parentId)).orderBy(asc(p.sortOrder), asc(categories.sortOrder));
  return rows;
}
export async function recipeToForm(r: typeof recipes.$inferSelect): Promise<RecipeFormData> {
  const cats = await db.select({ id: recipeCategories.categoryId }).from(recipeCategories).where(eq(recipeCategories.recipeId, r.id));
  return { ...r, ingredientsText: r.ingredients.map(ingredientToLine).join("\n"), stepsText: r.steps.map((s) => s.text).join("\n"), categoryIds: cats.map((c) => c.id), nutrition: r.nutrition as Record<string, number | undefined> | null };
}
