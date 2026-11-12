# Simmerly — Project Plan (Allrecipes-style 1:1 MVP)

> Working brand name: **Simmerly** (change in `src/lib/site.ts`). The reference site is
> https://www.allrecipes.com/. We reproduce its **layout, information architecture, page
> templates, type scale, color system and interactions**. Per §8 of the client brief we do
> **not** copy Allrecipes' logo, trademarks, recipe text, photos or videos — all demo
> content is original, and demo photos are hot-linked from Unsplash (free licence) until the
> client supplies approved content.

---

## 1. Brief → requirement matrix

| Brief § | Requirement | Where it lives |
|---|---|---|
| 2A.1 | Homepage + main sections | `/` — CMS-driven `homepage_sections` |
| 2A.2 | Main nav + dropdown mega-menus + mobile nav | `components/layout/Header.tsx`, `MobileNav.tsx` (nav built from `categories.show_in_nav`) |
| 2A.3 | Category landing pages | `/recipes/[id]/[slug]` |
| 2A.4–5 | Search + filtered search | `/search?q=&ingredient=&maxTime=&diet=&category=&sort=` (Postgres FTS) |
| 2A.6–7 | Recipe detail + related | `/recipe/[id]/[slug]` |
| 2A.8 | Recipe collections | `/collections`, `/collections/[slug]` |
| 2A.9–10 | Articles + cooking guides | `/article/[slug]`, `/kitchen-tips`, `/news` |
| 2A.11–12 | Video listing + video pages | `/videos`, `/video/[id]/[slug]` |
| 2A.13 | Author/contributor profiles | `/cook/[username]` |
| 2A.14–16 | About, Contact, Privacy, Terms | `/about-us`, `/contact`, `/privacy-policy`, `/terms-of-service` (CMS `pages`) |
| 2A.17 | 404 + error pages | `app/not-found.tsx`, `app/error.tsx` |
| 2B.18–20 | Register, login/logout, password recovery | `/account/register`, `/account/login`, `/account/forgot-password`, `/account/reset-password` |
| 2B.21–22 | Profile + settings | `/cook/[username]`, `/account/settings` |
| 2B.23–24 | MyRecipes (saved) + personal collections | `/account/my-recipes`, `/account/collections/[id]` |
| 2B.25 | Activity / contribution history | `/account/activity` |
| 2C.26–29 | Ratings, reviews, UGC photos, review sorting | Recipe page `#reviews`, `/api/reviews`, `/api/photos` |
| 2C.30–31 | Recipe submission + editing | `/account/submit-recipe`, `/account/recipes/[id]/edit` |
| 2C.32 | Moderation | `/admin/moderation` (reviews, photos, submissions) |
| 2C.33 | Contributor attribution | Byline "Submitted by" on recipe + profile links |
| 3 | Recipe page features (scaler, nutrition, print, share, save…) | `RecipeIngredients` (½x/1x/2x/custom), print stylesheet + `/recipe/.../print`, Web Share + fallbacks |
| 4 | Search & discovery | `lib/search.ts` — `tsvector` + GIN index, ingredient filter, time, diet, sort relevance/rating/newest |
| 5 | Admin / CMS | `/admin/*` (see §6) |
| 6 | Responsive + states | Tailwind breakpoints 375/768/1024/1280; hover/focus/loading/empty/error/success states on every form |
| 7 | Stack, auth, media, SEO, backup, deploy | §3 below |
| 8 | Content model + bulk import | Schema §4; `npm run import -- file.json` bulk importer |
| 9 | Testing | `tests/e2e.spec.ts` (Playwright) + manual checklist §8 |

## 2. Reference-site audit (template inventory)

Reference structure (as known from the live site; automated fetching of allrecipes.com is
blocked from our build environment, so **pixel comparison against client-supplied screenshots
is part of Milestone 5**):

- **Header**: white bar, wordmark left, pill search "Find a recipe or ingredient", utility
  links (Log In / My Account, heart = saved), black uppercase nav row: DINNERS · MEALS ·
  INGREDIENTS · OCCASIONS · CUISINES · KITCHEN TIPS · NEWS · FEATURES · ABOUT US. Hover opens
  a full-width dropdown with link columns. Mobile: hamburger → slide-in panel with
  accordions.
- **Cards**: 4:3 or 1:1 image, small uppercase orange-on-white category tag, bold title,
  orange stars + rating count ("1,234 Ratings"). Heart save button on image.
- **Homepage**: hero feature (large image + 3 stacked stories), "The Latest" grid, themed
  carousels/rows, category tiles, editorial picks, video row, newsletter.
- **Category page**: breadcrumb, H1, intro, sub-category chips, "Featured" + grid, load more.
- **Recipe page**: breadcrumb, H1, stars · ratings · reviews · photos, dek, byline
  "Submitted by X · Updated on date", Save/Rate/Print/Share buttons, hero, details card
  (Prep/Cook/Total/Servings/Yield), ingredients w/ "Original recipe (1X) yields N servings" +
  ½x/1x/2x, Directions numbered steps, Cook's Note, Nutrition Facts (summary + full label
  toggle), "Photos of …" strip, reviews (histogram, sort Most helpful/Newest/Highest/Lowest,
  Helpful button), "You'll Also Love".
- **Footer**: wordmark, social, newsletter, link columns, legal line.

Design tokens (`tailwind.config.ts`): brand orange `#ce4620` (hover `#a83a1a`), ink
`#111111`, body `#262626`, muted `#595959`, rule `#e6e6e6`, tint `#f5f5f5`, star `#ce4620`.
Type: one humanist sans family (Source Sans 3) at 400/600/700/800; uppercase tracked labels
for nav and tags; H1 40/48 desktop, 32/40 mobile.

## 3. Technology & architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend + SSR | **Next.js 15 (App Router) + React 19 + TypeScript** | SEO-critical SSR/ISR, server components, one codebase for site + API + admin |
| Styling | Tailwind CSS 3 with design tokens | Pixel-tight replication, responsive utilities |
| Database | **PostgreSQL 16** | Relational content model, full-text search, JSONB |
| ORM / migrations | Drizzle ORM + drizzle-kit | Type-safe SQL, no binary engines, raw SQL where needed (FTS) |
| Search | Postgres `tsvector` (weighted title > ingredients > description) + GIN | Real DB results; swappable for Meilisearch/Typesense in phase 2 via `lib/search.ts` |
| Auth | Email+password, bcrypt (12 rounds), signed JWT (jose, HS256) in httpOnly SameSite=Lax cookie, role-based (`user`, `contributor`, `editor`, `admin`) | No 3rd-party lock-in; OAuth providers can be added later |
| Media | Storage adapter (`lib/storage.ts`): local disk (`UPLOAD_DIR`) served via `/media/*`; S3/R2 adapter for production | |
| Email | Outbox table + console (dev); SMTP/Resend adapter (prod) | Password reset works end-to-end |
| Deploy | Docker (multi-stage) + docker-compose (app + postgres), Nginx/Caddy TLS, security headers (CSP, HSTS, X-Frame-Options) | |
| Backup | `deploy/backup.sh` (pg_dump + uploads tar, 14-day rotation), `deploy/restore.sh`; Neon has built-in point-in-time restore | |

Expansion seams: search adapter, storage adapter, email adapter, `homepage_sections` JSON
config, role system, `/api/*` route handlers usable by a future mobile app.

## 4. Data model

`users` (role, status, username, bio, avatar) · `password_resets` · `categories` (tree,
nav flag, SEO) · `recipes` (status draft/pending/published/rejected, times, servings,
ingredients JSONB, steps JSONB, nutrition JSONB, diets[], cuisine, cached rating stats, SEO,
`search` tsvector) · `recipe_categories` · `reviews` (rating, body, status, helpful) ·
`review_helpful` · `recipe_photos` (UGC, moderated) · `saved_recipes` · `collections`
(personal or editorial) · `collection_recipes` · `articles` (article/guide/news) · `videos` ·
`homepage_sections` · `pages` (about/privacy/terms) · `media` · `contact_messages` ·
`email_outbox` · `newsletter_subscribers`.

## 5. Public URL structure (SEO)

`/recipe/{id}/{slug}` · `/recipes/{id}/{slug}` · `/search` · `/collections/{slug}` ·
`/article/{slug}` · `/video/{id}/{slug}` · `/cook/{username}` · `/sitemap.xml` ·
`/robots.txt`. Every template ships `generateMetadata` (title, description, canonical,
OpenGraph) and recipes emit `schema.org/Recipe` JSON-LD.

## 6. Admin dashboard / CMS (`/admin`, roles editor+admin)

Premium dark-sidebar layout, KPI tiles, 30-day activity chart, moderation queue badges.
Modules: Dashboard · Recipes (CRUD, publish/unpublish, SEO, ingredients/steps editor) ·
Submissions (approve/reject) · Categories · Collections · Articles & Guides · Videos ·
Users & Authors (roles, ban) · Reviews (approve/reject/delete) · Photos · Media library
(upload) · Homepage sections (reorder, enable, configure) · Pages (About/Privacy/Terms) ·
Messages (contact) · Email outbox.

## 7. Milestones

| # | Milestone | Status in this build |
|---|---|---|
| 1 | Research & design audit, architecture | ✅ this document |
| 2 | UI/UX + frontend templates (responsive) | ✅ built |
| 3 | Backend & CMS (DB, auth, search, reviews, saves, admin) | ✅ built |
| 4 | Content integration | ✅ original demo seed + bulk importer; client-approved content import pending |
| 5 | Testing & baseline approval | ⚙️ 67/67 automated e2e checks pass (docs/TEST_REPORT.md); side-by-side visual comparison needs client screenshots |
| 6 | Final delivery (Docker, backups, docs) | ⚙️ configs included; production deploy awaits written approval |

## 8. MVP vs future phase

**MVP (this build):** everything in §1. **Phase 2:** meal planner, shopping list, OAuth
login, newsletter ESP integration, Meilisearch, CDN image resizing, ad slots, magazine
subscriptions, recipe "I made it" check-ins, follow cooks, notifications, multi-language.

## 9. Open items for the client

1. Approved brand name/logo (replace "Simmerly").
2. Licensed launch content (recipes, photography, video) — importer accepts JSON.
3. Reference screenshots for the Milestone 5 visual-diff pass (our environment cannot fetch allrecipes.com).
4. Hosting choice (VPS + Docker vs. Vercel + managed Postgres) and SMTP provider.
