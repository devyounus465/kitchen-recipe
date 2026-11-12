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
- New reviews containing links and all user photos/recipe submissions go through moderation.

## Authorization
- `/admin` requires editor or admin; user role/ban management requires admin; admins can't demote or ban themselves.
- Members can only edit/delete their own drafts, pending or rejected recipes, collections and reviews.
- Admin form values are whitelisted (status, type, kind); referenced users/recipes/categories are verified.

## HTTP headers
Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
Cross-Origin-Opener-Policy; HSTS via Caddy (VPS) or Vercel.

## Data & operations
- Demo seeding refuses to run in production unless `--force` (and then uses random passwords).
- Daily database + uploads backups (`deploy/backup.sh`), health endpoint `/api/health/`.
- Dependencies: `npm audit --omit=dev` reports 0 known vulnerabilities. One moderate dev-only advisory remains
  (esbuild inside drizzle-kit's CLI; its dev server is never used).

## Reporting
Please report vulnerabilities privately to the site owner rather than opening a public issue.
