"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, recipes, reviews, recipePhotos, categories, collections, collectionRecipes, articles, videos, users, media, homepageSections, pages, contactMessages, siteSettings, redirects } from "@/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { issuePasswordReset } from "@/lib/password-reset";
import { normalizePath } from "@/lib/redirects";
import { importContent } from "@/lib/importer";
import { requireStaff, requireAdmin } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { refreshRecipeStats } from "@/lib/stats";
import { sendEmail } from "@/lib/email";
import { slugify } from "@/lib/utils";
import { addRedirect } from "@/lib/redirects";
import type { FormState } from "./public";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k)) || 0;
const oneOf = <T extends string>(v: string, allowed: readonly T[], fallback: T): T => (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
/** Returns the id if that row exists, else null (avoids foreign-key errors from tampered forms). */
async function existingUser(id: number) { if (!id) return null; const [r] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)); return r?.id ?? null; }
async function existingRecipe(id: number) { if (!id) return null; const [r] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.id, id)); return r?.id ?? null; }
/** Staff-entered image/media URLs: https or uploaded /media/ paths only. */
const safeUrl = (v: string) => (/^(https:\/\/|\/media\/)\S+$/.test(v) ? v : null);
/** Top-level paths used by the app itself; a CMS page with these slugs would never be reachable. */
const RESERVED_SLUGS = new Set(["recipe", "recipes", "search", "collections", "article", "articles", "kitchen-tips", "news", "videos", "video", "cook", "account", "admin", "api", "media", "contact", "sitemap-xml", "robots-txt", "favicon-svg"]);
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
  const v = { name, slug: slugify(str(fd, "slug") || name), description: str(fd, "description"), parentId: num(fd, "parentId") || null, imageUrl: safeUrl(str(fd, "imageUrl")), showInNav: fd.get("showInNav") === "on", sortOrder: num(fd, "sortOrder"), seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null };
  if (v.parentId === id && id) return { error: "A category can't be its own parent." };
  try { if (id) await db.update(categories).set(v).where(eq(categories.id, id)); else await db.insert(categories).values(v); } catch { return { error: "That slug is already in use." }; }
  return done(id ? "Category updated." : "Category created.");
}
export async function deleteCategory(fd: FormData) { await requireStaff(); const id = num(fd, "id"); await db.update(categories).set({ parentId: null }).where(eq(categories.parentId, id)); await db.delete(categories).where(eq(categories.id, id)); revalidatePath("/", "layout"); }

// ---------- collections ----------
export async function saveCollection(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff(); const id = num(fd, "id"); const name = str(fd, "name"); if (name.length < 2) return { error: "Name is required." };
  const v = { name, slug: slugify(str(fd, "slug") || name), description: str(fd, "description"), imageUrl: safeUrl(str(fd, "imageUrl")), isEditorial: true, isPublic: true, seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null };
  const ids = str(fd, "recipeIds").split(/[\s,]+/).map(Number).filter(Boolean);
  let cid = id;
  const [old] = id ? await db.select({ slug: collections.slug }).from(collections).where(eq(collections.id, id)) : [];
  try { if (id) await db.update(collections).set(v).where(eq(collections.id, id)); else cid = (await db.insert(collections).values(v).returning())[0].id; } catch { return { error: "That slug is already in use." }; }
  if (old && old.slug !== v.slug) await addRedirect(`/collections/${old.slug}/`, `/collections/${v.slug}/`);
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
  let heroUrl = safeUrl(str(fd, "heroUrl")); const f = fd.get("heroFile"); if (f instanceof File && f.size) { try { heroUrl = (await saveFile(f)).url; } catch (e) { return { error: (e as Error).message }; } }
  const status = oneOf(str(fd, "status"), ["draft", "published"] as const, "draft");
  const v = { title, slug: slugify(str(fd, "slug") || title), kind: oneOf(str(fd, "kind"), ["article", "guide", "news"] as const, "article"), dek: str(fd, "dek"), body: String(fd.get("body") || ""), heroUrl, authorId: (await existingUser(num(fd, "authorId"))) ?? u.id, status,
    relatedRecipeIds: str(fd, "relatedRecipeIds").split(/[\s,]+/).map(Number).filter(Boolean), seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null, updatedAt: new Date() };
  let aid = id;
  try {
    if (id) {
      const [cur] = await db.select().from(articles).where(eq(articles.id, id));
      await db.update(articles).set({ ...v, publishedAt: status === "published" ? cur?.publishedAt ?? new Date() : cur?.publishedAt }).where(eq(articles.id, id));
      if (cur && cur.slug !== v.slug) await addRedirect(`/article/${cur.slug}/`, `/article/${v.slug}/`);
    }
    else aid = (await db.insert(articles).values({ ...v, publishedAt: status === "published" ? new Date() : null }).returning())[0].id;
  } catch { return { error: "That slug is already in use." }; }
  revalidatePath("/", "layout"); if (!id) redirect(`/admin/articles/${aid}?saved=1`);
  return done("Article saved.");
}
export async function deleteArticle(fd: FormData) { await requireStaff(); await db.delete(articles).where(eq(articles.id, num(fd, "id"))); revalidatePath("/", "layout"); redirect("/admin/articles"); }

// ---------- videos ----------
export async function saveVideo(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireStaff(); const id = num(fd, "id"); const title = str(fd, "title"); if (title.length < 3) return { error: "Title is required." };
  let videoUrl = str(fd, "videoUrl") || null; let thumbnailUrl = safeUrl(str(fd, "thumbnailUrl"));
  try { const vf = fd.get("videoFile"); if (vf instanceof File && vf.size) videoUrl = (await saveFile(vf)).url; const tf = fd.get("thumbFile"); if (tf instanceof File && tf.size) thumbnailUrl = (await saveFile(tf)).url; } catch (e) { return { error: (e as Error).message }; }
  const status = oneOf(str(fd, "status"), ["draft", "published"] as const, "draft");
  if (videoUrl && !/^(https:\/\/|\/media\/|\/videos\/)\S+$/.test(videoUrl)) return { error: "Video URL must start with https:// (or be an uploaded file)." };
  const v = { title, slug: slugify(str(fd, "slug") || title), description: str(fd, "description"), videoUrl, thumbnailUrl, durationSec: Math.max(0, num(fd, "durationSec")), recipeId: await existingRecipe(num(fd, "recipeId")), authorId: (await existingUser(num(fd, "authorId"))) ?? u.id, status, seoTitle: str(fd, "seoTitle") || null, seoDescription: str(fd, "seoDescription") || null };
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
  const [cur] = await db.select().from(users).where(eq(users.id, id)); if (!cur) return { error: "User not found." };
  // Role or status change → end that user's existing sessions immediately.
  const bump = cur.role !== role || cur.status !== status;
  let avatarUrl = cur.avatarUrl; const file = fd.get("avatar");
  if (file instanceof File && file.size) { try { avatarUrl = (await saveFile(file)).url; } catch (e) { return { error: (e as Error).message }; } }
  if (fd.get("removeAvatar") === "on") avatarUrl = null;
  await db.update(users).set({ role, status, avatarUrl, isStaff: fd.get("isStaff") === "on", title: str(fd, "title").slice(0, 120) || null, bio: str(fd, "bio").slice(0, 1000), ...(bump ? { sessionVersion: cur.sessionVersion + 1 } : {}) }).where(eq(users.id, id));
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
  if (typeof config !== "object" || config === null || Array.isArray(config)) return { error: "Config must be a JSON object, e.g. {\"limit\": 4}." };
  const type = oneOf(str(fd, "type"), ["hero", "recipe_grid", "recipe_row", "category_tiles", "collection_feature", "article_list", "video_row", "newsletter"] as const, "recipe_grid");
  if (!str(fd, "title")) return { error: "Title is required." };
  const v = { title: str(fd, "title"), type, config, sortOrder: num(fd, "sortOrder"), enabled: fd.get("enabled") === "on" };
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
  if (RESERVED_SLUGS.has(v.slug)) return { error: `"/${v.slug}/" is used by the site itself. Please choose another URL.` };
  const [old] = id ? await db.select({ slug: pages.slug }).from(pages).where(eq(pages.id, id)) : [];
  try { if (id) await db.update(pages).set(v).where(eq(pages.id, id)); else await db.insert(pages).values(v); } catch { return { error: "Slug already in use." }; }
  if (old && old.slug !== v.slug) await addRedirect(`/${old.slug}/`, `/${v.slug}/`);
  return done("Page saved.");
}
export async function markMessage(fd: FormData) { await requireStaff(); const id = num(fd, "id"); const [m] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)); if (m) await db.update(contactMessages).set({ handled: !m.handled }).where(eq(contactMessages.id, id)); revalidatePath("/admin/messages"); }

// ---------- users: create / invite / reset ----------
export async function createUserAdmin(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const p = z.object({ name: z.string().trim().min(2, "Name is required.").max(120), email: z.string().trim().toLowerCase().email("Valid email required.").max(255),
    role: z.enum(["user", "contributor", "editor", "admin"]), title: z.string().trim().max(120).optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if ((await db.select({ id: users.id }).from(users).where(eq(users.email, p.data.email))).length) return { error: "A user with this email already exists." };
  const base = slugify(p.data.name).replace(/-/g, "") || "cook"; let username = base; let n = 1;
  while ((await db.select({ id: users.id }).from(users).where(eq(users.username, username))).length) username = `${base}${++n}`;
  // Unusable random password; the person sets their own via the emailed invitation link.
  const [u] = await db.insert(users).values({ name: p.data.name, email: p.data.email, username, role: p.data.role, title: p.data.title || null,
    isStaff: fd.get("isStaff") === "on", passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12) }).returning();
  await issuePasswordReset(u, { invite: true });
  redirect(`/admin/users/${u.id}?created=1`);
}
export async function sendResetAdmin(fd: FormData) {
  await requireAdmin(); const [u] = await db.select().from(users).where(eq(users.id, num(fd, "id")));
  if (u) await issuePasswordReset(u);
  redirect(`/admin/users/${num(fd, "id")}?reset=1`);
}

// ---------- site settings ----------
export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const social = Object.fromEntries(["Facebook", "Instagram", "Pinterest", "TikTok", "YouTube"].map((k) => [k, str(fd, `social_${k}`)]));
  for (const [k, v] of Object.entries(social)) if (v && !/^https:\/\/\S+$/.test(v)) return { error: `${k} link must start with https://` };
  const contactEmail = str(fd, "contactEmail");
  if (contactEmail && !z.string().email().safeParse(contactEmail).success) return { error: "Contact email is not valid." };
  const values: Record<string, unknown> = {
    tagline: str(fd, "tagline").slice(0, 200), footerAbout: str(fd, "footerAbout").slice(0, 500),
    newsletterTitle: str(fd, "newsletterTitle").slice(0, 120), newsletterSubtitle: str(fd, "newsletterSubtitle").slice(0, 300),
    contactEmail, social, reviewModeration: oneOf(str(fd, "reviewModeration"), ["links", "all", "none"] as const, "links"),
  };
  for (const [key, value] of Object.entries(values))
    await db.insert(siteSettings).values({ key, value }).onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  return done("Settings saved.");
}

// ---------- redirects ----------
export async function saveRedirect(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const from = normalizePath(str(fd, "fromPath")); const to = normalizePath(str(fd, "toPath"));
  if (!from || !to) return { error: "Both paths must be site-relative, e.g. /old-page/ → /new-page/." };
  if (from === to) return { error: "From and To can't be the same." };
  // Prevent loops/chains: the target must not itself be redirected.
  const [chain] = await db.select({ to: redirects.toPath }).from(redirects).where(eq(redirects.fromPath, to));
  if (chain) return { error: `"${to}" is itself redirected to "${chain.to}". Point directly to the final URL.` };
  await db.insert(redirects).values({ fromPath: from, toPath: to }).onConflictDoUpdate({ target: redirects.fromPath, set: { toPath: to } });
  return done("Redirect saved.");
}
export async function deleteRedirect(fd: FormData) { await requireStaff(); await db.delete(redirects).where(eq(redirects.id, num(fd, "id"))); revalidatePath("/admin/redirects"); }

// ---------- bulk import ----------
export async function importAdmin(_: FormState, fd: FormData): Promise<FormState> {
  await requireStaff();
  const file = fd.get("file"); let text = str(fd, "json");
  if (file instanceof File && file.size) {
    if (file.size > 5 * 1024 * 1024) return { error: "File is too large (max 5MB). Split it into smaller files." };
    text = await file.text();
  }
  if (!text) return { error: "Choose a JSON file or paste JSON." };
  let data: unknown; try { data = JSON.parse(text); } catch { return { error: "That isn't valid JSON." }; }
  const r = await importContent(data);
  revalidatePath("/", "layout");
  if (!r.created && !r.skipped && r.errors.length) return { error: "Nothing imported: " + r.errors.slice(0, 5).join(" · ") };
  return { ok: true, message: `Imported ${r.created}, skipped ${r.skipped} existing.${r.errors.length ? " Notes: " + r.errors.slice(0, 5).join(" · ") : ""}` };
}
