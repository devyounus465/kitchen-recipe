"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, reviews, reviewHelpful, recipePhotos, recipes } from "@/db";
import { getUser } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { refreshRecipeStats } from "@/lib/stats";
import { rateLimit } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";
import type { FormState } from "./public";

export async function submitReview(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser(); if (!user) return { error: "Please log in to rate and review." };
  const recipeId = Number(fd.get("recipeId")); const rating = Number(fd.get("rating")); const body = String(fd.get("body") || "").trim();
  if (!(rating >= 1 && rating <= 5)) return { error: "Please select a star rating." };
  if (body.length > 3000) return { error: "Reviews are limited to 3,000 characters." };
  if (!rateLimit(`review:${user.id}`, 20)) return { error: "You're posting reviews too quickly. Please try again later." };
  const [r] = await db.select({ id: recipes.id, authorId: recipes.authorId }).from(recipes).where(and(eq(recipes.id, recipeId), eq(recipes.status, "published")));
  if (!r) return { error: "Recipe not found." };
  if (r.authorId === user.id) return { error: "You can't rate your own recipe." };
  // Simple auto-moderation: links get held for review.
  const mode = (await getSettings()).reviewModeration;
  const status = mode === "all" || (mode === "links" && /https?:\/\/|www\./i.test(body)) ? "pending" : "approved";
  await db.insert(reviews).values({ recipeId, userId: user.id, rating, body, status })
    .onConflictDoUpdate({ target: [reviews.userId, reviews.recipeId], set: { rating, body, status, updatedAt: new Date() } });
  await refreshRecipeStats(recipeId);
  revalidatePath("/recipe/[id]/[slug]", "page");
  return { ok: true, message: status === "pending" ? "Thanks! Your review will appear after moderation." : "Thanks for your review!" };
}

export async function deleteReview(fd: FormData) {
  const user = await getUser(); if (!user) return;
  const id = Number(fd.get("id"));
  const [rv] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!rv || (rv.userId !== user.id && user.role !== "admin" && user.role !== "editor")) return;
  await db.delete(reviews).where(eq(reviews.id, id));
  await refreshRecipeStats(rv.recipeId);
  revalidatePath("/recipe/[id]/[slug]", "page");
}

export async function toggleHelpful(reviewId: number): Promise<{ ok: boolean; count?: number; voted?: boolean; needLogin?: boolean }> {
  const user = await getUser(); if (!user) return { ok: false, needLogin: true };
  if (!rateLimit(`helpful:${user.id}`, 60, 60_000)) return { ok: false };
  const existing = await db.select().from(reviewHelpful).where(and(eq(reviewHelpful.reviewId, reviewId), eq(reviewHelpful.userId, user.id)));
  if (existing.length) await db.delete(reviewHelpful).where(and(eq(reviewHelpful.reviewId, reviewId), eq(reviewHelpful.userId, user.id)));
  else await db.insert(reviewHelpful).values({ reviewId, userId: user.id });
  const [row] = await db.update(reviews).set({ helpfulCount: sql`GREATEST(0, ${reviews.helpfulCount} + ${existing.length ? -1 : 1})` }).where(eq(reviews.id, reviewId)).returning({ c: reviews.helpfulCount });
  return { ok: true, count: row?.c ?? 0, voted: !existing.length };
}

export async function uploadRecipePhoto(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser(); if (!user) return { error: "Please log in to add a photo." };
  const recipeId = Number(fd.get("recipeId")); const file = fd.get("photo");
  if (!(file instanceof File) || !file.size) return { error: "Please choose a photo to upload." };
  if (!file.type.startsWith("image/")) return { error: "Only image files are allowed." };
  if (!rateLimit(`photo:${user.id}`, 10)) return { error: "You've uploaded several photos recently. Please try again later." };
  const [r] = await db.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, recipeId), eq(recipes.status, "published")));
  if (!r) return { error: "Recipe not found." };
  try {
    const saved = await saveFile(file);
    await db.insert(recipePhotos).values({ recipeId, userId: user.id, url: saved.url, caption: String(fd.get("caption") || "").slice(0, 300), status: "pending" });
    return { ok: true, message: "Photo uploaded! It will appear once approved by our moderators." };
  } catch (e) { return { error: (e as Error).message }; }
}
