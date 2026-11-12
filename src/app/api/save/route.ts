import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, savedRecipes } from "@/db";
import { getUser } from "@/lib/auth";
import { refreshRecipeStats } from "@/lib/stats";

export async function POST(req: Request) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { recipeId, saved } = await req.json().catch(() => ({}));
  const id = Number(recipeId); if (!id) return NextResponse.json({ error: "bad" }, { status: 400 });
  if (saved) await db.insert(savedRecipes).values({ userId: user.id, recipeId: id }).onConflictDoNothing();
  else await db.delete(savedRecipes).where(and(eq(savedRecipes.userId, user.id), eq(savedRecipes.recipeId, id)));
  await refreshRecipeStats(id);
  return NextResponse.json({ ok: true, saved: !!saved });
}
