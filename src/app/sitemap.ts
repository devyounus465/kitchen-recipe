import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, recipes, categories, articles, videos, collections, pages } from "@/db";
import { SITE } from "@/lib/site";
import { recipeUrl, categoryUrl, articleUrl, videoUrl } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => SITE.url + p;
  const [r, c, a, v, col, pg] = await Promise.all([
    db.select({ id: recipes.id, slug: recipes.slug, updatedAt: recipes.updatedAt }).from(recipes).where(eq(recipes.status, "published")),
    db.select().from(categories), db.select().from(articles).where(eq(articles.status, "published")), db.select().from(videos).where(eq(videos.status, "published")),
    db.select().from(collections).where(eq(collections.isEditorial, true)), db.select().from(pages)]);
  return [
    ...["/", "/recipes/", "/collections/", "/videos/", "/kitchen-tips/", "/news/", "/articles/", "/contact/"].map((p) => ({ url: u(p), changeFrequency: "daily" as const, priority: 0.8 })),
    ...r.map((x) => ({ url: u(recipeUrl(x)), lastModified: x.updatedAt, priority: 0.9 })),
    ...c.map((x) => ({ url: u(categoryUrl(x)), priority: 0.7 })),
    ...a.map((x) => ({ url: u(articleUrl(x)), lastModified: x.updatedAt, priority: 0.6 })),
    ...v.map((x) => ({ url: u(videoUrl(x)), priority: 0.5 })),
    ...col.map((x) => ({ url: u(`/collections/${x.slug}/`), priority: 0.6 })),
    ...pg.map((x) => ({ url: u(`/${x.slug}/`), priority: 0.3 })),
  ];
}
