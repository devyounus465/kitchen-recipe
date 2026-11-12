import "server-only";
import { and, desc, eq, inArray, sql, asc } from "drizzle-orm";
import { db, recipes, categories, recipeCategories, users, articles, videos, collections, collectionRecipes, reviews, recipePhotos, savedRecipes, homepageSections } from "@/db";

export type Card = { id: number; slug: string; title: string; imageUrl: string | null; ratingAvg: number; ratingCount: number; tag: string | null; totalMin: number | null };

const cardCols = {
  id: recipes.id, slug: recipes.slug, title: recipes.title, imageUrl: recipes.imageUrl, ratingAvg: recipes.ratingAvg, ratingCount: recipes.ratingCount, totalMin: recipes.totalMin,
  tag: sql<string | null>`(SELECT c.name FROM recipe_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.recipe_id = "recipes"."id" ORDER BY c.parent_id IS NULL, c.sort_order ASC LIMIT 1)`,
};
const published = eq(recipes.status, "published");

export async function cardsByIds(ids: number[]): Promise<Card[]> {
  if (!ids.length) return [];
  const rows = await db.select(cardCols).from(recipes).where(and(published, inArray(recipes.id, ids)));
  return ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as Card[];
}
export async function latestCards(limit = 8, offset = 0) {
  return db.select(cardCols).from(recipes).where(published).orderBy(desc(recipes.publishedAt)).limit(limit).offset(offset);
}
export async function topRatedCards(limit = 8) {
  return db.select(cardCols).from(recipes).where(published).orderBy(desc(sql`${recipes.ratingAvg} * ln(${recipes.ratingCount} + 2)`)).limit(limit);
}
export async function popularCards(limit = 8) {
  return db.select(cardCols).from(recipes).where(published).orderBy(desc(recipes.viewCount)).limit(limit);
}

async function categoryDescendantIds(id: number): Promise<number[]> {
  const kids = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id));
  return [id, ...kids.map((k) => k.id)];
}
export async function cardsInCategory(categoryId: number, limit = 24, offset = 0, sort: "latest" | "rating" = "rating") {
  const ids = await categoryDescendantIds(categoryId);
  const sub = db.selectDistinct({ id: recipeCategories.recipeId }).from(recipeCategories).where(inArray(recipeCategories.categoryId, ids));
  const order = sort === "latest" ? desc(recipes.publishedAt) : desc(sql`${recipes.ratingAvg} * ln(${recipes.ratingCount} + 2)`);
  const rows = await db.select(cardCols).from(recipes).where(and(published, inArray(recipes.id, sub))).orderBy(order).limit(limit).offset(offset);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(recipes).where(and(published, inArray(recipes.id, sub)));
  return { rows, total: n };
}
export async function cardsInCategorySlug(slug: string, limit = 4) {
  const [c] = await db.select().from(categories).where(eq(categories.slug, slug));
  if (!c) return [];
  return (await cardsInCategory(c.id, limit)).rows;
}

export async function navTree() {
  const all = await db.select().from(categories).where(eq(categories.showInNav, true)).orderBy(asc(categories.sortOrder));
  return all.filter((c) => !c.parentId).map((p) => ({ ...p, children: all.filter((c) => c.parentId === p.id) }));
}

type SearchParams = { q?: string; ingredient?: string; exclude?: string; maxTime?: number; diets?: string[]; category?: string; sort?: string; page?: number };
export async function searchRecipes(p: SearchParams, pageSize = 24) {
  const conds = [sql`r.status = 'published'`];
  const q = (p.q || "").trim();
  const tsq = q ? sql`websearch_to_tsquery('english', ${q})` : null;
  if (tsq) conds.push(sql`(r.search @@ ${tsq} OR r.title ILIKE ${"%" + q + "%"})`);
  for (const ing of (p.ingredient || "").split(",").map((s) => s.trim()).filter(Boolean))
    conds.push(sql`EXISTS (SELECT 1 FROM jsonb_array_elements(r.ingredients) e WHERE e->>'item' ILIKE ${"%" + ing + "%"})`);
  for (const ing of (p.exclude || "").split(",").map((s) => s.trim()).filter(Boolean))
    conds.push(sql`NOT EXISTS (SELECT 1 FROM jsonb_array_elements(r.ingredients) e WHERE e->>'item' ILIKE ${"%" + ing + "%"})`);
  if (p.maxTime) conds.push(sql`r.total_min <= ${p.maxTime}`);
  for (const d of p.diets || []) conds.push(sql`${d} = ANY(r.diets)`);
  if (p.category) conds.push(sql`EXISTS (SELECT 1 FROM recipe_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.recipe_id = r.id AND (c.slug = ${p.category} OR c.parent_id = (SELECT id FROM categories WHERE slug = ${p.category})))`);
  const where = sql.join(conds, sql` AND `);
  const order = p.sort === "rating" ? sql`r.rating_avg * ln(r.rating_count + 2) DESC`
    : p.sort === "newest" ? sql`r.published_at DESC`
    : p.sort === "popular" ? sql`r.view_count DESC`
    : tsq ? sql`ts_rank(r.search, ${tsq}) + (CASE WHEN r.title ILIKE ${"%" + q + "%"} THEN 0.5 ELSE 0 END) DESC, r.rating_count DESC` : sql`r.rating_avg * ln(r.rating_count + 2) DESC`;
  const page = Math.max(1, p.page || 1);
  const rows = await db.execute<Card & { image_url: string }>(sql`
    SELECT r.id, r.slug, r.title, r.image_url AS "imageUrl", r.rating_avg AS "ratingAvg", r.rating_count AS "ratingCount", r.total_min AS "totalMin",
      (SELECT c.name FROM recipe_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.recipe_id = r.id ORDER BY c.parent_id IS NULL, c.sort_order ASC LIMIT 1) AS tag
    FROM recipes r WHERE ${where} ORDER BY ${order} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`);
  const [{ n }] = await db.execute<{ n: number }>(sql`SELECT count(*)::int n FROM recipes r WHERE ${where}`);
  return { rows: [...rows] as unknown as Card[], total: n, page, pages: Math.max(1, Math.ceil(n / pageSize)) };
}

export async function getRecipe(id: number) {
  const [r] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!r) return null;
  const [author] = r.authorId ? await db.select().from(users).where(eq(users.id, r.authorId)) : [null];
  const cats = await db.select({ id: categories.id, slug: categories.slug, name: categories.name, parentId: categories.parentId }).from(recipeCategories).innerJoin(categories, eq(categories.id, recipeCategories.categoryId)).where(eq(recipeCategories.recipeId, id));
  return { ...r, author, categories: cats };
}
export async function relatedCards(recipeId: number, limit = 8) {
  const rows = await db.execute<Card>(sql`
    SELECT r.id, r.slug, r.title, r.image_url AS "imageUrl", r.rating_avg AS "ratingAvg", r.rating_count AS "ratingCount", r.total_min AS "totalMin",
      (SELECT c.name FROM recipe_categories rc JOIN categories c ON c.id = rc.category_id WHERE rc.recipe_id = r.id ORDER BY c.parent_id IS NULL, c.sort_order ASC LIMIT 1) AS tag
    FROM recipes r
    WHERE r.status='published' AND r.id <> ${recipeId}
    ORDER BY (SELECT count(*) FROM recipe_categories a JOIN recipe_categories b ON a.category_id=b.category_id WHERE a.recipe_id=${recipeId} AND b.recipe_id=r.id) DESC,
      r.rating_avg DESC LIMIT ${limit}`);
  return [...rows] as unknown as Card[];
}
export async function recipeReviews(recipeId: number, sort = "helpful", viewerId?: number) {
  const order = sort === "newest" ? desc(reviews.createdAt) : sort === "highest" ? desc(reviews.rating) : sort === "lowest" ? asc(reviews.rating) : desc(reviews.helpfulCount);
  return db.select({ id: reviews.id, rating: reviews.rating, body: reviews.body, helpfulCount: reviews.helpfulCount, createdAt: reviews.createdAt, userId: reviews.userId, userName: users.name, username: users.username,
    votedHelpful: viewerId ? sql<boolean>`EXISTS (SELECT 1 FROM review_helpful h WHERE h.review_id=${reviews.id} AND h.user_id=${viewerId})` : sql<boolean>`false` })
    .from(reviews).innerJoin(users, eq(users.id, reviews.userId)).where(and(eq(reviews.recipeId, recipeId), eq(reviews.status, "approved"))).orderBy(order, desc(reviews.id));
}
export async function ratingHistogram(recipeId: number) {
  const rows = await db.select({ rating: reviews.rating, n: sql<number>`count(*)::int` }).from(reviews).where(and(eq(reviews.recipeId, recipeId), eq(reviews.status, "approved"))).groupBy(reviews.rating);
  return [5, 4, 3, 2, 1].map((s) => ({ stars: s, n: rows.find((r) => r.rating === s)?.n ?? 0 }));
}
export async function recipePhotoList(recipeId: number) {
  return db.select({ id: recipePhotos.id, url: recipePhotos.url, caption: recipePhotos.caption, userName: users.name, username: users.username }).from(recipePhotos).innerJoin(users, eq(users.id, recipePhotos.userId)).where(and(eq(recipePhotos.recipeId, recipeId), eq(recipePhotos.status, "approved"))).orderBy(desc(recipePhotos.createdAt));
}
export async function isSaved(userId: number | undefined, recipeId: number) {
  if (!userId) return false;
  const r = await db.select().from(savedRecipes).where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
  return r.length > 0;
}
export async function savedIdSet(userId?: number) {
  if (!userId) return new Set<number>();
  const r = await db.select({ id: savedRecipes.recipeId }).from(savedRecipes).where(eq(savedRecipes.userId, userId));
  return new Set(r.map((x) => x.id));
}

export async function articleList(kind?: string, limit = 12) {
  return db.select({ id: articles.id, slug: articles.slug, title: articles.title, dek: articles.dek, heroUrl: articles.heroUrl, kind: articles.kind, publishedAt: articles.publishedAt, authorName: users.name, authorUsername: users.username })
    .from(articles).leftJoin(users, eq(users.id, articles.authorId)).where(kind ? and(eq(articles.status, "published"), eq(articles.kind, kind)) : eq(articles.status, "published")).orderBy(desc(articles.publishedAt)).limit(limit);
}
export async function videoList(limit = 12) {
  return db.select().from(videos).where(eq(videos.status, "published")).orderBy(desc(videos.publishedAt)).limit(limit);
}
export async function editorialCollections() {
  return db.select({ id: collections.id, slug: collections.slug, name: collections.name, description: collections.description, imageUrl: collections.imageUrl, n: sql<number>`(SELECT count(*)::int FROM collection_recipes cr WHERE cr.collection_id = ${collections.id})` })
    .from(collections).where(eq(collections.isEditorial, true)).orderBy(asc(collections.id));
}
export async function collectionCards(collectionId: number) {
  const ids = await db.select({ id: collectionRecipes.recipeId }).from(collectionRecipes).where(eq(collectionRecipes.collectionId, collectionId)).orderBy(asc(collectionRecipes.position));
  return cardsByIds(ids.map((i) => i.id));
}
export async function homeSections() {
  return db.select().from(homepageSections).where(eq(homepageSections.enabled, true)).orderBy(asc(homepageSections.sortOrder));
}
