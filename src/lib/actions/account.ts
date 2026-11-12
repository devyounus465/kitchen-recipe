"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { and, eq, gt, isNull, sql, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db, users, passwordResets, collections, collectionRecipes, recipes, recipeCategories } from "@/db";
import { createSession, destroySession, getUser, isStaffRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { saveFile } from "@/lib/storage";
import { rateLimit } from "@/lib/ratelimit";
import { slugify } from "@/lib/utils";
import { parseIngredientLine } from "@/lib/ingredients";
import { SITE } from "@/lib/site";
import type { FormState } from "./public";

const errs = (e: z.ZodError) => Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message]));
const safeNext = (n: unknown) => { const s = String(n || ""); return s.startsWith("/") && !s.startsWith("//") ? s : "/account/my-recipes/"; };
const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0] || "local";
const password = z.string().min(8, "Password must be at least 8 characters.").regex(/[A-Za-z]/, "Include at least one letter.").regex(/\d/, "Include at least one number.");

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const p = z.object({ name: z.string().trim().min(2, "Please enter your name.").max(120), email: z.string().trim().toLowerCase().email("Please enter a valid email."), password, terms: z.literal("on", { message: "Please accept the Terms of Service." }) }).safeParse(Object.fromEntries(fd));
  const values = { name: String(fd.get("name") || ""), email: String(fd.get("email") || "") };
  if (!p.success) return { error: "Please fix the errors below.", fieldErrors: errs(p.error), values };
  if (!rateLimit(`reg:${await ip()}`, 10)) return { error: "Too many attempts. Please try again later." };
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, p.data.email));
  if (exists.length) return { error: "An account with this email already exists.", fieldErrors: { email: "Email already registered. Try logging in." }, values };
  let base = slugify(p.data.name).replace(/-/g, "") || "cook"; let username = base; let n = 1;
  while ((await db.select({ id: users.id }).from(users).where(eq(users.username, username))).length) username = `${base}${++n}`;
  const [u] = await db.insert(users).values({ name: p.data.name, email: p.data.email, username, passwordHash: await bcrypt.hash(p.data.password, 12), newsletter: fd.get("newsletter") === "on" }).returning();
  await createSession(u.id);
  await sendEmail(u.email, `Welcome to ${SITE.name}!`, `Hi ${u.name},\n\nThanks for joining ${SITE.name}. Start saving recipes: ${SITE.url}/account/my-recipes/`);
  redirect(safeNext(fd.get("next")) === "/account/my-recipes/" ? "/account/my-recipes/?welcome=1" : safeNext(fd.get("next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase(); const pw = String(fd.get("password") || "");
  const values = { email };
  if (!email || !pw) return { error: "Please enter your email and password.", values };
  if (!rateLimit(`login:${email}:${await ip()}`, 8)) return { error: "Too many login attempts. Please wait 10 minutes and try again.", values };
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u || !(await bcrypt.compare(pw, u.passwordHash))) return { error: "Incorrect email or password.", values };
  if (u.status !== "active") return { error: "This account has been suspended. Please contact support.", values };
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id));
  await createSession(u.id);
  redirect(safeNext(fd.get("next")));
}

export async function logout() { await destroySession(); redirect("/"); }

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "Please enter a valid email address." };
  if (!rateLimit(`forgot:${await ip()}`, 5)) return { error: "Too many requests. Please try again later." };
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (u) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.insert(passwordResets).values({ userId: u.id, tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    await sendEmail(u.email, "Reset your password", `Hi ${u.name},\n\nReset your password (link valid for 1 hour):\n${SITE.url}/account/reset-password/?token=${token}\n\nIf you didn't request this, ignore this email.`);
  }
  return { ok: true, message: "If an account exists for that email, we've sent a password reset link. It expires in 1 hour." };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") || ""); const pw = password.safeParse(fd.get("password"));
  if (!pw.success) return { error: pw.error.issues[0].message };
  if (fd.get("password") !== fd.get("confirm")) return { error: "Passwords don't match." };
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const [r] = await db.select().from(passwordResets).where(and(eq(passwordResets.tokenHash, hash), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())));
  if (!r) return { error: "This reset link is invalid or has expired. Please request a new one." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(pw.data, 12) }).where(eq(users.id, r.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.userId, r.userId));
  await createSession(r.userId);
  redirect("/account/my-recipes/?reset=1");
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser(); if (!u) return { error: "Please log in." };
  const p = z.object({ name: z.string().trim().min(2, "Name is too short.").max(120), username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{3,40}$/, "3–40 characters: letters, numbers, . _ -"), email: z.string().trim().toLowerCase().email("Invalid email."), bio: z.string().max(500, "Bio max 500 characters.").optional(), location: z.string().max(120).optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please fix the errors below.", fieldErrors: errs(p.error) };
  const clash = await db.select({ id: users.id, email: users.email, username: users.username }).from(users).where(sql`(${users.email} = ${p.data.email} OR ${users.username} = ${p.data.username}) AND ${users.id} <> ${u.id}`);
  if (clash.length) return { error: "That email or username is already taken.", fieldErrors: clash[0].email === p.data.email ? { email: "Email in use." } : { username: "Username taken." } };
  let avatarUrl = u.avatarUrl; const file = fd.get("avatar");
  if (file instanceof File && file.size) { try { avatarUrl = (await saveFile(file)).url; } catch (e) { return { error: (e as Error).message }; } }
  if (fd.get("removeAvatar") === "on") avatarUrl = null;
  await db.update(users).set({ ...p.data, avatarUrl, newsletter: fd.get("newsletter") === "on" }).where(eq(users.id, u.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Your profile has been updated." };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser(); if (!u) return { error: "Please log in." };
  if (!(await bcrypt.compare(String(fd.get("current") || ""), u.passwordHash))) return { error: "Your current password is incorrect." };
  const pw = password.safeParse(fd.get("password")); if (!pw.success) return { error: pw.error.issues[0].message };
  if (fd.get("password") !== fd.get("confirm")) return { error: "New passwords don't match." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(pw.data, 12) }).where(eq(users.id, u.id));
  return { ok: true, message: "Password changed successfully." };
}

export async function deleteAccount(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser(); if (!u) return { error: "Please log in." };
  if (fd.get("confirm") !== "DELETE") return { error: 'Type DELETE to confirm.' };
  if (u.role === "admin") return { error: "Admin accounts can't be deleted here." };
  await db.delete(users).where(eq(users.id, u.id)); await destroySession(); redirect("/?deleted=1");
}

// ---- Collections ----
export async function createCollection(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser(); if (!u) return { error: "Please log in." };
  const name = String(fd.get("name") || "").trim(); if (name.length < 2 || name.length > 80) return { error: "Collection name must be 2–80 characters." };
  let slug = slugify(name) || "collection"; let n = 1;
  while ((await db.select({ id: collections.id }).from(collections).where(and(eq(collections.userId, u.id), eq(collections.slug, slug)))).length) slug = `${slugify(name)}-${++n}`;
  const [c] = await db.insert(collections).values({ userId: u.id, name, slug: slug, description: String(fd.get("description") || "").slice(0, 500), isPublic: fd.get("isPublic") === "on" }).returning();
  const rid = Number(fd.get("recipeId")); if (rid) await db.insert(collectionRecipes).values({ collectionId: c.id, recipeId: rid }).onConflictDoNothing();
  revalidatePath("/account", "layout");
  return { ok: true, message: `Collection “${name}” created.` };
}
async function ownCollection(id: number) { const u = await getUser(); if (!u) return null; const [c] = await db.select().from(collections).where(and(eq(collections.id, id), eq(collections.userId, u.id))); return c ?? null; }
export async function updateCollection(_: FormState, fd: FormData): Promise<FormState> {
  const c = await ownCollection(Number(fd.get("id"))); if (!c) return { error: "Collection not found." };
  const name = String(fd.get("name") || "").trim(); if (name.length < 2) return { error: "Name is too short." };
  await db.update(collections).set({ name, description: String(fd.get("description") || "").slice(0, 500), isPublic: fd.get("isPublic") === "on" }).where(eq(collections.id, c.id));
  revalidatePath("/account", "layout"); return { ok: true, message: "Collection updated." };
}
export async function deleteCollection(fd: FormData) { const c = await ownCollection(Number(fd.get("id"))); if (c) await db.delete(collections).where(eq(collections.id, c.id)); redirect("/account/my-recipes/?tab=collections"); }
export async function toggleInCollection(collectionId: number, recipeId: number, add: boolean) {
  const c = await ownCollection(collectionId); if (!c) return { ok: false };
  if (add) await db.insert(collectionRecipes).values({ collectionId, recipeId, position: Date.now() % 1e9 }).onConflictDoNothing();
  else await db.delete(collectionRecipes).where(and(eq(collectionRecipes.collectionId, collectionId), eq(collectionRecipes.recipeId, recipeId)));
  revalidatePath("/account", "layout"); return { ok: true };
}

// ---- Recipe submission / editing (users + admin) ----
export async function saveRecipe(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser(); if (!u) return { error: "Please log in." };
  const staff = isStaffRole(u.role); const id = Number(fd.get("id")) || null;
  let existing: typeof recipes.$inferSelect | undefined;
  if (id) { [existing] = await db.select().from(recipes).where(eq(recipes.id, id)); if (!existing || (!staff && existing.authorId !== u.id)) return { error: "You can't edit this recipe." }; }
  const p = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
    description: z.string().trim().min(10, "Add a short description (10+ characters).").max(1000),
    prepMin: z.coerce.number().int().min(0).max(10000), cookMin: z.coerce.number().int().min(0).max(10000), additionalMin: z.coerce.number().int().min(0).max(10000).default(0),
    servings: z.coerce.number().int().min(1, "Servings must be at least 1.").max(500), yieldText: z.string().max(120).optional(),
    ingredients: z.string().trim().min(3, "Add at least one ingredient."), steps: z.string().trim().min(10, "Add at least one step."),
    notes: z.string().max(2000).optional(), cuisine: z.string().max(60).optional(), imageUrlText: z.string().max(1000).optional(),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please fix the errors below.", fieldErrors: errs(p.error) };
  const d = p.data;
  const ingredients = d.ingredients.split("\n").map(parseIngredientLine).filter(Boolean) as NonNullable<ReturnType<typeof parseIngredientLine>>[];
  const steps = d.steps.split(/\n\s*\n|\n/).map((t) => t.trim()).filter(Boolean).map((text) => ({ text }));
  let imageUrl = existing?.imageUrl ?? null;
  const file = fd.get("image");
  if (file instanceof File && file.size) { try { imageUrl = (await saveFile(file)).url; } catch (e) { return { error: (e as Error).message, fieldErrors: { image: (e as Error).message } }; } }
  else if (d.imageUrlText && /^(https:\/\/|\/media\/)/.test(d.imageUrlText)) imageUrl = d.imageUrlText;
  const diets = fd.getAll("diets").map(String).slice(0, 10);
  const catIds = fd.getAll("categories").map(Number).filter(Boolean);
  let status = existing?.status ?? "pending";
  if (staff) status = String(fd.get("status") || status);
  else if (!existing || existing.status === "rejected" || existing.status === "draft") status = fd.get("asDraft") ? "draft" : "pending";
  else if (existing.status === "published") status = "pending"; // edits to published recipes are re-moderated
  const values = {
    title: d.title, description: d.description, prepMin: d.prepMin, cookMin: d.cookMin, additionalMin: d.additionalMin, totalMin: d.prepMin + d.cookMin + d.additionalMin,
    servings: d.servings, yieldText: d.yieldText || `${d.servings} servings`, ingredients, steps, notes: d.notes || null, cuisine: d.cuisine || null, diets, imageUrl, status, updatedAt: new Date(),
    ...(staff ? { slug: slugify(String(fd.get("slug") || d.title)) || slugify(d.title), seoTitle: String(fd.get("seoTitle") || "") || null, seoDescription: String(fd.get("seoDescription") || "") || null,
      authorId: Number(fd.get("authorId")) || existing?.authorId || u.id,
      nutrition: fd.get("calories") ? { calories: Number(fd.get("calories")) || 0, fat: Number(fd.get("fat")) || 0, carbs: Number(fd.get("carbs")) || 0, protein: Number(fd.get("protein")) || 0, sodium: Number(fd.get("sodium")) || undefined, fiber: Number(fd.get("fiber")) || undefined, sugar: Number(fd.get("sugar")) || undefined, saturatedFat: Number(fd.get("saturatedFat")) || undefined, cholesterol: Number(fd.get("cholesterol")) || undefined } : existing?.nutrition ?? null } : { slug: existing?.slug ?? slugify(d.title) }),
    ...(status === "published" && !existing?.publishedAt ? { publishedAt: new Date() } : {}),
  };
  let rid = id;
  if (existing) await db.update(recipes).set(values).where(eq(recipes.id, existing.id));
  else rid = (await db.insert(recipes).values({ ...values, authorId: (values as { authorId?: number }).authorId ?? u.id }).returning())[0].id;
  if (catIds.length || fd.get("categoriesTouched")) { await db.delete(recipeCategories).where(eq(recipeCategories.recipeId, rid!)); if (catIds.length) await db.insert(recipeCategories).values(catIds.map((categoryId) => ({ recipeId: rid!, categoryId }))); }
  revalidatePath("/", "layout");
  if (staff && fd.get("from") === "admin") redirect(`/admin/recipes/${rid}?saved=1`);
  redirect(`/account/activity/?submitted=${status}`);
}
export async function deleteOwnRecipe(fd: FormData) {
  const u = await getUser(); if (!u) return; const id = Number(fd.get("id"));
  await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.authorId, u.id), inArray(recipes.status, ["draft", "pending", "rejected"])));
  redirect("/account/activity/");
}
