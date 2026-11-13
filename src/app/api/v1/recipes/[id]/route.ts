import { getRecipe } from "@/lib/queries";
import { json, limited } from "@/lib/api";
import { SITE } from "@/lib/site";
import { recipeUrl, cookUrl } from "@/lib/utils";

/** GET /api/v1/recipes/:id — a published recipe with ingredients, steps and nutrition. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await limited(); if (blocked) return blocked;
  const id = Number((await params).id);
  const r = Number.isInteger(id) && id > 0 ? await getRecipe(id) : null;
  if (!r || r.status !== "published") return json({ error: "not_found" }, 404);
  return json({
    id: r.id, slug: r.slug, title: r.title, description: r.description, url: SITE.url + recipeUrl(r), imageUrl: r.imageUrl,
    author: r.author ? { name: r.author.name, url: SITE.url + cookUrl(r.author) } : null,
    publishedAt: r.publishedAt, updatedAt: r.updatedAt,
    times: { prepMinutes: r.prepMin, cookMinutes: r.cookMin, additionalMinutes: r.additionalMin, totalMinutes: r.totalMin },
    servings: r.servings, yield: r.yieldText, cuisine: r.cuisine, diets: r.diets,
    categories: r.categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    ingredients: r.ingredients, steps: r.steps, notes: r.notes, nutrition: r.nutrition,
    rating: { average: Math.round(r.ratingAvg * 10) / 10, count: r.ratingCount, reviews: r.reviewCount },
  });
}
