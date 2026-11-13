// Security regression tests. Run against a running, seeded (local/demo) server:
//   BASE_URL=http://localhost:3000 node tests/security.mjs
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const req = createRequire(import.meta.url);
let PW; try { PW = req("playwright"); } catch { PW = req(execSync("npm root -g").toString().trim() + "/playwright"); }
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ctxOpts = process.env.E2E_INSECURE ? { ignoreHTTPSErrors: true } : {};
const results = []; let failed = 0;
const step = async (n, fn) => { try { await fn(); results.push(["PASS", n]); } catch (e) { failed++; results.push(["FAIL", n, String(e.message || e).split("\n")[0]]); } };
const expect = (c, m) => { if (!c) throw new Error(m); };

const browser = await PW.chromium.launch();
const newCtx = async () => { const c = await browser.newContext(ctxOpts); await c.route("**/images.unsplash.com/**", (r) => r.fulfill({ contentType: "image/svg+xml", body: "<svg xmlns='http://www.w3.org/2000/svg'/>" })); c.setDefaultTimeout(15000); return c; };
async function login(ctx, email, password, next = "") {
  const p = await ctx.newPage(); await p.goto(`${BASE}/account/login/${next}`, { waitUntil: "networkidle" });
  await p.fill("#email", email); await p.fill("#password", password); await p.click("main button[type=submit]");
  await p.waitForLoadState("networkidle"); await p.waitForTimeout(500); return p;
}

// Staging mode: against a server started with STAGING_PASSWORD (pass the same value here),
// only the private-staging checks run (every other request would need the password).
if (process.env.STAGING_PASSWORD) {
  await step("Private staging: password required, noindex, health open", async () => {
    const noAuth = await fetch(BASE + "/"); expect(noAuth.status === 401, `no creds → ${noAuth.status}`);
    const bad = await fetch(BASE + "/", { headers: { authorization: "Basic " + btoa("x:wrong") } }); expect(bad.status === 401, `wrong → ${bad.status}`);
    const ok = await fetch(BASE + "/", { headers: { authorization: "Basic " + btoa("client:" + process.env.STAGING_PASSWORD) } });
    expect(ok.status === 200 && /noindex/.test(ok.headers.get("x-robots-tag") || ""), `right → ${ok.status}`);
    expect((await fetch(BASE + "/api/health/")).status === 200, "health blocked");
  });
  await step("Private staging: password guessing is blocked after 20 failures", async () => {
    let status = 0;
    for (let i = 0; i < 25 && status !== 429; i++) status = (await fetch(BASE + "/", { headers: { authorization: "Basic " + btoa("x:guess" + i) } })).status;
    expect(status === 429, `last status ${status}`);
  });
  await browser.close();
  for (const r of results) console.log(r.join("  "));
  console.log(`\n${results.filter((r) => r[0] === "PASS").length} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
}

await step("Security headers present (CSP, frame, nosniff)", async () => {
  const r = await fetch(BASE + "/"); const h = r.headers;
  expect(/default-src 'self'/.test(h.get("content-security-policy") || ""), "CSP missing");
  expect(h.get("x-frame-options") === "SAMEORIGIN" && h.get("x-content-type-options") === "nosniff", "frame/nosniff missing");
  expect(!h.get("x-powered-by"), "x-powered-by leaked");
});
await step("Health endpoint reports DB up", async () => { const r = await fetch(BASE + "/api/health/"); const j = await r.json(); expect(r.status === 200 && j.ok, JSON.stringify(j)); });
await step("No CSP violations or console errors on key pages", async () => {
  const ctx = await newCtx(); const p = await ctx.newPage(); const errs = [];
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); }); p.on("pageerror", (e) => errs.push(e.message));
  for (const u of ["/", "/recipe/1/chewy-brown-butter-chocolate-chip-cookies/", "/search/?q=chicken", "/video/1/how-to-make-fluffy-buttermilk-pancakes/"]) await p.goto(BASE + u, { waitUntil: "networkidle" });
  await ctx.close(); expect(!errs.length, errs.slice(0, 3).join(" | "));
});
for (const evil of ["//evil.example/", "/\\evil.example/", "https://evil.example/"]) {
  await step(`Login next=${evil} does not redirect off-site`, async () => {
    const ctx = await newCtx(); const p = await login(ctx, "lindacooks@example.test", "Password123!", `?next=${encodeURIComponent(evil)}`);
    expect(new URL(p.url()).origin === new URL(BASE).origin, `went to ${p.url()}`);
    await p.goto(`${BASE}/account/login/?next=${encodeURIComponent(evil)}`); await p.waitForLoadState("networkidle");
    expect(new URL(p.url()).origin === new URL(BASE).origin, `logged-in redirect went to ${p.url()}`); await ctx.close();
  });
}
await step("Cross-site POST to API routes is rejected (403)", async () => {
  for (const path of ["/api/save/", "/api/auth/logout/"]) {
    const r = await fetch(BASE + path, { method: "POST", headers: { "sec-fetch-site": "cross-site", "content-type": "application/json" }, body: "{}", redirect: "manual" });
    expect(r.status === 403, `${path} → ${r.status}`);
  }
});
await step("Forged session cookie is ignored", async () => {
  const r = await fetch(BASE + "/account/my-recipes/", { headers: { cookie: "sm_session=eyJhbGciOiJub25lIn0.eyJ1aWQiOjF9." }, redirect: "manual" });
  expect(r.status === 307 && /login/.test(r.headers.get("location") || ""), `status ${r.status}`);
});
await step("Members cannot open the admin", async () => {
  const ctx = await newCtx(); const p = await login(ctx, "racheld@example.test", "Password123!"); await p.goto(BASE + "/admin", { waitUntil: "networkidle" });
  expect(!new URL(p.url()).pathname.startsWith("/admin"), p.url()); await ctx.close();
});
await step("Password change signs out other sessions", async () => {
  const email = "owenp@example.test"; const a = await newCtx(); const b = await newCtx();
  await login(a, email, "Password123!"); const pb = await login(b, email, "Password123!");
  const pa = await a.newPage(); await pa.goto(BASE + "/account/settings/", { waitUntil: "networkidle" });
  await pa.fill("#cur", "Password123!"); await pa.fill("#np", "Changed12345"); await pa.fill("#cp", "Changed12345"); await pa.click("button:has-text('Update Password')");
  await pa.getByText("signed out on all other devices").waitFor();
  await pb.goto(BASE + "/account/my-recipes/", { waitUntil: "networkidle" }); expect(/\/account\/login/.test(pb.url()), `other session still valid: ${pb.url()}`);
  await pa.goto(BASE + "/account/my-recipes/", { waitUntil: "networkidle" }); expect(/my-recipes/.test(pa.url()), "current session was signed out");
  await a.close(); await b.close();
});
await step("Email change requires current password", async () => {
  const ctx = await newCtx(); const p = await login(ctx, "emshaw@example.test", "Password123!"); await p.goto(BASE + "/account/settings/", { waitUntil: "networkidle" });
  await p.fill("#s-email", "attacker@example.test"); await p.click("button:has-text('Save Changes')"); await p.getByText("current password to change your email").first().waitFor(); await ctx.close();
});
await step("Cannot review an unpublished recipe", async () => {
  const ctx = await newCtx(); const p = await login(ctx, "jorge_r@example.test", "Password123!");
  const pending = await (await p.request.get(BASE + "/recipe/41/grandmas-cornbread/")).status(); expect(pending === 404, `pending recipe visible: ${pending}`); await ctx.close();
});
await step("Login is rate limited", async () => {
  const ctx = await newCtx(); const p = await ctx.newPage(); await p.goto(BASE + "/account/login/", { waitUntil: "networkidle" }); let limited = false;
  for (let i = 0; i < 10 && !limited; i++) { await p.fill("#email", "hannahk@example.test"); await p.fill("#password", "wrong-" + i);
    await Promise.all([p.waitForResponse((r) => r.request().method() === "POST"), p.click("main button[type=submit]")]); await p.waitForTimeout(300); limited = (await p.locator("main [role=alert]").first().innerText()).includes("Too many"); }
  expect(limited, "no rate limit after 10 attempts"); await ctx.close();
});
await browser.close();
for (const r of results) console.log(r.join("  "));
console.log(`\n${results.filter((r) => r[0] === "PASS").length} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
