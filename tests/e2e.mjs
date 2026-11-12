// End-to-end smoke test: run against a running server (npm start) with seeded data.
//   BASE_URL=http://localhost:3000 node tests/e2e.mjs
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const req = createRequire(import.meta.url);
let PW; try { PW = req("playwright"); } catch { PW = req(execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = PW;
const BASE = process.env.BASE_URL || "http://localhost:3000";
const DIR = path.dirname(fileURLToPath(import.meta.url));
// Wait for hydration after every navigation so interactions use the JS path.
const patch = (p) => { const g = p.goto.bind(p); p.goto = (u, o) => g(u, { waitUntil: "networkidle", ...o }); return p; };
const results = []; let failed = 0;
async function step(name, fn) {
  try { await fn(); results.push(["PASS", name]); }
  catch (e) { failed++; results.push(["FAIL", name, String(e.message || e).split("\n")[0]]); }
}
const expect = (c, msg) => { if (!c) throw new Error(msg); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
// Remote demo photos may be unreachable from CI; stub them so tests are deterministic.
await ctx.route("**/images.unsplash.com/**", (r) => r.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"/>' }));
ctx.setDefaultTimeout(10000);
const page = patch(await ctx.newPage());
const pageErrors = []; page.on("pageerror", (e) => pageErrors.push(e.message));
const stamp = Date.now(); const email = `e2e${stamp}@example.test`; const pw = "Testing123";

// 1. Templates return 200
const templates = ["/", "/recipes/", "/recipes/1/dinners/", "/search/?q=chicken", "/search/?ingredient=garlic&maxTime=30&diet=gluten-free&sort=rating",
  "/recipe/1/chewy-brown-butter-chocolate-chip-cookies/", "/collections/", "/collections/quick-weeknight-dinners/", "/kitchen-tips/", "/news/", "/articles/",
  "/article/how-to-brown-butter-and-why-you-should/", "/videos/", "/video/1/how-to-make-fluffy-buttermilk-pancakes/", "/cook/maya-thornton/", "/about-us/", "/contact/",
  "/privacy-policy/", "/terms-of-service/", "/account/login/", "/account/register/", "/account/forgot-password/", "/sitemap.xml", "/robots.txt"];
for (const t of templates) await step(`GET ${t} → 200`, async () => { const r = await page.goto(BASE + t); expect(r.status() === 200, `status ${r.status()}`); });
await step("Unknown URL → 404 page", async () => { const r = await page.goto(BASE + "/no-such-page-xyz/"); expect(r.status() === 404, `status ${r.status()}`); expect(await page.getByText("can't find that page").count(), "404 copy missing"); });
await step("Wrong slug → canonical redirect", async () => { await page.goto(BASE + "/recipe/1/wrong-slug/"); expect(page.url().includes("chewy-brown-butter"), page.url()); });
await step("Account pages require login", async () => { await page.goto(BASE + "/account/my-recipes/"); expect(page.url().includes("/account/login"), page.url()); });
await step("Admin requires login", async () => { await page.goto(BASE + "/admin"); expect(page.url().includes("/account/login"), page.url()); });

// 2. Internal link crawl (homepage + nav) — no dead links
await step("No dead internal links from homepage", async () => {
  await page.goto(BASE + "/");
  const hrefs = [...new Set(await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href"))))].filter((h) => !h.startsWith("/api"));
  const bad = [];
  for (const h of hrefs) { const r = await ctx.request.get(BASE + h, { maxRedirects: 5 }); if (r.status() >= 400) bad.push(`${h} (${r.status()})`); }
  expect(!bad.length, `dead: ${bad.join(", ")}`); results.push(["INFO", `checked ${hrefs.length} internal links`]);
});

// 3. Mega menu + search
await step("Mega-menu opens on hover", async () => { await page.goto(BASE + "/"); await page.hover("nav[aria-label=Main] >> text=Dinners"); await page.waitForTimeout(300); expect(await page.locator("text=View All Dinners").first().isVisible(), "dropdown not visible"); });
await step("Search by name returns DB results", async () => { await page.goto(BASE + "/search/?q=salmon"); expect(await page.getByText("Honey Soy Glazed Salmon").count(), "salmon missing"); });
await step("Search by ingredient filter", async () => { await page.goto(BASE + "/search/?ingredient=chickpeas"); const t = await page.locator("main h3").allTextContents(); expect(t.length >= 2 && t.every((x) => /Curry|Buddha/.test(x)), t.join("|")); });
await step("Diet + time filters narrow results", async () => { await page.goto(BASE + "/search/?diet=vegan&maxTime=20"); const t = await page.locator("main h3").allTextContents(); expect(t.length >= 1, "no results"); expect(!t.some((x) => /Burger|Steak/.test(x)), t.join("|")); });
await step("Empty search state", async () => { await page.goto(BASE + "/search/?q=zzzxqv"); expect(await page.getByText("couldn't find any matches").count(), "empty state missing"); });

// 4. Registration + login/logout
await step("Register new account", async () => {
  await page.goto(BASE + "/account/register/");
  await page.fill("#name", "E2E Tester"); await page.fill("#email", email); await page.fill("#password", pw); await page.check("input[name=terms]");
  await page.click("main button[type=submit]"); await page.waitForURL(/my-recipes/); expect(await page.getByText("Welcome to Simmerly").count(), "welcome missing");
});
await step("Register validation errors", async () => {
  const p2 = patch(await browser.newPage()); await p2.goto(BASE + "/account/register/"); await p2.fill("#name", "X"); await p2.fill("#email", "bad"); await p2.fill("#password", "short"); await p2.click("main button[type=submit]");
  await p2.waitForSelector("[role=alert]"); expect(await p2.getByText("valid email").count(), "no email error"); await p2.close();
});
// 5. Save, collection, review, photo
const recipePath = "/recipe/6/diner-style-smash-burgers/";
await step("Save recipe (heart)", async () => { await page.goto(BASE + recipePath); await page.locator("main button:has-text('Save')").first().click(); await page.getByText("Saved to My Recipes").waitFor(); });
await step("Saved recipe shows in My Recipes", async () => { await page.goto(BASE + "/account/my-recipes/"); expect(await page.getByText("Diner-Style Smash Burgers").count(), "not in saved"); });
await step("Create collection from saved recipe", async () => {
  await page.getByRole("button", { name: "Add to collection" }).first().click(); await page.getByRole("button", { name: "+ New collection" }).click(); await page.fill("main input[name=name]", "My Burgers"); await page.getByRole("button", { name: "Create Collection" }).click(); await page.waitForTimeout(800);
  await page.goto(BASE + "/account/my-recipes/?tab=collections"); await page.locator("main a", { hasText: "My Burgers" }).click(); await page.waitForURL(/account\/collections\/\d+/); expect(await page.getByText("Diner-Style Smash Burgers").count(), "recipe not in collection");
});
await step("Serving scaler 2x doubles quantities", async () => {
  await page.goto(BASE + recipePath); const before = await page.locator("#ingredients li").first().innerText(); await page.click("#ingredients button:has-text('2x')");
  const after = await page.locator("#ingredients li").first().innerText(); expect(before.startsWith("1 ½") && after.startsWith("3"), `${before} → ${after}`);
});
await step("Rate & review recipe", async () => {
  await page.goto(BASE + recipePath); await page.click("[aria-label='4 stars']"); await page.fill("#rv-body", "E2E review: crispy edges, great sauce."); await page.click("#review-form button[type=submit]");
  await page.getByText("Thanks for your review!").waitFor(); await page.goto(BASE + recipePath + "?sort=newest"); expect(await page.getByText("E2E review: crispy edges").count(), "review not listed");
});
await step("Review sorting (lowest first)", async () => { await page.goto(BASE + recipePath + "?sort=lowest"); const first = await page.locator("#reviews li [role=img]").first().getAttribute("aria-label"); expect(/Rated [1-4]/.test(first || ""), first); });
await step("Helpful vote toggles", async () => { const b = page.locator("#reviews button:has-text('Helpful')").nth(1); const t1 = await b.innerText(); await b.click(); await page.waitForTimeout(800); const t2 = await b.innerText(); expect(t1 !== t2, `${t1} = ${t2}`); });
await step("Upload recipe photo (goes to moderation)", async () => {
  await page.goto(BASE + recipePath); await page.click("#photos button:has-text('Add Photo')"); await page.setInputFiles("#ph", path.join(DIR, "fixture.jpg")); await page.click("#photos button:has-text('Upload')");
  await page.getByText("It will appear once approved").waitFor();
});
// 6. Recipe submission
await step("Submit a recipe", async () => {
  await page.goto(BASE + "/account/submit-recipe/");
  await page.fill("#rf-title", `E2E Lemon Bars ${stamp}`); await page.fill("#rf-desc", "Bright, tangy lemon bars with a buttery shortbread crust.");
  await page.fill("textarea[name=ingredients]", "1 cup butter, softened\n2 cups all-purpose flour\n4 eggs\n1 1/2 cups sugar\n1/3 cup lemon juice");
  await page.fill("textarea[name=steps]", "Bake the crust at 350°F for 20 minutes.\nWhisk filling and pour over crust; bake 20 minutes more.");
  await page.check("input[name=categories] >> nth=0"); await page.click("button:has-text('Submit Recipe')"); await page.waitForURL(/activity/);
  expect(await page.getByText("waiting for review").count(), "no confirmation");
});
await step("Edit own submitted recipe", async () => { await page.locator("main a:text-is('Edit')").first().click(); await page.fill("#rf-servings", "16"); await page.click("button:has-text('Save & Resubmit')"); await page.waitForURL(/activity/); });
await step("Update profile settings", async () => { await page.goto(BASE + "/account/settings/"); await page.fill("#s-bio", "I test recipes for a living."); await page.click("button:has-text('Save Changes')"); await page.getByText("profile has been updated").waitFor(); });
await step("Activity history lists contributions", async () => { await page.goto(BASE + "/account/activity/"); expect(await page.getByText(`E2E Lemon Bars ${stamp}`).count() && await page.getByText("crispy edges").count(), "activity incomplete"); });
await step("Logout", async () => { await page.goto(BASE + "/"); await page.click("header button:has(svg.lucide-chevron-down)"); await page.click("text=Log Out"); await page.waitForURL(/loggedout/); expect(await page.locator("header >> text=Log In").first().isVisible(), "still logged in"); });
await step("Login with wrong password fails", async () => { await page.goto(BASE + "/account/login/"); await page.fill("#email", email); await page.fill("#password", "nope12345"); await page.click("main button[type=submit]"); await page.getByText("Incorrect email or password").waitFor(); });
await step("Login", async () => { await page.fill("#password", pw); await page.click("main button[type=submit]"); await page.waitForURL(/my-recipes/); });
// 7. Password recovery (reads reset link from admin outbox)
const admin = await browser.newContext(); await admin.route("**/images.unsplash.com/**", (r) => r.fulfill({ contentType: "image/svg+xml", body: "<svg xmlns='http://www.w3.org/2000/svg'/>" }));
admin.setDefaultTimeout(10000);
const ap = patch(await admin.newPage());
await step("Admin login", async () => { await ap.goto(BASE + "/account/login/?next=/admin"); await ap.fill("#email", "admin@simmerly.test"); await ap.fill("#password", "Admin123!"); await ap.click("main button[type=submit]"); await ap.waitForURL((u) => u.pathname.startsWith("/admin")); expect(await ap.getByText("Published recipes").count(), "dashboard missing"); });
await step("Password recovery end-to-end", async () => {
  const p3 = patch(await browser.newPage()); await p3.goto(BASE + "/account/forgot-password/"); await p3.fill("#email", email); await p3.click("main button[type=submit]"); await p3.getByText("we've sent a password reset link").waitFor();
  await ap.goto(BASE + "/admin/outbox"); const body = await ap.locator("pre").first().innerText(); const link = body.match(/https?:\/\/\S+reset-password\/\?token=\w+/)?.[0]; expect(link, "no reset link in outbox");
  await p3.goto(link.replace(/^https?:\/\/[^/]+/, BASE)); await p3.fill("#password", "NewPass456"); await p3.fill("#confirm", "NewPass456"); await p3.click("main button[type=submit]"); await p3.waitForURL(/my-recipes/); await p3.close();
});
// 8. Admin CMS
await step("Admin: moderation approves submitted recipe", async () => {
  await ap.goto(BASE + "/admin/moderation"); const card = ap.locator("li", { hasText: `E2E Lemon Bars ${stamp}` }); await card.locator("button:has-text('Approve & publish')").click(); await ap.waitForTimeout(800);
  const r = await ap.request.get(BASE + `/search/?q=${encodeURIComponent("E2E Lemon Bars " + stamp)}`); expect((await r.text()).includes(`E2E Lemon Bars ${stamp}`), "approved recipe not searchable");
});
await step("Admin: approve photo", async () => { await ap.goto(BASE + "/admin/moderation"); await ap.locator("button:has-text('Approve') >> visible=true").last().click(); await ap.waitForTimeout(500); });
await step("Admin: create + publish recipe", async () => {
  await ap.goto(BASE + "/admin/recipes/new"); await ap.fill("#rf-title", `Admin Test Soup ${stamp}`); await ap.fill("#rf-desc", "A quick test soup created from the CMS."); await ap.fill("textarea[name=ingredients]", "4 cups broth\n1 onion, diced");
  await ap.fill("textarea[name=steps]", "Simmer everything for 20 minutes."); await ap.selectOption("#rf-status", "published"); await ap.fill("#n-calories", "120"); await ap.click("button:has-text('Save Recipe')"); await ap.waitForURL(/saved=1/);
});
await step("Admin: create category", async () => { await ap.goto(BASE + "/admin/categories"); const f = ap.locator("section", { hasText: "Add category" }); await f.locator("input[name=name]").fill(`Test Cat ${stamp}`); await f.locator("input[name=showInNav]").uncheck(); await f.locator("button:has-text('Create category')").click(); await f.getByText("Category created").waitFor(); });
await step("Admin: create + publish article", async () => { await ap.goto(BASE + "/admin/articles/new"); await ap.fill("input[name=title]", `Test Article ${stamp}`); await ap.fill("textarea[name=body]", "## Hello\nBody text."); await ap.selectOption("select[name=status]", "published"); await ap.click("button:has-text('Save article')"); await ap.waitForURL(/saved=1/); const r = await ap.request.get(BASE + `/article/test-article-${stamp}/`); expect(r.status() === 200, `article ${r.status()}`); });
await step("Admin: media upload", async () => { await ap.goto(BASE + "/admin/media"); await ap.setInputFiles("input[name=files]", path.join(DIR, "fixture.jpg")); await ap.click("button:has-text('Upload')"); await ap.getByText("1 file uploaded").waitFor(); const src = await ap.locator("main img, div img").first().getAttribute("src"); const r = await ap.request.get(BASE + src); expect(r.status() === 200, `media ${r.status()}`); });
await step("Admin: homepage section toggle", async () => { await ap.goto(BASE + "/admin/homepage"); await ap.locator("button[aria-label=Hide]").last().click(); await ap.waitForTimeout(500); await ap.locator("button[aria-label=Show]").last().click(); });
await step("Admin: edit page SEO", async () => { await ap.goto(BASE + "/admin/pages"); await ap.click("text=About Us"); await ap.fill("input[name=seoTitle]", "About Simmerly"); await ap.click("button:has-text('Save')"); await ap.getByText("Page saved").waitFor(); const html = await (await ap.request.get(BASE + "/about-us/")).text(); expect(html.includes("<title>About Simmerly"), "seo title not applied"); });
await step("Admin: ban user blocks login", async () => {
  await ap.goto(BASE + "/admin/users?q=" + encodeURIComponent(email)); await ap.click("text=E2E Tester"); await ap.selectOption("select[name=status]", "banned"); await ap.click("button:has-text('Save')"); await ap.getByText("User updated").waitFor();
  const p4 = patch(await browser.newPage()); await p4.goto(BASE + "/account/login/"); await p4.fill("#email", email); await p4.fill("#password", "NewPass456"); await p4.click("main button[type=submit]"); await p4.getByText("suspended").waitFor(); await p4.close();
});
await step("Non-staff cannot open admin", async () => { const r = await page.goto(BASE + "/admin"); expect(!page.url().includes("/admin") || r.status() >= 300, page.url()); });
await step("SEO: recipe JSON-LD + canonical", async () => { const html = await (await ctx.request.get(BASE + recipePath)).text(); expect(html.includes('"@type":"Recipe"') && html.includes('rel="canonical"'), "missing"); });
await step("Contact form submits", async () => { const p5 = patch(await browser.newPage()); await p5.goto(BASE + "/contact/"); await p5.fill("#c-name", "Test"); await p5.fill("#c-email", "t@example.test"); await p5.fill("#c-sub", "Hello there"); await p5.fill("#c-msg", "This is a test message."); await p5.click("button:has-text('Send Message')"); await p5.getByText("Thanks for reaching out").waitFor(); await p5.close(); });
await step("Mobile: hamburger menu opens", async () => { const m = await browser.newContext({ viewport: { width: 390, height: 844 } }); const mp = patch(await m.newPage()); await mp.goto(BASE + "/"); await mp.click("[aria-label='Open menu'] >> nth=0"); expect(await mp.locator("[role=dialog] >> text=Dinners").isVisible(), "drawer"); await m.close(); });
await step("No uncaught client errors", async () => { expect(!pageErrors.length, pageErrors.slice(0, 3).join(" | ")); });

await browser.close();
for (const r of results) console.log(r.join("  "));
console.log(`\n${results.filter((r) => r[0] === "PASS").length} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
