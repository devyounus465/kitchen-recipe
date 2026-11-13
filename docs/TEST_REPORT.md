# Test Report

Last run: 2026-11-13 · production builds · Playwright/Chromium · fresh data for each run.

| Suite | Environment | Result |
|---|---|---|
| Functional e2e (`npm run test:e2e`), 77 checks | `next build && next start` | **77 / 77 pass** |
| Functional e2e, 76 checks (before the responsive check was added) | Docker stack: PostgreSQL + app + Caddy HTTPS (as on a VPS) | **76 / 76 pass** |
| Security regression (`npm run test:security`), 13 checks | `next build && next start` | **13 / 13 pass** |
| Private staging checks (`STAGING_PASSWORD=… npm run test:security`) | `next start` and Docker stack | **2 / 2 pass** |

The functional suite covers every page template, a crawl of all internal links from the homepage,
registration/login/logout, password recovery, saving and collections, search and filters, ratings,
reviews, helpful votes, photo uploads, recipe submission and editing, account settings, moderation, admin CRUD,
media upload, homepage sections, page SEO, site settings, URL redirects, bulk import (valid and invalid),
author invitations, community photos, step photos, video playback, the public API, contact form,
no horizontal overflow on 7 key pages at 390 px, 768 px, 1024 px and 1366 px,
mobile navigation and client-side errors.

## Lighthouse (mobile emulation, production build)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home | 97 | 100 | 96* | 100 |
| Recipe | 97 | 100 | 96* | 100 |
| Category | 98 | 100 | 96* | 100 |
| Search | 98 | 100 | 96* | 63** |
| Video | 99 | 100 | 96* | 100 |
| Login | 98 | 100 | 100 | 63** |

Desktop: performance 100 on all tested pages. LCP 2.0–2.5 s mobile, CLS 0.
\* Only finding: demo photos from Unsplash can't be reached from the test environment (console network
errors); not an issue for real visitors. \*\* Search and login pages are intentionally `noindex`.

## Also verified
- Docker image builds; migrations, seeding, CLI import and `create-admin` run inside the container.
- `db:seed` refuses to run in production without `--force`; with `--force` it generates a random admin password.
- Server refuses to start in production with a missing/weak/example `AUTH_SECRET` (exit code 1).
- Private staging: 401 without password, 200 with it, `noindex`, health endpoint open, 429 after 20 wrong passwords.
- `/api/health/` and the Docker healthcheck; uploads persist across restarts; `deploy/backup.sh` works.
- HTTP status codes: 404, 308 canonical and renamed-URL redirects, 307 auth redirects, HTTP→HTTPS.
- TypeScript strict mode with no unused locals/parameters; `knip` reports no unused files, exports or dependencies.
- `npm audit --omit=dev`: 0 known vulnerabilities.

## Not yet verified
- Real domain + Let's Encrypt certificate (tested with `localhost` and Caddy's local CA).
- Real SMTP delivery (emails verified via Admin → Email outbox).
- Visual comparison against reference screenshots (allrecipes.com is not reachable from the build environment).
