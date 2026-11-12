// Bulk content importer. Usage: npm run import -- content.json
// content.json: { "recipes": [ { "title", "description", "imageUrl", "prepMin", "cookMin", "servings",
//   "ingredients": ["1 cup flour", ...], "steps": ["...", ...], "categories": ["desserts"], "diets": ["vegetarian"],
//   "cuisine", "nutrition": {"calories":200,...}, "author": "username", "status": "published" } ], "articles": [ ... ] }
import "./env";
import fs from "node:fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import * as s from "../src/db/schema";
import { slugify } from "../src/lib/utils";
import { parseIngredientLine } from "../src/lib/ingredients";

const file = process.argv[2]; if (!file) { console.error("usage: npm run import -- content.json"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const client = postgres(process.env.DATABASE_URL!); const db = drizzle(client, { schema: s });
let ok = 0, skipped = 0;
for (const r of data.recipes ?? []) {
  const slug = slugify(r.slug || r.title);
  if ((await db.select({ id: s.recipes.id }).from(s.recipes).where(eq(s.recipes.slug, slug))).length) { skipped++; continue; }
  const [author] = r.author ? await db.select().from(s.users).where(eq(s.users.username, r.author)) : [];
  const ingredients = (r.ingredients ?? []).map((x: string) => parseIngredientLine(x)).filter(Boolean);
  const [row] = await db.insert(s.recipes).values({ slug, title: r.title, description: r.description ?? "", imageUrl: r.imageUrl ?? null, authorId: author?.id ?? null, status: r.status ?? "published",
    prepMin: r.prepMin ?? 0, cookMin: r.cookMin ?? 0, additionalMin: r.additionalMin ?? 0, totalMin: (r.prepMin ?? 0) + (r.cookMin ?? 0) + (r.additionalMin ?? 0), servings: r.servings ?? 4, yieldText: r.yield ?? null,
    ingredients, steps: (r.steps ?? []).map((text: string) => ({ text })), nutrition: r.nutrition ?? null, diets: r.diets ?? [], cuisine: r.cuisine ?? null, notes: r.notes ?? null, publishedAt: new Date() }).returning();
  if (r.categories?.length) { const cats = await db.select().from(s.categories).where(inArray(s.categories.slug, r.categories)); if (cats.length) await db.insert(s.recipeCategories).values(cats.map((c) => ({ recipeId: row.id, categoryId: c.id }))); }
  ok++;
}
for (const a of data.articles ?? []) {
  const slug = slugify(a.slug || a.title); if ((await db.select().from(s.articles).where(eq(s.articles.slug, slug))).length) { skipped++; continue; }
  const [author] = a.author ? await db.select().from(s.users).where(eq(s.users.username, a.author)) : [];
  await db.insert(s.articles).values({ slug, title: a.title, kind: a.kind ?? "article", dek: a.dek ?? "", body: a.body ?? "", heroUrl: a.heroUrl ?? null, authorId: author?.id ?? null, status: a.status ?? "published", publishedAt: new Date() }); ok++;
}
console.log(`Imported ${ok}, skipped ${skipped} (already exist).`); await client.end();
