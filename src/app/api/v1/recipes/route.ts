import { searchRecipes } from "@/lib/queries";
import { json, limited } from "@/lib/api";
import { SITE } from "@/lib/site";
import { recipeUrl } from "@/lib/utils";

/** GET /api/v1/recipes?q=&ingredient=&exclude=&maxTime=&diet=&category=&sort=relevance|rating|newest|popular&page=&limit= */
export async function GET(req: Request) {
  const blocked = await limited(); if (blocked) return blocked;
  const p = new URL(req.url).searchParams;
  const limit = Math.min(50, Math.max(1, Number(p.get("limit")) || 24));
  const res = await searchRecipes({
    q: p.get("q")?.slice(0, 200) || undefined, ingredient: p.get("ingredient")?.slice(0, 200) || undefined, exclude: p.get("exclude")?.slice(0, 200) || undefined,
    maxTime: Number(p.get("maxTime")) || undefined, diets: p.getAll("diet").slice(0, 6), category: p.get("category")?.slice(0, 120) || undefined,
    sort: p.get("sort") || "relevance", page: Math.min(1000, Number(p.get("page")) || 1),
  }, limit);
  return json({
    data: res.rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, url: SITE.url + recipeUrl(r), imageUrl: r.imageUrl, rating: Math.round(r.ratingAvg * 10) / 10, ratingCount: r.ratingCount, totalMinutes: r.totalMin, category: r.tag })),
    page: res.page, pages: res.pages, total: res.total,
  });
}
