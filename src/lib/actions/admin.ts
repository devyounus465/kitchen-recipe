"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, recipes, reviews, recipePhotos, categories, collections, collectionRecipes, articles, videos, users, media, homepageSections, pages, contactMessages, recipeCategories } from "@/db";
import { requireStaff, requireAdmin } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { refreshRecipeStats } from "@/lib/stats";
import { sendEmail } from "@/lib/email";
import { slugify } from "@/lib/utils";
import type { FormState } from "./public";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k)) || 0;
const done = (msg = "Saved.") => { revalidatePath("/", "layout"); return { ok: true, message: msg } as FormState; };

// ---------- moderation ----------
export async function moderateRecipe(fd: FormData) {
  await requireStaff(); const id = num(fd, "id"); const decision = str(fd, "decision");
  const [r] = await db.select().from(recipes).where(eq(recipes.id, id)); if (!r) return;
  if (decision === "approve") await db.update(recipes).set({ status: "published", publishedAt: r.publishedAt ?? new Date(), rejectReason: null }).where(eq(recipes.id, id));
  else await db.update(recipes).set({ status: "rejected", rejectReason: str(fd, "reason") || "Did not meet our recipe guidelines." }).where(eq(recipes.id, id));
  if (r.authorId) { const [a] = await db.select().from(users).where(eq(users.id, r.authorId)); if (a) await sendEmail(a.email, decision === "approve" ? `Your recipe "${r.title}" is live!` : `Update on your recipe "${r.title}"`, decision === "approve" ? "Congratulations — your recipe has been published." : `Our editors couldn't publish it yet: ${str(fd, "reason") || "it did not meet our guidelines."} You can edit and resubmit from My Activity.`); }
  revalidatePath("/", "layout");
}
export async function moderateReview(fd: FormData) {
  await requireStaff(); const ids = fd.getAll("id").map(Number); const decision = str(fd, "decision");
  const rows = await db.select({ recipeId: reviews.recipeId }).from(reviews).where(inArray(reviews.id, ids));
  if (decision === "delete") await db.delete(reviews).where(inArray(reviews.id, ids));
  else await db.update(reviews).set({ status: decision === "approve" ? "approved" : "rejected" }).where(inArray(reviews.id, ids));
  for (const r of new Set(rows.map((x) => x.recipeId))) await refreshRecipeStats(r);
  revalidatePath("/", "layout");
}
export async function moderatePhoto(fd: FormData) {
  await requireStaff(); const ids = fd.getAll("id").map(Number); const decision = str(fd, "decision");
  const rows = await db.select({ recipeId: recipePhotos.recipeId }).from(recipePhotos).where(inArray(recipePhotos.id, ids));
  if (decision === "delete") await db.delete(recipePhotos).where(inArray(recipePhotos.id, ids));
  else await db.update(recipePhotos).set({ status: decision === "approve" ? "approved" : "rejected" }).where(inArray(recipePhotos.id, ids));
  for (const r of new Set(rows.map((x) => x.recipeId))) await refreshRecipeStats(r);
  revalidatePath("/", "layout");
}
export async function recipeBulk(fd: FormData) {
  await requireStaff(); const ids = fd.getAll("id").map(Number).filter(Boolean); const action = str(fd, "bulk"); if (!ids.length) return;
  if (action === "delete") await db.delete(recipes).where(inArray(recipes.id, ids));
  else if (["published", "draft", "pending"].includes(action)) { await db.update(recipes).set({ status: action }).where(inArray(recipes.id, ids)); if (action === "published") for (const id of ids) await db.update(recipes).set({ publishedAt: new Date() }).where(and(eq(recipes.id, id))); }
  revalidatePath("/", "layout");
}
export async function deleteRecipe(fd: FormData) { await requireStaff(); await db.delete(recipes).where(eq(recipes.id, num(fd, "id"))); revalidatePath("/", "layout"); redirect("/admin/recipes?deleted=1"); }

// ---------- categories ----------
export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff(); const id = num(fd, "id"); const name = str(fd, "name"); if (name.length < 2) return { error: "Name is required." };
  const v = { name, slug: slugify(str(fd, "slug") || name), description: str(fd, "description"), parentId: num(fd, "parentId") || null, imageUrl: str(fd, "imageUrl") || null, showInNav: fd.get("showInNav") === "on", sortOrder: num(fd, "sortOrder"), seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null };
  if (v.parentId === id && id) return { error: "A category can't be its own parent." };
  try { if (id) await db.update(categories).set(v).where(eq(categories.id, id)); else await db.insert(categories).values(v); } catch { return { error: "That slug is already in use." }; }
  return done(id ? "Category updated." : "Category created.");
}
export async function deleteCategory(fd: FormData) { await requireStaff(); const id = num(fd, "id"); await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id)); await db.delete(categories).where(eq(categories.id, id)); revalidatePath("/", "layout"); }

// ---------- collections ----------
export async function saveCollection(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff(); const id = num(fd, "id"); const name = str(fd, "name"); if (name.length < 2) return { error: "Name is required." };
  const v = { name, slug: slugify(str(fd, "slug") || name), description: str(fd, "description"), imageUrl: str(fd, "imageUrl") || null, isEditorial: true, isPublic: true, seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null };
  const ids = str(fd, "recipeIds").split(/[\s,]+/).map(Number).filter(Boolean);
  let cid = id;
  try { if (id) await db.update(collections).set(v).where(eq(collections.id, id)); else cid = (await db.insert(collections).values(v).returning())[0].id; } catch { return { error: "That slug is already in use." }; }
  await db.delete(collectionRecipes).where(eq(collectionRecipes.collectionId, cid));
  const valid = ids.length ? (await db.select({ id: recipes.id }).from(recipes).where(inArray(recipes.id, ids))).map((r) => r.id) : [];
  if (valid.length) await db.insert(collectionRecipes).values(ids.filter((i) => valid.includes(i)).map((recipeId, position) => ({ collectionId: cid, recipeId, position })));
  revalidatePath("/", "layout"); if (!id) redirect(`/admin/collections/${cid}?saved=1`);
  return done("Collection saved.");
}
export async function deleteCollectionAdmin(fd: FormData) { await requireStaff(); await db.delete(collections).where(eq(collections.id, num(fd, "id"))); revalidatePath("/", "layout"); redirect("/admin/collections"); }

// ---------- articles ----------
export async function saveArticle(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireStaff(); const id = num(fd, "id"); const title = str(fd, "title"); if (title.length < 3) return { error: "Title is required." };
  let heroUrl = str(fd, "heroUrl") || null; const f = fd.get("heroFile"); if (f instanceof File && f.size) { try { heroUrl = (await saveFile(f)).url; } catch (e) { return { error: (e as Error).message }; } }
  const status = str(fd, "status") || "draft";
  const v = { title, slug: slugify(str(fd, "slug") || title), kind: str(fd, "kind") || "article", dek: str(fd, "dek"), body: String(fd.get("body") || ""), heroUrl, authorId: num(fd, "authorId") || u.id, status,
    relatedRecipeIds: str(fd, "relatedRecipeIds").split(/[\s,]+/).map(Number).filter(Boolean), seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null, updatedAt: new Date() };
  let aid = id;
  try {
    if (id) { const [cur] = await db.select().from(articles).where(eq(articles.id, id)); await db.update(articles).set({ ...v, publishedAt: status === "published" ? cur?.publishedAt ?? new Date() : cur?.publishedAt }).where(eq(articles.id, id)); }
    else aid = (await db.insert(articles).values({ ...v, publishedAt: status === "published" ? new Date() : null }).returning())[0].id;
  } catch { return { error: "That slug is already in use." }; }
  revalidatePath("/", "layout"); if (!id) redirect(`/admin/articles/${aid}?saved=1`);
  return done("Article saved.");
}
export async function deleteArticle(fd: FormData) { await requireStaff(); await db.delete(articles).where(eq(articles.id, num(fd, "id"))); revalidatePath("/", "layout"); redirect("/admin/articles"); }

// ---------- videos ----------
export async function saveVideo(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireStaff(); const id = num(fd, "id"); const title = str(fd, "title"); if (title.length < 3) return { error: "Title is required." };
  let videoUrl = str(fd, "videoUrl") || null; let thumbnailUrl = str(fd, "thumbnailUrl") || null;
  try { const vf = fd.get("videoFile"); if (vf instanceof File && vf.size) videoUrl = (await saveFile(vf)).url; const tf = fd.get("thumbFile"); if (tf instanceof File && tf.size) thumbnailUrl = (await saveFile(tf)).url; } catch (e) { return { error: (e as Error).message }; }
  const status = str(fd, "status") || "draft";
  const v = { title, slug: slugify(str(fd, "slug") || title), description: str(fd, "description"), videoUrl, thumbnailUrl, durationSec: num(fd, "durationSec"), recipeId: num(fd, "recipeId") || null, authorId: num(fd, "authorId") || u.id, status, seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null };
  let vid = id;
  if (id) { const [cur] = await db.select().from(videos).where(eq(videos.id, id)); await db.update(videos).set({ ...v, publishedAt: status === "published" ? cur?.publishedAt ?? new Date() : cur?.publishedAt }).where(eq(videos.id, id)); }
  else vid = (await db.insert(videos).values({ ...v, publishedAt: status === "published" ? new Date() : null }).returning())[0].id;
  revalidatePath("/", "layout"); if (!id) redirect(`/admin/videos/${vid}?saved=1`);
  return done("Video saved.");
}
export async function deleteVideo(fd: FormData) { await requireStaff(); await db.delete(videos).where(eq(videos.id, num(fd, "id"))); revalidatePath("/", "layout"); redirect("/admin/videos"); }

// ---------- users ----------
export async function updateUserAdmin(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin(); const id = num(fd, "id");
  const role = str(fd, "role"); const status = str(fd, "status");
  if (id === me.id && (role !== "admin" || status !== "active")) return { error: "You can't demote or ban yourself." };
  if (!["user", "contributor", "editor", "admin"].includes(role) || !["active", "banned"].includes(status)) return { error: "Invalid role or status." };
  await db.update(users).set({ role, status, isStaff: fd.get("isStaff") === "on", title: str(fd, "title") || null, bio: str(fd, "bio") }).where(eq(users.id, id));
  return done("User updated.");
}
export async function deleteUserAdmin(fd: FormData) { const me = await requireAdmin(); const id = num(fd, "id"); if (id !== me.id) await db.delete(users).where(eq(users.id, id)); redirect("/admin/users"); }

// ---------- media ----------
export async function uploadMedia(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireStaff(); const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one file." };
  const errors: string[] = [];
  for (const f of files) { try { const s = await saveFile(f); await db.insert(media).values({ ...s, alt: str(fd, "alt"), uploadedBy: u.id }); } catch (e) { errors.push(`${f.name}: ${(e as Error).message}`); } }
  revalidatePath("/admin/media");
  return errors.length ? { error: errors.join(" ") } : { ok: true, message: `${files.length} file${files.length > 1 ? "s" : ""} uploaded.` };
}
export async function deleteMedia(fd: FormData) { await requireStaff(); await db.delete(media).where(eq(media.id, num(fd, "id"))); revalidatePath("/admin/media"); }

// ---------- homepage ----------
export async function saveSection(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff(); const id = num(fd, "id");
  let config: Record<string, unknown> = {};
  try { config = JSON.parse(String(fd.get("config") || "{}")); } catch { return { error: "Config must be valid JSON." }; }
  const v = { title: str(fd, "title"), type: str(fd, "type"), config, sortOrder: num(fd, "sortOrder"), enabled: fd.get("enabled") === "on" };
  if (id) await db.update(homepageSections).set(v).where(eq(homepageSections.id, id)); else await db.insert(homepageSections).values(v);
  return done("Section saved.");
}
export async function moveSection(fd: FormData) {
  await requireStaff(); const id = num(fd, "id"); const dir = str(fd, "dir");
  const all = await db.select().from(homepageSections).orderBy(homepageSections.sortOrder);
  const i = all.findIndex((s) => s.id === id); const j = dir === "up" ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  for (const [k, s] of all.entries()) await db.update(homepageSections).set({ sortOrder: k }).where(eq(homepageSections.id, s.id));
  revalidatePath("/", "layout");
}
export async function toggleSection(fd: FormData) { await requireStaff(); const id = num(fd, "id"); const [s] = await db.select().from(homepageSections).where(eq(homepageSections.id, id)); if (s) await db.update(homepageSections).set({ enabled: !s.enabled }).where(eq(homepageSections.id, id)); revalidatePath("/", "layout"); }
export async function deleteSection(fd: FormData) { await requireStaff(); await db.delete(homepageSections).where(eq(homepageSections.id, num(fd, "id"))); revalidatePath("/", "layout"); }

// ---------- pages ----------
export async function savePage(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff(); const id = num(fd, "id"); const title = str(fd, "title"); if (!title) return { error: "Title is required." };
  const v = { title, slug: slugify(str(fd, "slug") || title), body: String(fd.get("body") || ""), seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null, updatedAt: new Date() };
  try { if (id) await db.update(pages).set(v).where(eq(pages.id, id)); else await db.insert(pages).values(v); } catch { return { error: "Slug already in use." }; }
  return done("Page saved.");
}
export async function markMessage(fd: FormData) { await requireStaff(); const id = num(fd, "id"); const [m] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)); if (m) await db.update(contactMessages).set({ handled: !m.handled }).where(eq(contactMessages.id, id)); revalidatePath("/admin/messages"); }
export async function addRecipeToCategory(fd: FormData) { await requireStaff(); await db.insert(recipeCategories).values({ recipeId: num(fd, "recipeId"), categoryId: num(fd, "categoryId") }).onConflictDoNothing(); }
