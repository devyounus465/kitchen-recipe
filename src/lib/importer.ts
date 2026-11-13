// Bulk content importer shared by the CLI (`npm run import -- file.json`) and Admin → Import.
// Accepts { categories?, recipes?, articles?, videos? }. Existing slugs are skipped (idempotent).
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db, categories, recipes, recipeCategories, articles, videos, users } from "../db";
import { slugify } from "./utils";
import { parseIngredientLine } from "./ingredients";

const url = z.string().trim().max(1000).regex(/^(https:\/\/|\/media\/|\/videos\/)\S+$/, "must be an https:// URL or a /media/ or /videos/ path");
const status = z.enum(["draft", "pending", "published"]).default("draft");
const Category = z.object({ name: z.string().trim().min(2).max(120), slug: z.string().max(120).optional(), parent: z.string().optional(), description: z.string().max(2000).optional(), showInNav: z.boolean().default(true), imageUrl: url.optional() });
const Recipe = z.object({
  title: z.string().trim().min(3).max(200), slug: z.string().max(200).optional(), description: z.string().max(2000).default(""), imageUrl: url.optional(),
  prepMin: z.number().int().min(0).max(10000).default(0), cookMin: z.number().int().min(0).max(10000).default(0), additionalMin: z.number().int().min(0).max(10000).default(0),
  servings: z.number().int().min(1).max(500).default(4), yield: z.string().max(120).optional(),
  ingredients: z.array(z.string().max(300)).min(1).max(100), steps: z.array(z.string().max(3000)).min(1).max(60),
  categories: z.array(z.string()).max(20).default([]), diets: z.array(z.string()).max(10).default([]), cuisine: z.string().max(60).optional(), notes: z.string().max(3000).optional(),
  nutrition: z.record(z.string(), z.number().min(0).max(100000)).optional(), author: z.string().optional(), status,
});
const Article = z.object({ title: z.string().trim().min(3).max(220), slug: z.string().max(200).optional(), kind: z.enum(["article", "guide", "news"]).default("article"), dek: z.string().max(1000).default(""), body: z.string().max(200000).default(""), heroUrl: url.optional(), author: z.string().optional(), status });
const Video = z.object({ title: z.string().trim().min(3).max(200), slug: z.string().max(200).optional(), description: z.string().max(5000).default(""), videoUrl: url.optional(), thumbnailUrl: url.optional(), durationSec: z.number().int().min(0).max(36000).default(0), recipe: z.string().optional(), author: z.string().optional(), status });
const ImportFile = z.object({ categories: z.array(Category).max(500).optional(), recipes: z.array(Recipe).max(2000).optional(), articles: z.array(Article).max(1000).optional(), videos: z.array(Video).max(1000).optional() });

type ImportReport = { created: number; skipped: number; errors: string[] };

async function authorId(username?: string) {
  if (!username) return null;
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  return u?.id ?? null;
}

export async function importContent(input: unknown): Promise<ImportReport> {
  const report: ImportReport = { created: 0, skipped: 0, errors: [] };
  const parsed = ImportFile.safeParse(input);
  if (!parsed.success) {
    report.errors = parsed.error.issues.slice(0, 20).map((i) => `${i.path.join(".")}: ${i.message}`);
    return report;
  }
  const data = parsed.data;
  for (const c of data.categories ?? []) {
    const slug = slugify(c.slug || c.name);
    if ((await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug))).length) { report.skipped++; continue; }
    const [parent] = c.parent ? await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, c.parent)) : [];
    await db.insert(categories).values({ slug, name: c.name, description: c.description ?? "", parentId: parent?.id ?? null, showInNav: c.showInNav, imageUrl: c.imageUrl ?? null });
    report.created++;
  }
  for (const r of data.recipes ?? []) {
    const slug = slugify(r.slug || r.title);
    if ((await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.slug, slug))).length) { report.skipped++; continue; }
    const ingredients = r.ingredients.map(parseIngredientLine).filter((x): x is NonNullable<typeof x> => !!x);
    const [row] = await db.insert(recipes).values({
      slug, title: r.title, description: r.description, imageUrl: r.imageUrl ?? null, authorId: await authorId(r.author), status: r.status,
      prepMin: r.prepMin, cookMin: r.cookMin, additionalMin: r.additionalMin, totalMin: r.prepMin + r.cookMin + r.additionalMin, servings: r.servings,
      yieldText: r.yield ?? `${r.servings} servings`, ingredients, steps: r.steps.map((text) => ({ text })), nutrition: r.nutrition ?? null,
      diets: r.diets, cuisine: r.cuisine ?? null, notes: r.notes ?? null, publishedAt: r.status === "published" ? new Date() : null,
    }).returning({ id: recipes.id });
    if (r.categories.length) {
      const cats = await db.select({ id: categories.id }).from(categories).where(inArray(categories.slug, r.categories));
      if (cats.length) await db.insert(recipeCategories).values(cats.map((c) => ({ recipeId: row.id, categoryId: c.id })));
      if (cats.length < r.categories.length) report.errors.push(`Recipe "${r.title}": unknown category slug(s) ignored`);
    }
    report.created++;
  }
  for (const a of data.articles ?? []) {
    const slug = slugify(a.slug || a.title);
    if ((await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug))).length) { report.skipped++; continue; }
    await db.insert(articles).values({ slug, title: a.title, kind: a.kind, dek: a.dek, body: a.body, heroUrl: a.heroUrl ?? null, authorId: await authorId(a.author), status: a.status === "pending" ? "draft" : a.status, publishedAt: a.status === "published" ? new Date() : null });
    report.created++;
  }
  for (const v of data.videos ?? []) {
    const slug = slugify(v.slug || v.title);
    if ((await db.select({ id: videos.id }).from(videos).where(eq(videos.slug, slug))).length) { report.skipped++; continue; }
    const [rec] = v.recipe ? await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.slug, v.recipe)) : [];
    await db.insert(videos).values({ slug, title: v.title, description: v.description, videoUrl: v.videoUrl ?? null, thumbnailUrl: v.thumbnailUrl ?? null, durationSec: v.durationSec, recipeId: rec?.id ?? null, authorId: await authorId(v.author), status: v.status === "pending" ? "draft" : v.status, publishedAt: v.status === "published" ? new Date() : null });
    report.created++;
  }
  return report;
}
