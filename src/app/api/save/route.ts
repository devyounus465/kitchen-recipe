import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, savedRecipes, recipes } from "@/db";
import { getUser } from "@/lib/auth";
import { refreshRecipeStats } from "@/lib/stats";
import { isCrossSite } from "@/lib/sameorigin";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (isCrossSite(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const user = await getUser(); if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!rateLimit(`save:${user.id}`, 60, 60_000)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const { recipeId, saved } = await req.json().catch(() => ({}));
  const id = Number(recipeId); if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "bad" }, { status: 400 });
  const [r] = await db.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, id), eq(recipes.status, "published")));
  if (!r && saved) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (saved) await db.insert(savedRecipes).values({ userId: user.id, recipeId: id }).onConflictDoNothing();
  else await db.delete(savedRecipes).where(and(eq(savedRecipes.userId, user.id), eq(savedRecipes.recipeId, id)));
  await refreshRecipeStats(id);
  return NextResponse.json({ ok: true, saved: !!saved });
}
