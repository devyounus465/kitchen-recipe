import "./env";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "../src/db/schema";
import { CATEGORY_TREE, STAFF, COMMUNITY, RECIPES, ARTICLES, REVIEW_TEXT, DEMO_VIDEO_RECIPES, U } from "./seed-data";
import { slugify, parseQty } from "../src/lib/utils";

// Safety: seeding DELETES all content. On production servers require an explicit --force.
const PROD = process.env.NODE_ENV === "production";
if (PROD && !process.argv.includes("--force")) {
  console.error("✖ Refusing to seed: this deletes ALL recipes, users and content.\n  If you really want demo data on this server, run:  npm run db:seed -- --force");
  process.exit(1);
}
const client = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
const db = drizzle(client, { schema: s });
let seed = 42; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

await client.unsafe(`TRUNCATE users, categories, recipes, articles, videos, collections, homepage_sections, pages, media, contact_messages, email_outbox, newsletter_subscribers RESTART IDENTITY CASCADE`);

// Local/demo: well-known passwords. Production (--force): random passwords, admin's printed once.
const adminPassword = PROD ? crypto.randomBytes(12).toString("base64url") : "Admin123!";
const hash = await bcrypt.hash(PROD ? crypto.randomBytes(24).toString("hex") : "Password123!", 10);
const adminHash = await bcrypt.hash(adminPassword, 10);
const [admin] = await db.insert(s.users).values({ email: "admin@simmerly.test", passwordHash: adminHash, name: "Site Admin", username: "admin", role: "admin", isStaff: false, createdAt: daysAgo(120) }).returning();
const staff = await db.insert(s.users).values(STAFF.map((p, i) => ({ email: `${p.username}@simmerly.test`, passwordHash: hash, name: p.name, username: p.username, bio: p.bio, title: p.title, role: "editor", isStaff: true, createdAt: daysAgo(110 - i) }))).returning();
const community = await db.insert(s.users).values(COMMUNITY.map(([name, username], i) => ({ email: `${username}@example.test`, passwordHash: hash, name, username, role: i < 4 ? "contributor" : "user", bio: "Home cook who loves feeding friends and family.", location: pick(["Austin, TX", "Portland, OR", "Columbus, OH", "Denver, CO", "Raleigh, NC", "Toronto, ON"]), createdAt: daysAgo(Math.floor(rnd() * 90) + 1) }))).returning();

// Categories
const catBySlug = new Map<string, number>();
let order = 0;
for (const g of CATEGORY_TREE) {
  const [parent] = await db.insert(s.categories).values({ slug: g.slug, name: g.name, description: g.desc, showInNav: true, sortOrder: order++ }).returning();
  catBySlug.set(g.slug, parent.id);
  for (const [slug, name] of g.children) {
    const [c] = await db.insert(s.categories).values({ slug, name, parentId: parent.id, showInNav: true, sortOrder: order++, description: `Our best ${name.toLowerCase()} recipes, tested by home cooks and rated by our community.` }).returning();
    catBySlug.set(slug, c.id);
  }
}

// Recipes
const recipeIds: number[] = [];
for (const [i, r] of RECIPES.entries()) {
  const author = i % 3 === 0 ? staff[i % staff.length] : community[i % community.length];
  const pub = daysAgo(Math.floor(rnd() * 80) + 2);
  const [row] = await db.insert(s.recipes).values({
    slug: slugify(r.t), title: r.t, description: r.d, imageUrl: U(r.img), authorId: author.id, status: "published",
    prepMin: r.p, cookMin: r.c, additionalMin: r.a ?? 0, totalMin: r.p + r.c + (r.a ?? 0), servings: r.s, yieldText: r.y ?? `${r.s} servings`,
    ingredients: r.ing.map((line) => { const [q, unit, item, note] = line.split("|"); return { qty: parseQty(q), unit: unit ?? "", item: item ?? "", note: note || undefined }; }),
    steps: r.st.map((text) => ({ text })), notes: r.note ?? null, diets: r.diets ?? [], cuisine: r.cu ?? null,
    nutrition: { calories: r.n[0], fat: r.n[1], carbs: r.n[2], protein: r.n[3], saturatedFat: Math.round(r.n[1] * 0.4), sodium: 300 + Math.round(rnd() * 600), fiber: Math.round(r.n[2] * 0.08), sugar: Math.round(r.n[2] * 0.25), cholesterol: Math.round(rnd() * 120) },
    publishedAt: pub, createdAt: pub, updatedAt: pub, viewCount: Math.floor(rnd() * 5000),
  }).returning();
  recipeIds.push(row.id);
  const cids = [...new Set(r.cats.map((c) => catBySlug.get(c)).filter(Boolean) as number[])];
  if (cids.length) await db.insert(s.recipeCategories).values(cids.map((categoryId) => ({ recipeId: row.id, categoryId })));
}
// one pending submission for moderation demo
await db.insert(s.recipes).values({ slug: "grandmas-cornbread", title: "Grandma's Skillet Cornbread", description: "Crispy-edged buttermilk cornbread baked in cast iron, just like my grandmother made it.", authorId: community[2].id, status: "pending", prepMin: 10, cookMin: 25, totalMin: 35, servings: 8,
  ingredients: [{ qty: 1, unit: "cup", item: "yellow cornmeal" }, { qty: 1, unit: "cup", item: "all-purpose flour" }, { qty: 1, unit: "cup", item: "buttermilk" }, { qty: 2, unit: "", item: "eggs" }, { qty: 4, unit: "tablespoons", item: "butter" }],
  steps: [{ text: "Heat butter in a cast-iron skillet in a 425°F oven." }, { text: "Mix dry and wet ingredients separately, then combine." }, { text: "Pour into the hot skillet and bake 20 to 25 minutes." }], imageUrl: U("1509440159596-0249088772ff") });

// Reviews
const allUsers = [...community, ...staff];
for (const rid of recipeIds) {
  const n = 3 + Math.floor(rnd() * 8);
  const shuffled = [...allUsers].sort(() => rnd() - 0.5).slice(0, n);
  for (const u of shuffled) {
    const roll = rnd(); const rating = roll < 0.6 ? 5 : roll < 0.85 ? 4 : roll < 0.94 ? 3 : roll < 0.98 ? 2 : 1;
    const d = daysAgo(Math.floor(rnd() * 60));
    await db.insert(s.reviews).values({ recipeId: rid, userId: u.id, rating, body: pick(REVIEW_TEXT[rating]), helpfulCount: Math.floor(rnd() * 40), createdAt: d, updatedAt: d });
  }
}
// pending review for moderation demo
await db.insert(s.reviews).values({ recipeId: recipeIds[5], userId: admin.id, rating: 5, body: "Pending review awaiting moderation — great burger!", status: "pending" }).onConflictDoNothing();
// UGC photos
for (let i = 0; i < 24; i++) {
  const ri = Math.floor(rnd() * RECIPES.length);
  await db.insert(s.recipePhotos).values({ recipeId: recipeIds[ri], userId: pick(community).id, url: U(RECIPES[ri].img, 600), status: i < 20 ? "approved" : "pending", caption: "Made this tonight!" });
}
// Rating stats
await client.unsafe(`UPDATE recipes r SET rating_avg = COALESCE(x.avg,0), rating_count = COALESCE(x.cnt,0), review_count = COALESCE(x.withbody,0)
  FROM (SELECT recipe_id, AVG(rating)::real avg, COUNT(*) cnt, COUNT(*) FILTER (WHERE body <> '') withbody FROM reviews WHERE status='approved' GROUP BY recipe_id) x WHERE x.recipe_id = r.id`);
await client.unsafe(`UPDATE recipes r SET photo_count = (SELECT COUNT(*) FROM recipe_photos p WHERE p.recipe_id=r.id AND p.status='approved')`);

// Saves + personal collections
for (const u of community) {
  const ids = [...recipeIds].sort(() => rnd() - 0.5).slice(0, 4 + Math.floor(rnd() * 6));
  await db.insert(s.savedRecipes).values(ids.map((recipeId) => ({ userId: u.id, recipeId, createdAt: daysAgo(Math.floor(rnd() * 30)) })));
}
await client.unsafe(`UPDATE recipes r SET save_count = (SELECT COUNT(*) FROM saved_recipes s WHERE s.recipe_id=r.id)`);
const [pc] = await db.insert(s.collections).values({ userId: community[0].id, slug: "sunday-suppers", name: "Sunday Suppers", description: "Slow, cozy dinners for the weekend.", isPublic: true }).returning();
await db.insert(s.collectionRecipes).values([8, 25, 28].map((i, p) => ({ collectionId: pc.id, recipeId: recipeIds[i], position: p })));

// Editorial collections
const EC: [string, string, string, number[]][] = [
  ["Quick Weeknight Dinners", "Dinner on the table in 30 minutes or less.", "1600891964092-4316c288032e", [1, 2, 6, 11, 24, 36]],
  ["Our Best Baking Recipes", "Cookies, cakes, breads and pies our test kitchen can't stop making.", "1578985545062-69928b1d9587", [0, 12, 20, 27, 33, 34]],
  ["Plant-Powered Favorites", "Vegetarian and vegan recipes even meat-lovers request.", "1546069901-ba9599a7e63c", [9, 18, 22, 23, 26, 38]],
  ["Game Day Spread", "Wings, dips and handhelds built for the big game.", "1567620832903-9fc6debc209f", [5, 10, 17, 30, 31, 32]],
  ["Cozy Soups & Stews", "Warming bowls for chilly nights.", "1547592166-23ac45744acd", [8, 14, 26, 18]],
  ["Brunch at Home", "Pancakes, French toast and everything in between.", "1484723091739-30a097e8f929", [3, 13, 15, 16, 27, 37]],
];
for (const [name, desc, img, idx] of EC) {
  const [c] = await db.insert(s.collections).values({ slug: slugify(name), name, description: desc, imageUrl: U(img), isEditorial: true, isPublic: true }).returning();
  await db.insert(s.collectionRecipes).values(idx.filter((i) => recipeIds[i]).map((i, p) => ({ collectionId: c.id, recipeId: recipeIds[i], position: p })));
}

// Articles
const articleIds: number[] = [];
for (const [i, a] of ARTICLES.entries()) {
  const [row] = await db.insert(s.articles).values({ slug: slugify(a.title), kind: a.kind, title: a.title, dek: a.dek, body: a.body, heroUrl: U(a.img), authorId: staff[a.author].id, relatedRecipeIds: a.related.map((x) => recipeIds[x]).filter(Boolean), status: "published", publishedAt: daysAgo(i * 4 + 1) }).returning();
  articleIds.push(row.id);
}

// Videos (thumbnails only; licensed video files supplied by client / uploaded via CMS)
// Demo videos: original step-by-step clips generated by scripts/make-demo-videos.ts (public/videos/).
for (const [i, ri] of DEMO_VIDEO_RECIPES.entries()) {
  const r = RECIPES[ri]; const slug = slugify(r.t);
  await db.insert(s.videos).values({ slug, title: `How to Make ${r.t}`, description: `Our test kitchen walks through ${r.t.toLowerCase()} step by step. ${r.d}`, thumbnailUrl: U(r.img), durationSec: Math.round((r.st.length + 1) * 4.5), recipeId: recipeIds[ri], authorId: staff[i % 3].id, status: "published", publishedAt: daysAgo(i * 3 + 1), videoUrl: `/videos/${slug}.mp4` });
}

// Homepage sections (CMS-managed)
await db.insert(s.homepageSections).values([
  { type: "hero", title: "Featured", config: { recipeIds: [recipeIds[7], recipeIds[0], recipeIds[6], recipeIds[19]] }, sortOrder: 0 },
  { type: "recipe_grid", title: "The Latest", config: { sort: "latest", limit: 8 }, sortOrder: 1 },
  { type: "category_tiles", title: "Explore Our Most Popular Categories", config: { limit: 8 }, sortOrder: 2 },
  { type: "collection_feature", title: "Quick Weeknight Dinners", config: { collectionSlug: "quick-weeknight-dinners", subtitle: "Dinner on the table in 30 minutes or less.", limit: 4 }, sortOrder: 3 },
  { type: "article_list", title: "Kitchen Tips", config: { limit: 4 }, sortOrder: 4 },
  { type: "recipe_row", title: "Top-Rated Recipes", config: { sort: "rating", limit: 4 }, sortOrder: 5 },
  { type: "video_row", title: "Watch & Cook", config: { limit: 4 }, sortOrder: 6 },
  { type: "recipe_row", title: "Comfort Food Classics", config: { categorySlug: "soups-and-stews", limit: 4 }, sortOrder: 7 },
  { type: "newsletter", title: "Get our best recipes delivered", config: { subtitle: "Sign up for the Simmerly Daily Dish newsletter." }, sortOrder: 8 },
]);

// Static pages
await db.insert(s.pages).values([
  { slug: "about-us", title: "About Us", body: "## Food, friends and recipe inspiration\nSimmerly is a community of home cooks sharing recipes, reviews and photos. Every recipe on our site is rated and reviewed by people who have actually made it.\n\n## Our test kitchen\nOur editors and test kitchen develop, test and photograph recipes so you can cook with confidence.\n\n## Our community\nMillions of home cooks contribute reviews, tips and photos. Join us by creating a free account — save recipes, build collections and share your own creations.\n\n## Editorial guidelines\nRecipes are tested at least three times. Nutrition information is estimated using standard databases and is provided as a guide." },
  { slug: "privacy-policy", title: "Privacy Policy", body: "_Last updated: November 2026_\n\n## Information we collect\nWe collect the information you provide when you create an account (name, email, password hash), content you submit (recipes, reviews, photos) and basic usage data.\n\n## How we use it\nTo operate the site, personalize your experience, moderate content and send emails you request.\n\n## Your choices\nYou can edit or delete your account information from Account Settings at any time.\n\n## Contact\nQuestions? Use our Contact page." },
  { slug: "terms-of-service", title: "Terms of Service", body: "_Last updated: November 2026_\n\n## Using Simmerly\nBy using this site you agree to these terms.\n\n## Your content\nYou retain ownership of recipes, reviews and photos you submit and grant us a licence to display them on Simmerly.\n\n## Community guidelines\nBe kind. Reviews must be about the recipe. We may remove content that violates these guidelines.\n\n## Disclaimer\nRecipes and nutrition information are provided for informational purposes." },
]);
await db.insert(s.contactMessages).values({ name: "Laura P.", email: "laura@example.test", subject: "Recipe question", message: "Can the lasagna be frozen before baking?" });
if (PROD) console.log(`\nAdmin login: admin@simmerly.test / ${adminPassword}\n(Save it now; it is not shown again. Change it after logging in.)\n`);
console.log(`Seeded: ${recipeIds.length} recipes, ${articleIds.length} articles, ${allUsers.length + 1} users`);
await client.end();
