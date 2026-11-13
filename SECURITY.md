# Security overview

## Authentication & sessions
- Passwords hashed with bcrypt (cost 12); 8–128 characters with letters and numbers (admins created via `create-admin`: 12+).
- Sessions are signed JWTs (HS256 only) in an `httpOnly`, `SameSite=Lax` cookie, `Secure` on https.
- **Production refuses to start** if `AUTH_SECRET` is missing, shorter than 32 characters or an example value.
- Sessions are revoked on password change (other devices), password reset, ban and role change (`users.session_version`).
- Login timing is the same for known and unknown emails; generic "incorrect email or password" message.
- Changing the account email or deleting the account requires the current password.
- Password-reset tokens: 256-bit random, stored as SHA-256 hashes, valid 1 hour, single use (atomic).

## Abuse protection (rate limits, per server instance)
Login (per email+IP and per account), registration, password reset (per IP and per account), password change,
reviews, review "helpful" votes, photo uploads, recipe submissions, collections, contact form, newsletter, save button.
The client IP is taken from the last `X-Forwarded-For` hop (set by our own proxy).

## Request forgery & redirects
- Server Actions: Next.js origin check. Free tunnel domains are accepted **only** when the site isn't on a
  public https domain (local demos); add extra origins with `ALLOWED_ORIGINS`.
- API routes (`/api/save`, `/api/auth/logout`) reject cross-site requests (`Sec-Fetch-Site`/Origin check).
- Post-login redirects only allow same-site paths (blocks `//evil.com`, `/\evil.com`).

## Content & uploads
- All user text rendered as text; markdown (staff only) is escaped first, links limited to `/…` and `http(s)`,
  external links get `rel="nofollow noopener noreferrer"`.
- Uploads: JPG/PNG/WebP/GIF (+MP4 on self-hosted), type checked by magic bytes, 4 MB image limit, random
  file names; served with `nosniff` and a sandboxing CSP. No SVG/HTML uploads.
- User photos and recipe submissions always go through moderation; reviews follow the mode set in Admin → Settings
  (hold reviews with links by default, hold all, or publish immediately).

## Authorization
- `/admin` requires editor or admin; user role/ban management requires admin; admins can't demote or ban themselves.
- Members can only edit/delete their own drafts, pending or rejected recipes, collections and reviews.
- Admin form values are whitelisted (status, type, kind); referenced users/recipes/categories are verified.

## Private staging, API and CMS additions
- `STAGING_PASSWORD`: site-wide password (constant-time comparison, max 20 wrong attempts per IP per
  10 minutes), `noindex` on every response; only `/api/health/` stays open for monitoring.
- Public API `/api/v1/*`: read-only, published content only, no cookies or private fields (no emails),
  120 requests/minute per IP, page size ≤ 50.
- Bulk import (staff only): 5 MB limit, every field validated, URLs restricted to `https://`, `/media/`, `/videos/`.
- URL redirects: site-relative paths only (no open redirects); chains and loops are rejected.
- User invitations: the account gets an unusable random password plus a single-use 72-hour set-password link.

## HTTP headers
Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
Cross-Origin-Opener-Policy; HSTS via Caddy (VPS) or Vercel.

## Data & operations
- Demo seeding refuses to run in production unless `--force` (and then uses random passwords).
- Daily database + uploads backups (`deploy/backup.sh`), health endpoint `/api/health/`.
- Dependencies: `npm audit --omit=dev` reports 0 known vulnerabilities. One moderate dev-only advisory remains
  (esbuild inside drizzle-kit's CLI; its dev server is never used).

## Threat review

| Threat | Mitigation | Verified by |
|---|---|---|
| Password guessing / credential stuffing | bcrypt, per-account and per-IP limits, same timing for unknown emails | `tests/security.mjs` |
| Stolen session cookie after password change | `session_version` revocation, httpOnly + Secure cookie | `tests/security.mjs` |
| Forged/altered session token | HS256 signature, algorithm pinned, strong secret enforced at startup | `tests/security.mjs`, Docker test |
| Phishing via open redirect | `safeNext()` and site-relative redirects only | `tests/security.mjs` |
| CSRF | SameSite cookies, Next.js origin check on actions, cross-site check on API routes | `tests/security.mjs` |
| Stored XSS (reviews, profiles, CMS text) | React escaping, escaped markdown, CSP | code review, CSP check |
| Malicious uploads | Type + magic-byte checks, no SVG/HTML, random names, `nosniff` + sandbox CSP | code review |
| Privilege escalation | Role checks on every admin action, admin-only user management, whitelisted inputs | `tests/security.mjs`, e2e |
| Data exposure via API | Explicit field mapping, published-only queries | e2e |
| Staging leak / indexing | Basic auth + `noindex`, brute-force limit | `tests/security.mjs` (with `STAGING_PASSWORD`) |
| Spam (reviews, contact, newsletter) | Rate limits, honeypot, moderation modes | code review |
| Data loss | Daily backups, seed guard, health checks | Docker test |

Known limits: rate limits are in memory, per server instance (use Redis if you run several instances);
the CSP allows inline scripts because Next.js hydration needs them; search queries are not rate limited
(add a proxy-level limit in Caddy if abused).

## Reporting
Please report vulnerabilities privately to the site owner rather than opening a public issue.
