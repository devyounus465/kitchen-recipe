import { navTree } from "@/lib/queries";
import { json, limited } from "@/lib/api";
import { SITE } from "@/lib/site";
import { categoryUrl } from "@/lib/utils";

/** GET /api/v1/categories — the category tree used for navigation. */
export async function GET() {
  const blocked = await limited(); if (blocked) return blocked;
  const tree = await navTree();
  const shape = (c: { id: number; slug: string; name: string; description: string | null }) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description, url: SITE.url + categoryUrl(c) });
  return json({ data: tree.map((g) => ({ ...shape(g), children: g.children.map(shape) })) });
}
