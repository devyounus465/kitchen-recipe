# Test Report

Last run: 2026-11-12 · production builds · Playwright/Chromium · fresh data for each run.

| Suite | Environment | Result |
|---|---|---|
| Functional e2e (`npm run test:e2e`), 67 checks | `next build && next start` (local) | **67 / 67 pass** |
| Functional e2e, 67 checks | Docker stack: PostgreSQL + app + Caddy HTTPS (as on a VPS) | **67 / 67 pass** |
| Security regression (`npm run test:security`), 13 checks | `next build && next start` (local) | **13 / 13 pass** |

## Also verified
- Docker image builds; migrations, seeding, bulk import and `create-admin` run inside the container.
- `db:seed` refuses to run in production without `--force`; with `--force` it generates a random admin password.
- Server refuses to start in production with a missing/weak/example `AUTH_SECRET` (exit code 1).
- `/api/health/` reports database status; Docker healthcheck marks the app healthy.
- Uploaded files persist across container restarts; `deploy/backup.sh` produces database + uploads archives.
- HTTP status codes: 404 for missing pages, 308 canonical redirects, 307 auth redirects, HTTP→HTTPS redirect.
- TypeScript strict mode with no unused locals/parameters; `knip` reports no unused files, exports or dependencies.
- `npm audit --omit=dev`: 0 known vulnerabilities.

## Security checks covered by `tests/security.mjs`
Security headers/CSP (no console or CSP errors on key pages), health endpoint, open-redirect attempts
(`//evil`, `/\evil`, absolute URLs), cross-site POSTs to API routes (403), forged session cookie, member blocked
from admin, password change signs out other sessions, email change requires current password, unpublished
recipes hidden, login rate limiting.

## Not yet verified
- Real domain + Let's Encrypt certificate (tested with `localhost` and Caddy's local CA).
- Real SMTP delivery (code path tested without SMTP; emails land in Admin → Email outbox).
- Visual comparison against reference screenshots (allrecipes.com is not reachable from the build environment).
- Lighthouse performance audit.
