# Automated Test Report

Run: 2026-11-12 19:34 UTC · production build (`next build && next start`) · Playwright/Chromium · fresh seed

**Result: 67 passed, 0 failed**

```
PASS  GET / → 200
PASS  GET /recipes/ → 200
PASS  GET /recipes/1/dinners/ → 200
PASS  GET /search/?q=chicken → 200
PASS  GET /search/?ingredient=garlic&maxTime=30&diet=gluten-free&sort=rating → 200
PASS  GET /recipe/1/chewy-brown-butter-chocolate-chip-cookies/ → 200
PASS  GET /collections/ → 200
PASS  GET /collections/quick-weeknight-dinners/ → 200
PASS  GET /kitchen-tips/ → 200
PASS  GET /news/ → 200
PASS  GET /articles/ → 200
PASS  GET /article/how-to-brown-butter-and-why-you-should/ → 200
PASS  GET /videos/ → 200
PASS  GET /video/1/how-to-make-fluffy-buttermilk-pancakes/ → 200
PASS  GET /cook/maya-thornton/ → 200
PASS  GET /about-us/ → 200
PASS  GET /contact/ → 200
PASS  GET /privacy-policy/ → 200
PASS  GET /terms-of-service/ → 200
PASS  GET /account/login/ → 200
PASS  GET /account/register/ → 200
PASS  GET /account/forgot-password/ → 200
PASS  GET /sitemap.xml → 200
PASS  GET /robots.txt → 200
PASS  Unknown URL → 404 page
PASS  Wrong slug → canonical redirect
PASS  Account pages require login
PASS  Admin requires login
INFO  checked 69 internal links
PASS  No dead internal links from homepage
PASS  Mega-menu opens on hover
PASS  Search by name returns DB results
PASS  Search by ingredient filter
PASS  Diet + time filters narrow results
PASS  Empty search state
PASS  Register new account
PASS  Register validation errors
PASS  Save recipe (heart)
PASS  Saved recipe shows in My Recipes
PASS  Create collection from saved recipe
PASS  Serving scaler 2x doubles quantities
PASS  Rate & review recipe
PASS  Review sorting (lowest first)
PASS  Helpful vote toggles
PASS  Upload recipe photo (goes to moderation)
PASS  Submit a recipe
PASS  Edit own submitted recipe
PASS  Update profile settings
PASS  Activity history lists contributions
PASS  Logout
PASS  Login with wrong password fails
PASS  Login
PASS  Admin login
PASS  Password recovery end-to-end
PASS  Admin: moderation approves submitted recipe
PASS  Admin: approve photo
PASS  Admin: create + publish recipe
PASS  Admin: create category
PASS  Admin: create + publish article
PASS  Admin: media upload
PASS  Admin: homepage section toggle
PASS  Admin: edit page SEO
PASS  Admin: ban user blocks login
PASS  Non-staff cannot open admin
PASS  SEO: recipe JSON-LD + canonical
PASS  Contact form submits
PASS  Mobile: hamburger menu opens
PASS  No uncaught client errors

67 passed, 0 failed
```

Also verified manually: bulk importer (idempotent), `scripts/backup.sh` (db dump + uploads archive), TypeScript strict typecheck, HTTP status codes (404, 308 canonical redirects, 307 auth redirects). Screenshots of key templates are in `screenshots/` (generated locally, not committed).

Not yet verified: Docker image build (no Docker in the dev sandbox), visual diff against reference screenshots (allrecipes.com is not reachable from the build environment — needs client-supplied screenshots), Lighthouse performance audit.
